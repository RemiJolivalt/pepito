import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runCoCeoPlanning } from "@/lib/agents/co-ceo";
import { getSessionCompany } from "@/lib/session";

export async function GET() {
  const company = await getSessionCompany();
  if (!company) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }
  const items = await prisma.actionPlanItem.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "asc" },
    include: { proposals: { orderBy: { createdAt: "desc" } } },
  });
  return NextResponse.json(items);
}

export async function POST() {
  const company = await getSessionCompany();
  if (!company) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  try {
    const items = await runCoCeoPlanning(company.id);
    return NextResponse.json(items, { status: 201 });
  } catch (error) {
    console.error("Erreur plan Paul:", error);
    return NextResponse.json({ error: "Échec de la génération du plan" }, { status: 500 });
  }
}
