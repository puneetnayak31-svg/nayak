# Docs

Start with [`../AGENTS.md`](../AGENTS.md) (rules, commands, read order). Then use this index.

| Doc | Answers | Update it when you… |
|---|---|---|
| [`SCOPE.md`](SCOPE.md) | What the product does, for whom; what is live, stubbed or copy-only; plan limits; out of scope. | add, remove or change a user-visible feature; change plans or limits. |
| [`TECH_BRIEF.md`](TECH_BRIEF.md) | Stack, architecture, **module index** (every file → responsibility), pages, tables, core objects, logo system, config, tests. | add, move or remove a module, page, table, logo construction or symbol family; change versions. |
| [`WORKFLOWS.md`](WORKFLOWS.md) | Every user flow traced through endpoints, services and tables; recipes for common dev changes. | change how a flow behaves, or a recipe step. |
| [`DECISIONS.md`](DECISIONS.md) | Deliberate choices and their reasons. | make or reverse a deliberate choice (mark old entries superseded). |
| [`CHANGELOG.md`](CHANGELOG.md) | What changed, round by round. | make any change (add a line under **Unreleased**). |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Internals: provider design, caching, data-model diagram, key flows, extension points. | change internals or an extension point. |
| [`API.md`](API.md) | Every endpoint with request and response shapes. | add or change an endpoint. |
| [`PROVIDERS.md`](PROVIDERS.md) | How to configure each AI, domain, social, image, auth and analytics provider. | add or change a provider or its env vars. |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Docker, hosts, production checklist, scaling. | change build, runtime or required config. |
| [`LIMITATIONS.md`](LIMITATIONS.md) | Honest known limitations and future extension points. | fix one, or discover a new one. |
| [`LOGO_SCIENCE.md`](LOGO_SCIENCE.md) | The science and practice of professional logos (types, perception, usage rules), from the founder's two reference PDFs plus general practice, and what GoBrandToday does about it. | change logo constructions, logo rules in the brand book, or exports of logo files. |
| [`DESIGN_RESEARCH.md`](DESIGN_RESEARCH.md) | What top brand studios (Koto and peers) ship, and the rules our logos, toolkit and mockups follow. Research input, not a spec. | change the design rules for scenes, toolkit or logos. |
| [`MARKETING_BRIEF.md`](MARKETING_BRIEF.md) | Everything marketing needs: pitch, features, plans, experts, our own brand, demo story, claims guardrails. Paste it into a chat to generate campaigns. | change a user-visible feature, price, plan limit, expert service or site copy. |

**The code is the source of truth.** When a doc disagrees with the code, fix the doc in the same change.
`npm run docs:check` (part of `npm test`) catches missing routes, env vars, tables, pages, modules, logo
styles, symbol families and root scripts. It can't catch wrong descriptions, so read what you edit.
