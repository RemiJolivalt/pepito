"use client";

import { useState } from "react";
import type { AgentProposal, AuditFinding } from "@prisma/client";
import type { SafeCompany } from "@/lib/safe-company";
import { PERSONAS, type AgentKey } from "@/lib/agents/personas";
import { PersonaAvatar } from "@/components/persona-avatar";
import { ProposalCard } from "@/components/proposal-card";

/** Mode "manuel" : lancer un agent directement, sans passer par le plan de Paul. */
export function EquipeClient({
  company,
  initialAuditFindings,
  initialProposals,
}: {
  company: SafeCompany;
  initialAuditFindings: AuditFinding[];
  initialProposals: AgentProposal[];
}) {
  const [auditFindings, setAuditFindings] = useState(initialAuditFindings);
  const [proposals, setProposals] = useState(initialProposals);
  const [running, setRunning] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newsContext, setNewsContext] = useState("");
  const [prospectDescription, setProspectDescription] = useState("");

  async function refresh() {
    const [f, p] = await Promise.all([
      fetch(`/api/audit-findings?companyId=${company.id}`),
      fetch(`/api/proposals?companyId=${company.id}`),
    ]);
    if (f.ok) setAuditFindings(await f.json());
    if (p.ok) setProposals(await p.json());
  }

  async function run(key: string, url: string, body: Record<string, unknown>) {
    setRunning(key);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Échec de l'exécution de l'agent");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'exécution de l'agent");
    } finally {
      setRunning(null);
    }
  }

  async function decide(id: string, status: "validee" | "rejetee") {
    setBusyId(id);
    try {
      await fetch(`/api/proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function execute(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${id}/execute`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.open(data.url, "_blank");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de la publication");
    } finally {
      setBusyId(null);
    }
  }

  function AgentHeader({ agentKey }: { agentKey: Exclude<AgentKey, "co_ceo"> }) {
    const persona = PERSONAS[agentKey];
    return (
      <div className="flex items-center gap-3">
        <PersonaAvatar agentKey={agentKey} size={40} />
        <div>
          <h2 className="text-lg font-medium">{persona.name} <span className="text-sm font-normal text-slate-400">— {persona.role}</span></h2>
          <p className="text-xs text-slate-500">{persona.blurb}</p>
        </div>
      </div>
    );
  }

  const byAgent = (agent: string) => proposals.filter((p) => p.agent === agent);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Équipe</h1>
      <p className="mt-1 text-sm text-slate-500">
        Mode manuel : lancez un agent directement. Pour une direction d&apos;ensemble, passez par le plan de {PERSONAS.co_ceo.name} sur &quot;Aujourd&apos;hui&quot;.
      </p>
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* Martine : diagnostic + fiche Google (fusion de l'ancienne Nadia, cf. docs/backlog.md) */}
      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <AgentHeader agentKey="marketing" />
          <button
            onClick={() => run("marketing", "/api/agents/marketing/run", {})}
            disabled={running !== null}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {running === "marketing" ? "Martine travaille…" : "Lancer"}
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {auditFindings.length === 0 && <li className="text-sm text-slate-500">Aucun constat pour le moment.</li>}
          {auditFindings.map((f) => (
            <li key={f.id} className="rounded-lg border border-slate-200 p-3">
              <span className="text-xs uppercase text-slate-400">{f.category}</span>
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{f.content}</p>
            </li>
          ))}
        </ul>
        {byAgent("marketing").length > 0 && (
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            {byAgent("marketing").map((p) => (
              <ProposalCard key={p.id} proposal={p} onDecision={decide} busy={busyId === p.id} />
            ))}
          </div>
        )}
      </section>

      {/* Camille : contenu (posts + site), s'appuie sur les constats de Martine ci-dessus */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <AgentHeader agentKey="contenu" />
        <div className="mt-3 flex gap-2">
          <input
            placeholder="Actualité à communiquer (optionnel)"
            value={newsContext}
            onChange={(e) => setNewsContext(e.target.value)}
            className="flex-1 rounded-lg border px-2 py-1.5 text-sm"
          />
          <button
            onClick={() => run("contenu", "/api/agents/contenu/run", { newsContext: newsContext || undefined })}
            disabled={running !== null}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {running === "contenu" ? "Camille travaille…" : "Lancer"}
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {byAgent("contenu").map((p) => (
            <ProposalCard key={p.id} proposal={p} onDecision={decide} onExecute={execute} busy={busyId === p.id} />
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <AgentHeader agentKey="demarchage" />
        <p className="mt-2 text-xs text-slate-500">
          Pistes publiques et templates génériques uniquement — aucune donnée personnelle de particulier, aucun envoi automatisé.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            placeholder="Type de prospects visés (optionnel)"
            value={prospectDescription}
            onChange={(e) => setProspectDescription(e.target.value)}
            className="flex-1 rounded-lg border px-2 py-1.5 text-sm"
          />
          <button
            onClick={() => run("demarchage", "/api/agents/demarchage/run", { prospectDescription: prospectDescription || undefined })}
            disabled={running !== null}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {running === "demarchage" ? "Jean-Claude travaille…" : "Lancer"}
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {byAgent("demarchage").map((p) => (
            <ProposalCard key={p.id} proposal={p} onDecision={decide} busy={busyId === p.id} />
          ))}
        </div>
      </section>
    </div>
  );
}
