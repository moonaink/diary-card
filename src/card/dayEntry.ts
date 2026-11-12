import {
  RATING_KEYS,
  RATING_LABELS,
  RATING_MAX,
  SKILLS_USE_MAX,
  SUBSTANCE_CATEGORY_KEYS,
  type RatingKey,
  type SubstanceCategory,
} from './cardColumns.ts'
import { isIsoDate, type IsoDate } from './dates.ts'
import { parsed, rejected, type ParseResult } from './parseResult.ts'

/** One substance taken during the day. Quantity is free text ("2 бокала", "50 мг"), as on paper. */
export interface SubstanceEntry {
  name: string
  quantity: string
}

/**
 * The card row of one date. An absent value means the cell is left blank, which is different from 0.
 * A day whose every value is absent has no stored record at all.
 */
export interface DayEntry {
  date: IsoDate
  ratings: Partial<Record<RatingKey, number>>
  substances: Partial<Record<SubstanceCategory, SubstanceEntry[]>>
  selfHarm?: boolean
  /** Number of lies; a non-negative integer. */
  lies?: number
  /** «Применение навыков», 0–7 on the scale `SKILLS_USE_SCALE`. */
  skillsUse?: number
}

export function emptyDayEntry(date: IsoDate): DayEntry {
  return { date, ratings: {}, substances: {} }
}

const isBlankSubstance = (entry: SubstanceEntry) =>
  entry.name.trim() === '' && entry.quantity.trim() === ''

export function isDayEntryEmpty(entry: DayEntry): boolean {
  return (
    RATING_KEYS.every((key) => entry.ratings[key] === undefined) &&
    SUBSTANCE_CATEGORY_KEYS.every((category) =>
      (entry.substances[category] ?? []).every(isBlankSubstance),
    ) &&
    entry.selfHarm === undefined &&
    entry.lies === undefined &&
    entry.skillsUse === undefined
  )
}

/**
 * The form a day is stored in: substance rows trimmed, blank rows and empty categories dropped.
 * The editing draft keeps blank rows so that a row the user just added does not vanish while typing.
 */
export function normalizeDayEntry(entry: DayEntry): DayEntry {
  const substances: DayEntry['substances'] = {}
  for (const category of SUBSTANCE_CATEGORY_KEYS) {
    const rows = (entry.substances[category] ?? [])
      .map((row) => ({ name: row.name.trim(), quantity: row.quantity.trim() }))
      .filter((row) => !isBlankSubstance(row))
    if (rows.length > 0) substances[category] = rows
  }
  const ratings: DayEntry['ratings'] = {}
  for (const key of RATING_KEYS) {
    if (entry.ratings[key] !== undefined) ratings[key] = entry.ratings[key]
  }
  const normalized: DayEntry = { date: entry.date, ratings, substances }
  if (entry.selfHarm !== undefined) normalized.selfHarm = entry.selfHarm
  if (entry.lies !== undefined) normalized.lies = entry.lies
  if (entry.skillsUse !== undefined) normalized.skillsUse = entry.skillsUse
  return normalized
}

export function applyRating(entry: DayEntry, key: RatingKey, value: number | undefined): DayEntry {
  if (value !== undefined && !isIntegerInRange(value, 0, RATING_MAX)) {
    throw new RangeError(`Rating ${key} must be 0–${RATING_MAX}, got ${value}`)
  }
  const ratings = { ...entry.ratings }
  if (value === undefined) delete ratings[key]
  else ratings[key] = value
  return { ...entry, ratings }
}

export function applySelfHarm(entry: DayEntry, value: boolean | undefined): DayEntry {
  return withOptional(entry, 'selfHarm', value)
}

export function applyLies(entry: DayEntry, value: number | undefined): DayEntry {
  if (value !== undefined && !isIntegerInRange(value, 0, Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`Lies must be a non-negative integer, got ${value}`)
  }
  return withOptional(entry, 'lies', value)
}

export function applySkillsUse(entry: DayEntry, value: number | undefined): DayEntry {
  if (value !== undefined && !isIntegerInRange(value, 0, SKILLS_USE_MAX)) {
    throw new RangeError(`Skills use must be 0–${SKILLS_USE_MAX}, got ${value}`)
  }
  return withOptional(entry, 'skillsUse', value)
}

export function addSubstance(entry: DayEntry, category: SubstanceCategory): DayEntry {
  const rows = [...(entry.substances[category] ?? []), { name: '', quantity: '' }]
  return { ...entry, substances: { ...entry.substances, [category]: rows } }
}

export function applySubstance(
  entry: DayEntry,
  category: SubstanceCategory,
  index: number,
  change: Partial<SubstanceEntry>,
): DayEntry {
  const rows = (entry.substances[category] ?? []).map((row, i) =>
    i === index ? { ...row, ...change } : row,
  )
  return { ...entry, substances: { ...entry.substances, [category]: rows } }
}

export function removeSubstance(
  entry: DayEntry,
  category: SubstanceCategory,
  index: number,
): DayEntry {
  const rows = (entry.substances[category] ?? []).filter((_, i) => i !== index)
  return { ...entry, substances: { ...entry.substances, [category]: rows } }
}

/** Reads a day entry from untrusted data (a backup file) and returns it normalized. */
export function tryParseDayEntry(value: unknown): ParseResult<DayEntry> {
  if (!isPlainObject(value)) return rejected('запись дня не является объектом')
  if (!isIsoDate(value.date)) return rejected(`неверная дата дня: ${String(value.date)}`)
  const where = `день ${value.date}`

  const ratingsValue = value.ratings ?? {}
  if (!isPlainObject(ratingsValue)) return rejected(`${where}: оценки не являются объектом`)
  const ratings: DayEntry['ratings'] = {}
  for (const [key, rating] of Object.entries(ratingsValue)) {
    if (!(RATING_KEYS as readonly string[]).includes(key)) {
      return rejected(`${where}: неизвестная оценка ${key}`)
    }
    if (!isIntegerInRange(rating, 0, RATING_MAX)) {
      return rejected(
        `${where}: оценка «${RATING_LABELS[key as RatingKey]}» должна быть от 0 до ${RATING_MAX}`,
      )
    }
    ratings[key as RatingKey] = rating
  }

  const substancesValue = value.substances ?? {}
  if (!isPlainObject(substancesValue)) return rejected(`${where}: вещества не являются объектом`)
  const substances: DayEntry['substances'] = {}
  for (const [category, rows] of Object.entries(substancesValue)) {
    if (!(SUBSTANCE_CATEGORY_KEYS as readonly string[]).includes(category)) {
      return rejected(`${where}: неизвестная категория веществ ${category}`)
    }
    if (!Array.isArray(rows)) return rejected(`${where}: ${category} не является списком`)
    const parsedRows: SubstanceEntry[] = []
    for (const row of rows) {
      if (!isPlainObject(row) || typeof row.name !== 'string' || typeof row.quantity !== 'string') {
        return rejected(`${where}: неверная запись в ${category}`)
      }
      parsedRows.push({ name: row.name, quantity: row.quantity })
    }
    substances[category as SubstanceCategory] = parsedRows
  }

  const entry: DayEntry = { date: value.date, ratings, substances }
  if (value.selfHarm !== undefined) {
    if (typeof value.selfHarm !== 'boolean') return rejected(`${where}: самоповреждение не да/нет`)
    entry.selfHarm = value.selfHarm
  }
  if (value.lies !== undefined) {
    if (!isIntegerInRange(value.lies, 0, Number.MAX_SAFE_INTEGER)) {
      return rejected(`${where}: ложь должна быть целым числом от 0`)
    }
    entry.lies = value.lies
  }
  if (value.skillsUse !== undefined) {
    if (!isIntegerInRange(value.skillsUse, 0, SKILLS_USE_MAX)) {
      return rejected(`${where}: применение навыков должно быть от 0 до ${SKILLS_USE_MAX}`)
    }
    entry.skillsUse = value.skillsUse
  }
  return parsed(normalizeDayEntry(entry))
}

function withOptional<K extends 'selfHarm' | 'lies' | 'skillsUse'>(
  entry: DayEntry,
  key: K,
  value: DayEntry[K],
): DayEntry {
  const next = { ...entry }
  if (value === undefined) delete next[key]
  else next[key] = value
  return next
}

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
