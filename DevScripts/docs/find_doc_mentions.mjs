// Search, not a check: where each name is mentioned in Docs/ and AGENTS.md.
// Case-sensitive substring match. Prints the equivalent grep command and its match count per name, then the
// matching lines grouped by document and nearest heading, each line once.
//
// Usage: node DevScripts/docs/find_doc_mentions.mjs <name> [name...]

import { documentFiles, headingOf, parseLines, readText } from '../lib/markdown.mjs'

const names = process.argv.slice(2)
if (names.length === 0) {
  console.error('usage: node DevScripts/docs/find_doc_mentions.mjs <name> [name...]')
  process.exit(2)
}

const quote = (s) => `'${s.replace(/'/g, `'\\''`)}'`
const counts = new Map(names.map((n) => [n, 0]))
const byDocument = new Map()

for (const docPath of documentFiles()) {
  let heading = '(before the first heading)'
  for (const line of parseLines(readText(docPath))) {
    const h = headingOf(line)
    if (h) heading = `${'#'.repeat(h.level)} ${h.text}`
    const matched = names.filter((n) => line.text.includes(n))
    if (matched.length === 0) continue
    for (const n of matched) counts.set(n, counts.get(n) + 1)
    if (!byDocument.has(docPath)) byDocument.set(docPath, new Map())
    const sections = byDocument.get(docPath)
    if (!sections.has(heading)) sections.set(heading, [])
    sections.get(heading).push({ num: line.num, text: line.text.trim(), matched })
  }
}

for (const n of names) {
  console.log(
    `grep -rnF --include='*.md' -- ${quote(n)} Docs AGENTS.md   # ${counts.get(n)} matching lines`,
  )
}

for (const [docPath, sections] of byDocument) {
  console.log(`\n${docPath}`)
  for (const [heading, lines] of sections) {
    console.log(`  ${heading}`)
    for (const line of lines) {
      const which = names.length > 1 ? `  [${line.matched.join(', ')}]` : ''
      console.log(`    ${line.num}: ${line.text}${which}`)
    }
  }
}
