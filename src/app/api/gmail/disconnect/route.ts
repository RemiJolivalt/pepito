import { NextRequest, NextResponse } from "next/server";
import { getSessionCompany } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { decryptGmailAccount, decryptGmailToken, gmailClient } from "@/lib/oauth/gmail";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  const company = await getSessionCompany();
  if (!company) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const connection = await prisma.channelConnection.findUnique({ where: { companyId_channel: { companyId: company.id, channel: "gmail" } } });
  let revoked = false;
  try {
    const encrypted = connection?.refreshToken ?? connection?.accessToken;
    if (encrypted) {
      const token = connection?.refreshToken ? decryptGmailAccount(connection.refreshToken, company.id).token : decryptGmailToken(encrypted, company.id);
      await gmailClient().revokeToken(token);
      revoked = true;
    }
  } catch {
    revoked = false;
  }
  await prisma.channelConnection.deleteMany({ where: { companyId: company.id, channel: "gmail" } });
  return NextResponse.json({ disconnected: true, revoked });
}