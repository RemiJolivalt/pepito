import { NextRequest, NextResponse } from "next/server";
import { setSessionEmail } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  await setSessionEmail(email);
  const company = await prisma.company.findUnique({ where: { ownerEmail: email } });

  return NextResponse.json({
    hasCompany: Boolean(company),
    companyId: company?.id ?? null,
  });
}
