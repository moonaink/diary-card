---
name: explain
description: Explain a plan, document, system, code area or question as one concrete walkthrough the user absorbs in one read. Runs only on an explicit /explain.
argument-hint: <path to a plan or document | system or code area | question>
disable-model-invocation: true
---

# Explain

Turn `$ARGUMENTS` into an explanation the user absorbs in one read: a walkthrough on one concrete example, not a
summary. With an empty argument, ask what to explain and do not proceed.

## Contract

- Explanation only: no changes to files, and no starting of a plan's stages.
- Not a review: no improvement proposals unless asked. A factually broken step is noted in one line where it comes
  up.
- Grounded in the repository: the load-bearing claims are checked against the code, and code that does not exist yet
  is called so («ещё не написано», «появится на Этапе 2»).
- The reader is out of context: no "as we discussed", and no term the explanation has not introduced.

## Process

1. Read `AGENTS.md` and the subject. For a system or area, find its canonical document through
   `Docs/Core/DocumentMap.md`.
2. Identify the runtime flow: what triggers it, what passes through, where it ends.
3. Open the key files and confirm the names and the order of calls.
4. Find the one architectural idea that makes the rest fall into place.
5. Invent one concrete example with real names and plausible values (a concrete day of the diary card with its
   ratings, a concrete week).

## Output

In Russian, straight into chat:

1. A table «слой | компонент | роль» that marks what exists versus what the subject adds, followed by the key idea in
   bold.
2. The example step by step: a «Дано:» setup, then numbered steps in runtime order (not in the plan's stage order),
   each naming the actual function called and what changes, with a one-clause reason wherever the order is not
   obvious.
3. Secondary flows, shorter.
4. Three to six non-obvious invariants, each with the consequence of breaking it.

## Style

Terse, no preamble and no closing summary. Real type names, function names and values instead of "the system
processes the data".
