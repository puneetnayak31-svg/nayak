#!/usr/bin/env node
/**
 * Docs drift check. Fails when facts in the code are missing from the docs that
 * AI coding agents (and humans) rely on. Run by `npm test` and `npm run docs:check`.
 *
 * It checks presence, not prose: a route, env var, table, page, module, logo
 * style, symbol family, migration or root script that exists in code must be
 * named in the right doc, and every relative link in the docs must resolve.
 * No dependencies — plain Node, so it runs anywhere the repo does.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');
const rel = (abs) => path.relative(ROOT, abs).split(path.sep).join('/');

function walk(dir, keep) {
  const out = [];
  const abs = path.join(ROOT, dir);
  if (!existsSync(abs)) return out;
  for (const name of readdirSync(abs)) {
    if (name === 'node_modules' || name === 'dist' || name === '.next') continue;
    const p = path.join(abs, name);
    if (statSync(p).isDirectory()) out.push(...walk(rel(p), keep));
    else if (keep(name)) out.push(rel(p));
  }
  return out.sort();
}

const failures = [];
const fail = (doc, what, items, hint) => {
  if (items.length) failures.push({ doc, what, items, hint });
};

const DOC = {
  agents: 'AGENTS.md',
  api: 'docs/API.md',
  brief: 'docs/TECH_BRIEF.md',
  env: '.env.example',
};
const agents = read(DOC.agents);
const api = read(DOC.api);
const brief = read(DOC.brief);
const envExample = read(DOC.env);

/* 1. API routes → docs/API.md */
const routeFiles = walk('apps/api/src/routes', (n) => n.endsWith('.ts'));
const routes = new Set();
for (const f of routeFiles) {
  for (const m of read(f).matchAll(/app\.(?:get|post|patch|put|delete)\(\s*(['`])([^'`]+)\1/g)) {
    if (!m[2].includes('${')) routes.add(m[2]);
  }
}
fail(DOC.api, 'API routes not documented', [...routes].filter((r) => !api.includes(r)).sort(), 'Add a row for each route (method, body, response).');

// Section aliases registered with a template literal: /api/brand/${alias}
const aliasSrc = read('apps/api/src/routes/brands.ts').match(/SECTION_ALIASES[^{]*\{([\s\S]*?)\};/);
const aliases = aliasSrc ? [...aliasSrc[1].matchAll(/'([a-z-]+)'\s*:/g)].map((m) => m[1]) : [];
fail(DOC.api, 'Section alias routes (/api/brand/<alias>) not documented', aliases.filter((a) => !api.includes(a)), 'List the alias in the Brands table.');

/* 2. Env vars → .env.example (and no stale keys there) */
const envKeys = [...read('apps/api/src/config/env.ts').matchAll(/^ {2}([A-Z][A-Z0-9_]+):/gm)].map((m) => m[1]);
const exampleKeys = [...envExample.matchAll(/^#?\s?([A-Z][A-Z0-9_]+)=/gm)].map((m) => m[1]);
const webEnv = new Set();
for (const f of walk('apps/web', (n) => /\.(ts|tsx|mjs)$/.test(n))) {
  for (const m of read(f).matchAll(/process\.env\.([A-Z][A-Z0-9_]+)/g)) webEnv.add(m[1]);
}
fail(DOC.env, 'API env vars (apps/api/src/config/env.ts) missing from .env.example', envKeys.filter((k) => !exampleKeys.includes(k)), 'Add `KEY=` (or `# KEY=example` for optional ones) with a short comment.');
fail(
  DOC.env,
  'Keys in .env.example that no code reads (stale?)',
  exampleKeys.filter((k) => !envKeys.includes(k) && !webEnv.has(k)),
  'Remove them, or wire them into config/env.ts or the web app.',
);

/* 3. Tables → TECH_BRIEF */
const tables = [...read('apps/api/src/db/schema.ts').matchAll(/pgTable\(\s*'([a-z_]+)'/g)].map((m) => m[1]);
fail(DOC.brief, 'Database tables not in the data model table', tables.filter((t) => !brief.includes(`\`${t}\``)), 'Add a row to section 4 (Data model).');

/* 4. Migrations → TECH_BRIEF */
const migrations = readdirSync(path.join(ROOT, 'apps/api/drizzle')).filter((n) => n.endsWith('.sql'));
fail(DOC.brief, 'SQL migrations not mentioned', migrations.filter((m) => !brief.includes(m)), 'List it under section 4 (Migrations).');

/* 5. Web pages → TECH_BRIEF */
const pages = walk('apps/web/app', (n) => n === 'page.tsx').map((f) => {
  const r = f.replace(/^apps\/web\/app/, '').replace(/\/page\.tsx$/, '');
  return r === '' ? '/' : r;
});
fail(DOC.brief, 'Web pages not in the page list', pages.filter((p) => !brief.includes(`\`${p}\``)), 'Add the route to section 3 (Web pages).');

/* 6. Modules → TECH_BRIEF module index (full paths) */
const isCode = (n) => /\.(ts|tsx|mjs)$/.test(n) && !n.endsWith('.d.ts');
const modules = [
  ...walk('packages/shared/src', isCode),
  ...walk('apps/api/src', isCode),
  ...walk('apps/web/components', isCode),
  ...walk('apps/web/lib', isCode),
  ...walk('apps/web/preview', isCode),
];
fail(DOC.brief, 'Modules missing from the module index', modules.filter((m) => !brief.includes(`\`${m}\``)), 'Add a row (full path + what it owns) to section 3.');
const indexed = [...brief.matchAll(/`((?:packages|apps)\/[^`*]+\.(?:ts|tsx|mjs))`/g)].map((m) => m[1]);
fail(DOC.brief, 'Module index lists files that no longer exist', [...new Set(indexed)].filter((m) => !existsSync(path.join(ROOT, m))), 'Remove or rename the row.');

/* 7. Logo constructions and symbol families → TECH_BRIEF */
const listFrom = (file, name) => {
  const m = read(file).match(new RegExp(`export const ${name} = \\[([^\\]]*)\\]`));
  return m ? [...m[1].matchAll(/'([a-z]+)'/g)].map((x) => x[1]) : [];
};
const styles = listFrom('packages/shared/src/types.ts', 'LOGO_STYLES');
const families = listFrom('packages/shared/src/symbols.ts', 'SYMBOL_FAMILIES');
if (!styles.length || !families.length) failures.push({ doc: 'scripts/check-docs.mjs', what: 'Could not parse LOGO_STYLES or SYMBOL_FAMILIES', items: ['update the parser'], hint: '' });
fail(DOC.brief, 'Logo constructions (LOGO_STYLES) not documented', styles.filter((s) => !brief.includes(`\`${s}\``)), 'Add it to section 6 (Logo system).');
fail(DOC.brief, 'Symbol families (SYMBOL_FAMILIES) not documented', families.filter((f) => !brief.includes(`\`${f}\``)), 'Add it to section 6 (Logo system).');

/* 8. Root scripts → AGENTS.md commands table */
const scripts = Object.keys(JSON.parse(read('package.json')).scripts ?? {});
fail(
  DOC.agents,
  'Root npm scripts not in the commands table',
  scripts.filter((s) => !new RegExp(`npm (run )?${s.replace(/[:]/g, '\\:')}(?![\\w:-])`).test(agents)),
  'Add the command to section 3 (Commands).',
);

/* 9. Relative links in agent-facing docs resolve */
const linkDocs = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'README.md', ...walk('docs', (n) => n.endsWith('.md'))];
const broken = [];
for (const d of linkDocs) {
  if (!existsSync(path.join(ROOT, d))) {
    broken.push(`${d} (file missing)`);
    continue;
  }
  for (const m of read(d).matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = m[1].split('#')[0];
    if (!target || /^(https?:|mailto:)/.test(target)) continue;
    if (!existsSync(path.join(ROOT, path.dirname(d), target))) broken.push(`${d} → ${m[1]}`);
  }
}
fail('docs', 'Broken relative links', broken, 'Fix the path or remove the link.');

/* report */
if (failures.length) {
  console.error('\n✗ Docs are out of date with the code:\n');
  for (const f of failures) {
    console.error(`  ${f.doc} — ${f.what}:`);
    for (const i of f.items) console.error(`      • ${i}`);
    if (f.hint) console.error(`    → ${f.hint}`);
    console.error('');
  }
  console.error('See AGENTS.md section 6 ("If you change X, also update Y").\n');
  process.exit(1);
}
console.log(
  `✓ Docs in sync: ${routes.size + aliases.length} routes, ${envKeys.length} env vars, ${tables.length} tables, ${migrations.length} migrations, ` +
    `${pages.length} pages, ${modules.length} modules, ${styles.length} logo styles, ${families.length} symbol families, ${scripts.length} scripts, links OK.`,
);
