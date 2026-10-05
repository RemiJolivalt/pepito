import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, AGENT_MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { PERSONAS, objectiveLine, directionLine, companyProfileLines } from "@/lib/agents/personas";
import { runVisibiliteLocaleAgent } from "@/lib/agents/visibilite-locale";
import { runCommunicationAgent } from "@/lib/agents/communication";
import { runDemarchageAgent } from "@/lib/agents/demarchage";
import { runAuditAgent } from "@/lib/agents/audit";
import { recordUsage } from "@/lib/usage";

const PERSONA = PERSONAS.co_ceo;
const HISTORY_LIMIT = 20;

/**
 * Agent "Co-CEO" : point de contact unique, orchestre les autres agents en
 * les invoquant comme des outils. Garde-fou inchangé : déléguer à un agent
 * ne fait que créer des propositions (ou des constats pour l'audit), jamais
 * d'exécution réelle — l'orchestration ne change pas le niveau d'autonomie
 * (cf. docs/agents-roster.md, docs/backlog.md).
 */
export async function runCoCeoTurn(companyId: string, userMessage: string) {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
  });

  await prisma.chatMessage.create({
    data: { companyId, role: "user", content: userMessage },
  });

  const history = await prisma.chatMessage.findMany({
    where: { companyId },
    orderBy: { createdAt: "asc" },
    take: HISTORY_LIMIT * 2,
  });

  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.content,
  }));

  const getCurrentStatus = betaZodTool({
    name: "get_current_status",
    description:
      "Récupère l'état réel actuel : propositions en attente (avec leur contenu) et derniers constats d'audit. À utiliser systématiquement avant de répondre à toute question sur l'état, le contenu ou le nombre de propositions/constats — ne jamais deviner ni se fier à ce qui a été dit dans un tour précédent.",
    inputSchema: z.object({}),
    run: async () => {
      const [pending, findings] = await Promise.all([
        prisma.agentProposal.findMany({
          where: { companyId, status: "en_attente" },
          orderBy: { createdAt: "desc" },
        }),
        prisma.auditFinding.findMany({
          where: { companyId },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);
      return JSON.stringify({
        propositionsEnAttente: pending.map((p) => ({
          id: p.id,
          agent: p.agent,
          kind: p.kind,
          title: p.title,
          content: p.content,
        })),
        derniersConstatsAudit: findings.map((f) => ({
          title: f.title,
          content: f.content,
        })),
      });
    },
  });

  const delegateVisibilite = betaZodTool({
    name: "delegate_visibilite_locale",
    description:
      "Lance l'agent Visibilité locale (fiche Google, avis clients). Crée des propositions en attente de validation, n'exécute rien.",
    inputSchema: z.object({}),
    run: async () => {
      const proposals = await runVisibiliteLocaleAgent(companyId);
      return `${proposals.length} proposition(s) créée(s) par ${PERSONAS.visibilite_locale.name}, en attente de validation dans le dashboard.`;
    },
  });

  const delegateCommunication = betaZodTool({
    name: "delegate_communication",
    description:
      "Lance l'agent Communication pour proposer des posts réseaux sociaux. Si une actualité réelle a été mentionnée par l'utilisateur, passe-la — sinon laisse vide, l'agent proposera ses propres idées génériques. Ne jamais inventer une actualité qui n'a pas été mentionnée.",
    inputSchema: z.object({
      newsContext: z
        .string()
        .optional()
        .describe("Actualité à communiquer, telle que mentionnée par l'utilisateur — omettre si aucune n'a été donnée"),
    }),
    run: async (input) => {
      const proposals = await runCommunicationAgent(companyId, input.newsContext);
      return `${proposals.length} proposition(s) créée(s) par ${PERSONAS.communication.name}, en attente de validation dans le dashboard.`;
    },
  });

  const delegateDemarchage = betaZodTool({
    name: "delegate_demarchage",
    description:
      "Lance l'agent Démarchage : recherche des pistes de croissance réelles (actualités, événements locaux) et, si un type de prospects a été décrit par l'utilisateur, prépare des templates de prospection générique.",
    inputSchema: z.object({
      prospectDescription: z
        .string()
        .optional()
        .describe("Type de prospects visés, tel que mentionné par l'utilisateur — omettre si non précisé"),
    }),
    run: async (input) => {
      const proposals = await runDemarchageAgent(companyId, input.prospectDescription);
      return `${proposals.length} proposition(s) créée(s) par ${PERSONAS.demarchage.name}, en attente de validation dans le dashboard.`;
    },
  });

  const delegateAudit = betaZodTool({
    name: "delegate_audit",
    description: "Relance l'agent Audit pour rafraîchir l'état des lieux de la présence en ligne ET l'analyse de la concurrence locale.",
    inputSchema: z.object({}),
    run: async () => {
      const findings = await runAuditAgent(companyId);
      return `${findings.length} constat(s) mis à jour par ${PERSONAS.audit.name}.`;
    },
  });

  const finalMessage = await anthropic.beta.messages.toolRunner({
    model: AGENT_MODEL,
    max_tokens: 2000,
    tools: [
      getCurrentStatus,
      delegateVisibilite,
      delegateCommunication,
      delegateDemarchage,
      delegateAudit,
    ],
    system: `Tu es ${PERSONA.name} de Pepito, un copilote IA pour indépendants et TPE. ${PERSONA.blurb}
Entreprise : ${company.name} (métier : ${company.trade}), zone de chalandise : ${company.servingArea}.
${companyProfileLines(company)}
${objectiveLine(company.objective)}
${directionLine(company.direction)}

Ton rôle : échanger avec le dirigeant, l'aider à prioriser, et déléguer aux agents spécialisés (${PERSONAS.visibilite_locale.name} pour la visibilité locale et le contenu de site web, ${PERSONAS.communication.name} pour la communication, ${PERSONAS.demarchage.name} pour le démarchage et les pistes de croissance, ${PERSONAS.audit.name} pour l'audit et l'analyse concurrentielle) via les outils delegate_* quand c'est pertinent.
Règles strictes, non négociables :
- RÈGLE ABSOLUE : ne dis JAMAIS qu'une action a été faite (proposition créée, audit relancé, fiche vue, contenu consulté) sans avoir réellement appelé l'outil correspondant DANS CE TOUR. Tu n'as aucune mémoire fiable de ce qui a été fait avant ce message — si on te demande l'état actuel, le nombre ou le contenu de propositions/constats, appelle TOUJOURS get_current_status avant de répondre. Ne devine jamais.
- Tu ne fais JAMAIS exécuter une action réelle toi-même, même automatiquement : déléguer ne fait que créer des propositions, qui restent soumises à la validation du dirigeant dans le dashboard. Dis-le clairement si tu délègues.
- Tu ne construis pas de site web toi-même (${PERSONAS.visibilite_locale.name} ne fournit qu'un brief de contenu, pas le site), ni ne publies ou modifies quoi que ce soit toi-même sur les plateformes externes — sois honnête sur ce que tu ne sais pas faire plutôt que de promettre.
- Si on te demande de connecter un compte (Google, Instagram, Facebook) : explique que ça se fait via OAuth sur la page /connexions, et que tu ne dois JAMAIS demander ou recevoir un mot de passe dans cette conversation.
- Pour déléguer à Communication (sans actualité) ou Démarchage (sans cible), tu peux le faire sans information — les agents proposeront leurs propres idées génériques. Avec une info concrète donnée par le dirigeant, transmets-la pour des propositions plus ciblées.
- Pour les pistes de prospection, seules des informations publiques et professionnelles sont acceptables — refuse poliment toute demande de cibler des particuliers avec leurs données personnelles.
- Réponds de façon brève et directe, comme un vrai point rapide entre dirigeants, pas un rapport formel.`,
    messages,
  });

  const assistantText = finalMessage.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  const savedReply = assistantText || "(pas de réponse textuelle — vérifiez le dashboard pour les nouvelles propositions)";

  await recordUsage({
    companyId: company.id,
    agent: "co_ceo",
    model: AGENT_MODEL,
    usage: finalMessage.usage,
  });

  await prisma.chatMessage.create({
    data: { companyId, role: "assistant", content: savedReply },
  });

  return savedReply;
}

/**
 * Paul "meneur" : produit un plan d'action structuré (quoi, qui, quand,
 * pourquoi) plutôt que de la prose — demande CEO explicite ("force de
 * proposition", "donne la direction"). Séparé de runCoCeoTurn : ne touche
 * pas à l'historique de chat, ne délègue jamais lui-même (chaque item du
 * plan n'est lancé que si l'utilisateur clique "Lancer" dans le dashboard).
 */
export async function runCoCeoPlanning(companyId: string) {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
  });

  const [pendingProposals, recentFindings, existingPlan, discarded] = await Promise.all([
    prisma.agentProposal.findMany({
      where: { companyId, status: "en_attente" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditFinding.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.actionPlanItem.findMany({
      where: { companyId, status: { in: ["propose", "lance"] } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.actionPlanItem.findMany({
      where: { companyId, status: "ecarte" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const createdItemIds: string[] = [];

  const proposePlanItem = betaZodTool({
    name: "propose_plan_item",
    description: "Ajoute une action au plan priorisé. Appelle cet outil une fois par action recommandée (3 à 5 fois en général).",
    inputSchema: z.object({
      agent: z
        .enum(["visibilite_locale", "communication", "demarchage", "audit"])
        .describe("Agent responsable de cette action"),
      title: z.string().describe("Action concrète et courte, ex: 'Mettre à jour la fiche Google'"),
      rationale: z
        .string()
        .describe("Pourquoi cette action, en lien avec l'objectif business du dirigeant"),
      timing: z.string().describe("Quand, en langage naturel : 'aujourd'hui', 'cette semaine', 'dès que le site est en ligne'"),
    }),
    run: async (input) => {
      const item = await prisma.actionPlanItem.create({
        data: {
          companyId,
          agent: input.agent,
          title: input.title,
          rationale: input.rationale,
          timing: input.timing,
        },
      });
      createdItemIds.push(item.id);
      return `Action ajoutée au plan (id: ${item.id}).`;
    },
  });

  const finalMessage = await anthropic.beta.messages.toolRunner({
    model: AGENT_MODEL,
    max_tokens: 2000,
    tools: [proposePlanItem],
    system: `Tu es ${PERSONA.name} de Pepito. Tu dois être force de proposition et donner une direction claire — pas attendre des questions.
Entreprise : ${company.name} (métier : ${company.trade}), zone de chalandise : ${company.servingArea}. Site web : ${company.website ?? (company.siteSlug ? `publié par Pepito (/site/${company.siteSlug})` : "aucun")}.
${companyProfileLines(company)}
${objectiveLine(company.objective)}
${directionLine(company.direction)}
Propositions déjà en attente de validation : ${pendingProposals.map((p) => `${p.agent}: ${p.title}`).join("; ") || "aucune"}.
Derniers constats (audit, concurrence) : ${recentFindings.map((f) => f.title).join("; ") || "aucun"}.
Actions déjà au plan (ne les répète pas) : ${existingPlan.map((i) => i.title).join("; ") || "aucune"}.
Actions ÉCARTÉES par le dirigeant, avec sa raison — ne les repropose pas et tiens compte de la raison : ${discarded.map((i) => `"${i.title}" (${i.feedback || "sans raison"})`).join("; ") || "aucune"}.

Ta tâche : propose un plan priorisé de 3 à 5 actions concrètes via propose_plan_item, chacune rattachée à un agent (${PERSONAS.visibilite_locale.name}/visibilite_locale, ${PERSONAS.communication.name}/communication, ${PERSONAS.demarchage.name}/demarchage, ${PERSONAS.audit.name}/audit), avec une justification liée à l'objectif et un délai réaliste.
Règles :
- Chaque action doit faire avancer l'objectif de façon mesurable — dis dans la justification QUEL effet attendu (appels, devis, avis, visibilité).
- Une action = un brief exécutable par l'agent tel quel : précis sur le quoi (ex: "3 posts sur les chantiers terminés avec photos avant/après"), pas vague ("améliorer la com").
- Si l'entreprise n'a pas de site, l'action "préparer le contenu du site" (visibilite_locale) est prioritaire : Pepito le publie après validation.
- Base-toi sur l'état réel ci-dessus — ne répète pas une action déjà proposée, au plan ou écartée.
- Priorise ce qui a le plus d'impact pour l'objectif, pas une liste exhaustive.`,
    messages: [
      {
        role: "user",
        content: "Donne-moi ton plan d'action priorisé.",
      },
    ],
  });

  await recordUsage({
    companyId: company.id,
    agent: "co_ceo",
    model: AGENT_MODEL,
    usage: finalMessage.usage,
  });

  return prisma.actionPlanItem.findMany({
    where: { id: { in: createdItemIds } },
  });
}
