import { NextRequest, NextResponse } from "next/server";
import { runCoCeoTurn } from "@/lib/agents/co-ceo";

export async function POST(request: NextRequest) {
  const { companyId, message } = await request.json();

  if (!companyId || !message) {
    return NextResponse.json(
      { error: "companyId et message sont requis" },
      { status: 400 },
    );
  }

  try {
    const reply = await runCoCeoTurn(companyId, message);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Erreur Co-CEO:", error);
    return NextResponse.json({ error: "Échec de la réponse" }, { status: 500 });
  }
}
