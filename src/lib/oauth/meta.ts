/**
 * OAuth Meta (Facebook Login — pour Instagram et Facebook). Jamais de mot
 * de passe utilisateur — cf. docs/backlog.md. Nécessite une app Meta for
 * Developers avec les permissions pages_manage_posts et
 * instagram_content_publish, passées en App Review par Meta (démarche
 * externe à faire par le CEO, cf. docs/backlog.md).
 */
export const META_SCOPE = "pages_show_list,pages_manage_posts,instagram_basic,instagram_content_publish";
const META_API_VERSION = "v21.0";

export function isMetaOAuthConfigured(): boolean {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export function buildMetaAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: redirectUri,
    scope: META_SCOPE,
    state,
    response_type: "code",
  });
  return `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?${params.toString()}`;
}

export async function exchangeMetaCode(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    code,
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: redirectUri,
  });
  const res = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/oauth/access_token?${params.toString()}`,
  );
  if (!res.ok) {
    throw new Error(`Échange de code Meta échoué (${res.status}): ${await res.text()}`);
  }
  return res.json() as Promise<{ access_token: string; expires_in?: number }>;
}
