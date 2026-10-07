import Link from "next/link";
import { PERSONAS, type AgentKey } from "@/lib/agents/personas";
import { PersonaAvatar } from "@/components/persona-avatar";

const TEAM: AgentKey[] = ["co_ceo", "marketing", "contenu", "demarchage"];

const STEPS = [
  { n: "1", title: "Vous donnez l'objectif", text: "« 10 nouveaux clients par mois ». Votre métier, votre zone, votre site s'il existe. 5 minutes." },
  { n: "2", title: "Paul fait le plan", text: "Votre partenaire de croissance audite votre présence en ligne, regarde vos concurrents et vous propose 3 à 5 actions, confiées à son équipe." },
  { n: "3", title: "Les agents proposent", text: "Fiche Google, site web, posts, prospection : chaque agent prépare le travail concret." },
  { n: "4", title: "Vous validez, Pepito réalise", text: "Rien ne part sans votre feu vert. Validé ? Pepito publie — à commencer par votre site." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm font-medium text-indigo-600">Pepito</p>
        <h1 className="mt-2 text-4xl font-semibold leading-tight tracking-tight">
          L&apos;équipe marketing que les indépendants n&apos;ont jamais eue.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Kiné, plombier, installateur solaire… Vous n&apos;avez ni le temps ni l&apos;envie de faire votre
          communication. Paul et son équipe d&apos;agents IA s&apos;en chargent — et vous gardez le dernier mot.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Commencer — c&apos;est gratuit pendant le pilote
        </Link>

        <section className="mt-16 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-slate-500">Votre équipe</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-4">
            {TEAM.map((key) => (
              <li key={key} className="flex flex-col items-center text-center">
                <PersonaAvatar agentKey={key} size={56} />
                <span className="mt-2 text-sm font-medium">{PERSONAS[key].name}</span>
                <span className="text-xs text-slate-500">{PERSONAS[key].role}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-semibold text-indigo-600">Étape {s.n}</span>
              <h3 className="mt-1 font-medium">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </section>

        <p className="mt-10 text-xs text-slate-400">
          Aucune action n&apos;est jamais exécutée sans votre validation. Vos accès (Google, Meta) passent par
          OAuth officiel — jamais de mot de passe saisi chez nous.
        </p>

        <footer className="mt-10 flex gap-4 border-t border-slate-200 pt-4 text-xs text-slate-400">
          <Link href="/cgu" className="hover:underline">Conditions d&apos;utilisation</Link>
          <Link href="/confidentialite" className="hover:underline">Confidentialité</Link>
          <Link href="/mentions-legales" className="hover:underline">Mentions légales</Link>
        </footer>
      </div>
    </main>
  );
}
