import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId");
  if (!companyId) {
    return NextResponse.json({ error: "companyId requis" }, { status: 400 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { companyId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
}
