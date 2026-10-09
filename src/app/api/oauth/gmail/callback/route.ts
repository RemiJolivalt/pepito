import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionCompany } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { encryptGmailToken, gmailClient, GMAIL_CALLBACK, GMAIL_SCOPE } from "@/lib/oauth/gmail";

const stateSchema = z.object({ state: z.string().min(1), verifier: z.string().min(43), companyId: z.string().min(1) });

export async function GET(request: NextRequest) {
  const store = await cookies();
  const rawState = store.get("biendecider_gmail_oauth")?.value;
  store.set("biendecider_gmail_oauth", "", { path: "/api/oauth/gmail", maxAge: 0 });
  const company = await getSessionCompany();
  if (!company) return NextResponse.redirect(new URL("/login", request.url));
  const fail = (error: string) => NextResponse.redirect(new URL(`/connexions?error=${error}`, request.url));
  try {
    const saved = stateSchema.safeParse(JSON.parse(rawState ?? "null"));
    if (!saved.success || saved.data.companyId !== company.id || saved.data.state !== request.nextUrl.searchParams.get("state")) return fail("gmail_state");
    if (request.nextUrl.searchParams.has("error")) return fail("gmail_denied");
    const code = request.nextUrl.searchParams.get("code");
    if (!code) return fail("gmail_state");
    const client = gmailClient(new URL(GMAIL_CALLBACK, request.url).toString());
    const { tokens } = await client.getToken({ code, codeVerifier: saved.data.verifier });
    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date || !tokens.id_token) return fail("gmail_tokens");
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GMAIL_OAUTH_CLIENT_ID });
    const identity = ticket.getPayload();
    if (!identity?.email || !identity.email_verified) return fail("gmail_identity");
    const info = await client.getTokenInfo(tokens.access_token);
    if (!info.scopes.includes(GMAIL_SCOPE)) return fail("gmail_scope");
    await prisma.channelConnection.upsert({
      where: { companyId_channel: { companyId: company.id, channel: "gmail" } },
      create: {
        companyId: company.id, channel: "gmail", status: "connecte",
        accessToken: encryptGmailToken(tokens.access_token, company.id),
        refreshToken: encryptGmailToken(JSON.stringify({ token: tokens.refresh_token, email: identity.email }), company.id), expiresAt: new Date(tokens.expiry_date),
      },
      update: {
        status: "connecte", accessToken: encryptGmailToken(tokens.access_token, company.id),
        refreshToken: encryptGmailToken(JSON.stringify({ token: tokens.refresh_token, email: identity.email }), company.id), expiresAt: new Date(tokens.expiry_date),
      },
    });
    return NextResponse.redirect(new URL("/connexions?connected=gmail", request.url));
  } catch {
    return fail("gmail_exchange");
  }
}