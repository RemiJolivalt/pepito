"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteCompanyButton({ companyId, companyName }: { companyId: string; companyName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await fetch(`/api/admin/companies/${companyId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded bg-red-600 px-2 py-1 text-xs text-white disabled:opacity-50"
        >
          {loading ? "…" : `Confirmer suppression de ${companyName}`}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-slate-400">
          annuler
        </button>
      </span>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-xs text-red-500 hover:underline">
      Supprimer
    </button>
  );
}
