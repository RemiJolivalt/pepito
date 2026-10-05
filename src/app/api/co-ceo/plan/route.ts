import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runCoCeoPlanning } from "@/lib/agents/co-ceo";

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId");
  if (!companyId) {
    return NextResponse.json({ error: "companyId requis" }, { status: 400 });
  }
  const items = await prisma.actionPlanItem.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const { companyId } = await request.json();
  if (!companyId) {
    return NextResponse.json({ error: "companyId requis" }, { status: 400 });
  }

  try {
    const items = await runCoCeoPlanning(companyId);
    return NextResponse.json(items, { status: 201 });
  } catch (error) {
    console.error("Erreur plan Paul:", error);
    return NextResponse.json({ error: "Échec de la génération du plan" }, { status: 500 });
  }
}
