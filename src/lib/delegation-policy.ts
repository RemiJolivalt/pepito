import "server-only";
import { prisma } from "@/lib/prisma";

export async function getConfiguredRiskLevels(): Promise<Record<string, string>> {
  try {
    const settings = await prisma.delegationRiskSetting.findMany({ select: { actionKind: true, riskLevel: true } });
    return Object.fromEntries(settings.map((setting) => [setting.actionKind, setting.riskLevel]));
  } catch {
    return {};
  }
}