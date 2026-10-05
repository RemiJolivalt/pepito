import type { AgentKey } from "@/lib/agents/personas";

/**
 * Avatars illustratifs (silhouette + couleur par agent), pas des photos de
 * personnes réelles : Camille, Martine, Jean-Claude et Paul sont des IA,
 * pas des employés — une "photo" réaliste serait trompeuse pour l'utilisateur
 * final si elle apparaît un jour hors du dashboard (cf. échange avec le CEO).
 */
const COLORS: Record<AgentKey, string> = {
  co_ceo: "#111827",
  audit: "#0f766e",
  visibilite_locale: "#1d4ed8",
  communication: "#be185d",
  demarchage: "#b45309",
};

export function PersonaAvatar({
  agentKey,
  size = 40,
}: {
  agentKey: AgentKey;
  size?: number;
}) {
  const color = COLORS[agentKey];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className="shrink-0 rounded-full"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="20" fill={color} />
      <circle cx="20" cy="15" r="7" fill="white" fillOpacity="0.9" />
      <path
        d="M6 36c1.5-8 7-12 14-12s12.5 4 14 12"
        fill="white"
        fillOpacity="0.9"
      />
    </svg>
  );
}
