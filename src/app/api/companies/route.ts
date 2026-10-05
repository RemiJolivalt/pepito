import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionEmail } from "@/lib/session";

export async function GET() {
  const ownerEmail = await getSessionEmail();
  if (!ownerEmail) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }
  const company = await prisma.company.findUnique({ where: { ownerEmail } });
  return NextResponse.json(company);
}

export async function POST(request: NextRequest) {
  const ownerEmail = await getSessionEmail();
  if (!ownerEmail) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const body = await request.json();
  const { name, trade, servingArea, tone, website, socialHandles, objective } = body;

  if (!name || !trade || !servingArea || !tone) {
    return NextResponse.json(
      { error: "name, trade, servingArea et tone sont requis" },
      { status: 400 },
    );
  }

  const company = await prisma.company.upsert({
    where: { ownerEmail },
    create: { ownerEmail, name, trade, servingArea, tone, website, socialHandles, objective },
    update: { name, trade, servingArea, tone, website, socialHandles, objective },
  });
  return NextResponse.json(company, { status: 201 });
}
