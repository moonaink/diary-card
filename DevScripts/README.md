# DevScripts

Checks that run outside the build. Node.js standard library only, run from the repository root. Shared parsing lives
in `DevScripts/lib/markdown.mjs`.

Conventions:

- A check prints nothing and exits 0 when all is well, prints one line per finding and exits 1 otherwise.
- A script that reads a rule from a rule document or from a skill exits 2 and names the line it could not find when
  the rule was reworded beyond recognition. The rule changes in one place, and the script never silently checks
  against an outdated copy. Wrong usage also exits 2.
- A finding is a reason to open the code and check, not a verdict. Empty output means names and structure are
  intact, not that the described behavior is true.

## docs/check_doc_edits.mjs

```sh
node DevScripts/docs/check_doc_edits.mjs                  # changed against HEAD, plus untracked files
node DevScripts/docs/check_doc_edits.mjs --ref <commit>   # changed against another commit
node DevScripts/docs/check_doc_edits.mjs --all            # every guarded file, as if all were new
node DevScripts/docs/check_doc_edits.mjs Docs/Core/Glossary.md   # only these of the changed files
```

Checks the markdown files under `Docs/`, `AGENTS.md`, `CLAUDE.md`, `DevScripts/` and `.claude/skills/` that differ
from the commit, and reports only what the commit did not already have:

- headings that disappeared or were renamed, with the documents that quote them (other documents may link to them);
- new links that lead nowhere: missing file, absolute path, or an `#anchor` that matches no heading;
- table rows with a missing or extra cell;
- an odd number of code fence lines;
- mixed CRLF and LF line endings;
- a deleted document that other documents still mention.

Example finding:

```text
Docs/Core/SystemMap.md:41: link target does not exist: ../Systems/CardModel.md
```

Does not check: wording, whether a link points at the right section, links in files outside the scope above.

When: after editing documents, before committing.

## docs/check_doc_names.mjs

```sh
node DevScripts/docs/check_doc_names.mjs                          # Docs/**/*.md and AGENTS.md
node DevScripts/docs/check_doc_names.mjs Docs/Core/SystemMap.md   # given documents
```

Finds code names in backticks and checks that they exist:

- paths (`src/App.tsx`, `Docs/Core/`) — resolved from the repository root or from the document's folder;
- bare file names (`vite.config.ts`) — some file in the repository has that name;
- `Type.member` — the type is declared in `.ts`/`.tsx`/`.js`/`.mjs` code outside `DevScripts/`, and the member is
  declared inside the braces of that declaration;
- `functionName()` — declared as a function, a const, or a method;
- compound PascalCase names (`DayEntry`) — declared as a class, interface, type, enum, function or const, or used as
  a folder name.

Skipped on purpose: fenced code blocks; `## Context` and `## Alternatives considered` in `Docs/Decisions/`; lines
that say the name is gone ("removed", "no longer", "instead of") or start a `Not implemented:` note; names listed in
`DevScripts/docs/check_doc_names.allow.txt`. In rule documents (`Docs/Core/*Rules.md`) only paths are checked,
because their type names are illustrations.

Example finding:

```text
Docs/Systems/CardModel.md:18: `DayEntry.urges` — DayEntry declares no member urges
```

Does not resolve: members of a type alias without a brace body (a union, a mapped type), inherited members,
single-word names (`App`, `Draft`), names with spaces, and anything external to the repository (browser APIs, npm
packages). A call at the start of a line can be taken for a method declaration.

When: after editing documents, and after renaming or deleting in code; on the canonical documents of a plan's area
during `/create-plan` research.

## docs/find_doc_mentions.mjs

```sh
node DevScripts/docs/find_doc_mentions.mjs DayEntry saveDay
```

A search, not a check: finds each name as a case-sensitive substring in `Docs/` and `AGENTS.md`. Prints first the
equivalent `grep` command and match count per name, then the matching lines grouped by document and nearest heading,
each line once. Always exits 0 (2 on wrong usage).

Example output:

```text
grep -rnF --include='*.md' -- 'App.tsx' Docs AGENTS.md   # 5 matching lines

Docs/Core/SystemMap.md
  ## Layers
    27: Not implemented: the folder is `src/ui/`; `src/App.tsx` is the only component today.
```

Cannot find the same idea written in other words; that needs a separate key-word search.

When: before renaming or deleting a type, member or file; during `/create-plan` research for every name the plan
changes.

## plan/check_plan.mjs

```sh
node DevScripts/plan/check_plan.mjs Drafts/<Feature>_ImplementationPlan.md
```

The mechanical part of plan verification:

- paths in backticks exist, and paths marked «(новый)» do not (a path marked new anywhere in the plan may be
  referenced unmarked in later stages);
- no words from the "No uncertainty" list of `.claude/skills/create-plan/SKILL.md`; blockquote lines (the template
  header), text in backticks and text in «», “” or "" quotes are exempt;
- documents named by the plan are within the size limits of `Docs/Core/DocumentationRules.md` `## Size Limits`;
- a quoted heading such as `` `## Runtime flow` `` exists at that level in the document named on the same line, or
  in the last document named above it in the same section of the plan;
- a line number (`path:12`, `path#L12`, «строка 12», "line 12") refers to a document, never to code, has a quoted
  anchor on the same line, and the anchor is on that line of the document.

The last line always reports how many paths, headings and line numbers were checked, so it is visible when part of
the plan was not recognized:

```text
Drafts/DailyEntry_ImplementationPlan.md:57: src/card/dayEntry.ts does not exist (mark it «(новый)» if the plan creates it)
check_plan: checked 24 paths, 3 headings, 1 line numbers; 1 findings
```

Exits 2 when the size limits in `DocumentationRules.md` or the word list in the skill can no longer be found.

Does not check: whether the plan is right, whether stages are standalone, whether a search count is current; those
are the manual checks of the skill's Step 4.

When: Step 4 of `/create-plan`, after every edit of a plan.
