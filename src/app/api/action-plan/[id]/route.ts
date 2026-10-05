import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = ["lance", "termine"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { status } = await request.json();

  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status doit être l'un de : ${ALLOWED_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  const item = await prisma.actionPlanItem.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json(item);
}
