"use client";

import { useEffect, useState } from "react";
import type { ActionRiskLevel } from "@/lib/delegation-risk";

type RiskSetting = {
  kind: string;
  label: string;
  configuredLevel: ActionRiskLevel | null;
  minimumLevel: ActionRiskLevel;
  effectiveLevel: ActionRiskLevel;
  updatedBy: string | null;
  updatedAt: string | null;
};

const OPTIONS: { value: ActionRiskLevel; label: string }[] = [
  { value: "faible", label: "Faible" },
  { value: "modere", label: "Modéré" },
  { value: "eleve", label: "Élevé" },
];

const LEVEL_RANK: Record<ActionRiskLevel, number> = { faible: 0, modere: 1, eleve: 2 };

export function DelegationRiskSettings({ explicitlyAuthorized }: { explicitlyAuthorized: boolean }) {
  const [settings, setSettings] = useState<RiskSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKind, setBusyKind] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!explicitlyAuthorized) return;
    let cancelled = false;
    fetch("/api/admin/delegation-risk")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Chargement impossible.");
        if (!cancelled) setSettings(body);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Chargement impossible.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [explicitlyAuthorized]);

  async function save(kind: string, riskLevel: ActionRiskLevel) {
    setBusyKind(kind);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/delegation-risk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionKind: kind, riskLevel }),
      });
      const updated = await response.json();
      if (!response.ok) throw new Error(updated.error ?? "Enregistrement impossible.");
      setSettings((current) => current.map((setting) => setting.kind === kind ? { ...setting, ...updated } : setting));
      setNotice(`Niveau de risque mis à jour pour ${settings.find((setting) => setting.kind === kind)?.label ?? kind}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enregistrement impossible.");
    } finally {
      setBusyKind(null);
    }
  }

  return (
    <section aria-labelledby="delegation-risk-heading" className="mt-8 border-y border-slate-200 py-6">
      <header className="max-w-3xl">
        <h2 id="delegation-risk-heading" className="text-lg font-medium">Politique de risque des actions</h2>
        <p className="mt-1 text-sm text-slate-600">Réglage global appliqué à toutes les entreprises. Choisissez le niveau minimal à exiger pour chaque type d&apos;action.</p>
      </header>
      {!explicitlyAuthorized && <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Configuration masquée : définissez explicitement <code>ADMIN_EMAILS</code> dans l&apos;environnement serveur pour autoriser les fondateurs à modifier la politique. L&apos;ouverture historique de l&apos;admin à tout utilisateur connecté ne suffit pas pour ce réglage global.</p>}
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {explicitlyAuthorized && loading && <p className="mt-4 text-sm text-slate-500">Chargement des niveaux…</p>}
      {explicitlyAuthorized && !loading && settings.length > 0 && (
        <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
          {settings.map((setting) => (
            <div key={setting.kind} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1 basis-48">
                <p className="text-sm font-medium">{setting.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {setting.configuredLevel ? "Réglage administrateur enregistré" : "Réglage initial calculé automatiquement"}
                  {" · "}Niveau effectif : {OPTIONS.find((option) => option.value === setting.effectiveLevel)?.label}
                  {" · "}Plancher : {OPTIONS.find((option) => option.value === setting.minimumLevel)?.label}
                  {setting.updatedBy && <> · Modifié par {setting.updatedBy}{setting.updatedAt && ` le ${new Date(setting.updatedAt).toLocaleString("fr-FR")}`}</>}
                </p>
              </div>
              <select
                aria-label={`Risque pour ${setting.label}`}
                value={setting.configuredLevel ?? setting.effectiveLevel}
                disabled={busyKind !== null}
                onChange={(event) => void save(setting.kind, event.target.value as ActionRiskLevel)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
              >
                  {OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} disabled={LEVEL_RANK[option.value] < LEVEL_RANK[setting.minimumLevel]}>
                      {option.label}{option.value === setting.minimumLevel ? " · plancher" : ""}
                    </option>
                  ))}
              </select>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 max-w-3xl space-y-2 text-sm text-slate-600">
        <p>Catégories configurables : <strong>Faible</strong> (interne et réversible), <strong>Modéré</strong> (données de tiers ou impact limité), <strong>Élevé</strong> (public, externe, dépense ou difficile à annuler).</p>
        <p>Ces catégories évaluent le risque d&apos;une action ; elles sont distinctes des modes Conseiller, Accompagner et Déléguer. Ce réglage ne choisit pas le mode d&apos;une entreprise.</p>
        <p>Le niveau choisi est persistant et global. Le niveau effectif ne descend jamais sous le plancher calculé : exposition publique, communication externe, dépense ou action difficile à annuler → risque élevé ; données de tiers → au minimum modéré ; type inconnu → élevé.</p>
        <p>Conseiller ne permet aucune exécution. Accompagner exige une confirmation humaine. Même en mode Déléguer, le plancher exige cette confirmation ; aucun mode autonome n&apos;est activé dans le prototype. L&apos;administrateur ne peut qu&apos;augmenter le niveau, jamais abaisser un plancher automatique.</p>
        <p>Cette politique est globale, pas configurable entreprise par entreprise. Toute modification prend effet immédiatement sur l&apos;affichage et les décisions serveur concernées.</p>
      </div>
    </section>
  );
}