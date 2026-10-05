/**
 * Personnification des agents (cf. docs/backlog.md #2). Noms repris de la
 * proposition tierce challengée le 2026-10-05 pour Communication et
 * Démarchage ; les autres sont nos choix. Le Co-CEO n'a volontairement pas
 * de prénom — c'est le point de contact, pas un personnage.
 */
export const PERSONAS = {
  co_ceo: {
    name: "Paul",
    role: "Co-CEO — votre point de contact",
    blurb:
      "Je connais votre entreprise et votre objectif. Je fais le point, je priorise et j'active les bons agents pour vous — toujours avec votre validation avant toute action réelle.",
  },
  audit: {
    name: "Nadia",
    role: "Audit",
    blurb:
      "Je visite votre site et vos réseaux pour dresser un état des lieux honnête de votre présence en ligne.",
  },
  visibilite_locale: {
    name: "Camille",
    role: "Visibilité locale",
    blurb:
      "Je m'occupe de votre fiche Google et de vos avis clients pour que vos clients vous trouvent facilement.",
  },
  communication: {
    name: "Martine",
    role: "Communication",
    blurb:
      "Je propose vos publications sur les réseaux sociaux à partir de votre actualité.",
  },
  demarchage: {
    name: "Jean-Claude",
    role: "Démarchage",
    blurb:
      "Je prépare des templates de prospection pour aller chercher de nouveaux clients.",
  },
} as const;

export type AgentKey = keyof typeof PERSONAS;

/** Ligne d'objectif business à injecter dans les prompts, si déclaré (cf. docs/backlog.md #1). */
export function objectiveLine(objective: string | null): string {
  return objective
    ? `Objectif business du dirigeant : ${objective}. Oriente tes propositions vers cet objectif en priorité.`
    : "";
}

