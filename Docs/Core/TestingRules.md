# Testing Rules

Status: Active

## Purpose

Tests that read as a specification of behavior and protect documented contracts, without becoming a second
documentation that contradicts `Docs/`.

The test runner is Vitest (`npm test` runs `vitest run`) in the Node environment, as set in `vite.config.ts`. Test
files are type-checked by `tsconfig.test.json`, which adds Node types for tests only; application code does not see
them. The suites and the contracts they protect are routed by [TestSuiteMap.md](TestSuiteMap.md).

## Scope Levels

`Required`:

- a test checks observable behavior or a documented contract, not private implementation;
- important input values are visible in the test or in a clearly named builder;
- a test of pure logic needs no browser, no React rendering and no storage.

`Forbidden`:

- a test that passes only because of the current internal order or structure;
- hiding important values in a generic helper like `createDefaultDay()`;
- random input without a fixed seed;
- fixing a test by changing expected values before confirming that the contract changed;
- skipped tests (`it.skip`, `it.todo`) kept as placeholders;
- production abstractions added only for a test's convenience.

## Test Categories

- **Formula tests** — a pure calculation: the fill frequency of a week (`src/card/weekCard.test.ts`), date
  arithmetic (`src/card/dates.test.ts`), the placement of values in the PDF layout (`src/pdf/cardLayout.test.ts`).
  The cheapest kind; preferred whenever the logic can be isolated.
- **State-model tests** — a sequence of pure transitions through a public API: editing a day entry, adding and
  removing substance entries (`src/card/dayEntry.test.ts`).
- **Integration-lite tests** — two or three modules together without the full application: reading a backup file
  into records (`src/storage/backupFile.test.ts`), the store over an in-memory IndexedDB
  (`src/storage/diaryStore.test.ts`), rendering a PDF with the real fonts (`src/pdf/renderCardPdf.test.ts`).

Storage tests use `fake-indexeddb` (`import 'fake-indexeddb/auto'` at the top of the test file), an in-memory
IndexedDB for Node, and delete the database after each test. A test that needs a file of the app (a font) reads it
from `node_modules` by a path relative to the test file.

What needs a real browser (the share sheet, file download, the service worker, the look of the PDF, layout on the
iPhone, storage eviction in Safari) is outside these rules and goes to the `## Manual test checklist` of the feature
until the project adopts browser tests and extends this document.

## Folder Layout And Naming

A test lives next to the module it protects: `src/<area>/<module>.test.ts`. Folders follow domain areas, not
technical test types.

Names read as specifications. Idiom for Vitest: `describe('<concept>')` with `it('<expected result> when <condition>')`.

- Right: `describe('resolveFillFrequency')`, `it('returns 4-6 when five days are filled')`.
- Wrong: `it('test1')`, `it('frequency works')`.

## Test Shape

- Arrange / Act / Assert in non-trivial tests, separated by blank lines.
- One main call in Act.
- Several asserts only when they describe one contract.
- The expected value is understandable from the inputs; a reader does not recompute it.
- Fractional values are compared with a tolerance (`toBeCloseTo`).

## Builders And Assertions

- A factory or custom assertion is added no earlier than the third repetition of the same setup.
- A value that affects the expected result is passed explicitly, even when a builder has a default.
- A helper does not recompute the production formula the same way production does.

## Contract Source

Tests are not a source of truth for design. Order: documents state the contract, production code shows actual
behavior, tests protect a confirmed contract or a regression. When a test and a document disagree, check the code
first, then act by [DocumentationRules.md](DocumentationRules.md) `## Conflict Resolution`. When the contract changes,
documents and tests change together.

## When To Recommend Tests

An agent adds or recommends tests when a change touches:

- a formula or derived value;
- a state transition;
- a request/result contract;
- a stored record shape or its migration;
- the backup format;
- a deterministic bug reproducible without the full application;
- a documented invariant.

Not for documentation-only, purely visual or wiring-only changes.

## Test Suite Documentation

The first documented suite creates `Docs/Core/TestSuiteMap.md` and its first `Docs/Tests/<Area>.md`.

`TestSuiteMap.md` is a router: a table `Area | Document | Test folders | Canonical documents`, the test commands, and
the maintenance rule — a new suite is an entry in `Docs/Tests/<Area>.md`; a new area is a new document plus a table
row; a single new test inside an existing suite changes nothing.

Entry format in `Docs/Tests/<Area>.md`:

```md
### <Suite name>

Files:

- `<path to test file>`

Contract: <one line: which documented contract the suite protects>

Canonical docs:

- [<Doc>.md](../<Layer>/<Doc>.md)

Not covered (intentionally): <what and why; omit the line when there is nothing to say>
```

A retelling of the tests is not written. What is deliberately untested, and why, goes to `Docs/Tests/Gaps.md` once
there is something to record.

## AI Checklist

Before finishing a task that touches tests:

1. Each new test checks a documented contract or a confirmed regression.
2. Inputs that affect the result are visible in the test.
3. Pure logic is tested without a browser, React rendering or storage.
4. Names read as specifications.
5. No expected value was changed without confirming the contract changed.
6. No skipped or placeholder tests were added.
7. A new suite is registered in `Docs/Tests/<Area>.md` and `TestSuiteMap.md`.

## Out of scope

Browser end-to-end tests, component rendering tests, snapshot tests and coverage targets are not introduced by this
document. Adopting any of them is a separate decision that extends this document.
