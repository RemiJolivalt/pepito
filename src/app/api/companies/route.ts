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
  const {
    name,
    trade,
    servingArea,
    website,
    socialHandles,
    objective,
    description,
    phone,
    certifications,
    openingHours,
  } = body;

  if (!name || !trade || !servingArea) {
    return NextResponse.json(
      { error: "name, trade et servingArea sont requis" },
      { status: 400 },
    );
  }

  const data = {
    name,
    trade,
    servingArea,
    website,
    socialHandles,
    objective,
    description,
    phone,
    certifications,
    openingHours,
  };

  const company = await prisma.company.upsert({
    where: { ownerEmail },
    create: { ownerEmail, ...data },
    update: data,
  });
  return NextResponse.json(company, { status: 201 });
}
