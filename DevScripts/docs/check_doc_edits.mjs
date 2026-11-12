// Checks the structure of markdown documents changed against a git commit (HEAD by default).
// Reports only problems that the commit did not already have.
//
// Usage: node DevScripts/docs/check_doc_edits.mjs [--ref <commit>] [--all] [paths...]

import { execFileSync } from 'node:child_process'
import {
  badTableRows,
  checkLink,
  countFenceLines,
  exists,
  guardedMarkdownFiles,
  hasMixedLineEndings,
  headings,
  isGuardedMarkdown,
  links,
  parseLines,
  readText,
  ROOT,
} from '../lib/markdown.mjs'

const SCRIPT = 'check_doc_edits.mjs'

function usage(message) {
  console.error(`${SCRIPT}: ${message}`)
  console.error(
    'usage: node DevScripts/docs/check_doc_edits.mjs [--ref <commit>] [--all] [paths...]',
  )
  process.exit(2)
}

function git(args, { allowFailure = false } = {}) {
  try {
    return execFileSync('git', ['-c', 'core.quotePath=false', ...args], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch (error) {
    if (allowFailure) return null
    throw error
  }
}

let ref = 'HEAD'
let all = false
const explicitPaths = []
const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--ref') {
    ref = argv[++i]
    if (!ref) usage('--ref needs a commit')
  } else if (argv[i] === '--all') all = true
  else if (argv[i].startsWith('-')) usage(`unknown option ${argv[i]}`)
  else explicitPaths.push(argv[i].replace(/\\/g, '/').replace(/^\.\//, ''))
}

if (git(['rev-parse', '--is-inside-work-tree'], { allowFailure: true }) === null) {
  usage('not inside a git repository')
}
const refExists =
  git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], { allowFailure: true }) !== null
if (!refExists && ref !== 'HEAD') usage(`unknown commit ${ref}`)

function oldContent(relPath) {
  if (all || !refExists) return ''
  return git(['show', `${ref}:${relPath}`], { allowFailure: true }) ?? ''
}

function splitZ(output) {
  return (output ?? '').split('\0').filter(Boolean)
}

let candidates
if (all) {
  candidates = guardedMarkdownFiles()
} else {
  const changed = refExists ? splitZ(git(['diff', '--name-only', '-z', ref, '--'])) : []
  const untracked = splitZ(git(['ls-files', '--others', '--exclude-standard', '-z']))
  const tracked = refExists ? [] : splitZ(git(['ls-files', '-z']))
  candidates = [...new Set([...changed, ...untracked, ...tracked])].filter(isGuardedMarkdown)
}
if (explicitPaths.length > 0) {
  const wanted = new Set(explicitPaths)
  candidates = candidates.filter((p) => wanted.has(p))
}

const findings = []
const report = (file, line, message) => findings.push(`${file}:${line}: ${message}`)

function headingKey(h) {
  return `${'#'.repeat(h.level)} ${h.text}`
}

function brokenLinks(relPath, text) {
  const result = []
  for (const line of parseLines(text)) {
    if (line.inFence) continue
    for (const link of links(line.text)) {
      const problem = checkLink(relPath, link.target)
      if (problem)
        result.push({ num: line.num, key: link.target, message: `${problem}: ${link.target}` })
    }
  }
  return result
}

// Other documents that point at a heading of relPath, by anchor link or by quoting the heading text.
function referencesToHeading(relPath, heading) {
  const quoted = `\`${headingKey(heading)}\``
  const fileName = relPath.split('/').pop()
  return guardedMarkdownFiles().filter((other) => {
    if (other === relPath || !exists(other)) return false
    const text = readText(other)
    return text.includes(fileName) && text.includes(quoted)
  })
}

for (const relPath of candidates) {
  const before = oldContent(relPath)
  if (!exists(relPath)) {
    const linkingDocs = guardedMarkdownFiles().filter((other) =>
      readText(other).includes(relPath.split('/').pop()),
    )
    report(
      relPath,
      1,
      `document deleted${linkingDocs.length ? `; still mentioned in ${linkingDocs.join(', ')}` : ''}`,
    )
    continue
  }
  const after = readText(relPath)

  const afterHeadings = new Set(headings(after).map(headingKey))
  for (const heading of headings(before)) {
    if (afterHeadings.has(headingKey(heading))) continue
    const refs = referencesToHeading(relPath, heading)
    report(
      relPath,
      heading.num,
      `heading "${headingKey(heading)}" disappeared or was renamed (line in ${ref}); ` +
        (refs.length ? `quoted in ${refs.join(', ')}` : 'other documents may link to it'),
    )
  }

  const oldBroken = new Set(brokenLinks(relPath, before).map((b) => b.key))
  for (const broken of brokenLinks(relPath, after)) {
    if (!oldBroken.has(broken.key)) report(relPath, broken.num, broken.message)
  }

  const oldBadRows = new Set(badTableRows(before).map((r) => r.text))
  for (const row of badTableRows(after)) {
    if (!oldBadRows.has(row.text)) {
      report(relPath, row.num, `table row has ${row.actual} cells, the header has ${row.expected}`)
    }
  }

  if (countFenceLines(after) % 2 === 1 && countFenceLines(before) % 2 === 0) {
    report(relPath, 1, 'odd number of code fence lines: a fence is not closed')
  }

  if (hasMixedLineEndings(after) && !hasMixedLineEndings(before)) {
    report(relPath, 1, 'mixed line endings (CRLF and LF in one file)')
  }
}

if (findings.length > 0) {
  for (const finding of findings) console.log(finding)
  process.exit(1)
}
