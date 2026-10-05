import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionEmail } from "@/lib/session";
import { verifyAndClearOAuthState } from "@/lib/oauth/state";
import { exchangeGoogleCode } from "@/lib/oauth/google";

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
    const redirectUri = new URL("/api/oauth/google/callback", request.url).toString();
    const tokens = await exchangeGoogleCode(code, redirectUri);

    await prisma.channelConnection.upsert({
      where: { companyId_channel: { companyId: company.id, channel: "google_business_profile" } },
      create: {
        companyId: company.id,
        channel: "google_business_profile",
        status: "connecte",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
      update: {
        status: "connecte",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });
  } catch (error) {
    console.error("Erreur callback OAuth Google:", error);
    return NextResponse.redirect(new URL("/connexions?error=oauth_exchange", request.url));
  }

  return NextResponse.redirect(new URL("/connexions?connected=google_business_profile", request.url));
}
