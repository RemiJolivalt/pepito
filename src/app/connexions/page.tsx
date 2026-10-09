import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionEmail } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { isGoogleOAuthConfigured } from "@/lib/oauth/google";
import { isMetaOAuthConfigured } from "@/lib/oauth/meta";

export const dynamic = "force-dynamic";

const CHANNELS = [
  {
    channel: "google_business_profile",
    label: "Fiche Google Business Profile",
    startUrl: "/api/oauth/google/start",
    configured: isGoogleOAuthConfigured(),
    missingEnvHint: "GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET",
    registrationStep:
      "Créer un projet Google Cloud, activer la Business Profile API, configurer l'écran de consentement OAuth et créer des identifiants OAuth (type application web).",
  },
  {
    channel: "facebook",
    label: "Facebook",
    startUrl: "/api/oauth/meta/start",
    configured: isMetaOAuthConfigured(),
    missingEnvHint: "META_APP_ID / META_APP_SECRET",
    registrationStep:
      "Créer une app sur developers.facebook.com, ajouter le produit Facebook Login, et demander les permissions pages_manage_posts (App Review Meta requis).",
  },
  {
    channel: "instagram",
    label: "Instagram",
    startUrl: "/api/oauth/meta/start",
    configured: isMetaOAuthConfigured(),
    missingEnvHint: "META_APP_ID / META_APP_SECRET",
    registrationStep:
      "Même app Meta que Facebook, avec la permission instagram_content_publish (App Review Meta requis) et un compte Instagram pro lié à la page.",
  },
] as const;

export default async function ConnexionsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const ownerEmail = await getSessionEmail();
  if (!ownerEmail) redirect("/login");

  const company = await prisma.company.findUnique({ where: { ownerEmail } });
  if (!company || !company.name) redirect("/onboarding");

  const { connected, error } = await searchParams;

  const existing = await prisma.channelConnection.findMany({
    where: { companyId: company.id },
  });
  const byChannel = new Map(existing.map((c) => [c.channel, c]));

  return (
    <AppShell companyName={company.name}>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">Connexions</h1>
        <p className="mt-2 text-sm text-gray-600">
          Les agents ont besoin d&apos;accéder à vos comptes pour agir à votre
          place (une fois vos propositions validées). Cette connexion se fait
          exclusivement via <strong>OAuth</strong> : vous autorisez BienDecider
          depuis l&apos;écran officiel de Google ou Meta — vous ne saisissez
          jamais votre mot de passe ici, et vous pouvez révoquer l&apos;accès
          à tout moment depuis votre compte Google/Meta.
        </p>

        {connected && (
          <p className="mt-4 rounded bg-green-50 p-3 text-sm text-green-700">
            Connexion réussie.
          </p>
        )}
        {error && (
          <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">
            La connexion a échoué ({error}). Réessayez ou contactez le support.
          </p>
        )}

        <ul className="mt-6 space-y-3">
          {CHANNELS.map((c) => {
            const connection = byChannel.get(c.channel);
            const connected = connection?.status === "connecte";
            return (
              <li
                key={c.channel}
                className="flex items-center justify-between rounded border border-gray-200 p-4"
              >
                <div>
                  <p className="font-medium">{c.label}</p>
                  <p className="text-xs text-gray-500">
                    {connected ? "Connecté" : "Non connecté"}
                  </p>
                  {!c.configured && (
                    <p className="mt-1 text-xs text-amber-600">
                      Pas encore activable : variables d&apos;environnement{" "}
                      <code>{c.missingEnvHint}</code> manquantes. Étape requise :{" "}
                      {c.registrationStep}
                    </p>
                  )}
                </div>
                {c.configured ? (
                  <a
                    href={c.startUrl}
                    className="shrink-0 rounded bg-black px-3 py-1.5 text-sm text-white"
                  >
                    {connected ? "Reconnecter" : "Connecter"}
                  </a>
                ) : (
                  <button
                    disabled
                    className="shrink-0 cursor-not-allowed rounded bg-gray-200 px-3 py-1.5 text-sm text-gray-500"
                  >
                    Connecter (bientôt — OAuth)
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <p className="mt-6 text-xs text-gray-400">
          En attendant qu&apos;un canal soit connecté, les agents préparent
          leurs propositions sans accès direct à vos comptes — vous les
          recopiez vous-même après validation.
        </p>
      </div>
    </AppShell>
  );
}
