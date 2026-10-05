import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionEmail } from "@/lib/session";

/** "Réorienter Paul" : consigne libre du dirigeant, injectée dans le plan et dans tous les agents. */
export async function POST(request: NextRequest) {
  const ownerEmail = await getSessionEmail();
  if (!ownerEmail) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }
  const { direction } = await request.json();
  if (typeof direction !== "string") {
    return NextResponse.json({ error: "direction requise" }, { status: 400 });
  }

  const company = await prisma.company.update({
    where: { ownerEmail },
    data: { direction: direction.trim() || null },
  });
  return NextResponse.json({ direction: company.direction });
}
