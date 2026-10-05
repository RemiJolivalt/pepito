import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionEmail } from "@/lib/session";
import { AppHeader } from "@/components/app-header";

export const dynamic = "force-dynamic";

const CHANNEL_LABELS: Record<string, string> = {
  google_business_profile: "Fiche Google Business Profile",
  instagram: "Instagram",
  facebook: "Facebook",
};

const CHANNELS = Object.keys(CHANNEL_LABELS);

export default async function ConnexionsPage() {
  const ownerEmail = await getSessionEmail();
  if (!ownerEmail) redirect("/login");

  const company = await prisma.company.findUnique({ where: { ownerEmail } });
  if (!company) redirect("/onboarding");

  const existing = await prisma.channelConnection.findMany({
    where: { companyId: company.id },
  });
  const byChannel = new Map(existing.map((c) => [c.channel, c]));

  return (
    <>
      <AppHeader companyName={company.name} />
      <main className="mx-auto max-w-2xl p-8 font-sans">
        <h1 className="text-2xl font-semibold">Connexions</h1>
        <p className="mt-2 text-sm text-gray-600">
          Les agents ont besoin d&apos;accéder à vos comptes pour agir à votre
          place (une fois vos propositions validées). Cette connexion se fait
          exclusivement via <strong>OAuth</strong> : vous autorisez Pepito
          depuis l&apos;écran officiel de Google ou Meta — vous ne saisissez
          jamais votre mot de passe ici, et vous pouvez révoquer l&apos;accès
          à tout moment depuis votre compte Google/Meta.
        </p>

        <ul className="mt-6 space-y-3">
          {CHANNELS.map((channel) => {
            const connection = byChannel.get(channel);
            const connected = connection?.status === "connecte";
            return (
              <li
                key={channel}
                className="flex items-center justify-between rounded border border-gray-200 p-4"
              >
                <div>
                  <p className="font-medium">{CHANNEL_LABELS[channel]}</p>
                  <p className="text-xs text-gray-500">
                    {connected ? "Connecté" : "Non connecté"}
                  </p>
                </div>
                <button
                  disabled
                  title="Nécessite l'enregistrement d'une application développeur chez Google/Meta, pas encore fait pour ce pilote"
                  className="cursor-not-allowed rounded bg-gray-200 px-3 py-1.5 text-sm text-gray-500"
                >
                  Connecter (bientôt — OAuth)
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 text-xs text-gray-400">
          En attendant, les agents préparent leurs propositions sans accès
          direct à vos comptes — vous les recopiez vous-même après validation.
        </p>
      </main>
    </>
  );
}
