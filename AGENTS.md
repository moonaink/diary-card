# AGENTS.md

## Project Summary

A personal web app for keeping a DBT diary card on an iPhone: daily ratings of urges, states, substances, actions and
emotions, a weekly PDF in the layout of the paper card, records stored only on the phone, a pastel-pink kawaii style.

Stack: React 19, TypeScript 7, Vite 8 with vite-plugin-pwa, IndexedDB through idb, pdf-lib with fontkit, Vitest 5
with fake-indexeddb, oxlint, Prettier 3, Node.js 26 LTS. Hosted on GitHub Pages as a static installable web app;
there is no backend.

What works: daily entry with autosave, the week header and the PDF of a week, backup and restore, installation to
the iPhone home screen with offline work, and automatic publication to GitHub Pages on push to `main`.

Before proposing anything, read `## Implementation Status` in
[ProductOverview.md](Docs/Overview/ProductOverview.md); do not propose what its `## Explicitly Out Of Scope` lists,
and raise what `## Design Not Yet Fixed` lists with the user instead of deciding it.

## Area Routing

[Docs/Core/DocumentMap.md](Docs/Core/DocumentMap.md) lists every document with the question it answers.

- Before a change, find the canonical document of the area there and read every related document, not one.
- Find a type or module name by searching `Docs/`: each has one canonical document.

## Recommended Read Order

1. Before writing or editing any document — [DocumentationRules.md](Docs/Core/DocumentationRules.md).
2. Before changing code — [CodeArchitectureRules.md](Docs/Core/CodeArchitectureRules.md).
3. Before touching tests — [TestingRules.md](Docs/Core/TestingRules.md), [TestSuiteMap.md](Docs/Core/TestSuiteMap.md)
   and the test area document of the area in `Docs/Tests/`.
4. In an unfamiliar area — [ProductOverview.md](Docs/Overview/ProductOverview.md),
   [Glossary.md](Docs/Core/Glossary.md), [SystemMap.md](Docs/Core/SystemMap.md).
5. Then the canonical document of the area from [DocumentMap.md](Docs/Core/DocumentMap.md).

## Areas Not Yet Fully Documented

The code is the only source for these for now. Write the document when the area stabilizes.

- Visual style — `src/ui/styles.css` (colors as CSS variables at its top), `src/ui/decorations.tsx` (bow, heart and
  tab icons). The intent is in [ProductOverview.md](Docs/Overview/ProductOverview.md) `## Visual Style`.
- Build and tooling configuration — `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.test.json`,
  `.oxlintrc.json`, `.prettierrc.json`. The PWA part of `vite.config.ts` is in
  [OfflineApp.md](Docs/Systems/OfflineApp.md).

## Repository Landmarks

- `src/` — application code; layers and folders per [SystemMap.md](Docs/Core/SystemMap.md).
- `public/` — the home-screen icons and the favicon, copied into the build as they are.
- `Docs/` — documentation for agents, in English.
- `DevScripts/` — checks for documents and plans (Node, no dependencies); see `DevScripts/README.md`.
- `.claude/skills/` — the `/create-plan` and `/explain` skills.
- `.github/workflows/` — build and publication to GitHub Pages.
- `Drafts/` — plans and working notes; temporary, created with the first plan.
- `node_modules/`, `dist/` — generated, never committed.

## Code Notes

- Formatting is Prettier (`.prettierrc.json`): no semicolons, single quotes, width 100. Markdown is not formatted by
  Prettier.
- PascalCase for types and React components; camelCase for functions, variables and module file names; a component
  file is named after its component.
- Code identifiers are in English; user-visible text is in Russian.
- Shape of code: [CodeArchitectureRules.md](Docs/Core/CodeArchitectureRules.md). Shape of tests:
  [TestingRules.md](Docs/Core/TestingRules.md).

## Build And Testing

Run from the repository root:

| Command | What it does | Who runs it |
| --- | --- | --- |
| `npm ci` | Install exact dependencies from `package-lock.json` | agent |
| `npm run typecheck` | TypeScript check of the app and the config | agent |
| `npm run lint` | oxlint | agent |
| `npm run format` | Prettier, rewrites files; `npm run format:check` only checks | agent |
| `npm test` | Vitest, all tests once | agent |
| `npx vitest run <file or folder>` | Vitest, only the given tests | agent |
| `npm run build` | Type check and production build into `dist/` | agent |
| `npm run dev` | Dev server at `http://localhost:5173/diary-card/` | agent starts it, user looks |
| `npm run dev -- --host` | The same, reachable from the iPhone on the same Wi-Fi at `http://<computer IP>:5173/diary-card/` | agent starts it, user looks |

- The manual check in the browser or on the iPhone is done by the user. The dev server address has its own storage,
  separate from the installed app, so a manual check never touches the real records.
- Publication: a push to `main` runs `.github/workflows/deploy.yml` (lint, tests, build, deploy to GitHub Pages). The
  agent pushes; the user checks the installed app afterwards.
- Logs: command output goes to the terminal. Workflow runs: `gh run list`, and `gh run view <id> --log-failed` for a
  failed run.

## Documentation Update Rules

- A change is not finished until the related documentation is updated, if it touches a source of truth, a runtime
  flow, an invariant, user-visible behavior, a responsibility boundary, the rules of interaction between systems, or
  the status of a decision ([DocumentationRules.md](Docs/Core/DocumentationRules.md) `## Update Rule`).
- A new reusable subsystem gets a system document in `Docs/Systems/`; a new user-facing flow gets a feature overview
  in `Docs/Features/<Feature>/Overview.md`; a non-obvious choice gets an architecture decision document in
  `Docs/Decisions/`.
- Register a new document in [DocumentMap.md](Docs/Core/DocumentMap.md).
- Run the `DevScripts` checks after editing documents or renaming and deleting in code.
- Do not copy canonical rules back into `AGENTS.md`.

## Working Agreements

- Talk to the user, and write plans and reports, in Russian. Documents under `Docs/` are in English.
- After writing a plan, wait for an explicit instruction to execute it. While a plan is alive, new work on the same
  feature is added to it as a stage rather than done on the side.
- The agent commits and pushes. It commits when a task or the final stage of a plan is complete, the automated checks
  pass and — for a change that has a manual check — the user has confirmed it; then it pushes. Intermediate plan
  stages are not committed separately: the tree may not build between them, and a push publishes the app. No
  force-push and no rewriting of pushed history without the user's explicit request.
- Commit message in English: an imperative subject line of at most 72 characters and, only when needed, a short body
  about what changed and why, with no references to plans or stages.
- Code comments never mention a plan, a stage or a conversation.
- Do not list rejected alternatives that nobody proposed, and do not recite the project rules back as a checklist;
  follow them.
- After two failed fixes of the same problem in a row, stop guessing and ask the user for one concrete observation
  (what exactly they see, a screenshot, an error text).
- Working, verified logic is not reopened because of an imprecise phrase in a request; ask what is meant.
- A one-time helper (a migration or setup script written for a single use) is deleted together with its tests and
  documents once the user has verified the result, as a stage of the plan.
- An executed plan is deleted from `Drafts/` by a separate commit after the user has confirmed the result.
- In design discussions use plain language and concrete examples, and write into working notes only what was
  actually agreed.
