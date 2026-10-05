import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, AGENT_MODEL } from "@/lib/anthropic";
import { companyProfileLines } from "@/lib/agents/personas";
import { prisma } from "@/lib/prisma";
import { recordUsage } from "@/lib/usage";

/**
 * Première exécution réelle de bout en bout du produit : un brief de site
 * (proposition `site_web_content` de Camille) VALIDÉ par le dirigeant devient
 * une page publiée sur /site/[slug], hébergée par Pepito. Aucune dépendance
 * externe (pas de WordPress, pas d'hébergeur) — cf. docs/backlog.md.
 * Garde-fou inchangé : n'est jamais appelé sur une proposition non validée.
 */

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "site";
}

/** Défense en profondeur : le HTML est généré par un modèle — on retire tout script/handler, et la page est servie dans une iframe sandbox sans scripts. */
function sanitizeHtml(html: string): string {
  return html
    .replace(/```html\s*/gi, "")
    .replace(/```\s*$/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
}

export async function publishSiteFromProposal(proposalId: string) {
  const proposal = await prisma.agentProposal.findUniqueOrThrow({
    where: { id: proposalId },
    include: { company: true },
  });

  if (proposal.kind !== "site_web_content") {
    throw new Error("Seule une proposition de contenu de site peut être publiée.");
  }
  if (!["validee", "modifiee"].includes(proposal.status)) {
    throw new Error("La proposition doit être validée par le dirigeant avant publication.");
  }

  const company = proposal.company;

  // Prompt strictement identique pour toutes les entreprises et tous les
  // appels (aucune donnée entreprise dans le system — elle est dans le
  // message utilisateur ci-dessous) : candidat idéal au prompt caching,
  // partagé par toute publication de site, quelle que soit l'entreprise.
  const response = await anthropic.messages.create({
    model: AGENT_MODEL,
    max_tokens: 8000,
    system: [
      {
        type: "text",
        cache_control: { type: "ephemeral" },
        text: `Tu produis une page web complète (un seul fichier HTML, CSS inline dans une balise <style>), sobre, professionnelle et lisible sur mobile, pour une TPE. Interdits : JavaScript, iframes, formulaires, ressources externes (polices, images distantes) — uniquement du HTML et du CSS. Pas de texte inventé : utilise uniquement les informations du brief et de l'entreprise. Si une information manque (ex: numéro de téléphone), laisse un emplacement visible "[Votre téléphone]" plutôt que d'inventer. Réponds UNIQUEMENT avec le HTML, sans commentaire ni balises markdown.`,
      },
    ],
    messages: [
      {
        role: "user",
        content: `Entreprise : ${company.name} (${company.trade}), zone : ${company.servingArea}.
${companyProfileLines(company)}
Brief validé par le dirigeant :
${proposal.content}`,
      },
    ],
  });

  const rawHtml = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  await recordUsage({
    companyId: company.id,
    agent: "site_publish",
    model: AGENT_MODEL,
    usage: response.usage,
  });

  const html = sanitizeHtml(rawHtml);
  if (!html.toLowerCase().includes("<html")) {
    throw new Error("Le modèle n'a pas renvoyé une page HTML exploitable.");
  }

  let slug = company.siteSlug ?? slugify(company.name);
  if (!company.siteSlug) {
    const taken = await prisma.company.findUnique({ where: { siteSlug: slug } });
    if (taken && taken.id !== company.id) slug = `${slug}-${company.id.slice(-6)}`;
  }

  await prisma.$transaction([
    prisma.company.update({
      where: { id: company.id },
      data: { siteSlug: slug, siteHtml: html, sitePublishedAt: new Date() },
    }),
    prisma.agentProposal.update({
      where: { id: proposal.id },
      data: { status: "executee" },
    }),
    prisma.executionLog.upsert({
      where: { proposalId: proposal.id },
      create: { proposalId: proposal.id, result: "succes", detail: `Site publié : /site/${slug}` },
      update: { result: "succes", detail: `Site republié : /site/${slug}`, executedAt: new Date() },
    }),
  ]);

  return { slug };
}
