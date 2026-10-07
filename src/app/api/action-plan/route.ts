import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionCompany } from "@/lib/session";
import { FINDING_ACTION_AGENTS } from "@/lib/finding-shared";

/**
 * Création directe d'une action du plan, sans passer par Paul (donc sans
 * appel modèle) — utilisée pour transformer en un clic une action suggérée
 * par un constat d'audit (cf. finding-card.tsx) en vraie action du plan.
 * Le texte est déjà écrit par l'agent qui a produit le constat ; le
 * dirigeant valide en l'ajoutant, puis la lance depuis le dashboard comme
 * n'importe quelle autre action du plan — même garde-fou de validation
 * humaine partout ailleurs.
 */
export async function POST(request: NextRequest) {
  const company = await getSessionCompany();
  if (!company) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { agent, title, rationale } = await request.json();
  if (!FINDING_ACTION_AGENTS.includes(agent)) {
    return NextResponse.json({ error: `agent doit être l'un de : ${FINDING_ACTION_AGENTS.join(", ")}` }, { status: 400 });
  }
  if (typeof title !== "string" || !title.trim() || typeof rationale !== "string" || !rationale.trim()) {
    return NextResponse.json({ error: "title et rationale (non vides) requis" }, { status: 400 });
  }

  const item = await prisma.actionPlanItem.create({
    data: {
      companyId: company.id,
      agent,
      title: title.trim(),
      rationale: rationale.trim(),
      timing: "dès que possible",
    },
  });
  return NextResponse.json(item, { status: 201 });
}
