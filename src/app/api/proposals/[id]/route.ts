import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = ["validee", "modifiee", "rejetee"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const { status, content } = body;

  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status doit être l'un de : ${ALLOWED_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  // Décision humaine actée ici — aucune exécution réelle déclenchée en V1
  // (cf. docs/architecture-technique.md § Flux de validation humaine).
  const proposal = await prisma.agentProposal.update({
    where: { id },
    data: {
      status,
      content: status === "modifiee" && content ? content : undefined,
      decidedAt: new Date(),
    },
  });

  return NextResponse.json(proposal);
}
