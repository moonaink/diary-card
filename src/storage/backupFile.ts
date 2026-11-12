import { tryParseDayEntry, isPlainObject, type DayEntry } from '../card/dayEntry.ts'
import { toIsoDate } from '../card/dates.ts'
import { parsed, rejected, type ParseResult } from '../card/parseResult.ts'
import {
  tryParseSettings,
  tryParseWeekHeader,
  type DiarySettings,
  type WeekHeader,
} from '../card/weekCard.ts'

export const BACKUP_FORMAT = 'dbt-diary-card-backup'
/** Raised when the file shape changes. A file of a newer version than the app knows is refused. */
export const BACKUP_VERSION = 1

/** Everything the app stores: what a backup file carries and what a restore replaces. */
export interface DiaryContents {
  settings: DiarySettings
  days: DayEntry[]
  weeks: WeekHeader[]
}

export function buildBackupFile(contents: DiaryContents, exportedAt: Date): string {
  return JSON.stringify(
    {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: exportedAt.toISOString(),
      settings: contents.settings,
      days: contents.days,
      weeks: contents.weeks,
    },
    null,
    2,
  )
}

export function backupFileName(exportedAt: Date): string {
  return `diary-card-backup-${toIsoDate(exportedAt)}.json`
}

/**
 * Reads a backup file completely before anything is restored. Any invalid record rejects the whole file,
 * so a restore never applies half of a file.
 */
export function tryParseBackupFile(text: string): ParseResult<DiaryContents> {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return rejected('файл не является резервной копией: это не JSON')
  }
  if (!isPlainObject(data) || data.format !== BACKUP_FORMAT) {
    return rejected('файл не является резервной копией дневниковой карточки')
  }
  if (typeof data.version !== 'number' || !Number.isInteger(data.version) || data.version < 1) {
    return rejected('в файле неверная версия формата')
  }
  if (data.version > BACKUP_VERSION) {
    return rejected('копия сделана более новой версией приложения; обновите приложение')
  }

  const settings = tryParseSettings(data.settings)
  if (!settings.ok) return settings

  if (!Array.isArray(data.days)) return rejected('в файле нет списка дней')
  const days: DayEntry[] = []
  const seenDates = new Set<string>()
  for (const raw of data.days) {
    const day = tryParseDayEntry(raw)
    if (!day.ok) return day
    if (seenDates.has(day.value.date)) return rejected(`день ${day.value.date} записан дважды`)
    seenDates.add(day.value.date)
    days.push(day.value)
  }

  if (!Array.isArray(data.weeks)) return rejected('в файле нет списка недель')
  const weeks: WeekHeader[] = []
  const seenWeeks = new Set<string>()
  for (const raw of data.weeks) {
    const week = tryParseWeekHeader(raw)
    if (!week.ok) return week
    if (seenWeeks.has(week.value.weekStart)) {
      return rejected(`неделя ${week.value.weekStart} записана дважды`)
    }
    seenWeeks.add(week.value.weekStart)
    weeks.push(week.value)
  }

  return parsed({ settings: settings.value, days, weeks })
}
