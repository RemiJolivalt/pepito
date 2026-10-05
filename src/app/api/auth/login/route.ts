import { NextRequest, NextResponse } from "next/server";
import { setSessionEmail } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

/**
 * Login simple par email + mot de passe (cf. docs/backlog.md — demande CEO).
 * Première connexion d'un email inconnu = création de compte : le mot de
 * passe fourni est enregistré, l'entreprise est créée avec des champs vides
 * (complétés ensuite dans l'onboarding). Un compte créé avant ce champ
 * (passwordHash null) accepte le mot de passe fourni et l'enregistre —
 * migration en douceur, pas de rupture pour les comptes de test existants.
 */
export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "Mot de passe requis (6 caractères minimum)" }, { status: 400 });
  }

  let company = await prisma.company.findUnique({ where: { ownerEmail: email } });

  if (!company) {
    company = await prisma.company.create({
      data: {
        ownerEmail: email,
        passwordHash: await hashPassword(password),
        name: "",
        trade: "",
        servingArea: "",
      },
    });
  } else if (!company.passwordHash) {
    company = await prisma.company.update({
      where: { id: company.id },
      data: { passwordHash: await hashPassword(password) },
    });
  } else if (!(await verifyPassword(password, company.passwordHash))) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  await setSessionEmail(email);
  company = await prisma.company.update({
    where: { id: company.id },
    data: { loginCount: { increment: 1 }, lastLoginAt: new Date() },
  });

  return NextResponse.json({
    hasCompany: Boolean(company.name),
    companyId: company.id,
  });
}
