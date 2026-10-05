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

type CompanyProfileFields = {
  description?: string | null;
  phone?: string | null;
  certifications?: string | null;
  openingHours?: string | null;
};

/**
 * Profil libre de l'entreprise (remplace l'ancien champ "tone" figé) —
 * description, téléphone, certifications, horaires, uniquement les champs
 * renseignés. Le ton de communication se déduit de la description elle-même.
 */
export function companyProfileLines(company: CompanyProfileFields): string {
  const lines: string[] = [];
  if (company.description) lines.push(`Description donnée par le dirigeant : ${company.description}`);
  if (company.phone) lines.push(`Téléphone à afficher : ${company.phone}`);
  if (company.certifications) lines.push(`Certifications/labels : ${company.certifications}`);
  if (company.openingHours) lines.push(`Horaires d'ouverture : ${company.openingHours}`);
  return lines.join("\n");
}

/** Consigne de réorientation du dirigeant — prime sur tout le reste. */
export function directionLine(direction: string | null): string {
  return direction
    ? `CONSIGNE DU DIRIGEANT (prioritaire) : ${direction}`
    : "";
}

/** Options communes de lancement d'un agent depuis le plan de Paul. */
export type AgentRunOptions = {
  /** Action du plan à réaliser — l'agent doit s'y tenir plutôt que de proposer autre chose. */
  brief?: string;
  /** Rattache les propositions créées à l'action du plan correspondante. */
  planItemId?: string;
};

export function briefLine(brief?: string): string {
  return brief
    ? `ACTION DEMANDÉE PAR PAUL (Co-CEO) : ${brief}\nTes propositions doivent réaliser précisément cette action, pas autre chose.`
    : "";
}

