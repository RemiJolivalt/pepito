"use client";

import { useState } from "react";
import type { Company, AgentProposal } from "@prisma/client";

const STATUS_LABELS: Record<string, string> = {
  en_attente: "En attente",
  validee: "Validée",
  modifiee: "Modifiée",
  rejetee: "Rejetée",
  executee: "Exécutée",
};

export function CockpitClient({
  initialCompanies,
}: {
  initialCompanies: Company[];
}) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    initialCompanies[0]?.id ?? null,
  );
  const [proposals, setProposals] = useState<AgentProposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [runningAgent, setRunningAgent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulaire de création d'entreprise démo (onboarding minimal, cf. docs/spec-contextualisation.md)
  const [name, setName] = useState("");
  const [trade, setTrade] = useState("kine");
  const [servingArea, setServingArea] = useState("");
  const [tone, setTone] = useState("convivial_proximite");

  async function loadProposals(companyId: string) {
    setLoadingProposals(true);
    setError(null);
    try {
      const res = await fetch(`/api/proposals?companyId=${companyId}`);
      const data = await res.json();
      setProposals(data);
    } catch {
      setError("Impossible de charger les propositions.");
    } finally {
      setLoadingProposals(false);
    }
  }

  async function handleSelectCompany(companyId: string) {
    setSelectedCompanyId(companyId);
    await loadProposals(companyId);
  }

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, trade, servingArea, tone }),
    });
    if (!res.ok) {
      setError("Création de l'entreprise impossible.");
      return;
    }
    const company = await res.json();
    setCompanies((prev) => [company, ...prev]);
    setSelectedCompanyId(company.id);
    setProposals([]);
    setName("");
    setServingArea("");
  }

  async function handleRunAgent() {
    if (!selectedCompanyId) return;
    setRunningAgent(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/visibilite-locale/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: selectedCompanyId }),
      });
      if (!res.ok) throw new Error();
      await loadProposals(selectedCompanyId);
    } catch {
      setError(
        "Échec de l'exécution de l'agent — vérifiez la clé ANTHROPIC_API_KEY.",
      );
    } finally {
      setRunningAgent(false);
    }
  }

  async function handleDecision(
    proposalId: string,
    status: "validee" | "rejetee",
  ) {
    const res = await fetch(`/api/proposals/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok && selectedCompanyId) {
      await loadProposals(selectedCompanyId);
    }
  }

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  return (
    <main className="mx-auto max-w-3xl p-8 font-sans">
      <h1 className="text-2xl font-semibold">Pepito — Cockpit</h1>
      <p className="mt-1 text-sm text-gray-500">
        Agent &quot;Visibilité locale&quot; — chaque proposition attend votre
        validation avant toute exécution réelle.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Entreprises</h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {companies.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => handleSelectCompany(c.id)}
                className={`rounded border px-3 py-1 text-sm ${
                  c.id === selectedCompanyId
                    ? "border-black bg-black text-white"
                    : "border-gray-300"
                }`}
              >
                {c.name} ({c.trade})
              </button>
            </li>
          ))}
        </ul>

        <form
          onSubmit={handleCreateCompany}
          className="mt-4 grid grid-cols-2 gap-2 rounded border border-gray-200 p-4"
        >
          <input
            required
            placeholder="Nom commercial"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-2 rounded border px-2 py-1 text-sm"
          />
          <select
            value={trade}
            onChange={(e) => setTrade(e.target.value)}
            className="rounded border px-2 py-1 text-sm"
          >
            <option value="kine">Kinésithérapeute</option>
            <option value="plombier">Plombier</option>
            <option value="installateur_solaire">
              Installateur panneaux solaires
            </option>
          </select>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="rounded border px-2 py-1 text-sm"
          >
            <option value="pro_rassurant">Pro / rassurant</option>
            <option value="convivial_proximite">Convivial / proximité</option>
            <option value="technique_expert">Technique / expert</option>
          </select>
          <input
            required
            placeholder="Zone de chalandise (ex: Lyon et alentours)"
            value={servingArea}
            onChange={(e) => setServingArea(e.target.value)}
            className="col-span-2 rounded border px-2 py-1 text-sm"
          />
          <button
            type="submit"
            className="col-span-2 rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
          >
            + Ajouter une entreprise (démo)
          </button>
        </form>
      </section>

      {selectedCompany && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">
              Propositions — {selectedCompany.name}
            </h2>
            <button
              onClick={handleRunAgent}
              disabled={runningAgent}
              className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-50"
            >
              {runningAgent
                ? "L'agent réfléchit…"
                : "Lancer l'agent Visibilité locale"}
            </button>
          </div>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {loadingProposals && <p className="mt-2 text-sm">Chargement…</p>}

          <ul className="mt-4 space-y-3">
            {proposals.length === 0 && !loadingProposals && (
              <li className="text-sm text-gray-500">
                Aucune proposition pour le moment.
              </li>
            )}
            {proposals.map((p) => (
              <li key={p.id} className="rounded border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase text-gray-400">
                    {p.kind}
                  </span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </div>
                <h3 className="mt-1 font-medium">{p.title}</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                  {p.content}
                </p>
                {p.status === "en_attente" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleDecision(p.id, "validee")}
                      className="rounded bg-green-600 px-3 py-1 text-sm text-white"
                    >
                      Valider
                    </button>
                    <button
                      onClick={() => handleDecision(p.id, "rejetee")}
                      className="rounded bg-gray-200 px-3 py-1 text-sm"
                    >
                      Rejeter
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
