# Document Map

One line per document under `Docs/`. Test area documents under `Docs/Tests/` are routed by `TestSuiteMap.md`, not
listed here. A new document gets its line here in the same change that creates it.

## Overview

- [ProductOverview.md](../Overview/ProductOverview.md) — what the app is, the diary card it replaces, what exists, what is undecided, what is rejected

## Core

- [DocumentationRules.md](DocumentationRules.md) — how documents are structured, marked, written, sized and kept in sync with code
- [CodeArchitectureRules.md](CodeArchitectureRules.md) — the shape of new code: role names, ownership, boundaries, failure policy
- [TestingRules.md](TestingRules.md) — the shape of tests, what to test, how suites are documented
- [Glossary.md](Glossary.md) — canonical meaning of diary card terms: day entry, rating, urge, substance entry, skills use
- [SystemMap.md](SystemMap.md) — layers of the app in dependency order, main flows, what each layer must not do

## Decisions

- [LocalOnlyPwa.md](../Decisions/LocalOnlyPwa.md) — why the app is an installable web app with records only on the phone, and what follows
