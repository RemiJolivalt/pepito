import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runVisibiliteLocaleAgent } from "@/lib/agents/visibilite-locale";
import { runCommunicationAgent } from "@/lib/agents/communication";
import { runDemarchageAgent } from "@/lib/agents/demarchage";
import { runAuditAgent } from "@/lib/agents/audit";

/**
 * Lance l'agent correspondant à une action du plan de Paul, EN LUI PASSANT
 * L'ACTION COMME BRIEF (titre + justification). Avant ce correctif, l'agent
 * était lancé à vide et proposait autre chose que ce que Paul avait décidé.
 * Les propositions créées sont rattachées à l'action (planItemId).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const item = await prisma.actionPlanItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Action introuvable" }, { status: 404 });
  }
  if (item.status !== "propose") {
    return NextResponse.json({ error: "Action déjà lancée ou écartée" }, { status: 409 });
  }

  const options = {
    brief: `${item.title} — ${item.rationale}`,
    planItemId: item.id,
  };

  try {
    let producedCount = 0;
    let nextStatus: "lance" | "termine" = "lance";

    switch (item.agent) {
      case "visibilite_locale":
        producedCount = (await runVisibiliteLocaleAgent(item.companyId, options)).length;
        break;
      case "communication":
        producedCount = (await runCommunicationAgent(item.companyId, undefined, options)).length;
        break;
      case "demarchage":
        producedCount = (await runDemarchageAgent(item.companyId, undefined, options)).length;
        break;
      case "audit":
        producedCount = (await runAuditAgent(item.companyId, options)).length;
        // L'audit ne produit pas de proposition à valider : l'action est réalisée dès la fin du run.
        nextStatus = "termine";
        break;
      default:
        return NextResponse.json({ error: `Agent inconnu : ${item.agent}` }, { status: 400 });
    }

    // Un agent qui n'a rien produit ne laisse pas l'action bloquée en "lancé".
    if (producedCount === 0 && nextStatus === "lance") nextStatus = "termine";

    const updated = await prisma.actionPlanItem.update({
      where: { id },
      data: { status: nextStatus },
    });
    return NextResponse.json({ item: updated, producedCount });
  } catch (error) {
    console.error("Erreur lancement action du plan:", error);
    return NextResponse.json({ error: "Échec du lancement de l'action" }, { status: 500 });
  }
}
