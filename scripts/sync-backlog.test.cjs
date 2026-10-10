const test = require("node:test");
const assert = require("node:assert/strict");
const { readCatalog, validateCatalog, syncBacklog, syncBacklogWithRetry } = require("./sync-backlog.cjs");

test("catalog is valid and dependencies refer to known US", () => {
  const catalog = readCatalog();
  assert.equal(validateCatalog(catalog), catalog);
  assert.throws(() => validateCatalog([...catalog, catalog[0]]), /duplicate/);
});

test("import is idempotent and preserves human edits and closed Issues", async () => {
  const issues = [];
  const labelStore = [];
  const api = {
    listLabelsForRepo: async () => ({ data: labelStore }),
    listForRepo: async () => ({ data: issues }),
    createLabel: async (label) => { labelStore.push(label); return { data: label }; },
    create: async (input) => {
      const issue = { ...input, number: issues.length + 1, html_url: `https://example.invalid/issues/${issues.length + 1}` };
      issues.push(issue);
      return { data: issue };
    },
    update: async ({ issue_number, body }) => { issues.find((issue) => issue.number === issue_number).body = body; },
  };
  const github = { rest: { issues: api }, paginate: async (method, input) => (await method(input)).data };
  const input = { github, context: { repo: { owner: "test", repo: "test" } }, catalog: readCatalog(), log: () => {} };
  const first = await syncBacklog(input);
  assert.equal(first.created, input.catalog.length);
  assert(issues.some((issue) => issue.body.includes("#")));
  issues[0].body += "\nHuman change";
  issues[0].state = "closed";
  issues[0].labels = ["status:review"];
  const saved = JSON.stringify(issues);
  const second = await syncBacklog(input);
  assert.equal(second.created, 0);
  assert.equal(JSON.stringify(issues), saved);
  let attempts = 0;
  const retryGithub = { ...github, paginate: async (...args) => {
    attempts += 1;
    if (attempts === 1) throw Object.assign(new Error("Temporary GitHub failure"), { status: 500 });
    return github.paginate(...args);
  } };
  assert.equal((await syncBacklogWithRetry({ ...input, github: retryGithub })).created, 0);
  assert.equal(JSON.stringify(issues), saved);
  await assert.rejects(syncBacklogWithRetry({ ...input, github: { ...github, paginate: async () => {
    throw Object.assign(new Error("Missing permission"), { status: 403 });
  } } }), /Missing permission/);
});