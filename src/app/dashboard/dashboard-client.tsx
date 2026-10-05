"use client";

import { useState } from "react";
import type { Company, AgentProposal, AuditFinding, ChatMessage } from "@prisma/client";
import { PERSONAS } from "@/lib/agents/personas";

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
  initialChatMessages,
}: {
  company: Company;
  initialAuditFindings: AuditFinding[];
  initialProposals: AgentProposal[];
  initialChatMessages: ChatMessage[];
}) {
  const [auditFindings, setAuditFindings] = useState(initialAuditFindings);
  const [proposals, setProposals] = useState(initialProposals);
  const [chatMessages, setChatMessages] = useState(initialChatMessages);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
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

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatInput("");
    setChatMessages((prev) => [
      ...prev,
      { id: `tmp-${Date.now()}`, companyId: company.id, role: "user", content: userText, createdAt: new Date() },
    ]);
    setChatSending(true);
    setError(null);
    try {
      const res = await fetch("/api/co-ceo/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id, message: userText }),
      });
      if (!res.ok) throw new Error();
      const { reply } = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { id: `tmp-${Date.now()}-a`, companyId: company.id, role: "assistant", content: reply, createdAt: new Date() },
      ]);
      await refreshAll();
    } catch {
      setError("Le Co-CEO n'a pas pu répondre — vérifiez la clé ANTHROPIC_API_KEY côté serveur.");
    } finally {
      setChatSending(false);
    }
  }

  const pendingCount = proposals.filter((p) => p.status === "en_attente").length;

  const agentCards = [
    { key: "audit", persona: PERSONAS.audit, stat: `${auditFindings.length} constat(s)` },
    {
      key: "visibilite_locale",
      persona: PERSONAS.visibilite_locale,
      stat: `${proposals.filter((p) => p.agent === "visibilite_locale").length} proposition(s)`,
    },
    {
      key: "communication",
      persona: PERSONAS.communication,
      stat: `${proposals.filter((p) => p.agent === "communication").length} proposition(s)`,
    },
    {
      key: "demarchage",
      persona: PERSONAS.demarchage,
      stat: `${proposals.filter((p) => p.agent === "demarchage").length} proposition(s)`,
    },
  ];

  return (
    <main className="mx-auto max-w-5xl p-8 font-sans">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{company.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {company.trade} — {company.servingArea}
            {company.objective && (
              <>
                {" "}
                · Objectif : <span className="font-medium">{company.objective}</span>
              </>
            )}
          </p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
          {pendingCount} action(s) à valider
        </span>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {/* Encart Co-CEO : point de contact unique, oriente vers les agents */}
      <section className="mt-6 rounded-lg border border-gray-300 bg-gray-50 p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm text-white">
            CC
          </span>
          <div>
            <h2 className="font-medium">{PERSONAS.co_ceo.name}</h2>
            <p className="text-xs text-gray-500">{PERSONAS.co_ceo.blurb}</p>
          </div>
        </div>
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded border border-gray-200 bg-white p-3">
          {chatMessages.length === 0 && (
            <p className="text-sm text-gray-400">
              Dites-moi où vous en êtes, je m&apos;occupe de prioriser et de
              lancer les bons agents.
            </p>
          )}
          {chatMessages.map((m) => (
            <div
              key={m.id}
              className={m.role === "user" ? "text-right" : "text-left"}
            >
              <span
                className={`inline-block max-w-[80%] rounded px-3 py-1.5 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {m.content}
              </span>
            </div>
          ))}
          {chatSending && (
            <p className="text-sm text-gray-400">{PERSONAS.co_ceo.name} réfléchit…</p>
          )}
        </div>
        <form onSubmit={handleSendChat} className="mt-2 flex gap-2">
          <input
            placeholder="Écrivez à votre Co-CEO…"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 rounded border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={chatSending || !chatInput.trim()}
            className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Envoyer
          </button>
        </form>
      </section>

      {/* Agent Overview : vue épurée des agents actifs */}
      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {agentCards.map(({ key, persona, stat }) => (
          <div key={key} className="rounded border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium">
                {persona.name.charAt(0)}
              </span>
              <div>
                <p className="font-medium leading-tight">{persona.name}</p>
                <p className="text-xs text-gray-500">{persona.role}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-600">{persona.blurb}</p>
            <p className="mt-2 text-xs font-medium text-gray-400">{stat}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">
            Audit de présence en ligne — {PERSONAS.audit.name}
          </h2>
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
        <h2 className="text-lg font-medium">
          {PERSONAS.visibilite_locale.name} — Visibilité locale
        </h2>
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
        <h2 className="text-lg font-medium">
          {PERSONAS.communication.name} — Communication
        </h2>
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
        <h2 className="text-lg font-medium">
          {PERSONAS.demarchage.name} — Démarchage
        </h2>
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
