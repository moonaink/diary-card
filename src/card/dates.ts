/** A calendar date in the phone's local time zone, written as `YYYY-MM-DD`. Sorts correctly as a string. */
export type IsoDate = string

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Short weekday labels of the paper card, indexed by `Date.getDay()`: 0 is Sunday. */
const WEEKDAY_SHORT_LABELS = ['Вс.', 'Пн.', 'Вт.', 'Ср.', 'Чт.', 'Пт.', 'Сб.'] as const

/**
 * The weekday a card week starts on, as `Date.getDay()` counts: Wednesday. The therapy session is on
 * Wednesday, so one card covers exactly the days since the previous session, Wednesday to Tuesday.
 */
const CARD_WEEK_START_DAY = 3

const pad = (n: number) => String(n).padStart(2, '0')

export function toIsoDate(date: Date): IsoDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Local midnight of the date. */
export function parseIsoDate(iso: IsoDate): Date {
  const match = ISO_DATE.exec(iso)
  if (!match) throw new Error(`Not an ISO date: ${iso}`)
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/** True for a real calendar date in `YYYY-MM-DD` form (rejects `2026-02-30`). */
export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false
  return toIsoDate(parseIsoDate(value)) === value
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  // setDate on a local date keeps calendar days across daylight-saving changes, unlike adding milliseconds.
  const date = parseIsoDate(iso)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

/** First day of the card week that contains the date: the card's week runs Wednesday to Tuesday. */
export function weekStartOf(iso: IsoDate): IsoDate {
  const daysSinceStart = (parseIsoDate(iso).getDay() - CARD_WEEK_START_DAY + 7) % 7
  return addDays(iso, -daysSinceStart)
}

/** True when the date is the first day of a card week (a Wednesday). */
export function isWeekStart(iso: IsoDate): boolean {
  return weekStartOf(iso) === iso
}

export function weekDates(weekStart: IsoDate): IsoDate[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

/** «Ср.» for a Wednesday: the weekday label of the date as the paper card prints it. */
export function weekdayShortLabel(iso: IsoDate): string {
  return WEEKDAY_SHORT_LABELS[parseIsoDate(iso).getDay()]
}

/** True when the date lies in a week that ended before the week of `today`. */
export function isInPastWeek(iso: IsoDate, today: IsoDate): boolean {
  return weekStartOf(iso) < weekStartOf(today)
}
