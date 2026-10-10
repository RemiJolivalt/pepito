import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionEmail } from "@/lib/session";
import { isExplicitAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { effectiveRiskLevel, minimumRiskLevel, RISK_ACTIONS, RISK_LEVELS } from "@/lib/delegation-risk";

const updateSchema = z.object({
  actionKind: z.string(),
  riskLevel: z.enum(RISK_LEVELS),
});

function unavailable() {
  return NextResponse.json({
    error: "Les réglages de risque ne sont pas encore créés dans la base. Un administrateur doit appliquer la migration Prisma indiquée dans docs/delegation-risk-admin.md.",
  }, { status: 503 });
}

export async function GET() {
  const email = await getSessionEmail();
  if (!isExplicitAdminEmail(email)) return NextResponse.json({ error: "Accès administrateur explicite requis." }, { status: 403 });
  try {
    const saved = await prisma.delegationRiskSetting.findMany();
    const byKind = new Map(saved.map((setting) => [setting.actionKind, setting]));
    return NextResponse.json(RISK_ACTIONS.map((action) => {
      const setting = byKind.get(action.kind);
      return {
        ...action,
        configuredLevel: setting?.riskLevel ?? null,
        minimumLevel: minimumRiskLevel(action.kind),
        effectiveLevel: effectiveRiskLevel(action.kind, setting?.riskLevel),
        updatedBy: setting?.updatedBy ?? null,
        updatedAt: setting?.updatedAt ?? null,
      };
    }));
  } catch {
    return unavailable();
  }
}

export async function PATCH(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  const email = await getSessionEmail();
  if (!isExplicitAdminEmail(email)) return NextResponse.json({ error: "Accès administrateur explicite requis." }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !RISK_ACTIONS.some((action) => action.kind === parsed.data.actionKind)) {
    return NextResponse.json({ error: "Action ou niveau de risque non reconnu." }, { status: 400 });
  }
  const minimum = minimumRiskLevel(parsed.data.actionKind);
  if (RISK_LEVELS.indexOf(parsed.data.riskLevel) < RISK_LEVELS.indexOf(minimum)) {
    return NextResponse.json({ error: `Le niveau choisi est sous le plancher de sécurité de cette action (${minimum}).` }, { status: 400 });
  }
  try {
    const setting = await prisma.delegationRiskSetting.upsert({
      where: { actionKind: parsed.data.actionKind },
      create: { actionKind: parsed.data.actionKind, riskLevel: parsed.data.riskLevel, updatedBy: email! },
      update: { riskLevel: parsed.data.riskLevel, updatedBy: email! },
    });
    return NextResponse.json({
      actionKind: setting.actionKind,
      configuredLevel: setting.riskLevel,
      effectiveLevel: effectiveRiskLevel(setting.actionKind, setting.riskLevel),
      minimumLevel: minimum,
      updatedBy: setting.updatedBy,
      updatedAt: setting.updatedAt,
    });
  } catch {
    return unavailable();
  }
}