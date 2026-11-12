import { SUBSTANCE_CATEGORY_KEYS, type SubstanceCategory } from './cardColumns.ts'
import { isIsoDate, weekDates, weekStartOf, type IsoDate } from './dates.ts'
import { isDayEntryEmpty, isPlainObject, type DayEntry } from './dayEntry.ts'
import { parsed, rejected, type ParseResult } from './parseResult.ts'

/** Values of the card header that are entered per week. Absent values print as blanks. */
export interface WeekHeader {
  /** Monday of the week; the key of the header. */
  weekStart: IsoDate
  /** «Вы заполняете дневник во время сессии?» */
  duringSession?: boolean
  /** «Дата начала заполнения», entered by hand. */
  startDate?: IsoDate
}

/** Values entered once for the whole app. */
export interface DiarySettings {
  /** «Имя» in the card header. */
  name: string
}

export const DEFAULT_SETTINGS: DiarySettings = { name: '' }

export type FillFrequency = 'daily' | 'fourToSix' | 'twoToThree' | 'once'

/** Options of «Как часто Вы заполняете эту сторону в неделю?» in the order the paper card prints them. */
export const FILL_FREQUENCY_OPTIONS: readonly { value: FillFrequency; label: string }[] = [
  { value: 'daily', label: 'Ежедневно' },
  { value: 'twoToThree', label: '2-3 р.' },
  { value: 'fourToSix', label: '4-6 р.' },
  { value: 'once', label: 'Один' },
]

/** Derived from the number of filled days; null when no day of the week is filled. */
export function resolveFillFrequency(filledDays: number): FillFrequency | null {
  if (filledDays >= 7) return 'daily'
  if (filledDays >= 4) return 'fourToSix'
  if (filledDays >= 2) return 'twoToThree'
  if (filledDays === 1) return 'once'
  return null
}

/** Everything the PDF of one week needs. Built from stored records each time, never stored itself. */
export interface WeekCard {
  weekStart: IsoDate
  /** Monday to Sunday; null for a day without an entry. */
  days: (DayEntry | null)[]
  header: WeekHeader
  name: string
  fillFrequency: FillFrequency | null
}

export function buildWeekCard(
  weekStart: IsoDate,
  entries: readonly DayEntry[],
  header: WeekHeader | undefined,
  settings: DiarySettings,
): WeekCard {
  if (weekStartOf(weekStart) !== weekStart) throw new Error(`${weekStart} is not a Monday`)
  const byDate = new Map(entries.map((entry) => [entry.date, entry]))
  const days = weekDates(weekStart).map((date) => {
    const entry = byDate.get(date)
    return entry && !isDayEntryEmpty(entry) ? entry : null
  })
  return {
    weekStart,
    days,
    header: header ?? { weekStart },
    name: settings.name,
    fillFrequency: resolveFillFrequency(days.filter((day) => day !== null).length),
  }
}

/** Distinct substance names entered before in a category, most frequently used first. */
export function collectSubstanceNames(
  entries: readonly DayEntry[],
  category: SubstanceCategory,
): string[] {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    for (const row of entry.substances[category] ?? []) {
      const name = row.name.trim()
      if (name !== '') counts.set(name, (counts.get(name) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ru'))
    .map(([name]) => name)
}

export function collectAllSubstanceNames(
  entries: readonly DayEntry[],
): Record<SubstanceCategory, string[]> {
  return Object.fromEntries(
    SUBSTANCE_CATEGORY_KEYS.map((category) => [category, collectSubstanceNames(entries, category)]),
  ) as Record<SubstanceCategory, string[]>
}

export function tryParseWeekHeader(value: unknown): ParseResult<WeekHeader> {
  if (!isPlainObject(value)) return rejected('шапка недели не является объектом')
  if (!isIsoDate(value.weekStart) || weekStartOf(value.weekStart) !== value.weekStart) {
    return rejected(`неверное начало недели: ${String(value.weekStart)}`)
  }
  const header: WeekHeader = { weekStart: value.weekStart }
  if (value.duringSession !== undefined) {
    if (typeof value.duringSession !== 'boolean') {
      return rejected(`неделя ${value.weekStart}: «во время сессии» не да/нет`)
    }
    header.duringSession = value.duringSession
  }
  if (value.startDate !== undefined) {
    if (!isIsoDate(value.startDate)) {
      return rejected(`неделя ${value.weekStart}: неверная дата начала заполнения`)
    }
    header.startDate = value.startDate
  }
  return parsed(header)
}

export function tryParseSettings(value: unknown): ParseResult<DiarySettings> {
  if (!isPlainObject(value) || typeof value.name !== 'string') {
    return rejected('настройки не содержат имени')
  }
  return parsed({ name: value.name })
}
