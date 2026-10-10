import { AppShell } from "@/components/app-shell";

export default function CguPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-700">
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800">
          <strong>Brouillon non validé juridiquement.</strong> Base de travail
          pour la phase pilote, à faire relire par un juriste avant toute
          ouverture à des utilisateurs externes ou tout lancement commercial.
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">Conditions générales d&apos;utilisation</h1>
        <p className="mt-2 text-slate-500">Version pilote, 2026-10-09.</p>

        <h2 className="mt-6 font-medium text-slate-900">1. Objet</h2>
        <p className="mt-1">
          BienDecider est un service en phase pilote qui propose, via des agents IA, des actions de
          visibilité, communication et prospection pour les indépendants et TPE. Dans le prototype
          actuel, toute publication du site ou tout envoi Gmail requiert votre validation et
          confirmation explicites. Les fondateurs n&apos;ont pas encore arrêté la politique des
          futurs niveaux de délégation ; aucune exécution autonome n&apos;est activée.
        </p>

        <h2 className="mt-6 font-medium text-slate-900">2. Statut pilote</h2>
        <p className="mt-1">
          Le service est fourni en phase de test, gratuitement, sans garantie de disponibilité
          continue ni d&apos;exactitude des contenus générés. Des fonctionnalités peuvent évoluer
          ou être retirées sans préavis pendant cette phase.
        </p>

        <h2 className="mt-6 font-medium text-slate-900">3. Contenus générés par IA</h2>
        <p className="mt-1">
          Les propositions (textes, fiches, sites web) sont générées par un modèle d&apos;intelligence
          artificielle. Vous restez seul responsable de leur relecture, de leur exactitude et de leur
          conformité avant toute validation, publication ou envoi. BienDecider ne garantit pas l&apos;absence
          d&apos;erreur dans le contenu généré.
        </p>

        <h2 className="mt-6 font-medium text-slate-900">4. Vos obligations</h2>
        <ul className="mt-1 list-disc pl-5">
          <li>Fournir des informations exactes sur votre entreprise.</li>
          <li>Ne pas utiliser le service pour générer du contenu illégal, trompeur ou portant atteinte à des tiers.</li>
          <li>Respecter le cadre légal applicable à votre activité (RGPD pour la prospection, droit de la consommation, etc.) — BienDecider ne se substitue pas à un conseil juridique.</li>
          <li>Ne jamais partager votre mot de passe.</li>
        </ul>

        <h2 className="mt-6 font-medium text-slate-900">5. Connexions à des comptes tiers</h2>
        <p className="mt-1">
          Les connexions à Google ou Meta se font exclusivement via leur écran d&apos;autorisation
          officiel (OAuth) — BienDecider ne demande ni ne stocke jamais votre mot de passe sur ces
          plateformes. Vous pouvez révoquer l&apos;accès à tout moment depuis votre compte Google/Meta.
        </p>

        <h2 className="mt-6 font-medium text-slate-900">6. Limitation de responsabilité</h2>
        <p className="mt-1">
          [À valider juridiquement] BienDecider ne peut être tenu responsable des conséquences de
          l&apos;utilisation des contenus générés sans votre relecture, ni des indisponibilités liées
          à des services tiers (modèle d&apos;IA, hébergeur, plateformes connectées).
        </p>

        <h2 className="mt-6 font-medium text-slate-900">7. Résiliation</h2>
        <p className="mt-1">
          Vous pouvez demander la suppression de votre compte et de vos données à tout moment en
          contactant <a href="mailto:contact@biendecider.com" className="underline">contact@biendecider.com</a>.
        </p>

        <p className="mt-6 text-slate-500">
          Voir aussi la{" "}
          <a href="/confidentialite" className="underline">politique de confidentialité</a> et les{" "}
          <a href="/mentions-legales" className="underline">mentions légales</a>.
        </p>
      </div>
    </AppShell>
  );
}
