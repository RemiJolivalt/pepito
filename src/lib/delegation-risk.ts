export type ActionRiskLevel = "faible" | "modere" | "eleve";

export type ActionRisk = {
  level: ActionRiskLevel;
  label: string;
  explanation: string;
};

const RULES: Record<string, ActionRisk> = {
  piste_croissance: {
    level: "faible",
    label: "Risque faible",
    explanation: "Piste informative interne ; aucune publication, dépense ou prise de contact.",
  },
  prospect: {
    level: "modere",
    label: "Risque modéré",
    explanation: "Ajoute des informations professionnelles sur une organisation tierce ; vérifier la source et la pertinence.",
  },
  gbp_update: {
    level: "eleve",
    label: "Risque élevé",
    explanation: "Peut modifier publiquement la fiche d'une entreprise sur Google.",
  },
  review_reply: {
    level: "eleve",
    label: "Risque élevé",
    explanation: "Réponse publique à un avis ; impact réputationnel et données d'un tiers.",
  },
  social_post: {
    level: "eleve",
    label: "Risque élevé",
    explanation: "Contenu destiné à être publié publiquement au nom de l'entreprise.",
  },
  site_web_content: {
    level: "eleve",
    label: "Risque élevé",
    explanation: "Peut conduire à publier ou remplacer le site visible par les clients.",
  },
  prospecting_email: {
    level: "eleve",
    label: "Risque élevé",
    explanation: "Message de prospection destiné à un tiers ; conformité et réputation à vérifier.",
  },
  gmail_email: {
    level: "eleve",
    label: "Risque élevé",
    explanation: "Envoie un message externe depuis Gmail au nom du dirigeant.",
  },
};

const UNKNOWN_RISK: ActionRisk = {
  level: "eleve",
  label: "Risque élevé",
  explanation: "Type d'action non évalué ; validation humaine requise par prudence.",
};

export function assessActionRisk(kind: string): ActionRisk {
  return RULES[kind] ?? UNKNOWN_RISK;
}

export function requiresHumanApproval(kind: string): boolean {
  return assessActionRisk(kind).level !== "faible";
}