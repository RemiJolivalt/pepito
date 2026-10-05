import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { anthropic, AGENT_MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { PERSONAS, objectiveLine } from "@/lib/agents/personas";

const AGENT_NAME = "communication";
const PERSONA = PERSONAS.communication;

/**
 * Agent "Communication / réseaux sociaux" (cf. docs/agents-roster.md).
 * Ne fait QUE créer des propositions en base (statut "en_attente") : aucune
 * publication réelle ici. Contrairement à l'agent Visibilité locale, cet
 * agent a besoin d'une actualité déclarée par l'utilisateur (il n'invente
 * pas d'événement) — fournie en paramètre, pas collectée automatiquement.
 */
export async function runCommunicationAgent(
  companyId: string,
  newsContext: string,
) {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
  });

  const createdProposalIds: string[] = [];

  const proposeAction = betaZodTool({
    name: "propose_social_post",
    description:
      "Enregistre une proposition de publication sur les réseaux sociaux, en attente de validation humaine. N'exécute rien directement.",
    inputSchema: z.object({
      title: z.string().describe("Titre court de la proposition, affiché dans le cockpit"),
      caption: z.string().describe("Légende complète du post, prête à être relue et validée"),
      suggestedVisual: z
        .string()
        .describe(
          "Description du visuel suggéré pour accompagner le post (ex: type de photo, élément à mettre en avant) — pas de génération d'image en V1",
        ),
      suggestedDate: z
        .string()
        .describe("Date ou moment suggéré pour la publication, en langage naturel (ex: 'cette semaine', 'lundi matin')"),
    }),
    run: async (input) => {
      const content = `Légende : ${input.caption}\n\nVisuel suggéré : ${input.suggestedVisual}\n\nDate suggérée : ${input.suggestedDate}`;
      const proposal = await prisma.agentProposal.create({
        data: {
          companyId: company.id,
          agent: AGENT_NAME,
          kind: "social_post",
          title: input.title,
          content,
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

Ton rôle : proposer 2 à 3 posts Instagram/Facebook concrets à partir de l'actualité fournie par l'utilisateur.
Règles strictes :
- Tu ne fais QUE proposer, jamais publier : utilise uniquement l'outil propose_social_post pour chaque proposition.
- Appuie-toi exclusivement sur l'actualité fournie par l'utilisateur — n'invente jamais un événement, une offre ou une actualité qui n'a pas été mentionnée.
- Respecte le ton de communication indiqué.
- Une proposition = un post complet et directement utilisable (légende + suggestion de visuel + date), pas de placeholder du type "[à compléter]".`,
    messages: [
      {
        role: "user",
        content: `Actualité à communiquer : ${newsContext}\n\nPropose les posts correspondants.`,
      },
    ],
  });

  return prisma.agentProposal.findMany({
    where: { id: { in: createdProposalIds } },
  });
}
