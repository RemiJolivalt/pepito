import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionEmail } from "@/lib/session";
import { AppHeader } from "@/components/app-header";
import { PERSONAS, type AgentKey } from "@/lib/agents/personas";

export const dynamic = "force-dynamic";

/**
 * Rapport déterministe (pas d'appel LLM) : agrégation directe des données.
 * Choix délibéré — un rapport basé sur du texte généré risquerait de
 * répéter l'erreur d'hallucination déjà corrigée chez Paul (cf.
 * docs/backlog.md). Les chiffres ci-dessous sont toujours exacts.
 */
export default async function RapportPage() {
  const ownerEmail = await getSessionEmail();
  if (!ownerEmail) redirect("/login");

  const company = await prisma.company.findUnique({ where: { ownerEmail } });
  if (!company) redirect("/onboarding");

  const [validated, pending, rejected, findings, leads] = await Promise.all([
    prisma.agentProposal.findMany({
      where: { companyId: company.id, status: { in: ["validee", "modifiee"] } },
      orderBy: { decidedAt: "desc" },
    }),
    prisma.agentProposal.findMany({
      where: { companyId: company.id, status: "en_attente" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.agentProposal.count({
      where: { companyId: company.id, status: "rejetee" },
    }),
    prisma.auditFinding.findMany({
      where: { companyId: company.id, category: "concurrence" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.agentProposal.findMany({
      where: { companyId: company.id, kind: "piste_croissance" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <>
      <AppHeader companyName={company.name} />
      <main className="mx-auto max-w-3xl p-8 font-sans">
        <h1 className="text-2xl font-semibold">Rapport</h1>
        <p className="mt-1 text-sm text-gray-500">
          État réel de votre compte Pepito — ces chiffres sont calculés
          directement en base, pas générés par un agent.
        </p>

        <section className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="rounded border border-gray-200 p-4">
            <p className="text-2xl font-semibold">{validated.length}</p>
            <p className="text-xs text-gray-500">actions validées</p>
          </div>
          <div className="rounded border border-gray-200 p-4">
            <p className="text-2xl font-semibold">{pending.length}</p>
            <p className="text-xs text-gray-500">en attente de validation</p>
          </div>
          <div className="rounded border border-gray-200 p-4">
            <p className="text-2xl font-semibold">{rejected}</p>
            <p className="text-xs text-gray-500">rejetées</p>
          </div>
        </section>

        {pending.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-medium">⚠️ À valider</h2>
            <ul className="mt-2 space-y-2">
              {pending.map((p) => {
                const persona = PERSONAS[p.agent as Exclude<AgentKey, "co_ceo">];
                return (
                  <li key={p.id} className="rounded border border-gray-200 p-3 text-sm">
                    <span className="text-xs text-gray-400">{persona?.name ?? p.agent}</span>
                    <p className="font-medium">{p.title}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-lg font-medium">✅ Dernières actions validées</h2>
          {validated.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">Aucune action validée pour le moment.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {validated.slice(0, 5).map((p) => {
                const persona = PERSONAS[p.agent as Exclude<AgentKey, "co_ceo">];
                return (
                  <li key={p.id} className="rounded border border-gray-200 p-3 text-sm">
                    <span className="text-xs text-gray-400">{persona?.name ?? p.agent}</span>
                    <p className="font-medium">{p.title}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-medium">🔎 Positionnement concurrentiel</h2>
          {findings.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">
              Aucune analyse concurrentielle encore — lancez {PERSONAS.audit.name} depuis le dashboard.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {findings.map((f) => (
                <li key={f.id} className="rounded border border-gray-200 p-3 text-sm">
                  <p className="font-medium">{f.title}</p>
                  <p className="mt-1 text-gray-600">{f.content}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-medium">🎯 Pistes de croissance</h2>
          {leads.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">
              Aucune piste encore — lancez {PERSONAS.demarchage.name} depuis le dashboard.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {leads.map((l) => (
                <li key={l.id} className="rounded border border-gray-200 p-3 text-sm">
                  <p className="font-medium">{l.title}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-8 text-xs text-gray-400">
          Envoi automatique de ce rapport par email : pas encore en place (nécessite un fournisseur d&apos;envoi d&apos;email configuré) — cf. docs/backlog.md.
        </p>
      </main>
    </>
  );
}
