---
name: create-plan
description: Research the repository and write an implementation plan made of standalone stage prompts, saved to Drafts/. Runs only on an explicit /create-plan.
argument-hint: <path to task-description .md | task description text>
disable-model-invocation: true
---

# Create Plan

The skill file is in English; the plan it produces and the report to the user are in Russian.

## What a plan is

A set of standalone prompts. The user pastes stages into chat one at a time, in separate sessions, and an agent
executes each without access to the rest of the plan. Every stage is therefore self-sufficient and executable without
guesswork.

## Input

`$ARGUMENTS` is either a path to an existing `.md` file (read it — that is the task description) or the description
text itself. With an empty argument, ask the user for the description and do not proceed.

## Contract

- The deliverable is the plan file only: no changes to production code, tests or canonical documents. To try an edit
  out, work on copies in a scratch directory.
- The plan is grounded in the current repository: every claim about existing code, configuration or data is confirmed
  by opening the file, and nothing is called "already implemented" until it was seen in code.

## Step 1 — Research

1. Read `AGENTS.md` and the task description.
2. Read the rule documents the plan's scope requires: `Docs/Core/DocumentationRules.md` always;
   `Docs/Core/CodeArchitectureRules.md` if the plan touches code; `Docs/Core/TestingRules.md`, and
   `Docs/Core/TestSuiteMap.md` with the affected `Docs/Tests/<Area>.md` once they exist, if it touches tests.
3. Through `Docs/Core/DocumentMap.md` find and read the canonical documents of every affected area — a task almost
   always touches several, and `Docs/Overview/ProductOverview.md` and `Docs/Core/SystemMap.md` are almost always
   among them. Run `node DevScripts/docs/check_doc_names.mjs <documents>` on them: every reported name is a candidate
   document/code mismatch to confirm in code. A confirmed one inside a section the plan already changes becomes a
   plan item; any other goes to the documentation stage's "knowingly untouched" list with its reason, so the plan
   does not grow fixes unrelated to its task.
4. Inspect the code along the affected paths: exact files, types, functions, current contracts, and the area's
   exemplar patterns that stages will reference.
5. Run `node DevScripts/docs/find_doc_mentions.mjs <names…>` for every type and member the plan will change.
   Canonical documents often quote code, and the documentation stage must list each matched location individually —
   "update the document" without the list is not exact addressing. When the plan adds a member to an existing family
   (one more substance category, one more screen), pass the sibling names as well, to find the lists that enumerate
   the family. For every behavior statement the plan changes, also search `Docs/` for the key words of the old
   statement.

## Step 2 — Questions about design forks

Collect the forks that code and documents cannot settle:

- product decisions: what the user sees and does, what happens on interruption or error;
- ownership: who owns the state, a new type versus extending an existing one;
- scope boundaries: which adjacent work is excluded. Several independent features in one description are proposed as
  separate plans.

Also raise every item of `## Design Not Yet Fixed` in `ProductOverview.md` that the task touches. Do not ask what can
be derived. Phrase questions through behavior scenarios, not only technical structure. Ask everything in one batch,
in Russian, with answer options and a recommendation. If there are no forks, do not invent any. The answers are
recorded in the plan section «Ключевые решения (зафиксированы с пользователем)».

## Step 3 — Write the plan

Write the plan by the template and rules below and save it.

## Step 4 — Verify with tools, not by re-reading your own text

Run `node DevScripts/plan/check_plan.mjs Drafts/<Feature>_ImplementationPlan.md` first and resolve every finding;
read its last line to see how many paths, headings and line numbers it recognized. Then check:

1. Every referenced existing path exists; new files are marked «(новый)».
2. No uncertain wording and no unresolved forks.
3. No intermediate stage requires a passing build in its acceptance criteria; the final verification stage exists.
4. Every claim about current code, configuration or data — including those in «Что НЕ входит» and
   «Дизайн-инварианты» — traces to a file opened during research; otherwise open it now or drop the claim.
5. Test and documentation stages are present, or their absence is justified in «Что НЕ входит».
6. «Ключевые решения» contains every user answer from Step 2.
7. Every stage reads as a standalone prompt: files, contracts and exemplars are named inside it.
8. The header carries the code-comment rule, and no step or pseudocode comment would lead an executing agent to write
   plan references into code.
9. Every rule document required for the plan's scope was actually read in this session, not recalled.
10. Every search an acceptance criterion prescribes was actually run; the criterion quotes the command verbatim with
    the same flags, names its known false positives and states its non-zero pre-change count. Every match of the
    `Docs/` search is either covered by the documentation stage or listed as knowingly untouched, grouped by reason.
11. No line number addresses code.

## Planning rules

- **Exact addressing.** Exact file paths, type names, functions and values everywhere. Forbidden placeholders:
  "related tests", "nearby docs", "the appropriate helper", "the relevant config".
- **Address code by name, not by line number.** A name is greppable and survives edits; a line number goes stale as
  soon as anything above it changes, and stages run after earlier stages have already edited the file. A line number
  is allowed only for prose inside a document, with a quoted anchor, taken from `grep -n` output.
- **No uncertainty.** Forbidden words: maybe, probably, likely, possibly, «может быть», «возможно», «скорее всего», «вероятно», «при необходимости», «если понадобится». Resolve every fork before writing: by inspection, a defensible decision or a user question. A conditional branch is allowed only with an exact verifiable condition ("if `<specific function>` exists — modify `<exact path>`; otherwise create `<exact path>`").
- **Exemplars over inventions.** Where the area has an established pattern, reference it by exact path
  («по образцу `<file>`»). Carry over the exemplar's defensive setup and teardown too, especially the parts it
  justifies with a "why" comment; if one is dropped deliberately, the stage says so.
- **Derived sets over hand-written lists.** Before a stage enumerates the members of a set by hand, search for an
  existing declaration of that set (a union type, a constant array, a scale definition) and derive from it. A
  hand-written copy is a second source of truth, incomplete on the day it is written.
- **Cross-stage dependencies are explicit**: name the stage and the artifact («тип из Этапа 2»).
- **Uniform multi-site edits.** When a stage prescribes the same edit at several call sites, inspect each site's
  local context first; if the edit is redundant at some, say so and state the uniformity decision, or the executing
  agent will "simplify" one site and diverge.
- **Removing the last consumer.** When a stage removes the last use of something — an import, a property, a helper,
  a component — it says what happens to what is left behind. Acceptance criteria search for what should be gone and
  never catch what should have gone with it.
- **No plan references in code.** The template header carries this rule literally. Cross-stage references stay in
  plan prose, never inside pseudocode comments that could be copied into code.
- **Scope boundary is mandatory.** «Что НЕ входит» lists nearby functionality that is easy to affect by accident and
  intentional limitations, each with a reason.
- **Design invariants** get their own section: ownership and source of truth, the single mutation boundary, ordering
  with compensation — what must survive every stage.
- **"Why not X"** only for forks that were actually considered.
- **Document/code mismatch** found during research becomes a plan item: update the document or mark the mismatch.
- **Stored data.** The records live only on the user's phone. A stage that changes the shape of stored records or of
  the backup file says how records written by the previous version are read, and the test stage covers it.

## Stage rules

- A stage is a logical unit of work, not a buildable increment. Stages are cut by layer, so the tree legitimately does
  not build between them; a criterion "the project builds" in an intermediate stage would force artificial stage
  shapes. The only mandatory green point is the final verification stage.
- Every stage has four blocks: **Цель** (one sentence — what exists or works after the stage); **Файлы** (exact
  paths, new ones marked «(новый)»); **Содержание** (numbered steps with contracts: names and signatures of new types
  and functions, values to add, and what not to change); **Критерии приёмки** (verifiable statements about structure
  and behavior).
- A criterion of the form "verify by searching X" is executable without judgment: the search was run while writing
  the plan, the command is written verbatim as it was run, its count is copied from the output, the expected false
  positives are named, and the count on the current pre-change tree is non-zero — a search that already returns the
  post-change result verifies nothing.
- Stage order: implementation by layer in the dependency order of `Docs/Core/SystemMap.md` (card model → storage →
  PDF export → UI) → tests → documentation → final verification.
- The documentation stage: each changed contract lands in exactly one canonical document; feature documents link to
  the canon; routers (`Docs/Core/DocumentMap.md`, `Docs/Core/SystemMap.md`, `Docs/Core/Glossary.md`,
  `Docs/Core/TestSuiteMap.md` with `Docs/Tests/<Area>.md`; `AGENTS.md` only when the summary, the read order or the
  areas not yet documented change) are updated for what was actually added; `## Implementation Status` in
  `Docs/Overview/ProductOverview.md` is updated; a document that would exceed the hard size limit is split in the
  plan.
- Steps that belong to the user by the "who runs what" agreement in `AGENTS.md` (the manual check in the browser or on
  the iPhone) are marked «делает пользователь».
- The final stage is «Финальная верификация» as in the template: automated checks, the manual check by the user,
  fixes, `Notes / TODO`, then the agent commits and pushes after the user confirms.

## Splitting

One file by default. Only when the implementation alone exceeds about eight code stages: `_Stage1` (the whole
implementation, ending in its own verification) and `_Stage2` (tests and documentation), linked to each other, with a
section «Общий контекст для агента (прикладывать к каждому этапу)» that repeats the house rules a stage prompt needs,
including the code-comment rule.

## Plan template

Literal Russian strings are output as they are; `<...>` are instructions to the planner.

````md
# <Feature> — Implementation Plan

> **Назначение.** <1–3 sentences: what is being built and why, the user-facing scenario.>
> Каждый **этап** — логическая единица работы; этапы можно выполнять отдельными промптами по порядку.
>
> **Сборка и тесты проверяются на финальном этапе.** Промежуточные этапы на собираемость не проверяются.
>
> **Комментарии в коде** — только короткие пояснения неочевидного поведения (правило проекта).
> Запрещены комментарии, ссылающиеся на этот план и его этапы («Этап 4…», «по плану», «добавлено
> этапом N»): план — временный документ, код его переживёт.

---

## Область работ

### Что строим

<The result: the flow from the user's action to its effect.>

Затрагиваемые слои:

- <layer: what appears or changes in it — one line per layer>;
- тесты и документация.

### Что НЕ входит

- <nearby functionality intentionally excluded, with the reason>.

## Ключевые решения (зафиксированы с пользователем)

1. **<Short decision name.>** <The decision and its consequences for the implementation.>

## Дизайн-инварианты

- **<Invariant.>** <Where and how it holds; what would count as a violation.>

---

## Этап 1. <Layer: what is done>

**Цель:** <one sentence.>

**Файлы:**

- `<exact path>` (новый)
- `<exact path>` <what changes in it>

**Содержание:**

1. <Concrete step: type/function/value, signature, exemplar with its path; what NOT to change.>

**Критерии приёмки:**

- <Verifiable statement. No «проект собирается».>

## Этап <N-2>. Тесты

**Цель:** новые контракты защищены тестами там, где они выразимы без полного приложения.

**Файлы:** <existing suites and new files next to their modules, per `Docs/Core/TestingRules.md`>

**Содержание:** <per suite: which contracts are covered, which builders set the data up; what stays manual and why.>

**Критерии приёмки:** тест-файлы структурно полные и адресуют перечисленные контракты; прогон — на финальном этапе.

## Этап <N-1>. Документация

**Цель:** канон обновлён, роутеры знают о новой механике.

**Файлы и содержание:**

- `Docs/...` — <which document and what exactly it records, one line per matched location>;
- роутеры — по факту добавленного.

**Критерии приёмки:** каждый изменённый контракт отражён ровно в одном каноническом документе; feature-доки
ссылаются на канон, не дублируя его; `node DevScripts/docs/check_doc_names.mjs` и
`node DevScripts/docs/check_doc_edits.mjs` печатают пусто или каждая их находка разобрана по коду.

## Этап <N>. Финальная верификация

1. Агент прогоняет `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build`,
   `node DevScripts/docs/check_doc_names.mjs`, `node DevScripts/docs/check_doc_edits.mjs` и чинит найденное.
2. Агент запускает `npm run dev -- --host` и даёт адрес. Ручная проверка (делает пользователь) — в браузере на
   компьютере или на iPhone в той же сети Wi-Fi; у этого адреса своё хранилище, настоящие записи не затрагиваются:
   - <main flow scenario → expected result>;
   - <interruptions and edge cases>;
   - <adjacent features behave as before>.
3. По результатам — исправить найденное, снять или поправить `Notes / TODO` в затронутых документах.
4. После подтверждения пользователя агент коммитит и пушит; push в `main` публикует приложение на GitHub Pages.
   Сообщение коммита:

   ```text
   <subject line>

   <optional body>
   ```

5. После публикации пользователь открывает установленное приложение на iPhone и проверяет основной сценарий.
````

## Naming and output

Derive a PascalCase feature name from the plan title and save to `Drafts/<Feature>_ImplementationPlan.md` (create
`Drafts/` if it does not exist). If the file exists, stop and ask before overwriting.

## Report

In Russian: the path of the plan, what it was based on, the scope in one sentence, the number of stages, and how many
decisions were fixed from the user's answers («нет развилок» if there were no questions).
