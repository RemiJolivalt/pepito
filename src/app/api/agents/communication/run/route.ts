import { NextRequest, NextResponse } from "next/server";
import { runCommunicationAgent } from "@/lib/agents/communication";

export async function POST(request: NextRequest) {
  const { companyId, newsContext } = await request.json();

  if (!companyId) {
    return NextResponse.json({ error: "companyId requis" }, { status: 400 });
  }

  try {
    const proposals = await runCommunicationAgent(companyId, newsContext);
    return NextResponse.json(proposals, { status: 201 });
  } catch (error) {
    console.error("Erreur agent communication:", error);
    return NextResponse.json(
      { error: "Échec de l'exécution de l'agent" },
      { status: 500 },
    );
  }
}
