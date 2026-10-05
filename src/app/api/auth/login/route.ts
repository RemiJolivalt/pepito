import { NextRequest, NextResponse } from "next/server";
import { setSessionEmail } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

/**
 * Login simple par email + mot de passe (cf. docs/backlog.md — demande CEO).
 * Première connexion d'un email inconnu = création de compte : le mot de
 * passe fourni est enregistré, l'entreprise est créée avec des champs vides
 * (complétés ensuite dans l'onboarding). Un compte créé avant ce champ
 * (passwordHash null) accepte le mot de passe fourni et l'enregistre —
 * migration en douceur, pas de rupture pour les comptes de test existants.
 *
 * Anti-force-brute (cf. docs/backlog.md, point P0) : 5 échecs consécutifs
 * verrouillent le compte 15 minutes. Stocké en base (pas en mémoire) pour
 * rester valable entre plusieurs instances serverless.
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

  if (company?.lockedUntil && company.lockedUntil > new Date()) {
    const minutes = Math.ceil((company.lockedUntil.getTime() - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Trop de tentatives échouées. Réessayez dans ${minutes} minute(s).` },
      { status: 429 },
    );
  }

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
    const attempts = company.failedLoginAttempts + 1;
    await prisma.company.update({
      where: { id: company.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_DURATION_MS) : undefined,
      },
    });
    const remaining = MAX_ATTEMPTS - attempts;
    return NextResponse.json(
      {
        error:
          remaining > 0
            ? `Mot de passe incorrect (${remaining} tentative(s) restante(s))`
            : "Trop de tentatives échouées. Compte verrouillé 15 minutes.",
      },
      { status: remaining > 0 ? 401 : 429 },
    );
  }

  await setSessionEmail(email);
  company = await prisma.company.update({
    where: { id: company.id },
    data: { loginCount: { increment: 1 }, lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null },
  });

  return NextResponse.json({
    hasCompany: Boolean(company.name),
    companyId: company.id,
  });
}
