import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { isDayEntryEmpty, normalizeDayEntry, type DayEntry } from '../card/dayEntry.ts'
import type { IsoDate } from '../card/dates.ts'
import { DEFAULT_SETTINGS, type DiarySettings, type WeekHeader } from '../card/weekCard.ts'
import type { DiaryContents } from './backupFile.ts'

export const DIARY_DB_NAME = 'diary-card'
/** Raised with every change of object stores or record shape; `upgrade` then migrates older data. */
const DIARY_DB_VERSION = 1
const SETTINGS_KEY = 'settings'

interface DiaryDb extends DBSchema {
  days: { key: IsoDate; value: DayEntry }
  weeks: { key: IsoDate; value: WeekHeader }
  settings: { key: string; value: DiarySettings }
}

/**
 * The only owner of the diary records on the device. Everything else reads and changes them through this
 * class, so the stored form (normalized days, no empty days) is enforced in one place.
 */
export class DiaryStore {
  private readonly db: IDBPDatabase<DiaryDb>

  private constructor(db: IDBPDatabase<DiaryDb>) {
    this.db = db
  }

  static async open(): Promise<DiaryStore> {
    const db = await openDB<DiaryDb>(DIARY_DB_NAME, DIARY_DB_VERSION, {
      upgrade(database) {
        database.createObjectStore('days', { keyPath: 'date' })
        database.createObjectStore('weeks', { keyPath: 'weekStart' })
        database.createObjectStore('settings')
      },
    })
    return new DiaryStore(db)
  }

  close(): void {
    this.db.close()
  }

  loadDay(date: IsoDate): Promise<DayEntry | undefined> {
    return this.db.get('days', date)
  }

  /** Days from `from` to `to` inclusive, in date order. */
  loadDaysBetween(from: IsoDate, to: IsoDate): Promise<DayEntry[]> {
    return this.db.getAll('days', IDBKeyRange.bound(from, to))
  }

  loadAllDays(): Promise<DayEntry[]> {
    return this.db.getAll('days')
  }

  /**
   * Stores the day in normalized form, replacing any earlier entry of that date. A day with no values left
   * is deleted, so "not filled" and "filled" stay distinguishable for the fill frequency.
   * Successive calls are applied in call order: IndexedDB runs read-write transactions on the same store
   * in the order they were created.
   */
  async saveDay(entry: DayEntry): Promise<void> {
    const normalized = normalizeDayEntry(entry)
    if (isDayEntryEmpty(normalized)) await this.db.delete('days', normalized.date)
    else await this.db.put('days', normalized)
  }

  loadWeekHeader(weekStart: IsoDate): Promise<WeekHeader | undefined> {
    return this.db.get('weeks', weekStart)
  }

  async saveWeekHeader(header: WeekHeader): Promise<void> {
    if (header.duringSession === undefined && header.startDate === undefined) {
      await this.db.delete('weeks', header.weekStart)
    } else {
      await this.db.put('weeks', header)
    }
  }

  async loadSettings(): Promise<DiarySettings> {
    return (await this.db.get('settings', SETTINGS_KEY)) ?? DEFAULT_SETTINGS
  }

  async saveSettings(settings: DiarySettings): Promise<void> {
    await this.db.put('settings', settings, SETTINGS_KEY)
  }

  async exportAll(): Promise<DiaryContents> {
    const transaction = this.db.transaction(['days', 'weeks', 'settings'], 'readonly')
    const [days, weeks, settings] = await Promise.all([
      transaction.objectStore('days').getAll(),
      transaction.objectStore('weeks').getAll(),
      transaction.objectStore('settings').get(SETTINGS_KEY),
    ])
    await transaction.done
    return { days, weeks, settings: settings ?? DEFAULT_SETTINGS }
  }

  /**
   * Replaces every record with the given contents in one transaction: if any write fails, the transaction
   * aborts and the previous records stay as they were.
   */
  async replaceAll(contents: DiaryContents): Promise<void> {
    const transaction = this.db.transaction(['days', 'weeks', 'settings'], 'readwrite')
    const days = transaction.objectStore('days')
    const weeks = transaction.objectStore('weeks')
    const settings = transaction.objectStore('settings')
    const writes: Promise<unknown>[] = [days.clear(), weeks.clear(), settings.clear()]
    for (const day of contents.days) {
      const normalized = normalizeDayEntry(day)
      if (!isDayEntryEmpty(normalized)) writes.push(days.put(normalized))
    }
    for (const week of contents.weeks) writes.push(weeks.put(week))
    writes.push(settings.put(contents.settings, SETTINGS_KEY))
    await Promise.all([...writes, transaction.done])
  }
}

/**
 * Asks the browser not to clear the app's storage under storage pressure. Returns whether storage is
 * persistent; false or an unsupported API leaves the backup file as the only protection.
 */
export async function isStoragePersistent(): Promise<boolean> {
  try {
    return (await navigator.storage?.persisted?.()) ?? false
  } catch {
    return false
  }
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  try {
    return (await navigator.storage.persisted()) || (await navigator.storage.persist())
  } catch {
    return false
  }
}
