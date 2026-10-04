"use client";

import { useState } from "react";
import type { Company, AgentProposal, AuditFinding } from "@prisma/client";

const STATUS_LABELS: Record<string, string> = {
  en_attente: "En attente",
  validee: "Validée",
  modifiee: "Modifiée",
  rejetee: "Rejetée",
  executee: "Exécutée",
};

function ProposalList({
  proposals,
  onDecision,
}: {
  proposals: AgentProposal[];
  onDecision: (id: string, status: "validee" | "rejetee") => void;
}) {
  if (proposals.length === 0) {
    return (
      <p className="text-sm text-gray-500">Aucune proposition pour le moment.</p>
    );
  }
  return (
    <ul className="space-y-3">
      {proposals.map((p) => (
        <li key={p.id} className="rounded border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase text-gray-400">{p.kind}</span>
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
                onClick={() => onDecision(p.id, "validee")}
                className="rounded bg-green-600 px-3 py-1 text-sm text-white"
              >
                Valider
              </button>
              <button
                onClick={() => onDecision(p.id, "rejetee")}
                className="rounded bg-gray-200 px-3 py-1 text-sm"
              >
                Rejeter
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function DashboardClient({
  company,
  initialAuditFindings,
  initialProposals,
}: {
  company: Company;
  initialAuditFindings: AuditFinding[];
  initialProposals: AgentProposal[];
}) {
  const [auditFindings, setAuditFindings] = useState(initialAuditFindings);
  const [proposals, setProposals] = useState(initialProposals);
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newsContext, setNewsContext] = useState("");
  const [prospectDescription, setProspectDescription] = useState("");

  async function refreshAll() {
    const [findingsRes, proposalsRes] = await Promise.all([
      fetch(`/api/audit-findings?companyId=${company.id}`),
      fetch(`/api/proposals?companyId=${company.id}`),
    ]);
    if (findingsRes.ok) setAuditFindings(await findingsRes.json());
    if (proposalsRes.ok) setProposals(await proposalsRes.json());
  }

  async function runAgent(
    key: string,
    url: string,
    body: Record<string, unknown>,
  ) {
    setRunningAgent(key);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      await refreshAll();
    } catch {
      setError(
        "Échec de l'exécution — vérifiez la clé ANTHROPIC_API_KEY côté serveur.",
      );
    } finally {
      setRunningAgent(null);
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
    if (res.ok) await refreshAll();
  }

  return (
    <main className="mx-auto max-w-3xl p-8 font-sans">
      <h1 className="text-2xl font-semibold">{company.name}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {company.trade} — {company.servingArea}
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Audit de présence en ligne</h2>
          <button
            onClick={() => runAgent("audit", "/api/agents/audit/run", { companyId: company.id })}
            disabled={runningAgent !== null}
            className="rounded bg-gray-800 px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            {runningAgent === "audit" ? "Audit en cours…" : "Relancer l'audit"}
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {auditFindings.length === 0 && (
            <li className="text-sm text-gray-500">Aucun audit pour le moment.</li>
          )}
          {auditFindings.map((f) => (
            <li key={f.id} className="rounded border border-gray-200 p-3">
              <span className="text-xs uppercase text-gray-400">{f.category}</span>
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                {f.content}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Agent Visibilité locale</h2>
        <button
          onClick={() =>
            runAgent("visibilite_locale", "/api/agents/visibilite-locale/run", {
              companyId: company.id,
            })
          }
          disabled={runningAgent !== null}
          className="mt-2 rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          {runningAgent === "visibilite_locale"
            ? "L'agent réfléchit…"
            : "Lancer l'agent"}
        </button>
        <div className="mt-4">
          <ProposalList
            proposals={proposals.filter((p) => p.agent === "visibilite_locale")}
            onDecision={handleDecision}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Agent Communication</h2>
        <div className="mt-2 flex gap-2">
          <input
            placeholder="Actualité à communiquer (ex: nouvelle offre, événement)"
            value={newsContext}
            onChange={(e) => setNewsContext(e.target.value)}
            className="flex-1 rounded border px-2 py-1 text-sm"
          />
          <button
            onClick={() =>
              runAgent("communication", "/api/agents/communication/run", {
                companyId: company.id,
                newsContext,
              })
            }
            disabled={runningAgent !== null || !newsContext.trim()}
            className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            {runningAgent === "communication" ? "…" : "Lancer l'agent"}
          </button>
        </div>
        <div className="mt-4">
          <ProposalList
            proposals={proposals.filter((p) => p.agent === "communication")}
            onDecision={handleDecision}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Agent Démarchage</h2>
        <p className="mt-1 text-xs text-gray-500">
          Templates génériques uniquement — aucune liste de destinataires réels,
          aucun envoi automatisé. Vérifiez le cadre RGPD avant tout envoi.
        </p>
        <div className="mt-2 flex gap-2">
          <input
            placeholder="Type de prospects visés (ex: syndics d'immeubles du quartier)"
            value={prospectDescription}
            onChange={(e) => setProspectDescription(e.target.value)}
            className="flex-1 rounded border px-2 py-1 text-sm"
          />
          <button
            onClick={() =>
              runAgent("demarchage", "/api/agents/demarchage/run", {
                companyId: company.id,
                prospectDescription,
              })
            }
            disabled={runningAgent !== null || !prospectDescription.trim()}
            className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            {runningAgent === "demarchage" ? "…" : "Lancer l'agent"}
          </button>
        </div>
        <div className="mt-4">
          <ProposalList
            proposals={proposals.filter((p) => p.agent === "demarchage")}
            onDecision={handleDecision}
          />
        </div>
      </section>
    </main>
  );
}
