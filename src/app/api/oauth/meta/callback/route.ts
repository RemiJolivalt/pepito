import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionEmail } from "@/lib/session";
import { verifyAndClearOAuthState } from "@/lib/oauth/state";
import { exchangeMetaCode } from "@/lib/oauth/meta";

export async function GET(request: NextRequest) {
  const ownerEmail = await getSessionEmail();
  if (!ownerEmail) return NextResponse.redirect(new URL("/login", request.url));

  const company = await prisma.company.findUnique({ where: { ownerEmail } });
  if (!company) return NextResponse.redirect(new URL("/onboarding", request.url));

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const validState = await verifyAndClearOAuthState(state);

  if (!code || !validState) {
    return NextResponse.redirect(new URL("/connexions?error=oauth_state", request.url));
  }

  try {
    const redirectUri = new URL("/api/oauth/meta/callback", request.url).toString();
    const tokens = await exchangeMetaCode(code, redirectUri);
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : undefined;

    // Un seul jeton Meta couvre Facebook ET Instagram (compte Instagram pro
    // lié à la page Facebook) — on enregistre une connexion pour chacun.
    for (const channel of ["facebook", "instagram"] as const) {
      await prisma.channelConnection.upsert({
        where: { companyId_channel: { companyId: company.id, channel } },
        create: { companyId: company.id, channel, status: "connecte", accessToken: tokens.access_token, expiresAt },
        update: { status: "connecte", accessToken: tokens.access_token, expiresAt },
      });
    }
  } catch (error) {
    console.error("Erreur callback OAuth Meta:", error);
    return NextResponse.redirect(new URL("/connexions?error=oauth_exchange", request.url));
  }

  return NextResponse.redirect(new URL("/connexions?connected=meta", request.url));
}
