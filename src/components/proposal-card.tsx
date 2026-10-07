"use client";

import type { AgentProposal } from "@prisma/client";
import { PERSONAS, type AgentKey } from "@/lib/agents/personas";

export const STATUS_LABELS: Record<string, string> = {
  en_attente: "À valider",
  validee: "Validée",
  modifiee: "Modifiée",
  rejetee: "Rejetée",
  executee: "Réalisée",
};

const KIND_LABELS: Record<string, string> = {
  gbp_update: "Fiche Google",
  review_reply: "Réponse à un avis",
  site_web_content: "Contenu du site web",
  social_post: "Post réseaux sociaux",
  prospecting_email: "Email de prospection",
  piste_croissance: "Piste de croissance",
  prospect: "Prospect à contacter",
};

export function ProposalCard({
  proposal,
  onDecision,
  onExecute,
  busy,
  showAgent = false,
}: {
  proposal: AgentProposal;
  onDecision: (id: string, status: "validee" | "rejetee") => void;
  onExecute?: (id: string) => void;
  busy?: boolean;
  showAgent?: boolean;
}) {
  const persona = PERSONAS[proposal.agent as Exclude<AgentKey, "co_ceo">];
  const canPublishSite =
    proposal.kind === "site_web_content" &&
    ["validee", "modifiee"].includes(proposal.status) &&
    onExecute;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-500">
          {showAgent && persona ? `${persona.name} · ` : ""}
          {KIND_LABELS[proposal.kind] ?? proposal.kind}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 ${
            proposal.status === "en_attente"
              ? "bg-amber-100 text-amber-800"
              : proposal.status === "rejetee"
                ? "bg-slate-100 text-slate-500"
                : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {STATUS_LABELS[proposal.status] ?? proposal.status}
        </span>
      </div>
      <h3 className="mt-1 font-medium">{proposal.title}</h3>
      <details className="mt-1">
        <summary className="cursor-pointer text-xs text-indigo-600">Voir le contenu</summary>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{proposal.content}</p>
      </details>
      {proposal.status === "en_attente" && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onDecision(proposal.id, "validee")}
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            Valider
          </button>
          <button
            onClick={() => onDecision(proposal.id, "rejetee")}
            disabled={busy}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
          >
            Rejeter
          </button>
        </div>
      )}
      {canPublishSite && (
        <button
          onClick={() => onExecute(proposal.id)}
          disabled={busy}
          className="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {busy ? "Publication…" : "Publier le site"}
        </button>
      )}
    </article>
  );
}
