import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { anthropic, AGENT_MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { PERSONAS, objectiveLine } from "@/lib/agents/personas";

const AGENT_NAME = "demarchage";
const PERSONA = PERSONAS.demarchage;

/**
 * Agent "Démarchage / prospection" (cf. docs/agents-roster.md) — le plus
 * sensible du roster (RGPD, image de marque). En V1 :
 * - Jamais de vraie liste de destinataires : l'agent produit un TEMPLATE
 *   générique à adapter manuellement par l'utilisateur, jamais un envoi
 *   nominatif automatisé.
 * - Jamais d'exécution : seulement des propositions, comme les autres agents.
 * - L'utilisateur reste seul responsable de la base de contacts et du
 *   respect du RGPD / droit à la prospection — un rappel est inclus dans
 *   chaque proposition.
 */
export async function runDemarchageAgent(
  companyId: string,
  prospectDescription: string,
) {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
  });

  const createdProposalIds: string[] = [];

  const proposeAction = betaZodTool({
    name: "propose_prospecting_email",
    description:
      "Enregistre un template d'email de prospection générique, en attente de validation humaine. N'envoie rien, ne cible aucun destinataire réel.",
    inputSchema: z.object({
      title: z.string().describe("Titre court de la proposition, affiché dans le cockpit"),
      subject: z.string().describe("Objet de l'email"),
      body: z
        .string()
        .describe(
          "Corps du template, avec un placeholder [Prénom] pour la personnalisation manuelle — jamais de nom réel",
        ),
    }),
    run: async (input) => {
      const content = `Objet : ${input.subject}\n\n${input.body}\n\n⚠️ Template générique à adapter manuellement avant tout envoi. Vérifiez votre base de contacts et le cadre légal de la prospection (RGPD) avant envoi — en cas de doute, consultez un expert Conformité/Juridique.`;
      const proposal = await prisma.agentProposal.create({
        data: {
          companyId: company.id,
          agent: AGENT_NAME,
          kind: "prospecting_email",
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

Ton rôle : proposer 1 à 2 TEMPLATES d'email de prospection génériques, à partir du type de prospects décrit par l'utilisateur.
Règles strictes, non négociables :
- Tu ne fais QUE proposer des templates génériques, jamais de ciblage ni d'envoi réel : utilise uniquement l'outil propose_prospecting_email.
- N'invente JAMAIS de nom, email ou coordonnée de prospect réel — utilise exclusivement des placeholders comme [Prénom].
- Reste factuel sur l'offre de l'entreprise, pas de promesse commerciale exagérée.
- Un template = un email complet et directement adaptable, pas de placeholder du type "[à compléter]" pour le contenu métier.`,
    messages: [
      {
        role: "user",
        content: `Type de prospects visés : ${prospectDescription}\n\nPropose les templates correspondants.`,
      },
    ],
  });

  return prisma.agentProposal.findMany({
    where: { id: { in: createdProposalIds } },
  });
}
