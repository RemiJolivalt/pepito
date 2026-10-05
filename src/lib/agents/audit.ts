import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { anthropic, AGENT_MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { PERSONAS } from "@/lib/agents/personas";

const PERSONA = PERSONAS.audit;

/**
 * Agent "Audit" : visite le site web déclaré (s'il existe) via l'outil
 * serveur web_fetch et enregistre 3 à 5 constats. Ce n'est PAS un agent
 * d'action — pas de proposition à valider, juste un état des lieux affiché
 * en tête du dashboard avant les agents d'optimisation.
 * Si aucun site n'est renseigné ou n'est pas accessible, le constat "pas de
 * site web" est un résultat normal, pas une erreur (cf. challenge produit).
 */
export async function runAuditAgent(companyId: string) {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
  });

  const createdFindingIds: string[] = [];

  const proposeFinding = betaZodTool({
    name: "record_audit_finding",
    description:
      "Enregistre un constat d'audit (force ou point à améliorer) sur la présence en ligne de l'entreprise.",
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
        data: {
          companyId: company.id,
          category: input.category,
          title: input.title,
          content: input.content,
        },
      });
      createdFindingIds.push(finding.id);
      return `Constat enregistré (id: ${finding.id}).`;
    },
  });

  const websiteInstruction = company.website
    ? `Le site web déclaré est : ${company.website}. Utilise l'outil web_fetch pour le consulter avant de conclure.`
    : `Aucun site web n'a été déclaré. Enregistre un constat "site_web" signalant l'absence de site comme premier axe d'amélioration, sans inventer de contenu.`;

  await anthropic.beta.messages.toolRunner({
    model: AGENT_MODEL,
    max_tokens: 4000,
    tools: [
      proposeFinding,
      { type: "web_fetch_20260209", name: "web_fetch", max_uses: 3 },
      { type: "web_search_20260209", name: "web_search", max_uses: 5 },
    ],
    system: `Tu es ${PERSONA.name}, l'agent "${PERSONA.role}" de Pepito, un copilote IA pour indépendants et TPE.
Entreprise : ${company.name} (métier : ${company.trade}), zone de chalandise : ${company.servingArea}.
Réseaux sociaux déclarés : ${company.socialHandles ?? "aucun"}.

Ton rôle : dresser un état des lieux honnête de la présence en ligne de cette entreprise ET de son positionnement concurrentiel local, en 4 à 6 constats.
Règles strictes :
- Utilise uniquement l'outil record_audit_finding pour chaque constat.
- ${websiteInstruction}
- Si le site est inaccessible (erreur de fetch), signale-le comme un constat factuel, ne devine jamais son contenu.
- Utilise l'outil web_search pour identifier 2 à 3 concurrents réels du même métier dans la même zone (ex: "${company.trade} ${company.servingArea}"), et enregistre au moins un constat de catégorie "concurrence" résumant leur positionnement (ce qu'ils mettent en avant, leur présence en ligne) comparé à cette entreprise. Cite tes sources (nom de l'entreprise concurrente trouvée), n'invente jamais de concurrent.
- Pas de jargon marketing creux : chaque constat doit être concret et actionnable.`,
    messages: [
      {
        role: "user",
        content: company.website
          ? `Réalise l'audit de présence en ligne de cette entreprise, y compris une analyse de la concurrence locale. Site web à consulter : ${company.website}`
          : "Réalise l'audit de présence en ligne de cette entreprise, y compris une analyse de la concurrence locale.",
      },
    ],
  });

  if (createdFindingIds.length === 0) {
    const fallback = await prisma.auditFinding.create({
      data: {
        companyId: company.id,
        category: "site_web",
        title: "Audit incomplet",
        content:
          "L'agent n'a pas pu produire de constat exploitable cette fois-ci. Relancez l'audit depuis le dashboard.",
      },
    });
    createdFindingIds.push(fallback.id);
  }

  return prisma.auditFinding.findMany({
    where: { id: { in: createdFindingIds } },
  });
}
