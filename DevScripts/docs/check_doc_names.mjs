// Checks that code names written in backticks in documents exist in the repository:
// paths and file names, `Type.member` pairs, `functionName()` and compound PascalCase type names.
//
// Usage: node DevScripts/docs/check_doc_names.mjs [paths...]   (default: Docs/**/*.md and AGENTS.md)

import fs from 'node:fs'
import path from 'node:path'
import {
  abs,
  codeSpans,
  documentFiles,
  exists,
  headingOf,
  looksLikePath,
  parseLines,
  readText,
  toPosix,
  walk,
} from '../lib/markdown.mjs'

const ALLOWLIST_FILE = 'DevScripts/docs/check_doc_names.allow.txt'
const CODE_FILE = /\.(ts|tsx|mts|js|mjs|cjs|jsx)$/
// Lines that themselves say the name is gone or not there are intentional mentions.
const SKIP_LINE = /\b(removed|no longer|instead of)\b|(^|\s)Not implemented:/i
const DECISION_HISTORY_SECTIONS = new Set(['Context', 'Alternatives considered'])

const allowlist = new Set(
  exists(ALLOWLIST_FILE)
    ? readText(ALLOWLIST_FILE)
        .split('\n')
        .map((l) => l.replace(/#.*$/, '').trim())
        .filter(Boolean)
    : [],
)

const docs =
  process.argv.length > 2
    ? process.argv.slice(2).map((p) => toPosix(p).replace(/^\.\//, ''))
    : documentFiles()

let repoFiles = null
function repositoryFiles() {
  repoFiles ??= walk('.', () => true)
  return repoFiles
}

let codeSources = null
function codeText() {
  codeSources ??= repositoryFiles()
    .filter((f) => CODE_FILE.test(f) && !f.startsWith('DevScripts/'))
    .map((f) => readText(f))
    .join('\n')
  return codeSources
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function isTypeDeclared(name) {
  return new RegExp(`\\b(class|interface|type|enum|function|const|let)\\s+${escape(name)}\\b`).test(
    codeText(),
  )
}

function isFunctionDeclared(name) {
  const n = escape(name)
  return new RegExp(
    `function\\s*\\*?\\s+${n}\\b|\\b(const|let|var)\\s+${n}\\b|^\\s*(async\\s+|static\\s+|get\\s+|set\\s+)*${n}\\s*[(<]|\\b${n}\\s*:\\s*(async\\s*)?(\\(|function)`,
    'm',
  ).test(codeText())
}

// A PascalCase folder such as `DevScripts` is a directory name, not a type.
function isFolderName(name) {
  return repositoryFiles().some((f) => f.split('/').slice(0, -1).includes(name))
}

// The brace-delimited body of the declaration of typeName, or null when the type has no such body.
function typeBody(typeName) {
  const text = codeText()
  const t = escape(typeName)
  const start = new RegExp(
    // A type alias body must open on the declaration line: the code has no semicolons, so a wider match would
    // run into the next declaration's braces.
    `\\b(?:class|interface|enum)\\s+${t}\\b[^{;]*\\{|\\btype\\s+${t}\\b[^=;\\n]*=\\s*[^;{\\n]*\\{|\\b(?:const|let)\\s+${t}\\b[^=;\\n]*=\\s*\\{`,
  ).exec(text)
  if (!start) return null
  let depth = 0
  const open = start.index + start[0].length - 1
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}' && --depth === 0) return text.slice(open + 1, i)
  }
  return null
}

function isMemberDeclared(body, member) {
  const m = escape(member)
  return new RegExp(
    `(^|[\\s;,{])((readonly|static|async|get|set|public|private|protected)\\s+)*['"]?${m}['"]?\\s*[?!]?\\s*[:(=<,;]|(^|[\\s,{])${m}\\s*(,|$)`,
    'm',
  ).test(body)
}

function checkName(value, docPath, ruleDocument) {
  // A scoped npm package such as `@pdf-lib/fontkit` is checked against node_modules, not the repository tree.
  if (/^@[a-z0-9-]+\/[a-z0-9.-]+$/.test(value)) {
    return fs.existsSync(abs(`node_modules/${value}/package.json`))
      ? null
      : 'npm package is not installed'
  }
  if (looksLikePath(value)) {
    const clean = value.replace(/^\.\//, '').replace(/[#:].*$/, '')
    if (clean.includes('/')) {
      const fromRoot = clean.replace(/\/$/, '')
      const fromDoc = toPosix(path.normalize(path.join(path.dirname(docPath), fromRoot)))
      if (fs.existsSync(abs(fromRoot)) || fs.existsSync(abs(fromDoc))) return null
      return 'path does not exist'
    }
    return repositoryFiles().some((f) => f.split('/').pop() === clean)
      ? null
      : 'no file with this name in the repository'
  }
  if (ruleDocument) return null

  const member = value.match(/^([A-Z][A-Za-z0-9]*)\.([A-Za-z_$][A-Za-z0-9_$]*)(\(\))?$/)
  if (member) {
    const [, typeName, memberName] = member
    if (!isTypeDeclared(typeName)) return `type ${typeName} is not declared in the code`
    const body = typeBody(typeName)
    if (body === null) return null // a union or alias without a body: members are not resolved
    return isMemberDeclared(body, memberName)
      ? null
      : `${typeName} declares no member ${memberName}`
  }

  const fn = value.match(/^([a-z][A-Za-z0-9]*)\(\)$/)
  if (fn) return isFunctionDeclared(fn[1]) ? null : `function ${fn[1]} is not declared in the code`

  if (/^[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)+$/.test(value)) {
    if (isTypeDeclared(value) || isFolderName(value)) return null
    return 'type or component is not declared in the code'
  }
  return null
}

const findings = []
for (const docPath of docs) {
  if (!exists(docPath)) {
    findings.push(`${docPath}:1: document does not exist`)
    continue
  }
  // Rule documents illustrate with hypothetical names, so only their paths are checked.
  const ruleDocument = /^Docs\/Core\/[^/]*Rules\.md$/.test(docPath)
  const decisionDocument = docPath.startsWith('Docs/Decisions/')
  let section = ''
  for (const line of parseLines(readText(docPath))) {
    const heading = headingOf(line)
    if (heading) {
      if (heading.level === 2) section = heading.text
      continue
    }
    if (line.inFence || SKIP_LINE.test(line.text)) continue
    if (decisionDocument && DECISION_HISTORY_SECTIONS.has(section)) continue
    for (const span of codeSpans(line.text)) {
      if (allowlist.has(span.value)) continue
      const problem = checkName(span.value, docPath, ruleDocument)
      if (problem) findings.push(`${docPath}:${line.num}: \`${span.value}\` — ${problem}`)
    }
  }
}

if (findings.length > 0) {
  for (const finding of findings) console.log(finding)
  process.exit(1)
}
