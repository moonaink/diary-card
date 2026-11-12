import { addDays, parseIsoDate, type IsoDate } from '../card/dates.ts'

const dayTitle = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const dayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const shortDayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** «Четверг, 12 ноября», with the year when it is not the year of `today`. */
export function formatDayTitle(date: IsoDate, today: IsoDate): string {
  const title = capitalize(dayTitle.format(parseIsoDate(date)))
  return date.slice(0, 4) === today.slice(0, 4) ? title : `${title} ${date.slice(0, 4)}`
}

/** «9–15 ноября 2026» or «30 ноября – 6 декабря 2026». */
export function formatWeekTitle(weekStart: IsoDate): string {
  const end = addDays(weekStart, 6)
  const startDate = parseIsoDate(weekStart)
  const endDate = parseIsoDate(end)
  const year = end.slice(0, 4)
  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startDate.getDate()}–${dayMonth.format(endDate)} ${year}`
  }
  return `${dayMonth.format(startDate)} – ${dayMonth.format(endDate)} ${year}`
}

export function formatShortDate(date: IsoDate): string {
  return shortDayMonth.format(parseIsoDate(date))
}
