import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-2xl p-8 font-sans">
      <h1 className="text-3xl font-semibold">Pepito</h1>
      <p className="mt-3 text-lg text-gray-700">
        Le copilote IA des indépendants et TPE — kiné, plombier, installateur
        de panneaux solaires… Des agents spécialisés s&apos;occupent de votre
        visibilité, votre communication et votre démarchage. Vous, vous
        validez.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded border border-gray-200 p-4">
          <h2 className="font-medium">1. On fait connaissance</h2>
          <p className="mt-1 text-sm text-gray-600">
            Quelques infos sur votre métier, votre zone et votre site web.
            Moins de 5 minutes.
          </p>
        </div>
        <div className="rounded border border-gray-200 p-4">
          <h2 className="font-medium">2. Audit immédiat</h2>
          <p className="mt-1 text-sm text-gray-600">
            Un état des lieux de votre présence en ligne (site, réseaux) pour
            savoir où vous en êtes vraiment.
          </p>
        </div>
        <div className="rounded border border-gray-200 p-4">
          <h2 className="font-medium">3. Les agents proposent</h2>
          <p className="mt-1 text-sm text-gray-600">
            Visibilité, communication, démarchage — chaque agent propose,
            vous validez avant toute publication ou tout envoi.
          </p>
        </div>
      </section>

      <p className="mt-6 text-sm text-gray-500">
        Aucune action n&apos;est jamais exécutée sans votre validation
        explicite.
      </p>

      <Link
        href="/login"
        className="mt-8 inline-block rounded bg-black px-5 py-2 text-sm text-white"
      >
        Commencer
      </Link>
    </main>
  );
}
