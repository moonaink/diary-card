# Documentation Rules

## Purpose

This document defines how the documentation under `Docs/` is structured, marked, written and kept in sync with the
code. The documentation exists so that an agent that starts a session with no memory can find the canonical
description of any area in a few hops, trust it, and see explicitly where it does not match the code.

## Normative Summary

The words below are used with these meanings in every rule document of the project:

- `Required` — must be followed.
- `Recommended` — the default. Departing from it is allowed only when that makes the result more accurate.
- `Optional` — allowed, not expected.
- `Forbidden` — must not be done.

Binding rules for a reader who reads nothing else:

1. Every important fact has one canonical document. Other documents link to it and do not restate its rules.
2. One reusable subsystem has exactly one system document in `Docs/Systems/`.
3. A document records behavior, invariants, ownership, flow and reasons. It does not copy what the code states
   exactly (field lists, argument lists, configuration values).
4. A gap between a document and the code is always marked (`Known mismatch:`, `Not implemented:`, `Legacy path:`,
   `## Open questions`). An unmarked contradiction means the document is stale; it is not read as intended design.
5. Documents describe the current state. History is not written; git has it.
6. A change that touches behavior, a source of truth, a flow, an invariant or a boundary is not finished until the
   related documents are updated and the `DevScripts` checks are run.
7. A new document gets a line in [DocumentMap.md](DocumentMap.md).
8. Documents are written in English; code names and markers are never translated.
9. A document stays under the size limits in `## Size Limits`.

## Documentation Model

| Layer | Folder | Question |
| --- | --- | --- |
| `Overview` | `Docs/Overview/` | What is the product and what is the overall context? |
| `Core` | `Docs/Core/` | Which rules hold across the whole project? |
| `Systems` | `Docs/Systems/` | How is one subsystem built, and where is its canonical description? |
| `Features` | `Docs/Features/` | How do the systems form one concrete user-facing behavior? |
| `Decisions` | `Docs/Decisions/` | Why was this solution chosen? |
| `Tests` | `Docs/Tests/` | Which test suites protect the contracts of an area? |

Entry route: `CLAUDE.md` → `AGENTS.md` → [DocumentMap.md](DocumentMap.md) → the canonical document of the area.
`AGENTS.md` is a router: it holds no feature or system documentation and no list of documents.

A folder is created together with its first document. Empty folders, placeholder documents and sections "for later"
are `Forbidden`.

### What goes where

- `Overview` — product purpose, audience, main user loop, implementation status, undecided design, rejected ideas.
  No implementation detail.
- `Core` — rules that apply across the project (documentation, code, tests), the glossary, the system map and the
  routers (`DocumentMap.md`, `TestSuiteMap.md`).
- `Systems` — one document per reusable subsystem: its responsibility, source of truth, code location, runtime flow
  and invariants. A subsystem used by several features is described here and only here.
- `Features` — a user-facing flow built from several systems: `Docs/Features/<Feature>/Overview.md`, plus feature
  detail documents in the same folder when one scenario needs more than the overview carries.
- `Decisions` — architecture decision documents for choices that are not obvious, affect several systems, have
  already raised questions, or are easy to break in a refactor by someone who does not know the reason.
- `Tests` — one test area document per area, saying which suites protect which documented contracts. These documents
  are routed by `TestSuiteMap.md`, not by `DocumentMap.md`.

## Canonical Rules

### Source Of Truth Rule

For every important system the documentation names which data or rules are canonical, which type or module owns them,
and which other systems only read, cache or display them. Phrasing pattern: "`<Type>.<member>` is the source of truth
for `<what>`". If a system appears in several features, its source of truth is stated only in its system document.

### Duplication Rule

Repeating context is allowed; repeating canonical rules is not. A feature document may say how the feature uses a
system, which flow steps pass through it and which constraints matter for the feature. It may not carry a second full
description of the system, another version of its invariants or another source of truth.

### Document Boundary Rule

One document describes one canonical subject: one stable behavioral boundary with one primary source of truth and one
primary runtime flow. An area that falls into several independent sources of truth, invariant sets or flows becomes
several documents.

### Code Mapping Rule

Every system document names its primary code directory and its key types or entry points. When the system is spread
over several directories, it says which directory is primary and which part lives where.

### Link Rule

Links between documents are relative markdown paths from the current document. Absolute filesystem paths are
`Forbidden` as links. A reference to a section is written as a link to the document followed by the quoted heading:
``[SystemMap.md](SystemMap.md) `## Layer Rules` ``.

### Terminology Style Rule

File names are written exactly as on disk. Document type names are fixed and written the same way everywhere:
`system document`, `feature overview`, `feature detail document`, `architecture decision document`,
`test area document`. The phrase "feature document" is not a type. Product terms follow
[Glossary.md](Glossary.md).

## Required Structure Per Document Type

Section headings are written exactly as listed, so that a search for a heading finds every such section. Extra
sections are allowed when they make the description more accurate.

- **System document** (`Docs/Systems/<System>.md`): `## Summary`, `## Responsibility`, `## Source of truth`,
  `## Primary code directory`, `## Key types and files`, `## Runtime flow`, `## Rules and invariants`,
  `## Edge cases`, `## Extension notes`, `## Related features`. Optional: `## Naming conventions`,
  `## Open questions`, `## Notes / TODO`, `## Out of scope`.
- **Feature overview** (`Docs/Features/<Feature>/Overview.md`): `## Summary`, `## Purpose`, `## Systems involved`,
  `## Feature flow`, `## Main rules`, `## Subsystem map`, `## Related docs`. Its `Summary` carries both `Status:` and
  `Scope:`.
- **Feature detail document** (`Docs/Features/<Feature>/<Scenario>.md`): `## Summary`,
  `## Scenario / responsibility`, `## Systems used`, `## Runtime flow`, `## Feature-specific rules`, `## Edge cases`,
  `## Manual test checklist`.
- **Architecture decision document** (`Docs/Decisions/<Decision>.md`): the H1 is the title, `Status:` is on the line
  right after it, then `## Context`, `## Decision`, `## Consequences`, `## Alternatives considered`.
  `Alternatives considered` lists only alternatives that were really weighed.
- **Test area document** (`Docs/Tests/<Area>.md`): `## Summary` with `Status:` and a link to `TestSuiteMap.md`, then
  `## Suites` with one `### <Suite>` entry each, in the entry format of [TestingRules.md](TestingRules.md)
  `## Test Suite Documentation`.
- **Core and Overview documents** have no fixed section list. A Core rule document whose content is still a starting
  point carries `Status: Draft` on the line right after the H1.

A manual test checklist is a numbered list of "do this → see that" items with concrete expected results. Steps of
the kind "adjust until it looks right" are `Forbidden`.

## Markers

### Status

`Status:` is `Required` in every document of `Systems`, `Features`, `Decisions` and `Tests`. Values:

- `Draft` — useful, but incomplete or not yet confirmed by stable code.
- `Active` — reliable; describes the current contract.
- `Experimental` — describes behavior that exists but may be reworked.
- `Deprecated` — still relevant for understanding, not to be used for new changes.
- `Legacy` — a historical layer, not the current main path.

`Status` states the maturity of the whole document and never replaces a local marker.

### Scope

`Scope:` says whether the described behavior is part of the product contract. Values: `Canonical`,
`Development-only` (debug screens, seed data, flags and tooling that exist in code but are not the product).
`Required` in a feature overview; `Recommended` elsewhere when working code could be mistaken for a product feature.

### Local markers

A local marker starts a line or sentence with the exact prefix:

| Situation | Use |
| --- | --- |
| The document is reliable and describes the current contract | `Status: Active` |
| Useful, but maturity or completeness is limited | `Status: Draft` or `Status: Experimental` |
| The behavior belongs only to the development workflow | `Scope: Development-only` |
| The canonical contract and the code temporarily disagree | `Known mismatch:` |
| The behavior is intentionally absent at runtime | `Not implemented:` |
| A legacy path is still mentioned but must not be used | `Legacy path:` |
| The interpretation is not confirmed | `## Open questions` |
| A follow-up is known and does not change the current contract | `## Notes / TODO` |

Formatting: `Status: <Value>` is the first non-empty line inside `## Summary` (right after the H1 in a decision
document and in a Core document), `Scope: <Value>` comes right after it, and the two section headings are written
exactly as in the table. `## Notes / TODO` does not stand in for a missing required section, and neither it nor
`Status` stands in for `Known mismatch:`.

## Conflict Resolution

By default a document describes the current correct behavior, not a future version of the system. An agent does not
invent future architecture, does not normalize a system to "how it would be more proper", and does not turn a
disputed intent into canon without grounds in code and documents. Order of interpretation:

1. A `Known mismatch:` next to a rule, flow or invariant — follow that local note.
2. No such note and the code does not clearly contradict the document — the document describes current behavior.
3. The code clearly contradicts the document and there is no note — the document is a `stale-doc candidate`. The
   contradiction is not read as intended design.
4. For a stale-doc candidate: update the document to the confirmed current behavior, or add `## Open questions` when
   the intended contract cannot be derived reliably.
5. The document is silent or ambiguous — first record the behavior confirmed by the code, then add
   `## Open questions` or ask the user.

"The project is in active development" is not an excuse for silent gaps, contradictions between related documents or
wording like "this will change somehow later" without a marker.

## Writing Rules

- A document explains behavior, invariants and constraints. It does not retell code line by line.
- A document describes the current state. History ("previously", "removed", "moved") is not written, because git has
  it. The exception is `## Context` and `## Alternatives considered` in an architecture decision document.
- A document references concrete files, types and related documents. Code names, file names and paths are written in
  backticks, so that `DevScripts/docs/check_doc_names.mjs` can check them.

### Code Restatement Rule

A document does not copy lists that the code states exactly and completely: fields and properties of a type,
arguments of a function or constructor, keys of a stored record, props of a component, what a hook subscribes to, a
line-by-line retelling of a function body. Instead it names the type or function and states the rule behind the list;
a flow step describes the hand-off between functions or systems and names the key function.

A rule hidden inside such a list stays as its own sentence, so a list is read before it is removed, not cleaned out
mechanically.

Allowed: names of types (`## Key types and files`), enum or union values that each have their own behavior (together
with that behavior), and a single field without which a rule cannot be understood. The non-obvious meaning of a
field's value (a special value, units, range) is written at the field in code.

- Wrong: "The screen builds `SaveDayRequest` (date, urges, states, substances, actions, emotions) and calls
  `saveDay`."
- Right: "The screen builds `SaveDayRequest` and calls `saveDay`. Saving a day that already has an entry replaces
  that entry; two entries for one date never coexist."

(The names in this example are illustrative.)

### Configuration And Data Values Rule

A document describes what the code does and how a setting is to be configured correctly, but not how a concrete
setting is configured right now: values in config files and environment variables, flag states, seed records, lists
of existing content. Whoever needs a value opens the file by its name. Behavior is described through the setting
("the asset prefix from `base` in `vite.config.ts`"), and an example with numbers is a made-up one.

Allowed: constants and defaults in code, product decisions ("a rating is an integer from 0 to 5"), and a
configuration rule with its reason for a kind of setting.

### Documents And Code Comments

Documents are the canonical place for behavior, invariants and decisions; code comments explain local non-obvious
implementation. Neither replaces the other.

### Language Rule

A new document is written in English. An edit of an existing document is written in the language of the surrounding
text. A document is translated only as a separate change and as a whole. Code names and markers are never translated.
Product labels that the user sees in Russian (column titles of the diary card, button captions) are quoted in Russian
where the exact label matters.

## Size Limits

Size is counted in bytes, with CR characters not counted.

- Soft limit: 40960 bytes. A larger document is split at its next substantial edit.
- Hard limit: 61440 bytes. A larger document must be split, because an agent does not read it in one go.
- `AGENTS.md` limit: 20480 bytes.

A split follows the Document Boundary Rule (boundaries of source of truth and flow, not of section size). The
original path stays the main document of the area. Text is moved verbatim, without paraphrase. Links of the form
``[X.md](...) `## Section` `` are re-targeted to where the section went.

## Update Rule

A change is not finished until the related documentation is updated, if the change touches a source of truth, a
runtime flow, an invariant, user-visible behavior, a responsibility boundary, the rules of interaction between
systems, or the status of a decision.

Updates go by layer:

| What changed | Where it is recorded |
| --- | --- |
| Product context, implementation status, rejected ideas | `Docs/Overview/` |
| Global model, layers, terms, cross-project rules | `Docs/Core/` |
| One subsystem | `Docs/Systems/` |
| One user-facing scenario | `Docs/Features/` |
| A reason behind a non-obvious choice | `Docs/Decisions/` |
| A new test suite | `Docs/Tests/` and `Docs/Core/TestSuiteMap.md` |

A new document gets a line in [DocumentMap.md](DocumentMap.md) (a test area document gets a row in
`TestSuiteMap.md` instead).

After editing documents, and after renaming or deleting in code, the checks in `DevScripts/` are run (see
`DevScripts/README.md`):

- `node DevScripts/docs/check_doc_edits.mjs` — structure of the changed documents;
- `node DevScripts/docs/check_doc_names.mjs` — code names in documents still exist in the code;
- `node DevScripts/docs/find_doc_mentions.mjs <names…>` — where a renamed or deleted name is still mentioned.

A script finding is a reason to open the file and look, not a verdict.

## Quality Bar

A good document:

- makes it quick to see what counts as correct behavior;
- shows where the canonical description is;
- does not force a reader to dig the basic invariants out of the code;
- does not contradict related documents;
- stays short yet sufficient for decisions when changing code.
