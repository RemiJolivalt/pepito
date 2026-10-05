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
      "Je visite votre site et vos réseaux, et je regarde vos concurrents locaux pour dresser un état des lieux honnête — y compris votre positionnement face à eux.",
  },
  visibilite_locale: {
    name: "Camille",
    role: "Visibilité locale & technique",
    blurb:
      "Je m'occupe de votre fiche Google, de vos avis clients, je prépare le contenu d'un site web si vous n'en avez pas, et je vous guide pour connecter vos outils.",
  },
  communication: {
    name: "Martine",
    role: "Communication",
    blurb:
      "Je prépare vos publications sur les réseaux sociaux — à partir de votre actualité, ou de mes propres idées si vous n'en avez pas. Je ne publie jamais sans votre accord.",
  },
  demarchage: {
    name: "Jean-Claude",
    role: "Démarchage",
    blurb:
      "Je repère des pistes de croissance (actualités locales, événements) et je prépare des templates de prospection pour aller chercher de nouveaux clients.",
  },
} as const;

export type AgentKey = keyof typeof PERSONAS;

/** Ligne d'objectif business à injecter dans les prompts, si déclaré (cf. docs/backlog.md #1). */
export function objectiveLine(objective: string | null): string {
  return objective
    ? `Objectif business du dirigeant : ${objective}. Oriente tes propositions vers cet objectif en priorité.`
    : "";
}

