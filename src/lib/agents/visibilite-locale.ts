import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { anthropic, AGENT_MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { PERSONAS, objectiveLine } from "@/lib/agents/personas";

const AGENT_NAME = "visibilite_locale";
const PERSONA = PERSONAS.visibilite_locale;

/**
 * Agent "Visibilité locale" (cf. docs/agents-roster.md).
 * Ne fait QUE créer des propositions en base (statut "en_attente") :
 * aucun appel à une API externe ici. L'exécution réelle (mise à jour de la
 * fiche Google, publication d'une réponse) est déclenchée ailleurs, après
 * validation humaine dans le cockpit.
 */
export async function runVisibiliteLocaleAgent(companyId: string) {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
  });

  const createdProposalIds: string[] = [];

  const proposeAction = betaZodTool({
    name: "propose_action",
    description:
      "Enregistre une proposition d'action de visibilité locale, en attente de validation humaine. N'exécute rien directement.",
    inputSchema: z.object({
      kind: z
        .enum(["gbp_update", "review_reply"])
        .describe(
          "gbp_update = mise à jour d'une information de fiche Google Business Profile. review_reply = réponse suggérée à un avis client.",
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
        },
      });
      createdProposalIds.push(proposal.id);
      return `Proposition enregistrée (id: ${proposal.id}), en attente de validation.`;
    },
  });

  await anthropic.beta.messages.toolRunner({
    model: AGENT_MODEL,
    max_tokens: 4000,
    tools: [proposeAction],
    system: `Tu es ${PERSONA.name}, l'agent "${PERSONA.role}" de Pepito, un copilote IA pour indépendants et TPE.
Entreprise : ${company.name} (métier : ${company.trade}), zone de chalandise : ${company.servingArea}, ton de communication souhaité : ${company.tone}.
${objectiveLine(company.objective)}

Ton rôle : proposer 2 à 3 actions concrètes et courtes pour améliorer la visibilité locale de cette entreprise (fiche Google Business Profile, gestion des avis clients).
Règles strictes :
- Tu ne fais QUE proposer, jamais exécuter : utilise uniquement l'outil propose_action pour chaque proposition.
- Reste factuel et réaliste pour ce métier et cette zone, pas de contenu générique.
- Une proposition = une action, avec un contenu directement utilisable (pas de placeholder du type "[à compléter]").`,
    messages: [
      {
        role: "user",
        content:
          "Propose les premières actions de visibilité locale pour cette entreprise.",
      },
    ],
  });

  return prisma.agentProposal.findMany({
    where: { id: { in: createdProposalIds } },
  });
}
