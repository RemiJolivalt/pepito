import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, AGENT_MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { PERSONAS, objectiveLine } from "@/lib/agents/personas";
import { runVisibiliteLocaleAgent } from "@/lib/agents/visibilite-locale";
import { runCommunicationAgent } from "@/lib/agents/communication";
import { runDemarchageAgent } from "@/lib/agents/demarchage";
import { runAuditAgent } from "@/lib/agents/audit";

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

  const [pendingCount, latestFindings] = await Promise.all([
    prisma.agentProposal.count({
      where: { companyId, status: "en_attente" },
    }),
    prisma.auditFinding.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

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
      "Lance l'agent Communication pour proposer des posts réseaux sociaux à partir d'une actualité. Nécessite une actualité réelle fournie par l'utilisateur dans la conversation — ne jamais inventer d'actualité.",
    inputSchema: z.object({
      newsContext: z
        .string()
        .describe("Actualité à communiquer, telle que mentionnée par l'utilisateur"),
    }),
    run: async (input) => {
      const proposals = await runCommunicationAgent(companyId, input.newsContext);
      return `${proposals.length} proposition(s) créée(s) par ${PERSONAS.communication.name}, en attente de validation dans le dashboard.`;
    },
  });

  const delegateDemarchage = betaZodTool({
    name: "delegate_demarchage",
    description:
      "Lance l'agent Démarchage pour préparer des templates de prospection générique. Nécessite une description du type de prospects visés fournie par l'utilisateur.",
    inputSchema: z.object({
      prospectDescription: z
        .string()
        .describe("Type de prospects visés, tel que mentionné par l'utilisateur"),
    }),
    run: async (input) => {
      const proposals = await runDemarchageAgent(companyId, input.prospectDescription);
      return `${proposals.length} template(s) créé(s) par ${PERSONAS.demarchage.name}, en attente de validation dans le dashboard.`;
    },
  });

  const delegateAudit = betaZodTool({
    name: "delegate_audit",
    description: "Relance l'agent Audit pour rafraîchir l'état des lieux de la présence en ligne.",
    inputSchema: z.object({}),
    run: async () => {
      const findings = await runAuditAgent(companyId);
      return `${findings.length} constat(s) mis à jour par ${PERSONAS.audit.name}.`;
    },
  });

  const finalMessage = await anthropic.beta.messages.toolRunner({
    model: AGENT_MODEL,
    max_tokens: 2000,
    tools: [delegateVisibilite, delegateCommunication, delegateDemarchage, delegateAudit],
    system: `Tu es le ${PERSONA.name} de Pepito, un copilote IA pour indépendants et TPE. ${PERSONA.blurb}
Entreprise : ${company.name} (métier : ${company.trade}), zone de chalandise : ${company.servingArea}, ton : ${company.tone}.
${objectiveLine(company.objective)}
Propositions en attente de validation actuellement : ${pendingCount}.
Derniers constats d'audit : ${latestFindings.map((f) => f.title).join("; ") || "aucun"}.

Ton rôle : échanger avec le dirigeant, l'aider à prioriser, et déléguer aux agents spécialisés (${PERSONAS.visibilite_locale.name} pour la visibilité locale, ${PERSONAS.communication.name} pour la communication, ${PERSONAS.demarchage.name} pour le démarchage, ${PERSONAS.audit.name} pour l'audit) via les outils delegate_* quand c'est pertinent.
Règles strictes :
- Tu ne fais JAMAIS exécuter une action réelle toi-même : déléguer ne fait que créer des propositions, qui restent soumises à la validation du dirigeant dans le dashboard. Dis-le clairement si tu délègues.
- Pour déléguer à Communication ou Démarchage, tu as besoin d'une information concrète (actualité réelle, type de prospects) — demande-la au dirigeant si elle manque, n'invente jamais.
- Réponds de façon brève et directe, comme un vrai point rapide entre dirigeants, pas un rapport formel.`,
    messages,
  });

  const assistantText = finalMessage.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  const savedReply = assistantText || "(pas de réponse textuelle — vérifiez le dashboard pour les nouvelles propositions)";

  await prisma.chatMessage.create({
    data: { companyId, role: "assistant", content: savedReply },
  });

  return savedReply;
}
