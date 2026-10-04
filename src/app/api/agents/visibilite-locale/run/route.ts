import { NextRequest, NextResponse } from "next/server";
import { runVisibiliteLocaleAgent } from "@/lib/agents/visibilite-locale";

export async function POST(request: NextRequest) {
  const { companyId } = await request.json();

  if (!companyId) {
    return NextResponse.json({ error: "companyId requis" }, { status: 400 });
  }

  try {
    const proposals = await runVisibiliteLocaleAgent(companyId);
    return NextResponse.json(proposals, { status: 201 });
  } catch (error) {
    console.error("Erreur agent visibilite_locale:", error);
    return NextResponse.json(
      { error: "Échec de l'exécution de l'agent" },
      { status: 500 },
    );
  }
}
