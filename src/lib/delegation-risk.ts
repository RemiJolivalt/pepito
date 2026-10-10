export type ActionRiskLevel = "faible" | "modere" | "eleve";
export type DelegationMode = "conseiller" | "accompagner" | "deleguer";

export type ActionRiskFactors = {
  publicExposure: boolean;
  externalCommunication: boolean;
  thirdPartyData: boolean;
  spending: boolean;
  irreversible: boolean;
};

export type ActionRisk = {
  level: ActionRiskLevel;
  label: string;
  explanation: string;
  factors: ActionRiskFactors;
};

export const RISK_LEVELS = ["faible", "modere", "eleve"] as const;
export type ConfiguredRiskLevel = (typeof RISK_LEVELS)[number];

export const RISK_ACTIONS = [
  { kind: "piste_croissance", label: "Piste de croissance" },
  { kind: "prospect", label: "Prospect professionnel" },
  { kind: "gbp_update", label: "Mise à jour fiche Google" },
  { kind: "review_reply", label: "Réponse à un avis" },
  { kind: "social_post", label: "Publication réseaux sociaux" },
  { kind: "site_web_content", label: "Publication du site" },
  { kind: "prospecting_email", label: "Email de prospection" },
  { kind: "gmail_email", label: "Email Gmail manuel" },
] as const;

const LEVEL_RANK: Record<ActionRiskLevel, number> = { faible: 0, modere: 1, eleve: 2 };

export function minimumRiskLevel(kind: string, context: Partial<ActionRiskFactors> = {}): ActionRiskLevel {
  const rule = RULES[kind];
  const factors = rule
    ? {
        publicExposure: rule.factors.publicExposure || context.publicExposure === true,
        externalCommunication: rule.factors.externalCommunication || context.externalCommunication === true,
        thirdPartyData: rule.factors.thirdPartyData || context.thirdPartyData === true,
        spending: rule.factors.spending || context.spending === true,
        irreversible: rule.factors.irreversible || context.irreversible === true,
      }
    : UNKNOWN_RISK_FACTORS;
  return riskLevelFromFactors(factors);
}

function riskLevelFromFactors(factors: ActionRiskFactors): ActionRiskLevel {
  return factors.publicExposure || factors.externalCommunication || factors.spending || factors.irreversible
    ? "eleve"
    : factors.thirdPartyData
      ? "modere"
      : "faible";
}

export function effectiveRiskLevel(kind: string, configured?: string | null, context: Partial<ActionRiskFactors> = {}, minimum?: ActionRiskLevel): ActionRiskLevel {
  const floor = minimum ?? minimumRiskLevel(kind, context);
  if (!configured || !RISK_LEVELS.includes(configured as ConfiguredRiskLevel)) return floor;
  return LEVEL_RANK[configured as ConfiguredRiskLevel] >= LEVEL_RANK[floor] ? configured as ConfiguredRiskLevel : floor;
}

const NO_RISK_FACTORS: ActionRiskFactors = {
  publicExposure: false,
  externalCommunication: false,
  thirdPartyData: false,
  spending: false,
  irreversible: false,
};

const RULES: Record<string, { factors: ActionRiskFactors; explanation: string }> = {
  piste_croissance: {
    factors: { ...NO_RISK_FACTORS, thirdPartyData: true },
    explanation: "Piste interne sans contact, mais contenant des informations sur une organisation tierce.",
  },
  prospect: {
    factors: { ...NO_RISK_FACTORS, thirdPartyData: true },
    explanation: "Ajoute des informations professionnelles sur une organisation tierce ; vérifier la source et la pertinence.",
  },
  gbp_update: {
    factors: { ...NO_RISK_FACTORS, publicExposure: true },
    explanation: "Peut modifier publiquement la fiche d'une entreprise sur Google.",
  },
  review_reply: {
    factors: { ...NO_RISK_FACTORS, publicExposure: true, thirdPartyData: true },
    explanation: "Réponse publique à un avis ; impact réputationnel et données d'un tiers.",
  },
  social_post: {
    factors: { ...NO_RISK_FACTORS, publicExposure: true, thirdPartyData: true },
    explanation: "Contenu destiné à être publié publiquement au nom de l'entreprise.",
  },
  site_web_content: {
    factors: { ...NO_RISK_FACTORS, publicExposure: true, irreversible: true },
    explanation: "Peut conduire à publier ou remplacer le site visible par les clients.",
  },
  prospecting_email: {
    factors: { ...NO_RISK_FACTORS, externalCommunication: true, thirdPartyData: true, irreversible: true },
    explanation: "Message de prospection destiné à un tiers ; conformité et réputation à vérifier.",
  },
  gmail_email: {
    factors: { ...NO_RISK_FACTORS, externalCommunication: true, thirdPartyData: true, irreversible: true },
    explanation: "Envoie un message externe depuis Gmail au nom du dirigeant.",
  },
};

const UNKNOWN_RISK_FACTORS: ActionRiskFactors = {
  publicExposure: true,
  externalCommunication: true,
  thirdPartyData: true,
  spending: true,
  irreversible: true,
};

export function assessActionRisk(kind: string, context: Partial<ActionRiskFactors> = {}, configuredLevel?: string | null): ActionRisk {
  const rule = RULES[kind];
  const factors = rule
    ? {
        publicExposure: rule.factors.publicExposure || context.publicExposure === true,
        externalCommunication: rule.factors.externalCommunication || context.externalCommunication === true,
        thirdPartyData: rule.factors.thirdPartyData || context.thirdPartyData === true,
        spending: rule.factors.spending || context.spending === true,
        irreversible: rule.factors.irreversible || context.irreversible === true,
      }
    : UNKNOWN_RISK_FACTORS;
  const minimum = riskLevelFromFactors(factors);
  const level = effectiveRiskLevel(kind, configuredLevel, context, minimum);
  const label = level === "faible" ? "Risque faible" : level === "modere" ? "Risque modéré" : "Risque élevé";
  return {
    level,
    label,
    explanation: rule?.explanation ?? "Type d'action non évalué ; validation humaine requise par prudence.",
    factors,
  };
}

export function requiresHumanApproval(kind: string, mode: DelegationMode = "accompagner", context: Partial<ActionRiskFactors> = {}, configuredLevel?: string | null): boolean {
  if (mode !== "deleguer") return true;
  return assessActionRisk(kind, context, configuredLevel).level !== "faible";
}

export function canExecuteAction(
  kind: string,
  mode: DelegationMode,
  humanApproved: boolean,
  context: Partial<ActionRiskFactors> = {},
  configuredLevel?: string | null,
): boolean {
  if (mode === "conseiller") return false;
  if (humanApproved) return true;
  return mode === "deleguer" && !requiresHumanApproval(kind, mode, context, configuredLevel);
}