// The mechanical part of plan verification for /create-plan.
// Reads the size limits from Docs/Core/DocumentationRules.md and the forbidden words from the create-plan skill.
// The last printed line always says how many paths, headings and line numbers were checked.
//
// Usage: node DevScripts/plan/check_plan.mjs <plan.md> [plan.md...]

import {
  byteSizeWithoutCR,
  codeSpans,
  exists,
  headingOf,
  headings,
  links,
  looksLikePath,
  parseLines,
  readRule,
  readText,
  toPosix,
} from '../lib/markdown.mjs'

const SCRIPT = 'check_plan.mjs'
const RULES = 'Docs/Core/DocumentationRules.md'
const SKILL = '.claude/skills/create-plan/SKILL.md'

const plans = process.argv.slice(2).map((p) => toPosix(p).replace(/^\.\//, ''))
if (plans.length === 0) {
  console.error('usage: node DevScripts/plan/check_plan.mjs <plan.md> [plan.md...]')
  process.exit(2)
}

const softLimit = Number(
  readRule(RULES, /^- Soft limit: (\d+) bytes\./m, '- Soft limit: <n> bytes.', SCRIPT)[1],
)
const hardLimit = Number(
  readRule(RULES, /^- Hard limit: (\d+) bytes\./m, '- Hard limit: <n> bytes.', SCRIPT)[1],
)
const agentsLimit = Number(
  readRule(
    RULES,
    /^- `AGENTS\.md` limit: (\d+) bytes\./m,
    '- `AGENTS.md` limit: <n> bytes.',
    SCRIPT,
  )[1],
)
const forbiddenWords = readRule(
  SKILL,
  /\*\*No uncertainty\.\*\* Forbidden words: ([^.]+)\./,
  '**No uncertainty.** Forbidden words: <word>, <word>.',
  SCRIPT,
)[1]
  .split(',')
  .map((w) => w.trim().replace(/^«|»$/g, ''))
  .filter(Boolean)

const wordPatterns = forbiddenWords.map((w) => ({
  word: w,
  re: new RegExp(
    `(?<![\\p{L}\\p{N}_])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}_])`,
    'iu',
  ),
}))

const NEW_MARKER = /^\s*\((новый|новая|новое|новые|new)\)/i
const LINE_SUFFIX = /:(\d+)(?:[-–](\d+))?$/
const LINK_LINE_SUFFIX = /#L(\d+)(?:-L?(\d+))?$/
const PROSE_LINE = /(?<![\p{L}])(?:строк[а-я]*|lines?)\s+(\d+)(?:\s*[-–]\s*(\d+))?/giu
const QUOTED = /«([^»]+)»|“([^”]+)”|"([^"]+)"/g

const findings = []
const counts = { paths: 0, headings: 0, lineNumbers: 0 }
const report = (file, line, message) => findings.push(`${file}:${line}: ${message}`)

function stripQuotations(text) {
  return text.replace(/(`+)[^`]*?\1/g, ' ').replace(QUOTED, ' ')
}

function pathOf(value) {
  return value.replace(/^\.\//, '').replace(LINE_SUFFIX, '').replace(/#.*$/, '').replace(/\/$/, '')
}

function checkSize(plan, num, docPath, checkedDocs) {
  if (checkedDocs.has(docPath) || !exists(docPath)) return
  if (!(docPath.startsWith('Docs/') || docPath === 'AGENTS.md') || !docPath.endsWith('.md')) return
  checkedDocs.add(docPath)
  const size = byteSizeWithoutCR(readText(docPath))
  if (docPath === 'AGENTS.md') {
    if (size > agentsLimit)
      report(plan, num, `AGENTS.md is ${size} bytes, above its limit ${agentsLimit}`)
  } else if (size > hardLimit) {
    report(
      plan,
      num,
      `${docPath} is ${size} bytes, above the hard limit ${hardLimit}: the plan must split it`,
    )
  } else if (size > softLimit) {
    report(
      plan,
      num,
      `${docPath} is ${size} bytes, above the soft limit ${softLimit}: split it at this edit`,
    )
  }
}

function checkLineNumber(plan, line, target, from, to, anchors) {
  counts.lineNumbers++
  if (!target.endsWith('.md')) {
    report(plan, line.num, `line number ${from} addresses code (${target}); address code by name`)
    return
  }
  if (!exists(target)) return
  if (anchors.length === 0) {
    report(plan, line.num, `line number ${from} in ${target} has no quoted anchor next to it`)
    return
  }
  const docLines = readText(target).split('\n')
  const range = docLines.slice(from - 1, to ?? from).join('\n')
  if (!anchors.some((a) => range.includes(a))) {
    report(
      plan,
      line.num,
      `none of the quoted anchors is on line ${from}${to ? `-${to}` : ''} of ${target}`,
    )
  }
}

for (const plan of plans) {
  if (!exists(plan)) {
    console.error(`${SCRIPT}: plan file not found: ${plan}`)
    process.exit(2)
  }
  const lines = parseLines(readText(plan))

  // Paths the plan creates may be referenced without the marker in later stages.
  const newPaths = new Set()
  for (const line of lines) {
    if (line.inFence) continue
    for (const span of codeSpans(line.text)) {
      if (looksLikePath(span.value) && NEW_MARKER.test(line.text.slice(span.end)))
        newPaths.add(pathOf(span.value))
    }
  }

  const checkedDocs = new Set()
  let lastDoc = null
  for (const line of lines) {
    if (line.inFence) continue
    const heading = headingOf(line)
    if (heading && heading.level <= 2) lastDoc = null

    if (!line.text.trimStart().startsWith('>')) {
      const prose = stripQuotations(line.text)
      for (const { word, re } of wordPatterns) {
        if (re.test(prose)) report(plan, line.num, `uncertain wording "${word}"`)
      }
    }

    const spans = codeSpans(line.text)
    const anchors = []
    for (const match of line.text.matchAll(QUOTED)) anchors.push(match[1] ?? match[2] ?? match[3])
    for (const span of spans) {
      if (!looksLikePath(span.value) && !/^#{1,6} /.test(span.value)) anchors.push(span.value)
    }

    let docOnLine = null
    for (const span of spans) {
      const value = span.value
      if (looksLikePath(value)) {
        const target = pathOf(value)
        counts.paths++
        const markedNew = NEW_MARKER.test(line.text.slice(span.end))
        if (markedNew && exists(target))
          report(plan, line.num, `${target} is marked new but already exists`)
        if (!markedNew && !exists(target) && !newPaths.has(target)) {
          report(
            plan,
            line.num,
            `${target} does not exist (mark it «(новый)» if the plan creates it)`,
          )
        }
        checkSize(plan, line.num, target, checkedDocs)
        if (target.endsWith('.md')) docOnLine = lastDoc = target
        const suffix = value.match(LINE_SUFFIX)
        if (suffix)
          checkLineNumber(
            plan,
            line,
            target,
            Number(suffix[1]),
            suffix[2] && Number(suffix[2]),
            anchors,
          )
        continue
      }
      const quotedHeading = value.match(/^(#{1,6}) (.+)$/)
      if (quotedHeading) {
        const doc = docOnLine ?? lastDoc
        if (!doc || !exists(doc) || newPaths.has(doc)) continue
        counts.headings++
        const level = quotedHeading[1].length
        const text = quotedHeading[2].trim()
        if (!headings(readText(doc)).some((h) => h.level === level && h.text === text)) {
          report(plan, line.num, `heading "${value}" not found at level ${level} in ${doc}`)
        }
      }
    }

    for (const link of links(line.text)) {
      const suffix = link.target.match(LINK_LINE_SUFFIX)
      if (suffix) {
        const target = toPosix(link.target.replace(/#.*$/, ''))
        checkLineNumber(
          plan,
          line,
          target,
          Number(suffix[1]),
          suffix[2] && Number(suffix[2]),
          anchors,
        )
      }
    }

    for (const match of stripQuotations(line.text).matchAll(PROSE_LINE)) {
      const target =
        docOnLine ??
        spans
          .map((s) => s.value)
          .filter(looksLikePath)
          .map(pathOf)
          .pop()
      if (!target) continue
      checkLineNumber(plan, line, target, Number(match[1]), match[2] && Number(match[2]), anchors)
    }
  }
}

for (const finding of findings) console.log(finding)
console.log(
  `check_plan: checked ${counts.paths} paths, ${counts.headings} headings, ${counts.lineNumbers} line numbers; ` +
    `${findings.length} findings`,
)
process.exit(findings.length > 0 ? 1 : 0)
