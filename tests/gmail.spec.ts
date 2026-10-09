import { test, expect } from "@playwright/test";
import { buildGmailAuthUrl, buildGmailMessage, decryptGmailToken, encryptGmailToken, GMAIL_SCOPE, gmailMessageSchema, isGmailConfigured } from "../src/lib/oauth/gmail";

test("Gmail uses the exact callback, send-only scope and PKCE without exposing secrets", () => {
  process.env.GMAIL_OAUTH_CLIENT_ID = "test-client.apps.googleusercontent.com";
  process.env.GMAIL_OAUTH_CLIENT_SECRET = "test-secret";
  process.env.OAUTH_TOKEN_ENCRYPTION_KEY = "a".repeat(64);
  expect(isGmailConfigured()).toBe(true);
  const url = new URL(buildGmailAuthUrl("https://www.biendecider.com/api/oauth/gmail/callback", "test-state", "test-challenge"));
  expect(url.searchParams.get("redirect_uri")).toBe("https://www.biendecider.com/api/oauth/gmail/callback");
  expect(url.searchParams.get("scope")?.split(" ")).toEqual([GMAIL_SCOPE, "openid", "email"]);
  expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  expect(url.searchParams.get("access_type")).toBe("offline");
  expect(url.toString()).not.toContain("test-secret");
  delete process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
  expect(isGmailConfigured()).toBe(false);
});

test("Gmail tokens are encrypted, authenticated and bound to their company", () => {
  process.env.OAUTH_TOKEN_ENCRYPTION_KEY = "b".repeat(64);
  const token = "test-private-token";
  const encrypted = encryptGmailToken(token, "company-a");
  expect(encrypted).not.toContain(token);
  expect(decryptGmailToken(encrypted, "company-a")).toBe(token);
  expect(encryptGmailToken(token, "company-a")).not.toBe(encrypted);
  expect(() => decryptGmailToken(encrypted, "company-b")).toThrow();
  const parts = encrypted.split(".");
  parts[2] = Buffer.alloc(16).toString("base64url");
  expect(() => decryptGmailToken(parts.join("."), "company-a")).toThrow();
  expect(() => decryptGmailToken(token, "company-a")).toThrow();
});

test("manual email requires confirmation, rejects header injection and encodes UTF-8 MIME", async () => {
  const message = { to: "recipient@example.invalid", subject: "Résumé du projet", text: "Bonjour, voici le résumé.", confirmed: true as const };
  expect(gmailMessageSchema.safeParse({ ...message, confirmed: false }).success).toBe(false);
  expect(gmailMessageSchema.safeParse({ ...message, subject: "Test\r\nBcc: victim@example.invalid" }).success).toBe(false);
  expect(gmailMessageSchema.safeParse({ ...message, to: "a@example.invalid,b@example.invalid" }).success).toBe(false);
  const raw = await buildGmailMessage(message, "sender@example.invalid");
  expect(raw).toMatch(/^[a-zA-Z0-9_-]+$/);
  const mime = Buffer.from(raw, "base64url").toString("utf8");
  expect(mime).toContain("To: recipient@example.invalid");
  expect(mime).toContain("From: sender@example.invalid");
  expect(mime).toContain("Content-Type: text/plain; charset=utf-8");
  expect(mime).not.toContain("Bcc:");
});