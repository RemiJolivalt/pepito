import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { anthropic, AGENT_MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { recordUsage } from "@/lib/usage";
import {
  PERSONAS,
  directionLine,
  briefLine,
  companyProfileLines,
  type AgentRunOptions,
} from "@/lib/agents/personas";

const AGENT_NAME = "marketing";
const PERSONA = PERSONAS.marketing;

/**
 * Agent "Marketing Officer" (Martine) — fusion de l'ancienne Nadia (audit,
 * positionnement concurrentiel) et du pilotage de la fiche Google (ancienne
 * Camille), décidée le 2026-10-05 pour rationaliser l'équipe. Diagnostique
 * et pilote la présence Google ; ne produit pas de contenu créatif
 * (posts, site) — ça reste le rôle de Camille, qui s'appuie sur les
 * constats produits ici. Comme les autres agents : propose uniquement,
 * jamais d'exécution directe.
 */
export async function runMarketingAgent(
  companyId: string,
  options: AgentRunOptions = {},
) {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
  });

  const createdFindingIds: string[] = [];
  const createdProposalIds: string[] = [];

  const recordFinding = betaZodTool({
    name: "record_audit_finding",
    description:
      "Enregistre un constat d'audit ou de positionnement concurrentiel (pas une action à valider, juste un état des lieux).",
    inputSchema: z.object({
      category: z
        .enum(["site_web", "reseaux_sociaux", "concurrence"])
        .describe("Catégorie du constat — concurrence = positionnement face à un concurrent identifié"),
      title: z.string().describe("Titre court du constat"),
      content: z
        .string()
        .describe("Détail du constat et, si pertinent, une recommandation courte"),
    }),
    run: async (input) => {
      const finding = await prisma.auditFinding.create({
        data: { companyId: company.id, category: input.category, title: input.title, content: input.content },
      });
      createdFindingIds.push(finding.id);
      return `Constat enregistré (id: ${finding.id}).`;
    },
  });

  const proposeAction = betaZodTool({
    name: "propose_action",
    description:
      "Enregistre une proposition de mise à jour de la fiche Google, en attente de validation humaine. N'exécute rien directement.",
    inputSchema: z.object({
      kind: z
        .enum(["gbp_update", "review_reply"])
        .describe(
          "gbp_update = mise à jour d'une information structurée de la fiche Google Business Profile (horaires, catégorie, services...). review_reply = réponse suggérée à un avis client.",
        ),
      title: z.string().describe("Titre court de la proposition, affiché dans le cockpit"),
      content: z
        .string()
        .describe("Contenu complet de la proposition, prêt à être relu et validé par l'utilisateur"),
    }),
    run: async (input) => {
      const proposal = await prisma.agentProposal.create({
        data: {
          companyId: company.id,
          agent: AGENT_NAME,
          kind: input.kind,
          title: input.title,
          content: input.content,
          planItemId: options.planItemId,
        },
      });
      createdProposalIds.push(proposal.id);
      return `Proposition enregistrée (id: ${proposal.id}), en attente de validation.`;
    },
  });

  const websiteInstruction = company.website
    ? `Le site web déclaré est : ${company.website}. Utilise l'outil web_fetch pour le consulter avant de conclure.`
    : `Aucun site web n'a été déclaré. Enregistre un constat "site_web" signalant l'absence de site comme premier axe d'amélioration, sans inventer de contenu.`;

  const finalMessage = await anthropic.beta.messages.toolRunner({
    model: AGENT_MODEL,
    max_tokens: 4000,
    tools: [
      recordFinding,
      proposeAction,
      { type: "web_fetch_20260209", name: "web_fetch", max_uses: 3 },
      { type: "web_search_20260209", name: "web_search", max_uses: 5 },
    ],
    system: `Tu es ${PERSONA.name}, ${PERSONA.role} de Pepito, un copilote IA pour indépendants et TPE. ${PERSONA.trait}
Entreprise : ${company.name} (métier : ${company.trade}), zone de chalandise : ${company.servingArea}.
Réseaux sociaux déclarés : ${company.socialHandles ?? "aucun"}.
${companyProfileLines(company)}
${directionLine(company.direction)}
${briefLine(options.brief)}

Ton rôle a deux volets, à faire tous les deux sauf si le brief ci-dessus te demande de te concentrer sur un seul :
1. Diagnostic : état des lieux honnête de la présence en ligne (site, réseaux) ET du positionnement face à 2-3 concurrents réels locaux — outil record_audit_finding.
2. Pilotage de la fiche Google : propositions concrètes de mise à jour (infos structurées, pas de texte créatif long) et réponses aux avis — outil propose_action.
Règles strictes :
- Tu ne produis PAS de contenu créatif (posts réseaux sociaux, contenu de site) — c'est le rôle de ${PERSONAS.contenu.name}, qui s'appuiera sur tes constats.
- ${websiteInstruction}
- Si le site est inaccessible, signale-le comme un constat factuel, ne devine jamais son contenu.
- Utilise web_search pour identifier des concurrents réels (ex: "${company.trade} ${company.servingArea}") — cite tes sources, n'invente jamais de concurrent.
- Tu ne fais QUE proposer/constater, jamais exécuter directement.
- Pas de jargon marketing creux : chaque constat ou proposition doit être concret et actionnable.`,
    messages: [
      {
        role: "user",
        content: "Fais le point sur la présence en ligne de cette entreprise et pilote sa fiche Google.",
      },
    ],
  });

  if (createdFindingIds.length === 0 && createdProposalIds.length === 0) {
    const fallback = await prisma.auditFinding.create({
      data: {
        companyId: company.id,
        category: "site_web",
        title: "Analyse incomplète",
        content: "L'agent n'a pas pu produire de constat exploitable cette fois-ci. Relancez-le depuis le dashboard.",
      },
    });
    createdFindingIds.push(fallback.id);
  }

  await recordUsage({ companyId: company.id, agent: AGENT_NAME, model: AGENT_MODEL, usage: finalMessage.usage });

  const [findings, proposals] = await Promise.all([
    prisma.auditFinding.findMany({ where: { id: { in: createdFindingIds } } }),
    prisma.agentProposal.findMany({ where: { id: { in: createdProposalIds } } }),
  ]);
  return { findings, proposals };
}
