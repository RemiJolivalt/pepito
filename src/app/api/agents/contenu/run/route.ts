import { NextRequest, NextResponse } from "next/server";
import { runContenuAgent } from "@/lib/agents/contenu";
import { getSessionCompany } from "@/lib/session";

export async function POST(request: NextRequest) {
  const company = await getSessionCompany();
  if (!company) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }
  const { newsContext } = await request.json();

  try {
    const proposals = await runContenuAgent(company.id, newsContext);
    return NextResponse.json(proposals, { status: 201 });
  } catch (error) {
    console.error("Erreur agent contenu:", error);
    const message = error instanceof Error ? error.message : "Échec de l'exécution de l'agent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
