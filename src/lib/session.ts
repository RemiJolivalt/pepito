import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "pepito_session";

/**
 * Cookie de session SIGNÉ (HMAC) — corrige une faille critique trouvée en
 * conditions réelles le 2026-10-05 : l'ancienne version stockait l'email en
 * clair, non vérifié, dans le cookie. N'importe qui pouvait forger
 * `pepito_session_email=victime@email.com` à la main et accéder à son
 * compte sans jamais connaître le mot de passe. Ici, le cookie est
 * `base64url(email).hmac(email)` — toute altération invalide la signature.
 * Nécessite SESSION_SECRET dans l'environnement (généré une fois,
 * identique en local et en prod ; voir docs/backlog.md).
 */
function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET manquant dans l'environnement — généré une fois, requis pour signer les sessions. Voir docs/backlog.md.",
    );
  }
  return secret;
}

function sign(email: string): string {
  return createHmac("sha256", getSecret()).update(email).digest("hex");
}

function buildCookieValue(email: string): string {
  const encoded = Buffer.from(email, "utf8").toString("base64url");
  return `${encoded}.${sign(email)}`;
}

function verifyCookieValue(value: string): string | null {
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return null;
  let email: string;
  try {
    email = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = sign(email);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return email;
}

export async function getSessionEmail(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (!value) return null;
  return verifyCookieValue(value);
}

export async function setSessionEmail(email: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, buildCookieValue(email), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * Source de vérité unique de l'isolation entre entreprises : toute route API
 * qui lit/écrit des données d'une entreprise doit dériver son ID d'ICI, et
 * ne jamais faire confiance à un companyId envoyé par le client (cf. audit
 * du 2026-10-05 — aucune route ne vérifiait l'appartenance avant ce correctif).
 */
export async function getSessionCompany() {
  const ownerEmail = await getSessionEmail();
  if (!ownerEmail) return null;
  return prisma.company.findUnique({ where: { ownerEmail } });
}
