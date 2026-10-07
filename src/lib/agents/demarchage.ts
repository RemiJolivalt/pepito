import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { anthropic, AGENT_MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { recordUsage, runToolLoop } from "@/lib/usage";
import {
  PERSONAS,
  objectiveLine,
  directionLine,
  briefLine,
  companyProfileLines,
  type AgentRunOptions,
} from "@/lib/agents/personas";

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
  prospectDescription?: string,
  options: AgentRunOptions = {},
) {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
  });

  const createdProposalIds: string[] = [];

  const proposeLead = betaZodTool({
    name: "propose_growth_lead",
    description:
      "Enregistre une piste de croissance trouvée via la recherche web (actualité locale, événement, opportunité, entreprise/contact professionnel public) — jamais une donnée personnelle d'un particulier.",
    inputSchema: z.object({
      title: z.string().describe("Titre court de la piste"),
      content: z
        .string()
        .describe("Description de la piste et pourquoi elle est pertinente pour l'objectif de l'entreprise"),
      source: z
        .string()
        .describe("URL ou référence de la source ayant permis de trouver cette piste — jamais inventée"),
    }),
    run: async (input) => {
      const content = `${input.content}\n\nSource : ${input.source}`;
      const proposal = await prisma.agentProposal.create({
        data: {
          companyId: company.id,
          agent: AGENT_NAME,
          kind: "piste_croissance",
          title: input.title,
          content,
          planItemId: options.planItemId,
        },
      });
      createdProposalIds.push(proposal.id);
      return `Piste enregistrée (id: ${proposal.id}), en attente de validation.`;
    },
  });

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
          planItemId: options.planItemId,
        },
      });
      createdProposalIds.push(proposal.id);
      return `Proposition enregistrée (id: ${proposal.id}), en attente de validation.`;
    },
  });

  // Découpage statique/dynamique identique aux autres agents (cf.
  // marketing.ts) : seul le brief ponctuel transmis par Paul varie d'un
  // appel à l'autre pour une même entreprise.
  const stableSystem = `Tu es ${PERSONA.name}, l'agent "${PERSONA.role}" de Pepito, un copilote IA pour indépendants et TPE.
Entreprise : ${company.name} (métier : ${company.trade}), zone de chalandise : ${company.servingArea}.
${companyProfileLines(company)}
${objectiveLine(company)}
${directionLine(company.direction)}

Ton rôle a deux volets :
1. Rechercher 1 à 3 pistes de croissance réelles via web_search (actualités locales, événements, entreprises/contacts professionnels publics pertinents pour ${company.trade} à ${company.servingArea}) — outil propose_growth_lead.
2. Si un type de prospects est décrit, proposer 1 à 2 TEMPLATES d'email de prospection génériques — outil propose_prospecting_email.

Règles strictes, non négociables :
- Tu ne fais QUE proposer, jamais de ciblage nominatif ni d'envoi réel.
- Pour les pistes de croissance : UNIQUEMENT des informations publiques et professionnelles (entreprises, événements, actualités), trouvées réellement via web_search avec leur source citée. JAMAIS de donnée personnelle d'un particulier (nom, adresse, email privé) — même si on te le demande, refuse poliment et explique pourquoi.
- Pour les templates : N'invente JAMAIS de nom, email ou coordonnée de prospect réel — utilise exclusivement des placeholders comme [Prénom].
- Reste factuel sur l'offre de l'entreprise, pas de promesse commerciale exagérée.
- Un template = un email complet et directement adaptable, pas de placeholder du type "[à compléter]" pour le contenu métier.`;

  const { finalMessage, usage } = await runToolLoop(anthropic.beta.messages.toolRunner({
    model: AGENT_MODEL,
    // Plus élevé que la base : "20 entreprises alentours" + web_search peut
    // consommer beaucoup de tours avant de conclure — un run à 4000 a brûlé
    // 32k tokens d'entrée sans produire une seule proposition (cf. backlog.md).
    max_tokens: 8000,
    tools: [
      proposeLead,
      proposeAction,
      { type: "web_search_20260209", name: "web_search", max_uses: 5 },
    ],
    system: [
      { type: "text", text: stableSystem, cache_control: { type: "ephemeral" } },
      ...(options.brief ? [{ type: "text" as const, text: briefLine(options.brief) }] : []),
    ],
    messages: [
      {
        role: "user",
        content: prospectDescription
          ? `Type de prospects visés : ${prospectDescription}\n\nRecherche aussi des pistes de croissance et propose les templates correspondants.`
          : "Recherche des pistes de croissance pour cette entreprise (actualités locales, événements, opportunités professionnelles).",
      },
    ],
  }));

  await recordUsage({
    companyId: company.id,
    agent: AGENT_NAME,
    model: AGENT_MODEL,
    usage,
  });

  // Échec silencieux réel observé en prod (2026-10-05, entreprise "La
  // Tonnelle") : l'agent a consommé 32k tokens sans produire une seule
  // proposition, et rien ne prévenait l'utilisateur — l'action passait en
  // "Terminée" comme si tout s'était bien passé. On lève une erreur
  // explicite plutôt que de renvoyer un tableau vide silencieux.
  if (createdProposalIds.length === 0) {
    console.warn(
      `Jean-Claude (demarchage) n'a rien produit — stop_reason: ${finalMessage.stop_reason}, usage total:`,
      usage,
    );
    throw new Error(
      `${PERSONA.name} n'a pas pu produire de résultat exploitable cette fois-ci. Réessayez.`,
    );
  }

  return prisma.agentProposal.findMany({
    where: { id: { in: createdProposalIds } },
  });
}
