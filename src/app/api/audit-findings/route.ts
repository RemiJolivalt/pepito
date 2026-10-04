import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId");

  const findings = await prisma.auditFinding.findMany({
    where: companyId ? { companyId } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(findings);
}
