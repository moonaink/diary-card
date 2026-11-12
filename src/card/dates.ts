/** A calendar date in the phone's local time zone, written as `YYYY-MM-DD`. Sorts correctly as a string. */
export type IsoDate = string

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export const WEEKDAY_SHORT_LABELS = ['Пн.', 'Вт.', 'Ср.', 'Чт.', 'Пт.', 'Сб.', 'Вс.'] as const

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

/** Monday of the week that contains the date: the card's week runs Monday to Sunday. */
export function weekStartOf(iso: IsoDate): IsoDate {
  const mondayBased = (parseIsoDate(iso).getDay() + 6) % 7
  return addDays(iso, -mondayBased)
}

export function weekDates(weekStart: IsoDate): IsoDate[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

/** Index of the date inside its Monday-based week: 0 for Monday, 6 for Sunday. */
export function weekdayIndex(iso: IsoDate): number {
  return (parseIsoDate(iso).getDay() + 6) % 7
}

/** True when the date lies in a week that ended before the week of `today`. */
export function isInPastWeek(iso: IsoDate, today: IsoDate): boolean {
  return weekStartOf(iso) < weekStartOf(today)
}
