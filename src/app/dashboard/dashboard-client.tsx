"use client";

import { useState } from "react";
import type { AgentProposal, ChatMessage, ActionPlanItem } from "@prisma/client";
import type { SafeCompany } from "@/lib/safe-company";
import { PERSONAS, type AgentKey } from "@/lib/agents/personas";
import { PersonaAvatar } from "@/components/persona-avatar";
import { ProposalCard } from "@/components/proposal-card";
import { computeBusinessTarget, formatEuros } from "@/lib/business-target";
import type { FunnelStats } from "@/lib/funnel-shared";

type PlanItemWithProposals = ActionPlanItem & { proposals: AgentProposal[] };

const PLAN_STATUS: Record<string, { label: string; className: string }> = {
  propose: { label: "À lancer", className: "bg-slate-100 text-slate-600" },
  lance: { label: "En cours — à valider", className: "bg-amber-100 text-amber-800" },
  termine: { label: "Terminée", className: "bg-emerald-100 text-emerald-800" },
  ecarte: { label: "Écartée", className: "bg-slate-100 text-slate-400" },
};

export function DashboardClient({
  company,
  initialPlanItems,
  initialChatMessages,
  pendingCount,
  funnel,
}: {
  company: SafeCompany;
  initialPlanItems: PlanItemWithProposals[];
  initialChatMessages: ChatMessage[];
  pendingCount: number;
  funnel: FunnelStats;
}) {
  const [planItems, setPlanItems] = useState(initialPlanItems);
  const [chatMessages, setChatMessages] = useState(initialChatMessages);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [direction, setDirection] = useState(company.direction ?? "");
  const [directionSaved, setDirectionSaved] = useState(false);
  const [discardingId, setDiscardingId] = useState<string | null>(null);
  const [discardReason, setDiscardReason] = useState("");
  const [showClosed, setShowClosed] = useState(false);

  async function refreshPlan() {
    const res = await fetch(`/api/co-ceo/plan?companyId=${company.id}`);
    if (res.ok) setPlanItems(await res.json());
  }

  function fail(message: string) {
    setError(`${message} — vérifiez la clé ANTHROPIC_API_KEY côté serveur.`);
  }

  async function handleGeneratePlan() {
    setPlanLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/co-ceo/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id }),
      });
      if (!res.ok) throw new Error();
      await refreshPlan();
    } catch {
      fail(`${PERSONAS.co_ceo.name} n'a pas pu générer de plan`);
    } finally {
      setPlanLoading(false);
    }
  }

  async function handleLaunch(item: ActionPlanItem) {
    setBusyId(item.id);
    setError(null);
    try {
      const res = await fetch(`/api/action-plan/${item.id}/launch`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { producedCount } = await res.json();
      setNotice(
        producedCount > 0
          ? `${producedCount} proposition(s) à valider ci-dessous.`
          : "Action réalisée (rien à valider).",
      );
      await refreshPlan();
    } catch {
      fail("Échec du lancement de l'action");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDiscard(itemId: string) {
    setBusyId(itemId);
    try {
      await fetch(`/api/action-plan/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ecarte", feedback: discardReason }),
      });
      setDiscardingId(null);
      setDiscardReason("");
      await refreshPlan();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDecision(proposalId: string, status: "validee" | "rejetee") {
    setBusyId(proposalId);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await refreshPlan();
    } finally {
      setBusyId(null);
    }
  }

  async function handleExecute(proposalId: string) {
    setBusyId(proposalId);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/execute`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotice(`Site publié : ${window.location.origin}${data.url}`);
      await refreshPlan();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de la publication");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveDirection() {
    const res = await fetch("/api/companies/direction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    if (res.ok) {
      setDirectionSaved(true);
      setTimeout(() => setDirectionSaved(false), 2000);
    }
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
      await refreshPlan();
    } catch {
      fail(`${PERSONAS.co_ceo.name} n'a pas pu répondre`);
    } finally {
      setChatSending(false);
    }
  }

  // Une action "terminée" reste visible dans la liste principale — elle ne
  // disparaît plus en arrière-plan dès que vous validez. Correctif UX du
  // 2026-10-05 : "je suis perdu dès que je valide une action" — la carte
  // qu'on regarde ne doit jamais s'évaporer du champ de vision. Seules les
  // actions explicitement écartées restent repliées : vous avez choisi de
  // ne plus les voir.
  const visibleItems = planItems.filter((i) => i.status !== "ecarte");
  const discardedItems = planItems.filter((i) => i.status === "ecarte");
  const livePending = planItems.reduce(
    (n, i) => n + i.proposals.filter((p) => p.status === "en_attente").length,
    0,
  );
  const target = computeBusinessTarget({
    ...company,
    targetDate: company.targetDate ? new Date(company.targetDate) : null,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Aujourd&apos;hui</h1>
            <p className="mt-1 text-sm text-slate-500">
              Objectif : <span className="font-medium text-slate-800">{company.objective ?? "non défini"}</span>
              {company.siteSlug && (
                <>
                  {" · "}
                  <a href={`/site/${company.siteSlug}`} target="_blank" className="text-indigo-600 underline">
                    voir votre site
                  </a>
                </>
              )}
            </p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            {Math.max(livePending, pendingCount)} à valider
          </span>
        </header>

        {/* Objectif chiffré : la question à laquelle le dashboard doit répondre
            est "Pepito fait-il progresser mon activité ?" (cf. backlog). */}
        {target ? (
          <section className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border bg-white p-3">
              <p className="text-xs text-slate-500">Votre objectif</p>
              <p className="mt-1 text-lg font-semibold">{formatEuros(target.target)}<span className="text-xs font-normal text-slate-400">/mois</span></p>
              {target.monthsRemaining != null && (
                <p className="text-xs text-slate-400">
                  {target.monthsRemaining === 0 ? "échéance atteinte" : `dans ${target.monthsRemaining} mois`}
                </p>
              )}
            </div>
            <div className="rounded-lg border bg-white p-3">
              <p className="text-xs text-slate-500">Situation déclarée</p>
              <p className="mt-1 text-lg font-semibold">{formatEuros(target.current)}<span className="text-xs font-normal text-slate-400">/mois</span></p>
              <a href="/onboarding" className="text-xs text-indigo-600 underline">mettre à jour</a>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <p className="text-xs text-slate-500">Écart</p>
              <p className={`mt-1 text-lg font-semibold ${target.gap > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                {target.gap > 0 ? "+" : ""}{formatEuros(target.gap)}
              </p>
              <p className="text-xs text-slate-400">{target.growthPct > 0 ? "+" : ""}{target.growthPct} %</p>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <p className="text-xs text-slate-500">Clients à aller chercher</p>
              <p className="mt-1 text-lg font-semibold">
                {target.extraClientsPerMonth != null ? `≈ ${target.extraClientsPerMonth}` : "—"}
                <span className="text-xs font-normal text-slate-400">/mois en plus</span>
              </p>
              {target.extraClientsPerMonth == null && (
                <a href="/onboarding" className="text-xs text-indigo-600 underline">indiquer la valeur d&apos;un client</a>
              )}
            </div>
          </section>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-indigo-200 bg-indigo-50/40 p-3 text-sm text-slate-600">
            Donnez un objectif chiffré à {PERSONAS.co_ceo.name} (CA actuel, CA visé, échéance) : il calculera l&apos;écart et
            les clients à aller chercher, et chaque action du plan devra y contribuer.{" "}
            <a href="/onboarding" className="font-medium text-indigo-600 underline">Renseigner mon objectif</a>
          </p>
        )}

        {funnel.total.identifies > 0 && (
          <section className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border bg-white px-3 py-2 text-xs text-slate-600">
            <span className="font-medium text-slate-800">Ce mois-ci</span>
            <span><b>{funnel.thisMonth.identifies}</b> prospects identifiés</span>
            <span><b>{funnel.thisMonth.contactes}</b> contactés</span>
            <span><b>{funnel.thisMonth.reponses}</b> réponses</span>
            <span><b>{funnel.thisMonth.rdv}</b> RDV</span>
            <span><b>{funnel.thisMonth.clients}</b> client{funnel.thisMonth.clients > 1 ? "s" : ""} déclaré{funnel.thisMonth.clients > 1 ? "s" : ""}</span>
            <a href="/prospection" className="ml-auto text-indigo-600 underline">voir le funnel</a>
          </section>
        )}

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {notice && (
          <p className="mt-4 flex items-center justify-between rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            <span>{notice}</span>
            <button onClick={() => setNotice(null)} className="text-xs underline">fermer</button>
          </p>
        )}

        {/* Plan d'action : le cœur du parcours */}
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Plan d&apos;action de {PERSONAS.co_ceo.name}</h2>
            <button
              onClick={handleGeneratePlan}
              disabled={planLoading}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
            >
              {planLoading ? "Paul réfléchit…" : visibleItems.length ? "Compléter le plan" : "Demander un plan"}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Chaque action est confiée à un agent. Vous lancez, l&apos;agent propose, vous validez. Rien ne part sans vous.
          </p>

          {visibleItems.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              Aucune action en cours. Demandez un plan à {PERSONAS.co_ceo.name}.
            </div>
          ) : (
            <ol className="mt-4 space-y-3">
              {visibleItems.map((item, index) => {
                const persona = PERSONAS[item.agent as Exclude<AgentKey, "co_ceo">];
                const status = PLAN_STATUS[item.status];
                const busy = busyId === item.id;
                return (
                  <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-sm font-semibold text-slate-400">{index + 1}</span>
                      <PersonaAvatar agentKey={item.agent as AgentKey} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">{item.title}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-xs ${status.className}`}>{status.label}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{item.rationale}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {persona?.name ?? item.agent} · {item.timing}
                        </p>
                      </div>
                      {item.status === "propose" && (
                        <div className="flex shrink-0 flex-col gap-1">
                          <button
                            onClick={() => handleLaunch(item)}
                            disabled={busyId !== null}
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                          >
                            {busy ? `${persona?.name ?? "L'agent"} travaille…` : "Lancer"}
                          </button>
                          <button
                            onClick={() => setDiscardingId(discardingId === item.id ? null : item.id)}
                            disabled={busyId !== null}
                            className="text-xs text-slate-400 hover:text-slate-700"
                          >
                            Écarter
                          </button>
                        </div>
                      )}
                    </div>

                    {discardingId === item.id && (
                      <div className="mt-3 flex gap-2 rounded-lg bg-slate-50 p-2">
                        <input
                          autoFocus
                          placeholder="Pourquoi ? (Paul s'en souviendra)"
                          value={discardReason}
                          onChange={(e) => setDiscardReason(e.target.value)}
                          className="flex-1 rounded border px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() => handleDiscard(item.id)}
                          className="rounded bg-slate-700 px-3 py-1 text-sm text-white"
                        >
                          Confirmer
                        </button>
                      </div>
                    )}

                    {item.proposals.length > 0 && (
                      <div className="mt-3 space-y-2 border-l-2 border-indigo-100 pl-3">
                        {item.proposals.map((p) => (
                          <ProposalCard
                            key={p.id}
                            proposal={p}
                            onDecision={handleDecision}
                            onExecute={handleExecute}
                            busy={busyId === p.id}
                          />
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}

          {discardedItems.length > 0 && (
            <div className="mt-4">
              <button onClick={() => setShowClosed((v) => !v)} className="text-xs text-slate-500 underline">
                {showClosed ? "Masquer" : "Voir"} les {discardedItems.length} action(s) écartée(s)
              </button>
              {showClosed && (
                <ul className="mt-2 space-y-2">
                  {discardedItems.map((item) => (
                    <li key={item.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${PLAN_STATUS[item.status].className}`}>
                          {PLAN_STATUS[item.status].label}
                        </span>
                        <span className="text-slate-700">{item.title}</span>
                      </div>
                      {item.feedback && <p className="mt-1 text-xs text-slate-400">Raison : {item.feedback}</p>}
                      {item.proposals.length > 0 && (
                        <div className="mt-2 space-y-2 pl-3">
                          {item.proposals.map((p) => (
                            <ProposalCard key={p.id} proposal={p} onDecision={handleDecision} onExecute={handleExecute} busy={busyId === p.id} />
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Colonne Paul : réorienter + discuter */}
      <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <PersonaAvatar agentKey="co_ceo" size={36} />
            <div>
              <h2 className="font-medium">{PERSONAS.co_ceo.name}</h2>
              <p className="text-xs text-slate-500">{PERSONAS.co_ceo.role}</p>
            </div>
          </div>

          <label className="mt-4 block text-xs font-medium text-slate-600">Réorienter {PERSONAS.co_ceo.name}</label>
          <textarea
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            placeholder="ex: priorité au B2B, pas de démarchage de particuliers ; pas de posts le week-end"
            rows={3}
            className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
          />
          <button
            onClick={handleSaveDirection}
            className="mt-1 rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200"
          >
            {directionSaved ? "Enregistré ✓" : "Enregistrer la consigne"}
          </button>
          <p className="mt-1 text-xs text-slate-400">
            Appliquée au prochain plan et à tous les agents.
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-medium">Discuter avec {PERSONAS.co_ceo.name}</h3>
          <div className="mt-2 max-h-80 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-2">
            {chatMessages.length === 0 && (
              <p className="text-xs text-slate-400">Posez une question, demandez un point, ou donnez une actualité.</p>
            )}
            {chatMessages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={`inline-block max-w-[90%] whitespace-pre-wrap rounded-lg px-2.5 py-1.5 text-xs ${
                    m.role === "user" ? "bg-indigo-600 text-white" : "bg-white text-slate-800 shadow-sm"
                  }`}
                >
                  {m.content}
                </span>
              </div>
            ))}
            {chatSending && <p className="text-xs text-slate-400">{PERSONAS.co_ceo.name} réfléchit…</p>}
          </div>
          <form onSubmit={handleSendChat} className="mt-2 flex gap-2">
            <input
              placeholder={`Écrire à ${PERSONAS.co_ceo.name}…`}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 rounded-lg border px-2 py-1.5 text-sm"
            />
            <button
              type="submit"
              disabled={chatSending || !chatInput.trim()}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
            >
              Envoyer
            </button>
          </form>
        </section>
      </aside>
    </div>
  );
}
