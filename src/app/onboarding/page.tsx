"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [trade, setTrade] = useState("kine");
  const [servingArea, setServingArea] = useState("");
  const [tone, setTone] = useState("convivial_proximite");
  const [website, setWebsite] = useState("");
  const [socialHandles, setSocialHandles] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          trade,
          servingArea,
          tone,
          website: website || undefined,
          socialHandles: socialHandles || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const company = await res.json();

      // Premier audit lancé automatiquement à la fin de l'onboarding
      // (cf. docs/spec-contextualisation.md § écran de confirmation).
      fetch("/api/agents/audit/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id }),
      }).catch(() => {});

      router.push("/dashboard");
    } catch {
      setError("Impossible d'enregistrer ces informations, réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg p-8 font-sans">
      <h1 className="text-2xl font-semibold">Parlez-nous de votre activité</h1>
      <p className="mt-1 text-sm text-gray-500">
        Moins de 5 minutes. Vous pourrez tout modifier plus tard.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <input
          required
          placeholder="Nom commercial"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        />
        <select
          value={trade}
          onChange={(e) => setTrade(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="kine">Kinésithérapeute</option>
          <option value="plombier">Plombier</option>
          <option value="installateur_solaire">
            Installateur panneaux solaires
          </option>
        </select>
        <input
          required
          placeholder="Zone de chalandise (ex: Lyon et alentours)"
          value={servingArea}
          onChange={(e) => setServingArea(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        />
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="pro_rassurant">Pro / rassurant</option>
          <option value="convivial_proximite">Convivial / proximité</option>
          <option value="technique_expert">Technique / expert</option>
        </select>
        <input
          placeholder="Site web (optionnel — beaucoup de TPE n'en ont pas)"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        />
        <input
          placeholder="Compte Instagram/Facebook (optionnel, ex: @cabinet_demo)"
          value={socialHandles}
          onChange={(e) => setSocialHandles(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Enregistrement…" : "Valider et lancer mon audit"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </main>
  );
}
