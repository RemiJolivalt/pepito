"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TradeCombobox } from "@/components/trade-combobox";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [trade, setTrade] = useState("");
  const [servingArea, setServingArea] = useState("");
  const [website, setWebsite] = useState("");
  const [socialHandles, setSocialHandles] = useState("");
  const [objective, setObjective] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [certifications, setCertifications] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(true);

  // Pré-remplit le formulaire si l'entreprise existe déjà (page "Mon entreprise").
  useEffect(() => {
    fetch("/api/companies")
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (!c) return;
        setIsNew(false);
        setName(c.name ?? "");
        setTrade(c.trade ?? "");
        setServingArea(c.servingArea ?? "");
        setWebsite(c.website ?? "");
        setSocialHandles(c.socialHandles ?? "");
        setObjective(c.objective ?? "");
        setDescription(c.description ?? "");
        setPhone(c.phone ?? "");
        setCertifications(c.certifications ?? "");
        setOpeningHours(c.openingHours ?? "");
      })
      .catch(() => {});
  }, []);

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
          website: website || undefined,
          socialHandles: socialHandles || undefined,
          objective: objective || undefined,
          description: description || undefined,
          phone: phone || undefined,
          certifications: certifications || undefined,
          openingHours: openingHours || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const company = await res.json();

      if (isNew) {
        // Premier audit lancé automatiquement à la fin de l'onboarding
        // (cf. docs/spec-contextualisation.md § écran de confirmation).
        fetch("/api/agents/audit/run", { method: "POST" }).catch(() => {});
      }

      router.push("/dashboard");
    } catch {
      setError("Impossible d'enregistrer ces informations, réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-semibold">
          {isNew ? "Parlez-nous de votre activité" : "Mon entreprise"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isNew
            ? "Moins de 5 minutes. Vous pourrez tout modifier plus tard."
            : "Modifiez ces informations à tout moment — elles orientent directement vos agents."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <label className="text-sm font-medium">Quel est votre objectif principal ?</label>
          <input
            placeholder="ex: 10 nouveaux clients par mois"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
          />

          <input
            required
            placeholder="Nom commercial"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
          />

          <TradeCombobox value={trade} onChange={setTrade} />

          <input
            required
            placeholder="Zone de chalandise (ex: Lyon et alentours)"
            value={servingArea}
            onChange={(e) => setServingArea(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
          />

          <label className="mt-2 text-sm font-medium">
            Décrivez votre entreprise, votre savoir-faire et ce qui vous différencie
          </label>
          <textarea
            placeholder="ex: Cabinet familial depuis 15 ans, spécialisé en rééducation sportive, accueil chaleureux et sans attente..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="rounded border px-3 py-2 text-sm"
          />
          <p className="-mt-1 text-xs text-gray-400">
            Utilisé par tous les agents pour écrire dans votre ton — inutile de choisir un style dans une liste.
          </p>

          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Téléphone affiché aux clients (optionnel)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded border px-3 py-2 text-sm"
            />
            <input
              placeholder="Certifications / labels (ex: RGE, optionnel)"
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              className="rounded border px-3 py-2 text-sm"
            />
          </div>
          <input
            placeholder="Horaires d'ouverture (optionnel)"
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
          />
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
            {loading ? "Enregistrement…" : isNew ? "Valider et lancer mon audit" : "Enregistrer"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </div>
    </AppShell>
  );
}
