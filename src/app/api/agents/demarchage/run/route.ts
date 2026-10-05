import { NextRequest, NextResponse } from "next/server";
import { runDemarchageAgent } from "@/lib/agents/demarchage";
import { getSessionCompany } from "@/lib/session";

export async function POST(request: NextRequest) {
  const company = await getSessionCompany();
  if (!company) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }
  const { prospectDescription } = await request.json();

  try {
    const proposals = await runDemarchageAgent(company.id, prospectDescription);
    return NextResponse.json(proposals, { status: 201 });
  } catch (error) {
    console.error("Erreur agent demarchage:", error);
    const message = error instanceof Error ? error.message : "Échec de l'exécution de l'agent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
