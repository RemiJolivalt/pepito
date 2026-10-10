const fs = require("node:fs");

const labels = [
  ["type:us", "1d76db", "User story"],
  ["priority:p0", "b60205", "Bloquant avant ouverture externe"],
  ["priority:p1", "fbca04", "Prochain travail"],
  ["priority:p2", "c5def5", "Plus tard"],
  ["status:backlog", "ededed", "A prioriser"],
  ["status:ready", "0e8a16", "Pret a prendre"],
  ["status:in-progress", "1d76db", "Travail en cours"],
  ["status:review", "5319e7", "PR a relire"],
  ["status:blocked", "d93f0b", "Dependance ou action externe"],
  ["area:dev", "bfdadc", "Implementation"],
  ["area:external", "fef2c0", "Console fournisseur ou demarche CEO"],
  ["review-deferred", "f9d0c4", "Relecture apres fusion par delegation"],
];

function validateCatalog(catalog) {
  if (!Array.isArray(catalog) || catalog.length === 0) throw new Error("Empty backlog catalog");
  const ids = new Set();
  for (const story of catalog) {
    if (!/^[a-z0-9-]+$/.test(story.id) || ids.has(story.id)) throw new Error("Invalid or duplicate US id");
    ids.add(story.id);
    if (!story.title || !story.story || !Array.isArray(story.acceptance) || !story.acceptance.length) throw new Error("Missing story content");
    if (!["p0", "p1", "p2"].includes(story.priority) || !["ready", "backlog", "blocked"].includes(story.status) || !["dev", "external"].includes(story.area)) throw new Error("Invalid story labels");
  }
  for (const story of catalog) {
    for (const dependency of story.dependencies ?? []) {
      if (!ids.has(dependency) || dependency === story.id) throw new Error("Unknown or self dependency");
    }
  }
  return catalog;
}

function storyBody(story, issuesById) {
  const dependencies = (story.dependencies ?? []).map((id) => issuesById.has(id) ? `#${issuesById.get(id).number}` : `\`${id}\``);
  return [
    `<!-- biendecider-us:${story.id} -->`,
    "## Besoin utilisateur", story.story,
    "## Criteres d'acceptation", ...story.acceptance.map((criterion) => `- [ ] ${criterion}`),
    "## Dependances", dependencies.length ? dependencies.join(", ") : "Aucune dependance identifiee.",
    "## Verification", story.validation,
    "## Perimetre", story.scope,
    "## Suivi", "Un responsable dans Assignees, un seul label status:*. PR avec Closes #numero seulement si tous les criteres sont livres. Lier le deploiement et rouvrir si la recette echoue.",
    "Source initiale : docs/backlog.md, tri du 2026-10-10. Cette Issue est la source de verite du suivi ; l'import ne remplace pas les modifications humaines.",
  ].join("\n\n");
}

async function syncBacklog({ github, context, catalog, log = console.log }) {
  validateCatalog(catalog);
  const repo = context.repo;
  const existingLabels = await github.paginate(github.rest.issues.listLabelsForRepo, { ...repo, per_page: 100 });
  const labelNames = new Set(existingLabels.map((label) => label.name));
  for (const [name, color, description] of labels) {
    if (!labelNames.has(name)) await github.rest.issues.createLabel({ ...repo, name, color, description });
  }
  const existing = await github.paginate(github.rest.issues.listForRepo, { ...repo, state: "all", per_page: 100 });
  const issuesById = new Map();
  for (const issue of existing) {
    if (issue.pull_request) continue;
    const marker = issue.body?.match(/<!-- biendecider-us:([a-z0-9-]+) -->/);
    if (marker) issuesById.set(marker[1], issue);
  }
  const created = [];
  for (const story of catalog) {
    if (issuesById.has(story.id)) continue;
    const { data } = await github.rest.issues.create({
      ...repo, title: `[US] ${story.title}`, body: storyBody(story, issuesById),
      labels: ["type:us", `priority:${story.priority}`, `status:${story.status}`, `area:${story.area}`],
    });
    issuesById.set(story.id, data);
    created.push(story);
    log(`${story.id}: ${data.html_url}`);
  }
  for (const story of created) {
    await github.rest.issues.update({ ...repo, issue_number: issuesById.get(story.id).number, body: storyBody(story, issuesById) });
  }
  log(`Created ${created.length} US; existing Issues (including closed ones) preserved.`);
  return { created: created.length, total: issuesById.size };
}

module.exports = { syncBacklog, validateCatalog, storyBody, readCatalog: () => JSON.parse(fs.readFileSync("docs/github-backlog.json", "utf8")) };