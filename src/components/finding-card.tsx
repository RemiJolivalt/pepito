"use client";

import { useState } from "react";
import type { AuditFinding } from "@prisma/client";
import { PERSONAS, type AgentKey } from "@/lib/agents/personas";
import { parseFindingActionItems, type FindingActionItem } from "@/lib/finding-shared";

const CATEGORY_LABELS: Record<string, string> = {
  site_web: "Site web",
  reseaux_sociaux: "Réseaux sociaux",
  concurrence: "Concurrence",
};

/**
 * Carte compacte + pop-up de détail structuré (ce qui est bien / ce qu'il
 * faut améliorer / plan d'action) — cf. docs/backlog.md "lisibilité des
 * constats". Les constats créés avant cette structuration n'ont que
 * `content` : affiché tel quel dans la pop-up, en repli.
 */
export function FindingCard({ finding }: { finding: AuditFinding }) {
  const [open, setOpen] = useState(false);
  const actionItems = parseFindingActionItems(finding.actionItems);
  const hasStructure = Boolean(finding.whatWorks || finding.toImprove || actionItems.length > 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-slate-200 p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50/30"
      >
        <span className="text-xs uppercase text-slate-400">{CATEGORY_LABELS[finding.category] ?? finding.category}</span>
        <h3 className="font-medium">{finding.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{finding.content}</p>
        <span className="mt-1 inline-block text-xs text-indigo-600">Voir le détail →</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs uppercase text-slate-400">{CATEGORY_LABELS[finding.category] ?? finding.category}</span>
                <h2 className="text-lg font-semibold">{finding.title}</h2>
              </div>
              <button onClick={() => setOpen(false)} className="shrink-0 text-slate-400 hover:text-slate-600" aria-label="Fermer">
                ✕
              </button>
            </div>

            {hasStructure ? (
              <div className="mt-4 space-y-4">
                {finding.whatWorks && (
                  <section>
                    <h3 className="text-sm font-medium text-emerald-700">✓ Ce qui est bien</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{finding.whatWorks}</p>
                  </section>
                )}
                {finding.toImprove && (
                  <section>
                    <h3 className="text-sm font-medium text-amber-700">⚠ Ce qu'il faut améliorer</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{finding.toImprove}</p>
                  </section>
                )}
                {actionItems.length > 0 && (
                  <section>
                    <h3 className="text-sm font-medium text-indigo-700">→ Plan d'action proposé</h3>
                    <ul className="mt-2 space-y-2">
                      {actionItems.map((item, i) => (
                        <ActionItemRow key={i} item={item} />
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            ) : (
              <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">{finding.content}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ActionItemRow({ item }: { item: FindingActionItem }) {
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const persona = PERSONAS[item.agent as Exclude<AgentKey, "co_ceo">];

  async function addToPlan() {
    setStatus("saving");
    try {
      const res = await fetch("/api/action-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: item.agent, title: item.title, rationale: item.rationale }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <li className="rounded-lg border border-slate-200 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-slate-400">{persona?.name ?? item.agent}</p>
          <p className="text-sm font-medium">{item.title}</p>
          <p className="mt-0.5 text-xs text-slate-500">{item.rationale}</p>
        </div>
        <button
          onClick={addToPlan}
          disabled={status === "saving" || status === "done"}
          className="shrink-0 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs text-indigo-800 disabled:opacity-60"
        >
          {status === "done" ? "Ajouté ✓" : status === "saving" ? "…" : status === "error" ? "Réessayer" : "Ajouter au plan"}
        </button>
      </div>
    </li>
  );
}
