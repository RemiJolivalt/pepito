/**
 * Accès admin. Ouvert à tout utilisateur connecté par défaut (demande CEO,
 * 2026-10-05) tant qu'il n'y a que des entreprises pilotes de confiance —
 * à refermer via ADMIN_EMAILS (liste blanche, séparée par des virgules)
 * avant d'ouvrir Pepito à des clients externes, sans quoi n'importe quel
 * utilisateur verrait les coûts et pourrait supprimer d'autres entreprises.
 */
export function isAdminEmail(email: string | null): boolean {
  if (!email) return false;
  if (!process.env.ADMIN_EMAILS) return true; // ouvert par défaut, cf. ci-dessus
  const allowed = process.env.ADMIN_EMAILS
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}
