import { NextRequest, NextResponse } from "next/server";
import { runDemarchageAgent } from "@/lib/agents/demarchage";

export async function POST(request: NextRequest) {
  const { companyId, prospectDescription } = await request.json();

  if (!companyId) {
    return NextResponse.json({ error: "companyId requis" }, { status: 400 });
  }

  try {
    const proposals = await runDemarchageAgent(companyId, prospectDescription);
    return NextResponse.json(proposals, { status: 201 });
  } catch (error) {
    console.error("Erreur agent demarchage:", error);
    return NextResponse.json(
      { error: "Échec de l'exécution de l'agent" },
      { status: 500 },
    );
  }
}
