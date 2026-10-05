import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { createOAuthState } from "@/lib/oauth/state";
import { buildMetaAuthUrl, isMetaOAuthConfigured } from "@/lib/oauth/meta";

export async function GET(request: NextRequest) {
  const ownerEmail = await getSessionEmail();
  if (!ownerEmail) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!isMetaOAuthConfigured()) {
    return NextResponse.json(
      { error: "META_APP_ID / META_APP_SECRET non configurés côté serveur" },
      { status: 503 },
    );
  }

  const state = await createOAuthState();
  const redirectUri = new URL("/api/oauth/meta/callback", request.url).toString();
  return NextResponse.redirect(buildMetaAuthUrl(redirectUri, state));
}
