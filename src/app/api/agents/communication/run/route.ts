import { NextRequest, NextResponse } from "next/server";
import { runCommunicationAgent } from "@/lib/agents/communication";
import { getSessionCompany } from "@/lib/session";

export async function POST(request: NextRequest) {
  const company = await getSessionCompany();
  if (!company) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }
  const { newsContext } = await request.json();

  try {
    const proposals = await runCommunicationAgent(company.id, newsContext);
    return NextResponse.json(proposals, { status: 201 });
  } catch (error) {
    console.error("Erreur agent communication:", error);
    return NextResponse.json(
      { error: "Échec de l'exécution de l'agent" },
      { status: 500 },
    );
  }
}
