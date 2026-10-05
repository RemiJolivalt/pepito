/**
 * Accès admin par liste blanche d'emails (ADMIN_EMAILS, séparés par des
 * virgules) — pas de notion de rôle en base tant qu'il n'y a qu'un seul
 * opérateur. Si la variable n'est pas définie, personne n'est admin (défaut
 * sûr) plutôt que d'ouvrir la page à tout utilisateur connecté.
 */
export function isAdminEmail(email: string | null): boolean {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}
