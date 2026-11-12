import {
  ACTION_LABELS,
  ACTIONS_TITLE,
  EMOTIONS,
  SKILLS_USE_SCALE,
  STATES,
  SUBSTANCE_CATEGORIES,
  SUBSTANCES_TITLE,
  URGES,
  type RatingGroup,
  type RatingKey,
  type SubstanceCategory,
} from '../card/cardColumns.ts'
import { WEEKDAY_SHORT_LABELS, parseIsoDate, weekDates } from '../card/dates.ts'
import type { DayEntry } from '../card/dayEntry.ts'
import { FILL_FREQUENCY_OPTIONS, type WeekCard } from '../card/weekCard.ts'

// Page geometry of the front side of the paper card, in PDF points, with y growing downwards.
// The renderer flips y; everything here is plain arithmetic so it can be tested without a PDF library.

export const PAGE_WIDTH = 841.89 // A4 landscape
export const PAGE_HEIGHT = 595.28
export const MARGIN = 20

const THIN = 0.5
const THICK = 1.2
const LINE_HEIGHT = 1.18
/** Distance from the top of a line box to the baseline, as a share of the font size. */
const ASCENT = 0.8
const MIN_FONT_SIZE = 4
const SUBSTANCE_MIN_WIDTH_FIT_SIZE = 5.5
const PAD = 2.5

const DAY_W = 46
const RATING_W = 22
const QUANTITY_W = 22
const ACTION_W = 30
const EMOTION_W = 24

const HEADER_H = 54
const GROUP_H = 34
const LABEL_H = 96
const SCALE_H = 16
const LEGEND_GAP = 6
const LEGEND_H = 58

// Wording of the paper form, kept as printed on the original.
const FORM_TITLE = 'Диалектика Поведенческая Терапия'
const FORM_NAME = 'Дневниковая карточка'
const NAME_LABEL = 'Имя:'
const SESSION_LABEL = 'Вы заполняете дневник во время сессии?'
const FREQUENCY_LABEL = 'Как часто Вы заполняете эту сторону в неделю?'
const START_DATE_LABEL = 'Дата начала заполнения:'
const DAY_COLUMN_LABEL = 'День и дата'
const GROUP_SUBTITLE = (group: RatingGroup) => (group.subtitle ? `(${group.subtitle})` : '')

export type PdfFont = 'regular' | 'bold'

/** Width of `text` set in `font` at `size` points. */
export type MeasureText = (text: string, size: number, font: PdfFont) => number

/**
 * Text starting at (x, y) on its baseline. Rotated text runs upwards (90° counter-clockwise), as the column
 * titles of the paper card do.
 */
export interface TextOp {
  kind: 'text'
  text: string
  x: number
  y: number
  size: number
  font: PdfFont
  rotated: boolean
}

export interface LineOp {
  kind: 'line'
  x1: number
  y1: number
  x2: number
  y2: number
  thickness: number
}

export interface CardLayout {
  width: number
  height: number
  ops: (TextOp | LineOp)[]
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

type ColumnSpec =
  | { kind: 'rating'; key: RatingKey; label: string; group: RatingGroup }
  | { kind: 'substanceQuantity'; category: SubstanceCategory; label: string }
  | { kind: 'substanceName'; category: SubstanceCategory; label: string }
  | { kind: 'selfHarm' }
  | { kind: 'lies' }
  | { kind: 'skillsUse' }

interface Column {
  x: number
  w: number
  spec: ColumnSpec
}

/** The columns of the daily table in paper order, derived from the card declarations. */
function buildColumns(): Column[] {
  const fixed =
    DAY_W +
    (URGES.fields.length + STATES.fields.length) * RATING_W +
    3 * ACTION_W +
    EMOTIONS.fields.length * EMOTION_W
  const substanceW = (PAGE_WIDTH - 2 * MARGIN - fixed) / SUBSTANCE_CATEGORIES.length
  const columns: Column[] = []
  let x = MARGIN + DAY_W
  const push = (w: number, spec: ColumnSpec) => {
    columns.push({ x, w, spec })
    x += w
  }
  for (const group of [URGES, STATES]) {
    for (const field of group.fields) push(RATING_W, { kind: 'rating', ...field, group })
  }
  for (const category of SUBSTANCE_CATEGORIES) {
    push(QUANTITY_W, { kind: 'substanceQuantity', category: category.key, label: category.label })
    push(substanceW - QUANTITY_W, {
      kind: 'substanceName',
      category: category.key,
      label: category.label,
    })
  }
  push(ACTION_W, { kind: 'selfHarm' })
  push(ACTION_W, { kind: 'lies' })
  push(ACTION_W, { kind: 'skillsUse' })
  for (const field of EMOTIONS.fields)
    push(EMOTION_W, { kind: 'rating', ...field, group: EMOTIONS })
  return columns
}

class LayoutWriter {
  readonly ops: (TextOp | LineOp)[] = []
  private readonly measure: MeasureText

  constructor(measure: MeasureText) {
    this.measure = measure
  }

  line(x1: number, y1: number, x2: number, y2: number, thickness = THIN) {
    this.ops.push({ kind: 'line', x1, y1, x2, y2, thickness })
  }

  rect(box: Box, thickness = THIN) {
    const { x, y, w, h } = box
    this.line(x, y, x + w, y, thickness)
    this.line(x, y + h, x + w, y + h, thickness)
    this.line(x, y, x, y + h, thickness)
    this.line(x + w, y, x + w, y + h, thickness)
  }

  text(
    text: string,
    x: number,
    y: number,
    size: number,
    font: PdfFont = 'regular',
    rotated = false,
  ) {
    if (text !== '') this.ops.push({ kind: 'text', text, x, y, size, font, rotated })
  }

  width(text: string, size: number, font: PdfFont = 'regular') {
    return this.measure(text, size, font)
  }

  /** Greedy word wrap of `text` (explicit `\n` breaks kept) into lines no wider than `maxWidth`. */
  wrap(text: string, maxWidth: number, size: number, font: PdfFont): string[] {
    const lines: string[] = []
    for (const paragraph of text.split('\n')) {
      let current = ''
      for (const word of paragraph.split(' ').filter(Boolean)) {
        const candidate = current === '' ? word : `${current} ${word}`
        if (current !== '' && this.width(candidate, size, font) > maxWidth) {
          lines.push(current)
          current = word
        } else {
          current = candidate
        }
      }
      lines.push(current)
    }
    return lines
  }

  /**
   * The largest size not above `size` at which the wrapped text fits `lineLimit` per line and `stackLimit`
   * for all lines together. At the minimum size the text is returned as is, even if it still overflows.
   */
  fit(text: string, lineLimit: number, stackLimit: number, size: number, font: PdfFont) {
    for (let s = size; s >= MIN_FONT_SIZE; s -= 0.25) {
      const lines = this.wrap(text, lineLimit, s, font)
      const fitsLines = lines.every((l) => this.width(l, s, font) <= lineLimit)
      if (fitsLines && lines.length * s * LINE_HEIGHT <= stackLimit) return { lines, size: s }
    }
    return { lines: this.wrap(text, lineLimit, MIN_FONT_SIZE, font), size: MIN_FONT_SIZE }
  }

  /** Text block centered in the box, shrunk to fit. `top` aligns the block to the top instead. */
  centered(box: Box, text: string, size: number, font: PdfFont = 'regular', top = false) {
    const fitted = this.fit(text, box.w - 2 * PAD, box.h - 2 * PAD, size, font)
    const lh = fitted.size * LINE_HEIGHT
    const startY = top ? box.y + PAD : box.y + (box.h - fitted.lines.length * lh) / 2
    fitted.lines.forEach((l, i) => {
      const x = box.x + (box.w - this.width(l, fitted.size, font)) / 2
      this.text(l, x, startY + i * lh + fitted.size * ASCENT, fitted.size, font)
    })
    return startY + fitted.lines.length * lh
  }

  /** Text block in the box rotated to read upwards, centered both ways and shrunk to fit. */
  rotated(box: Box, text: string, size: number, font: PdfFont = 'regular') {
    const fitted = this.fit(text, box.h - 2 * PAD, box.w - 2 * PAD, size, font)
    const lh = fitted.size * LINE_HEIGHT
    // After rotation the top of a line faces left, so the first line is the leftmost one.
    const left = box.x + (box.w - fitted.lines.length * lh) / 2
    fitted.lines.forEach((l, i) => {
      const y = box.y + (box.h + this.width(l, fitted.size, font)) / 2
      this.text(l, left + i * lh + fitted.size * ASCENT, y, fitted.size, font, true)
    })
  }

  /** A blank to fill in, as on the paper form, with `value` written over it. Returns the x after it. */
  blank(x: number, baseline: number, width: number, value: string, size: number) {
    this.line(x, baseline + 1.5, x + width, baseline + 1.5, THIN)
    if (value !== '') {
      this.text(value, x + (width - this.width(value, size)) / 2, baseline, size)
    }
    return x + width
  }

  /** An option of the form: a blank marked with X when chosen, then its label. Returns the x after it. */
  option(x: number, baseline: number, label: string, chosen: boolean, size: number) {
    const after = this.blank(x, baseline, size * 1.6, chosen ? 'X' : '', size)
    this.text(label, after + 1.5, baseline, size)
    return after + 1.5 + this.width(label, size)
  }
}

const span = (columns: Column[], match: (c: Column) => boolean) => {
  const selected = columns.filter(match)
  const first = selected[0]
  const last = selected[selected.length - 1]
  return { x: first.x, w: last.x + last.w - first.x }
}

const pad2 = (n: number) => String(n).padStart(2, '0')

export function buildCardLayout(card: WeekCard, measure: MeasureText): CardLayout {
  const out = new LayoutWriter(measure)
  const columns = buildColumns()
  const tableX = MARGIN
  const tableW = PAGE_WIDTH - 2 * MARGIN

  const isGroup = (group: RatingGroup) => (c: Column) =>
    c.spec.kind === 'rating' && c.spec.group === group
  const urges = span(columns, isGroup(URGES))
  const states = span(columns, isGroup(STATES))
  const substances = span(columns, (c) => c.spec.kind.startsWith('substance'))
  const actions = span(columns, (c) => ['selfHarm', 'lies', 'skillsUse'].includes(c.spec.kind))
  const emotions = span(columns, isGroup(EMOTIONS))

  // Header row.
  const headerY = MARGIN
  const titleBox = { x: tableX, y: headerY, w: urges.x + urges.w - tableX, h: HEADER_H }
  out.rect(titleBox)
  const titleBottom = out.centered({ ...titleBox, h: 26 }, FORM_TITLE, 7.5, 'regular', true)
  out.centered({ ...titleBox, y: titleBottom, h: 14 }, FORM_NAME, 8.5, 'bold', true)

  const nameBox = { x: states.x, y: headerY, w: states.w, h: HEADER_H }
  out.rect(nameBox)
  out.text(NAME_LABEL, nameBox.x + PAD, headerY + PAD + 7 * ASCENT, 7)
  out.centered({ ...nameBox, y: headerY + 12, h: HEADER_H - 12 }, card.name, 9)

  const sessionBox = { x: substances.x, y: headerY, w: substances.w, h: HEADER_H }
  out.rect(sessionBox)
  out.text(SESSION_LABEL, sessionBox.x + PAD + 2, headerY + PAD + 7.5 * ASCENT + 2, 7.5)
  const sessionBaseline = headerY + 34
  const sessionX = sessionBox.x + sessionBox.w / 2 - 30
  const afterYes = out.option(
    sessionX,
    sessionBaseline,
    'Да',
    card.header.duringSession === true,
    8,
  )
  out.option(afterYes + 10, sessionBaseline, 'Нет', card.header.duringSession === false, 8)

  const frequencyBox = { x: actions.x, y: headerY, w: actions.w, h: HEADER_H }
  out.rect(frequencyBox)
  const frequencyBottom = out.centered(
    { ...frequencyBox, h: 30 },
    FREQUENCY_LABEL,
    6.5,
    'regular',
    true,
  )
  FILL_FREQUENCY_OPTIONS.forEach((option, i) => {
    const x = frequencyBox.x + PAD + (i % 2) * (frequencyBox.w / 2)
    const baseline = frequencyBottom + 6 + Math.floor(i / 2) * 9
    out.option(x, baseline, option.label, card.fillFrequency === option.value, 5.5)
  })

  const startBox = { x: emotions.x, y: headerY, w: emotions.w, h: HEADER_H }
  out.rect(startBox)
  out.centered({ ...startBox, h: 16 }, START_DATE_LABEL, 7.5, 'regular', true)
  const start = card.header.startDate ? parseIsoDate(card.header.startDate) : null
  const dateX = startBox.x + startBox.w / 2 - 50
  let x = dateX
  out.text('Месяц', x, headerY + 30, 7.5)
  x = out.blank(
    x + out.width('Месяц', 7.5) + 2,
    headerY + 30,
    18,
    start ? pad2(start.getMonth() + 1) : '',
    7.5,
  )
  out.text('Год', x + 8, headerY + 30, 7.5)
  out.blank(
    x + 10 + out.width('Год', 7.5),
    headerY + 30,
    26,
    start ? String(start.getFullYear()) : '',
    7.5,
  )
  out.text('Дата', dateX, headerY + 44, 7.5)
  out.blank(
    dateX + out.width('Дата', 7.5) + 2,
    headerY + 44,
    18,
    start ? pad2(start.getDate()) : '',
    7.5,
  )

  // Table head: group titles, column titles, scales.
  const groupY = headerY + HEADER_H
  const labelY = groupY + GROUP_H
  const scaleY = labelY + LABEL_H
  const rowsY = scaleY + SCALE_H
  const legendH = LEGEND_H
  const rowsH = PAGE_HEIGHT - MARGIN - rowsY - LEGEND_GAP - legendH
  const rowH = rowsH / 7

  const dayHeadBox = { x: tableX, y: groupY, w: DAY_W, h: GROUP_H + LABEL_H + SCALE_H }
  out.rect(dayHeadBox)
  out.rotated(dayHeadBox, DAY_COLUMN_LABEL, 8)

  const groupTitle = (area: { x: number; w: number }, title: string, subtitle: string) => {
    const box = { x: area.x, y: groupY, w: area.w, h: GROUP_H }
    out.rect(box)
    const bottom = out.centered({ ...box, h: 14 }, title, 9, 'bold', true)
    if (subtitle !== '')
      out.centered(
        { ...box, y: bottom, h: GROUP_H - (bottom - groupY) },
        subtitle,
        6.5,
        'regular',
        true,
      )
  }
  groupTitle(urges, `${URGES.title}:`, '')
  groupTitle(states, STATES.title, GROUP_SUBTITLE(STATES))
  groupTitle(substances, SUBSTANCES_TITLE, '')
  groupTitle(actions, ACTIONS_TITLE, '')
  groupTitle(emotions, EMOTIONS.title, GROUP_SUBTITLE(EMOTIONS))

  for (const column of columns) {
    const box = { x: column.x, y: labelY, w: column.w, h: LABEL_H }
    const spec = column.spec
    if (spec.kind === 'substanceName') continue
    if (spec.kind === 'substanceQuantity') {
      const categoryBox = {
        ...box,
        w: span(columns, (c) => 'category' in c.spec && c.spec.category === spec.category).w,
      }
      out.rect(categoryBox)
      out.centered({ ...categoryBox, y: labelY + 3, h: 34 }, spec.label, 7, 'regular', true)
      continue
    }
    out.rect(box)
    out.rotated(box, columnTitle(spec), spec.kind === 'rating' && spec.group === EMOTIONS ? 8 : 7)
  }

  for (const column of columns) {
    const box = { x: column.x, y: scaleY, w: column.w, h: SCALE_H }
    out.rect(box)
    out.centered(box, scaleLabel(column.spec), 6)
  }

  // Day rows.
  weekDates(card.weekStart).forEach((date, i) => {
    const y = rowsY + i * rowH
    const dayBox = { x: tableX, y, w: DAY_W, h: rowH }
    out.rect(dayBox)
    const parsedDate = parseIsoDate(date)
    out.text(WEEKDAY_SHORT_LABELS[i], tableX + PAD + 1, y + PAD + 8 * ASCENT + 1, 8)
    out.text(
      `${pad2(parsedDate.getDate())}.${pad2(parsedDate.getMonth() + 1)}`,
      tableX + PAD + 1,
      y + PAD + 18,
      7,
    )
    const entry = card.days[i]
    columns.forEach((column, c) => {
      const box = { x: column.x, y, w: column.w, h: rowH }
      out.rect(box)
      if (!entry) return
      if (column.spec.kind === 'substanceQuantity') {
        const name = columns[c + 1]
        writeSubstanceLines(
          out,
          box,
          { x: name.x, y, w: name.w, h: rowH },
          column.spec.category,
          entry,
        )
      } else {
        writeCell(out, box, column.spec, entry)
      }
    })
  })

  // Thick outlines of the blocks, drawn over the thin cell borders.
  out.rect({ x: tableX, y: headerY, w: tableW, h: HEADER_H }, THICK)
  out.rect({ x: tableX, y: groupY, w: tableW, h: rowsY + 7 * rowH - groupY }, THICK)
  for (const area of [urges, states, substances, actions, emotions]) {
    out.rect({ x: area.x, y: groupY, w: area.w, h: rowsY + 7 * rowH - groupY }, THICK)
  }

  // Legend of the skills-use scale, referenced by the asterisk in the column title.
  const legendBox = { x: tableX, y: PAGE_HEIGHT - MARGIN - legendH, w: tableW, h: legendH }
  out.rect(legendBox, THICK)
  out.centered({ ...legendBox, h: 13 }, `${ACTION_LABELS.skillsUse}*`, 7.5, 'bold', true)
  const half = Math.ceil(SKILLS_USE_SCALE.length / 2)
  SKILLS_USE_SCALE.forEach((meaning, value) => {
    const column = Math.floor(value / half)
    const lineBox = {
      x: legendBox.x + 8 + column * (legendBox.w / 2),
      y: legendBox.y + 13 + (value % half) * 10.5,
      w: legendBox.w / 2 - 16,
      h: 10.5,
    }
    const fitted = out.fit(`${value} – ${meaning}`, lineBox.w, lineBox.h, 7, 'regular')
    out.text(fitted.lines.join(' '), lineBox.x, lineBox.y + fitted.size * ASCENT + 1, fitted.size)
  })

  return { width: PAGE_WIDTH, height: PAGE_HEIGHT, ops: out.ops }
}

function columnTitle(spec: ColumnSpec): string {
  switch (spec.kind) {
    case 'rating':
      return spec.label
    case 'selfHarm':
      return ACTION_LABELS.selfHarm
    case 'lies':
      return ACTION_LABELS.lies
    case 'skillsUse':
      return `${ACTION_LABELS.skillsUse}*`
    default:
      return spec.label
  }
}

function scaleLabel(spec: ColumnSpec): string {
  switch (spec.kind) {
    case 'rating':
      return '0-5'
    case 'substanceQuantity':
    case 'lies':
      return 'Кол-во'
    case 'substanceName':
      return 'Название'
    case 'selfHarm':
      return 'Да/Нет'
    case 'skillsUse':
      return '0-7'
  }
}

function writeCell(out: LayoutWriter, box: Box, spec: ColumnSpec, entry: DayEntry) {
  const value = (text: string | undefined) => {
    if (text !== undefined) out.centered(box, text, 10)
  }
  switch (spec.kind) {
    case 'rating':
      return value(entry.ratings[spec.key]?.toString())
    case 'selfHarm':
      return value(entry.selfHarm === undefined ? undefined : entry.selfHarm ? 'Да' : 'Нет')
    case 'lies':
      return value(entry.lies?.toString())
    case 'skillsUse':
      return value(entry.skillsUse?.toString())
    case 'substanceQuantity':
    case 'substanceName':
      // Both cells of a category are written together by writeSubstanceLines.
      return
  }
}

/**
 * The quantity and name cells of one category list one entry per line. Both cells share one font size, so a
 * quantity stays on the line of its name; what still does not fit at the minimum size is cut with "…".
 */
function writeSubstanceLines(
  out: LayoutWriter,
  quantityBox: Box,
  nameBox: Box,
  category: SubstanceCategory,
  entry: DayEntry,
) {
  const rows = entry.substances[category] ?? []
  if (rows.length === 0) return
  const quantityWidth = quantityBox.w - 2 * PAD
  const nameWidth = nameBox.w - 2 * PAD
  const fitsHeight = (s: number) => rows.length * s * LINE_HEIGHT <= quantityBox.h - 2 * PAD
  const fitsWidth = (s: number) =>
    rows.every(
      (row) => out.width(row.quantity, s) <= quantityWidth && out.width(row.name, s) <= nameWidth,
    )
  // Many entries may shrink the text down to the minimum; one long name only down to a readable size,
  // after which it is cut instead.
  let size = 7
  while (size > MIN_FONT_SIZE && !fitsHeight(size)) size -= 0.25
  while (size > SUBSTANCE_MIN_WIDTH_FIT_SIZE && !fitsWidth(size)) size -= 0.25
  rows.forEach((row, i) => {
    const baseline = quantityBox.y + PAD + i * size * LINE_HEIGHT + size * ASCENT
    out.text(truncate(out, row.quantity, quantityWidth, size), quantityBox.x + PAD, baseline, size)
    out.text(truncate(out, row.name, nameWidth, size), nameBox.x + PAD, baseline, size)
  })
}

function truncate(out: LayoutWriter, text: string, maxWidth: number, size: number): string {
  if (out.width(text, size) <= maxWidth) return text
  let cut = text
  while (cut.length > 0 && out.width(`${cut}…`, size) > maxWidth) cut = cut.slice(0, -1)
  return `${cut}…`
}
