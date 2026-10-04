import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const companies = await prisma.company.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(companies);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, trade, servingArea, tone } = body;

  if (!name || !trade || !servingArea || !tone) {
    return NextResponse.json(
      { error: "name, trade, servingArea et tone sont requis" },
      { status: 400 },
    );
  }

  const company = await prisma.company.create({
    data: { name, trade, servingArea, tone },
  });
  return NextResponse.json(company, { status: 201 });
}
