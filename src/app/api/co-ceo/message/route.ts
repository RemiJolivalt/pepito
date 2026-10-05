import { NextRequest, NextResponse } from "next/server";
import { runCoCeoTurn } from "@/lib/agents/co-ceo";
import { getSessionCompany } from "@/lib/session";

export async function POST(request: NextRequest) {
  const company = await getSessionCompany();
  if (!company) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }
  const { message } = await request.json();
  if (!message) {
    return NextResponse.json({ error: "message requis" }, { status: 400 });
  }

  try {
    const reply = await runCoCeoTurn(company.id, message);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Erreur Co-CEO:", error);
    return NextResponse.json({ error: "Échec de la réponse" }, { status: 500 });
  }
}
