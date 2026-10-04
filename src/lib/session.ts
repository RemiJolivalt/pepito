import { cookies } from "next/headers";

const COOKIE_NAME = "pepito_session_email";

/**
 * Login minimal (email seul, pas de mot de passe) : volontairement un stub
 * tant qu'il n'y a qu'un utilisateur pilote. À durcir (vrai auth) avant tout
 * client payant — cf. docs/architecture-technique.md.
 */
export async function getSessionEmail(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export async function setSessionEmail(email: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, email, {
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
