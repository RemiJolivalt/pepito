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
