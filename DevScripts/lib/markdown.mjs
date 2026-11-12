// Shared helpers for the DevScripts checks: repository paths, markdown parsing and rule lookup.
// Standard library only, so the checks run right after cloning without npm install.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

const SKIPPED_DIRS = new Set(['node_modules', '.git', 'dist'])

export function toPosix(p) {
  return p.split(path.sep).join('/')
}

export function rel(absPath) {
  return toPosix(path.relative(ROOT, absPath))
}

export function abs(relPath) {
  return path.join(ROOT, relPath)
}

export function exists(relPath) {
  return fs.existsSync(abs(relPath))
}

export function readText(relPath) {
  return fs.readFileSync(abs(relPath), 'utf8')
}

export function walk(relDir, filter = () => true) {
  const result = []
  const start = abs(relDir)
  if (!fs.existsSync(start)) return result
  const stack = [start]
  while (stack.length > 0) {
    const dir = stack.pop()
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIPPED_DIRS.has(entry.name)) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) stack.push(full)
      else if (filter(full)) result.push(rel(full))
    }
  }
  return result.sort()
}

const isMarkdown = (p) => p.endsWith('.md')

// Documents read by agents: everything under Docs/ plus the root router.
export function documentFiles() {
  const files = walk('Docs', isMarkdown)
  if (exists('AGENTS.md')) files.push('AGENTS.md')
  return files
}

// Markdown files whose structure the edit check guards: documents plus the other agent-facing markdown.
export function guardedMarkdownFiles() {
  const files = [...documentFiles()]
  for (const single of ['CLAUDE.md']) if (exists(single)) files.push(single)
  files.push(...walk('DevScripts', isMarkdown), ...walk('.claude/skills', isMarkdown))
  return files
}

export function isGuardedMarkdown(relPath) {
  return (
    isMarkdown(relPath) &&
    (relPath.startsWith('Docs/') ||
      relPath === 'AGENTS.md' ||
      relPath === 'CLAUDE.md' ||
      relPath.startsWith('DevScripts/') ||
      relPath.startsWith('.claude/skills/'))
  )
}

export function byteSizeWithoutCR(text) {
  return Buffer.byteLength(text.replace(/\r/g, ''), 'utf8')
}

const FENCE = /^ {0,3}(`{3,}|~{3,})/

// Splits text into lines with fence state. A fence line itself is marked inFence so that callers skip it.
export function parseLines(text) {
  const raw = text.split('\n')
  const lines = []
  let fence = null
  for (let i = 0; i < raw.length; i++) {
    const textLine = raw[i].replace(/\r$/, '')
    const match = textLine.match(FENCE)
    let inFence = fence !== null
    if (match) {
      const marker = match[1]
      if (fence === null) {
        fence = marker
        inFence = true
      } else if (marker[0] === fence[0] && marker.length >= fence.length) {
        fence = null
        inFence = true
      }
    }
    lines.push({ num: i + 1, text: textLine, inFence })
  }
  return lines
}

export function countFenceLines(text) {
  return text.split('\n').filter((line) => FENCE.test(line)).length
}

const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/

export function headingOf(line) {
  if (line.inFence) return null
  const match = line.text.match(HEADING)
  return match ? { level: match[1].length, text: match[2] } : null
}

export function headings(text) {
  const result = []
  for (const line of parseLines(text)) {
    const heading = headingOf(line)
    if (heading) result.push({ ...heading, num: line.num })
  }
  return result
}

// GitHub-style anchor slugs, with -1, -2 suffixes for repeated headings.
export function headingSlugs(text) {
  const seen = new Map()
  const slugs = new Set()
  for (const heading of headings(text)) {
    const base = heading.text
      .replace(/`/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '')
      .replace(/\s/g, '-')
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    slugs.add(count === 0 ? base : `${base}-${count}`)
  }
  return slugs
}

const CODE_SPAN = /(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g

export function codeSpans(lineText) {
  const spans = []
  for (const match of lineText.matchAll(CODE_SPAN)) {
    spans.push({ value: match[2].trim(), start: match.index, end: match.index + match[0].length })
  }
  return spans
}

// Replaces code spans with spaces so that positions stay valid and link syntax inside code is ignored.
export function blankCodeSpans(lineText) {
  return lineText.replace(CODE_SPAN, (m) => ' '.repeat(m.length))
}

const LINK = /!?\[(?:[^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g

export function links(lineText) {
  const result = []
  for (const match of blankCodeSpans(lineText).matchAll(LINK)) {
    result.push({ target: match[1], start: match.index })
  }
  return result
}

// Returns a problem description for a relative link from fromRel, or null when it resolves.
export function checkLink(fromRel, target) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return null
  const hashIndex = target.indexOf('#')
  const filePart = hashIndex >= 0 ? target.slice(0, hashIndex) : target
  const anchor = hashIndex >= 0 ? target.slice(hashIndex + 1) : ''
  let targetRel = fromRel
  if (filePart !== '') {
    if (path.isAbsolute(filePart) || /^[A-Za-z]:/.test(filePart))
      return 'absolute path used as a link'
    let decoded = filePart
    try {
      decoded = decodeURIComponent(filePart)
    } catch {
      return 'link is not valid URL encoding'
    }
    targetRel = toPosix(path.normalize(path.join(path.dirname(fromRel), decoded)))
    if (!exists(targetRel)) return 'link target does not exist'
  }
  if (anchor !== '' && targetRel.endsWith('.md')) {
    if (!headingSlugs(readText(targetRel)).has(anchor.toLowerCase())) {
      return `anchor #${anchor} matches no heading in ${targetRel}`
    }
  }
  return null
}

// Cells of a table row, split on unescaped pipes as GitHub renders them.
export function tableCells(lineText) {
  let row = lineText.trim()
  if (row.startsWith('|')) row = row.slice(1)
  if (row.endsWith('|') && !row.endsWith('\\|')) row = row.slice(0, -1)
  return row.split(/(?<!\\)\|/)
}

const TABLE_SEPARATOR = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/

// Rows whose cell count differs from the header row of their table.
export function badTableRows(text) {
  const lines = parseLines(text)
  const bad = []
  for (let i = 0; i + 1 < lines.length; i++) {
    const header = lines[i]
    const separator = lines[i + 1]
    if (header.inFence || !header.text.includes('|') || !TABLE_SEPARATOR.test(separator.text))
      continue
    const expected = tableCells(header.text).length
    if (tableCells(separator.text).length !== expected) {
      bad.push({
        num: separator.num,
        text: separator.text,
        expected,
        actual: tableCells(separator.text).length,
      })
    }
    let j = i + 2
    while (
      j < lines.length &&
      !lines[j].inFence &&
      lines[j].text.includes('|') &&
      lines[j].text.trim() !== ''
    ) {
      const actual = tableCells(lines[j].text).length
      if (actual !== expected)
        bad.push({ num: lines[j].num, text: lines[j].text, expected, actual })
      j++
    }
    i = j - 1
  }
  return bad
}

export function hasMixedLineEndings(text) {
  const crlf = (text.match(/\r\n/g) ?? []).length
  const lf = (text.match(/\n/g) ?? []).length
  return crlf > 0 && crlf < lf
}

const KNOWN_EXTENSIONS =
  /\.(ts|tsx|mts|js|mjs|cjs|jsx|json|md|html|css|yml|yaml|svg|png|jpg|pdf|txt|ttf|woff2|webmanifest)$/

// A code span that names a repository path or file: no spaces, no placeholders, not a URL.
export function looksLikePath(value) {
  if (/\s/.test(value) || /[<>*{}$|]/.test(value)) return false
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value) || value.startsWith('-') || value.startsWith('#'))
    return false
  const bare = value.replace(/:\d+(?:[-–]\d+)?$/, '').replace(/#.*$/, '')
  // `/create-plan` is a slash command, not a path.
  if (/^\/[a-z][a-z0-9-]*$/.test(bare)) return false
  return bare.includes('/') || KNOWN_EXTENSIONS.test(bare)
}

// Reads one rule from a rule document. A missing line means the rule was reworded: stop with exit code 2
// instead of checking against an outdated copy.
export function readRule(relPath, pattern, description, scriptName) {
  if (!exists(relPath)) {
    console.error(`${scriptName}: cannot read ${relPath} (needed for: ${description})`)
    process.exit(2)
  }
  const match = readText(relPath).match(pattern)
  if (!match) {
    console.error(
      `${scriptName}: cannot find the line "${description}" in ${relPath} (pattern ${pattern}); ` +
        `the rule was reworded — update the pattern in ${scriptName}`,
    )
    process.exit(2)
  }
  return match
}
