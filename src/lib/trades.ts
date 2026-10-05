/**
 * Métiers suggérés à l'onboarding (recherche libre, pas un enum strict —
 * Company.trade reste un texte libre pour ne pas bloquer un métier absent
 * de cette liste indicative).
 */
export const TRADES = [
  "Kinésithérapeute",
  "Plombier",
  "Installateur panneaux solaires",
  "Électricien",
  "Chauffagiste",
  "Serrurier",
  "Menuisier",
  "Maçon",
  "Peintre en bâtiment",
  "Carreleur",
  "Couvreur",
  "Paysagiste / Jardinier",
  "Restaurant",
  "Boulanger-pâtissier",
  "Traiteur",
  "Fleuriste",
  "Coiffeur",
  "Esthéticienne",
  "Coach sportif",
  "Ostéopathe",
  "Dentiste",
  "Photographe",
  "Décorateur d'intérieur",
  "Agent immobilier",
  "Comptable",
  "Avocat",
  "Architecte d'intérieur",
  "Déménageur",
  "Taxi / VTC",
  "Toiletteur pour animaux",
  "Auto-école",
  "Garagiste",
  "Nettoyage / ménage à domicile",
  "Informaticien / dépannage",
  "Vétérinaire",
  "Pharmacien",
  "Pressing",
  "Cordonnier",
  "Tatoueur",
  "Professeur particulier",
] as const;

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Recherche par sous-chaîne, pas seulement par préfixe (ex: "res" -> "Restaurant"). */
export function searchTrades(query: string): string[] {
  const q = normalize(query.trim());
  if (!q) return TRADES.slice(0, 8) as string[];
  return TRADES.filter((t) => normalize(t).includes(q)) as string[];
}
