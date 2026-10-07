import { prisma } from "@/lib/prisma";
import { countLeads, type FunnelStats } from "@/lib/funnel-shared";

export * from "@/lib/funnel-shared";

/**
 * Funnel de prospection — agrégation déterministe (aucun appel modèle), même
 * principe que la page Rapport : les chiffres affichés sont toujours exacts.
 * Serveur uniquement (Prisma) ; la logique de comptage pure est dans
 * funnel-shared.ts, réutilisée côté client pour un recalcul immédiat après
 * une déclaration (cf. prospection-client.tsx).
 */

export async function getFunnelStats(companyId: string): Promise<FunnelStats> {
  const leads = await prisma.lead.findMany({
    where: { companyId },
    select: { stage: true, segment: true, createdAt: true },
  });
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const segments = new Map<string, typeof leads>();
  for (const lead of leads) {
    const key = lead.segment?.trim() || "sans segment";
    segments.set(key, [...(segments.get(key) ?? []), lead]);
  }

  return {
    total: countLeads(leads),
    thisMonth: countLeads(leads.filter((l) => l.createdAt >= monthStart)),
    bySegment: [...segments.entries()]
      .map(([segment, list]) => ({ segment, counts: countLeads(list) }))
      .sort((a, b) => b.counts.contactes - a.counts.contactes),
  };
}

export type WeeklyDelta = {
  identifies: number;
  contactes: number;
  reponses: number;
  rdv: number;
  clients: number;
};

/**
 * Évènements de la semaine écoulée, par date réelle de l'étape (pas par date
 * de création du lead) — pour le check-in hebdomadaire automatique
 * (cf. api/cron/weekly-review). Déterministe : aucun appel modèle, donc
 * aucun risque d'hallucination dans un message envoyé sans supervision
 * humaine (cf. src/app/rapport/page.tsx, même principe).
 */
export async function getWeeklyDelta(companyId: string, since: Date): Promise<WeeklyDelta> {
  const [identifies, contactes, reponses, rdv, clients] = await Promise.all([
    prisma.lead.count({ where: { companyId, createdAt: { gte: since }, stage: { not: "ecarte" } } }),
    prisma.lead.count({ where: { companyId, contactedAt: { gte: since } } }),
    prisma.lead.count({ where: { companyId, repliedAt: { gte: since } } }),
    prisma.lead.count({ where: { companyId, meetingAt: { gte: since } } }),
    prisma.lead.count({ where: { companyId, stage: "gagne", closedAt: { gte: since } } }),
  ]);
  return { identifies, contactes, reponses, rdv, clients };
}
