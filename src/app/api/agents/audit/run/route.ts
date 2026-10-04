import { NextRequest, NextResponse } from "next/server";
import { runAuditAgent } from "@/lib/agents/audit";

export async function POST(request: NextRequest) {
  const { companyId } = await request.json();

  if (!companyId) {
    return NextResponse.json({ error: "companyId requis" }, { status: 400 });
  }

  try {
    const findings = await runAuditAgent(companyId);
    return NextResponse.json(findings, { status: 201 });
  } catch (error) {
    console.error("Erreur agent audit:", error);
    return NextResponse.json(
      { error: "Échec de l'audit" },
      { status: 500 },
    );
  }
}
