import { NextResponse } from "next/server";
import { runVisibiliteLocaleAgent } from "@/lib/agents/visibilite-locale";
import { getSessionCompany } from "@/lib/session";

export async function POST() {
  const company = await getSessionCompany();
  if (!company) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  try {
    const proposals = await runVisibiliteLocaleAgent(company.id);
    return NextResponse.json(proposals, { status: 201 });
  } catch (error) {
    console.error("Erreur agent visibilite_locale:", error);
    return NextResponse.json(
      { error: "Échec de l'exécution de l'agent" },
      { status: 500 },
    );
  }
}
