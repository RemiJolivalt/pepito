import { NextResponse } from "next/server";
import { runAuditAgent } from "@/lib/agents/audit";
import { getSessionCompany } from "@/lib/session";

export async function POST() {
  const company = await getSessionCompany();
  if (!company) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  try {
    const findings = await runAuditAgent(company.id);
    return NextResponse.json(findings, { status: 201 });
  } catch (error) {
    console.error("Erreur agent audit:", error);
    return NextResponse.json(
      { error: "Échec de l'audit" },
      { status: 500 },
    );
  }
}
