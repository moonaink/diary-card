# Code Architecture Rules

Status: Active

## Purpose

Code that is predictable for a human and an agent: the role of a type is clear from its name, each piece of state
has one owner, and configuration, persisted state, calculation, input and presentation are not mixed without need.

The rules were set before the first feature and confirmed by it; each rule points at the file that exemplifies it.

## Application Levels

| Code | Level |
| --- | --- |
| New files, new flows, new reusable subsystems | `Required` |
| Files already being changed by the current task | `Recommended` |
| Untouched old code | `Optional` |
| A mass refactor for style alone | `Forbidden` |

If a rule conflicts with a documented system contract, the system document wins and the conflict is marked
(`## Open questions` or `Known mismatch:`) per [DocumentationRules.md](DocumentationRules.md) `## Markers`.

## Type Role Naming

A name tells the architectural role of a type, so nobody reads a whole file to learn whether it is a stored record, an
unsaved edit, an operation contract or UI.

| Form | Role |
| --- | --- |
| Plain domain noun (`<Thing>`) | A domain record: plain data that is stored, validated and passed around. No methods with side effects. |
| `<Thing>Settings` | User-editable configuration persisted on the device. |
| `<Operation>Request` | The input contract of an operation that validates its input. |
| `<Operation>Result` | The output contract of an operation that can fail: a discriminated union with `ok: true` and `ok: false` variants, the failure variant carrying a reason. |
| `<Thing>Store` | The owner of persisted records: the only module that reads and writes them in storage. |
| `<Name>Screen` | A React component that is one whole screen. |
| PascalCase component | A reusable React UI piece. |
| `use<Name>` | A React hook: wiring between UI and a store or the model. |

Generic names (`Manager`, `Handler`, `Data`, `Info`, `Processor`, `Utils`, `helpers`) are avoided when a precise role
exists. Existing names are not renamed for style.

Why: the card has several shapes of the same information — a stored day, a day being edited, a week prepared for
the PDF. The project names them `DayEntry`, the draft of `useDayDraft()` and `WeekCard`; `DiaryStore`,
`DiarySettings`, `DayScreen` and `ParseResult` follow the table.

## File Granularity

The small vocabulary of one operation (its union types, small records, failure-reason type) lives in the file of the
type or function that owns it, not one file per type. A separate file is for a vocabulary shared by many operations.

Why: one-type-per-file scatters an operation over many tiny files. The project keeps `SubstanceEntry` and every edit
of a day in `src/card/dayEntry.ts`; the column declarations shared by the screen, the PDF and validation live in
`src/card/cardColumns.ts`.

## Folder Layout

Code lives in `src/` by layer area: `src/card/`, `src/storage/`, `src/pdf/`, `src/ui/` (see
[SystemMap.md](SystemMap.md)). A module is `src/<area>/<module>.ts`, a React component `src/<area>/<Component>.tsx`,
a test sits next to its module as `src/<area>/<module>.test.ts`. A folder is created with its first file.

Why: the app is small; an area folder holds everything of one concern, so a task touches one or two folders.

## One Source Of Truth

Each piece of canonical state has one owner. For persisted card data the owner is `DiaryStore`; React state holds
only drafts and view state (which day is open, which tab). A value derived from records (the fill frequency, the rows
of the PDF) is computed by a function each time, not stored next to them.

Right direction:

```text
user action → edit function of the model → draft on screen → DiaryStore saves → later loads read the store
```

Unwanted direction:

```text
component keeps its own copy of a rule (e.g. "ratings are 0-5") and writes the record to IndexedDB directly,
while another component keeps a second copy of the same record in its state
```

Why: the data lives only on the phone. Two copies of a day that disagree mean one of them is silently lost on the
next save, and there is no server copy to recover from. The project derives the fill frequency in
`resolveFillFrequency()` and never stores it; the scale ranges exist only in `src/card/cardColumns.ts`.

## Feature Anatomy

A durable feature falls into these parts; not every feature has all of them. Examples from the diary card:

- configuration — the column declarations and scales, `src/card/cardColumns.ts`;
- persisted state — days, week headers, settings owned by `DiaryStore`;
- execution logic — `normalizeDayEntry()`, `buildWeekCard()`, `buildCardLayout()`;
- operation data — `ParseResult` of the `tryParse*` functions, `DiaryContents` of backup and restore;
- presentation — `DayScreen`, `WeekScreen`, `SettingsScreen`, `src/ui/styles.css`;
- documentation — [CardModel.md](../Systems/CardModel.md) and the feature documents.

## Framework Boundaries

React components and hooks are the boundary of the framework: rendering, local view state, reading input, calling
the model and the store. Calculations and decisions live in plain TypeScript functions that can be tested without
React, a browser or storage. Browser APIs (storage, file download, the share sheet) are wrapped in their own modules;
the model does not import them.

Why: plain functions are tested with Vitest in Node in milliseconds. The PDF geometry is the plain function
`buildCardLayout()`, tested without a PDF library, while `renderCardPdf()` only draws it; the share sheet and
download are behind `deliverFile()`.

## Dependency Lookup

Preferred order, from the most explicit to the least explicit:

1. function arguments and component props;
2. a module import of a pure function or a constant;
3. a React context that provides one app-wide instance, read through a `use<Name>` hook.

New module-level mutable singletons and lookups through `window` globals are `Forbidden`.

Why: an explicit dependency shows in the signature what a function touches. The one app-wide instance, the store,
reaches screens through `useDiaryStore()`; `renderCardPdf()` receives its fonts as an argument instead of loading
them itself.

## Validation And Failure Policy

Different kinds of failure are handled differently:

- **Configuration or environment error** — the build config is broken, or the browser lacks a required API. Loud and
  early: `StoreProvider` shows an error screen when the database cannot be opened, instead of running on without a
  place to save.
- **Invalid input from outside** — a backup file being restored. Validated at the boundary and returned as an
  explicit error with a reason; nothing is saved partially: `tryParseBackupFile()` checks the whole file before
  `DiaryStore.replaceAll` writes anything.
- **Runtime invalid state** — a day has no record yet, a stored record was written by an older version of the app,
  storage quota is exhausted. A safe explicit outcome: `useDayDraft()` starts an empty day for a missing record; a
  failed save shows a notice on the screen. Never a crash and never silent data loss.
- **Programmer contract error** — a function is called with arguments its contract forbids. May throw:
  `applyRating()` throws `RangeError` for a value outside 0–5.

## UI And Presentation

UI may read records and derived values, display them, keep a draft, and call the official entry point of the store
or model. UI may not write to storage directly, apply domain changes by itself, or keep a second copy of a rule (a
scale range, a derived value).

A direct user action that is refused says why (for example why a backup file was not restored); it does not silently
do nothing.

User-visible text is in Russian; code identifiers are in English.

## Method Names

| Verb | Meaning |
| --- | --- |
| `can*` / `is*` / `has*` | A check without mutation. |
| `try*` | An attempt that returns a `*Result` instead of throwing. |
| `resolve*` / `compute*` | Compute a final or derived value from inputs; no side effects. |
| `build*` | Assemble a new structure (a request, a PDF layout, a file) from inputs. |
| `load*` / `save*` | Read from or write to storage. |
| `apply*` | Apply a change to state. |
| `remove*` | Remove one part (one substance entry). |
| `clear*` | Remove the whole area (all entries of a day). |

## Comments

A comment explains a reason, an invariant or a non-obvious order: why the order matters, why a fallback exists, why
an obvious simplification would break behavior. It does not retell the line. Comments never reference a plan, a
stage of a plan or a conversation.

## Documentation Sync

A change that touches a source of truth, a runtime flow, an invariant, user-visible behavior or a responsibility
boundary updates the related documents in the same task, per [DocumentationRules.md](DocumentationRules.md)
`## Update Rule`.

## Test Recommendation

A change that touches a formula, a state transition, a request/result contract, a documented invariant or a
deterministic bug gets a test per [TestingRules.md](TestingRules.md) `## When To Recommend Tests`. If a test is
appropriate but was not added, the final answer says why in one line.

## Existing Code Migration

New code follows these rules, touched code moves closer to them, untouched code stays as it is. A mass rename or move
needs its own architecture decision document.

## AI Implementation Checklist

Before finishing a code task, go through:

1. No new source of truth was created by accident: every persisted value has one store, every derived value is
   computed, not stored.
2. Names of new types show their roles (`## Type Role Naming`).
3. The small vocabulary of an operation lives with its owner (`## File Granularity`).
4. Calculations and decisions are in plain functions outside components (`## Framework Boundaries`).
5. Dependencies are passed explicitly; no new global lookup.
6. Each failure kind is handled by its policy; no input is saved partially; nothing fails silently.
7. UI does not write to storage directly and does not copy a rule.
8. Comments explain reasons and do not mention a plan or its stages.
9. Documents are updated if behavior, an invariant, a flow or a boundary changed.
10. A test was added for test-worthy behavior, or its absence is explained in one line.
11. Old code was not rewritten for style.

## Out of scope

This document deliberately does not introduce a full Clean Architecture, domain-driven design, a dependency injection
framework, a state management library, or mass renames. Such changes are separate architecture decisions.
