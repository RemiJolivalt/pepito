/**
 * Calcul déterministe (aucun appel modèle) de l'écart entre la situation
 * déclarée et l'objectif chiffré — cf. docs/backlog.md "partenaire de
 * croissance". Tout est déclaratif : Pepito n'estime jamais un CA lui-même.
 */

type BusinessFields = {
  monthlyRevenue: number | null;
  revenueTarget: number | null;
  targetDate: Date | null;
  averageClientValue: number | null;
  newClientsPerMonth: number | null;
};

export type BusinessTarget = {
  current: number;
  target: number;
  gap: number;
  growthPct: number;
  monthsRemaining: number | null;
  /** Nouveaux clients par mois nécessaires en plus du rythme actuel — null sans valeur client. */
  extraClientsPerMonth: number | null;
};

export function computeBusinessTarget(company: BusinessFields): BusinessTarget | null {
  if (company.monthlyRevenue == null || company.revenueTarget == null) return null;
  const current = company.monthlyRevenue;
  const target = company.revenueTarget;
  const gap = target - current;
  const growthPct = current > 0 ? Math.round((gap / current) * 100) : 0;

  let monthsRemaining: number | null = null;
  if (company.targetDate) {
    const ms = company.targetDate.getTime() - Date.now();
    monthsRemaining = Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24 * 30.44)));
  }

  const extraClientsPerMonth =
    company.averageClientValue && company.averageClientValue > 0 && gap > 0
      ? Math.ceil(gap / company.averageClientValue)
      : null;

  return { current, target, gap, growthPct, monthsRemaining, extraClientsPerMonth };
}

export function formatEuros(value: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(value)} €`;
}

/** Résumé chiffré pour les prompts agents — vide si l'objectif chiffré n'est pas renseigné. */
export function businessTargetLines(company: BusinessFields): string {
  const t = computeBusinessTarget(company);
  if (!t) return "";
  const lines = [
    `Situation déclarée : ${formatEuros(t.current)}/mois de CA. Objectif : ${formatEuros(t.target)}/mois${
      t.monthsRemaining != null ? ` d'ici ${t.monthsRemaining} mois` : ""
    }, soit ${t.gap >= 0 ? "+" : ""}${formatEuros(t.gap)}/mois (${t.growthPct >= 0 ? "+" : ""}${t.growthPct} %).`,
  ];
  if (company.averageClientValue) {
    lines.push(`Valeur moyenne d'un client : ${formatEuros(company.averageClientValue)}.`);
  }
  if (t.extraClientsPerMonth != null) {
    lines.push(
      `Il faut donc environ ${t.extraClientsPerMonth} nouveaux clients supplémentaires par mois${
        company.newClientsPerMonth != null ? ` (rythme actuel déclaré : ${company.newClientsPerMonth}/mois)` : ""
      }. Chaque action doit être justifiée par sa contribution à cet écart, pas par un effet de visibilité vague.`,
    );
  }
  return lines.join("\n");
}
