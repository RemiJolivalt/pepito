import { test as base, expect } from "@playwright/test";
import { PrismaClient, type Company } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createHmac, randomUUID } from "node:crypto";
import { config } from "dotenv";

config({ quiet: true });

const baseURL = process.env.UX_TEST_BASE_URL ?? "http://localhost:3000";
const test = base.extend<{ company: Company }>({
  company: async ({ page }, runFixture) => {
    if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) throw new Error("DATABASE_URL and SESSION_SECRET are required for UX tests.");
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
    const ownerEmail = `ux-test-${randomUUID()}@example.invalid`;
    const company = await prisma.company.create({ data: {
      ownerEmail, name: "Atelier Test Parcours", trade: "Artisan", servingArea: "Paris",
      objective: "Développer les demandes de devis", monthlyRevenue: 4000, revenueTarget: 6000, averageClientValue: 500,
    } });
    try {
      const encoded = Buffer.from(ownerEmail).toString("base64url");
      const signature = createHmac("sha256", process.env.SESSION_SECRET).update(ownerEmail).digest("hex");
      await page.context().addCookies([{ name: "pepito_session", value: `${encoded}.${signature}`, url: baseURL, httpOnly: true, sameSite: "Lax" }]);
      await page.route("**/api/agents/**", (route) => route.fulfill({ status: 503, json: { error: "Agent indisponible pour le test" } }));
      await runFixture(company);
    } finally {
      await prisma.company.delete({ where: { id: company.id } });
      await prisma.$disconnect();
    }
  },
});

test("single validation queue, persistent decisions, publishing and error recovery", async ({ page, company }, testInfo) => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    const item = await prisma.actionPlanItem.create({ data: { companyId: company.id, agent: "contenu", title: "Préparer la communication", rationale: "Attirer des demandes qualifiées", timing: "Cette semaine", status: "lance" } });
    await prisma.agentProposal.createMany({ data: [
      { companyId: company.id, planItemId: item.id, agent: "contenu", kind: "social_post", title: "Publication issue du plan", content: "Contenu du plan" },
      { companyId: company.id, agent: "contenu", kind: "social_post", title: "Demande manuelle", content: "Contenu manuel" },
      { companyId: company.id, agent: "contenu", kind: "site_web_content", title: "Site approuvé à publier", content: "Contenu du site", status: "validee" },
    ] });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${baseURL}/dashboard`);
    await expect(page.getByRole("heading", { name: "Préparer la communication" })).toBeVisible();
    await expect(page.locator("article")).toHaveCount(0);
    await page.getByRole("link", { name: "À valider 3", exact: true }).click();
    await expect(page.locator("article")).toHaveCount(3);
    const manual = page.locator("article").filter({ hasText: "Demande manuelle" });
    await page.route("**/api/proposals/*", async (route) => {
      if (route.request().method() === "PATCH") await route.fulfill({ status: 500, json: { error: "Décision non enregistrée" } });
      else await route.continue();
    });
    await manual.getByRole("button", { name: "Valider", exact: true }).click();
    await expect(page.locator("main").getByRole("alert")).toHaveText("Décision non enregistrée");
    await expect(manual.getByRole("button", { name: "Valider", exact: true })).toBeEnabled();
    await page.unroute("**/api/proposals/*");
    await manual.getByRole("button", { name: "Valider", exact: true }).click();
    await expect(manual.getByText("Validée", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "À valider 2", exact: true })).toBeVisible();
    await expect(manual).toBeVisible();
    const planned = page.locator("article").filter({ hasText: "Publication issue du plan" });
    await planned.getByRole("button", { name: "Rejeter", exact: true }).click();
    await expect(planned.getByText("Rejetée", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "À valider 1", exact: true })).toBeVisible();
    const site = await prisma.agentProposal.findFirstOrThrow({ where: { companyId: company.id, kind: "site_web_content" } });
    await page.route(`**/api/proposals/${site.id}/execute`, async (route) => {
      await prisma.agentProposal.update({ where: { id: site.id }, data: { status: "executee" } });
      await route.fulfill({ json: { url: "/site/test" } });
    });
    await page.getByRole("button", { name: "Publier le site" }).click();
    await expect(page.locator("article").filter({ hasText: site.title }).getByText("Réalisée", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "À valider 0", exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("validation-desktop.png"), fullPage: true });
    await page.reload();
    await expect(page.getByText("Tout est à jour.", { exact: false })).toBeVisible();
    await page.getByRole("link", { name: "Voir les résultats", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Résultats", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: site.title })).toBeVisible();
    await expect(page.getByRole("button", { name: "Valider", exact: true })).toHaveCount(0);
    await page.goto(`${baseURL}/equipe`);
    await expect(page.locator("article")).toHaveCount(0);
    await page.getByText("Demande ponctuelle", { exact: true }).first().click();
    await page.getByRole("button", { name: "Confier la demande" }).first().click();
    await expect(page.locator("main").getByRole("alert")).toHaveText("Agent indisponible pour le test");
    await expect(page.getByRole("button", { name: "Confier la demande" }).first()).toBeEnabled();
  } finally { await prisma.$disconnect(); }
});

test("diagnostic to plan, keyboard dialog and responsive navigation", async ({ page, company }, testInfo) => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    await prisma.auditFinding.create({ data: {
      companyId: company.id, category: "site_web", title: "Visibilité locale à renforcer", content: "Votre offre pourrait être plus visible.",
      whatWorks: "Une activité bien identifiée", toImprove: "Préciser la zone d'intervention",
      actionItems: [{ agent: "contenu", title: "Clarifier la zone d'intervention", rationale: "Améliorer les demandes locales" }],
    } });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseURL}/diagnostic`);
    await page.getByRole("button", { name: /Visibilité locale à renforcer/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await page.getByRole("button", { name: /Visibilité locale à renforcer/ }).click();
    await page.getByRole("button", { name: "Ajouter au plan" }).click();
    await expect(page.getByRole("button", { name: /Ajouté/ })).toBeDisabled();
    await page.getByRole("link", { name: "Voir dans le plan d'action" }).click();
    await expect(page.getByRole("heading", { name: "Clarifier la zone d'intervention", exact: true }).last()).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("plan-mobile.png"), fullPage: true });
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ["/dashboard", "/dashboard?view=validation", "/diagnostic", "/equipe", "/rapport"]) {
        await page.goto(`${baseURL}${path}`);
        await expect(page.locator("h1")).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("header summary").click();
    await page.getByRole("link", { name: "Diagnostic", exact: true }).last().click();
    await expect(page.getByRole("heading", { name: "Diagnostic", exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("diagnostic-mobile.png"), fullPage: true });
  } finally { await prisma.$disconnect(); }
});