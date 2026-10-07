import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionCompany } from "@/lib/session";
import { LEAD_STAGES, type LeadStage } from "@/lib/funnel-shared";

/** Étapes que le dirigeant déclare lui-même — "propose"/"ecarte" passent par la validation de la proposition. */
const DECLARABLE: LeadStage[] = ["a_contacter", "contacte", "repondu", "rdv", "gagne", "perdu"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const company = await getSessionCompany();
  if (!company) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing || existing.companyId !== company.id) {
    return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  }

  const { stage } = await request.json();
  if (!LEAD_STAGES.includes(stage) || !DECLARABLE.includes(stage)) {
    return NextResponse.json({ error: `stage doit être l'un de : ${DECLARABLE.join(", ")}` }, { status: 400 });
  }

  const now = new Date();
  const lead = await prisma.lead.update({
    where: { id },
    data: {
      stage,
      contactedAt: stage === "contacte" && !existing.contactedAt ? now : undefined,
      repliedAt: stage === "repondu" && !existing.repliedAt ? now : undefined,
      meetingAt: stage === "rdv" && !existing.meetingAt ? now : undefined,
      closedAt: ["gagne", "perdu"].includes(stage) ? now : undefined,
    },
  });
  return NextResponse.json(lead);
}
