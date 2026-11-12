# Code Architecture Rules

Status: Draft

## Purpose

Code that is predictable for a human and an agent: the role of a type is clear from its name, each piece of state
has one owner, and configuration, persisted state, calculation, input and presentation are not mixed without need.

The repository holds only the Vite + React + TypeScript skeleton (`src/main.tsx`, `src/App.tsx`), so these rules are
starting points, not patterns extracted from existing code. They are revised after the first features: each rule then
gets a pointer to the file that exemplifies it, and rules the code does not need are removed.

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
| `<Thing>Draft` | The unsaved editing copy of a record held by a screen. Becomes a record only through the save operation. |
| `<Thing>Settings` | User-editable configuration persisted on the device. |
| `<Operation>Request` | The input contract of an operation that validates its input. |
| `<Operation>Result` | The output contract of an operation that can fail: a discriminated union with `ok: true` and `ok: false` variants, the failure variant carrying a reason. |
| `<Thing>Store` | The owner of one kind of persisted record: the only module that reads and writes it in storage. |
| `<Name>Screen` | A React component that is one whole screen. |
| PascalCase component | A reusable React UI piece. |
| `use<Name>` | A React hook: wiring between UI and a store or the model. |

Generic names (`Manager`, `Handler`, `Data`, `Info`, `Processor`, `Utils`, `helpers`) are avoided when a precise role
exists. Existing names are not renamed for style.

Why: the card has several shapes of the same information (a stored day, a day being edited, a day prepared for the
PDF). Without role names those shapes get confused, and a screen starts saving its draft as if it were the record.

## File Granularity

The small vocabulary of one operation (its union types, small records, failure-reason type) lives in the file of the
type or function that owns it, not one file per type. A separate file is for a vocabulary shared by many operations
(for example the rating scales of the card).

Why: one-type-per-file scatters an operation over many tiny files; an agent then reads five files to understand one
save.

## Folder Layout

Code lives in `src/` by area: `src/<area>/<module>.ts`, React components as `src/<area>/<Component>.tsx`, a test next
to its module as `src/<area>/<module>.test.ts`. The areas and their dependency order are in
[SystemMap.md](SystemMap.md). A folder is created with its first file.

Why: the app is small; an area folder holds everything of one concern, so a task touches one or two folders.

## One Source Of Truth

Each piece of canonical state has one owner. For persisted card data the owner is its store module; React state holds
only drafts and view state (which day is open, which week is selected). A value derived from records (the fill
frequency of a week, the rows of the PDF) is computed by a function from the records each time, not stored next to
them.

Right direction:

```text
user action → screen builds a request → model validates → store saves → screen re-reads the record → UI
```

Unwanted direction:

```text
component keeps its own copy of a rule (e.g. "ratings are 0-5") and writes the record to storage directly,
while another component keeps a second copy of the same record in its state
```

Why: the data lives only on the phone. Two copies of a day that disagree mean one of them is silently lost on the
next save, and there is no server copy to recover from.

## Feature Anatomy

A durable feature falls into these parts; not every feature has all of them:

- configuration — constants and scales of the card (model area);
- persisted state — records owned by a store;
- execution logic — plain functions that validate, derive and transform (model area);
- operation data — `*Request` and `*Result` types of the operations;
- presentation — screens, components and hooks;
- documentation — the system or feature document that states the contract.

No feature exists yet; real examples are added here with the first feature.

## Framework Boundaries

React components and hooks are the boundary of the framework: rendering, local view state, reading input, calling
the model and the store. Calculations and decisions (validation of a rating, the fill frequency of a week, the layout
of the PDF table) live in plain TypeScript functions that can be tested without React, a browser or storage.

The same holds for browser APIs: storage access, file download and the share sheet are wrapped in their own modules;
the model does not import them.

Why: plain functions are tested with Vitest in Node in milliseconds; logic inside a component needs a browser to be
tested at all, so in practice it is not tested.

## Dependency Lookup

Preferred order, from the most explicit to the least explicit:

1. function arguments and component props;
2. a module import of a pure function or a constant;
3. a React context that provides one app-wide instance (for example the store), read through a `use<Name>` hook.

New module-level mutable singletons and lookups through `window` globals are `Forbidden`.

Why: an explicit dependency shows in the signature what a function touches; a hidden global makes a test depend on
what another test left behind.

## Validation And Failure Policy

Different kinds of failure are handled differently:

- **Configuration or environment error** — the build config is broken, or the browser lacks a required API (storage
  unavailable, private mode refusing storage). Loud and early: the app shows an error screen that names the problem;
  it does not run on with a half-working store.
- **Invalid input from outside** — a value typed in a form, a backup file being restored. Validated at the boundary
  and returned as an explicit error with a reason; nothing is saved partially. A restored backup that fails
  validation leaves the existing records untouched.
- **Runtime invalid state** — a day has no record yet, a stored record was written by an older version of the app,
  storage quota is exhausted. A safe explicit outcome: an empty day, a migrated record, a message to the user. Never
  a crash and never silent data loss.
- **Programmer contract error** — a function is called with arguments its contract forbids. May throw.

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
| `build*` | Assemble a new structure (a request, a PDF document) from inputs. |
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
