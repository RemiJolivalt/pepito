import { AppShell } from "@/components/app-shell";

export default function MentionsLegalesPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-700">
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800">
          <strong>Brouillon non validé juridiquement.</strong> Ce document est
          un point de départ généré automatiquement, pas un document
          conforme. Les champs entre crochets doivent être complétés avec vos
          informations réelles, et l&apos;ensemble doit être relu par un
          juriste avant toute mise en ligne publique.
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">Mentions légales</h1>

        <h2 className="mt-6 font-medium text-slate-900">Éditeur du site</h2>
        <p className="mt-1">
          [Raison sociale / nom et prénom si exercice en nom propre]<br />
          [Forme juridique, ex: SAS, EI...]<br />
          [Adresse du siège social]<br />
          [Numéro SIRET]<br />
          <a href="mailto:contact@biendecider.com" className="underline">contact@biendecider.com</a><br />
          Directeur de la publication : [Nom]
        </p>

        <h2 className="mt-6 font-medium text-slate-900">Hébergement</h2>
        <p className="mt-1">
          Application hébergée par Vercel Inc., 340 S Lemon Ave #4133, Walnut,
          CA 91789, États-Unis.<br />
          Base de données hébergée via Vercel Postgres (infrastructure Neon).
        </p>

        <h2 className="mt-6 font-medium text-slate-900">Propriété intellectuelle</h2>
        <p className="mt-1">
          [À compléter : conditions de réutilisation des contenus du site,
          marques, logos.]
        </p>

        <h2 className="mt-6 font-medium text-slate-900">Contact</h2>
        <p className="mt-1">Pour toute question sur BienDecider : <a href="mailto:contact@biendecider.com" className="underline">contact@biendecider.com</a>.</p>
      </div>
    </AppShell>
  );
}
