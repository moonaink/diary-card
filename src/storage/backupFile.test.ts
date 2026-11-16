import { describe, expect, it } from 'vitest'
import { applyRating, emptyDayEntry } from '../card/dayEntry.ts'
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  buildBackupFile,
  tryParseBackupFile,
  type DiaryContents,
} from './backupFile.ts'

const contents: DiaryContents = {
  settings: { name: 'Анна' },
  days: [
    applyRating(emptyDayEntry('2026-11-09'), 'anxiety', 4),
    {
      ...emptyDayEntry('2026-11-10'),
      substances: { alcohol: [{ name: 'Вино', quantity: '1' }] },
      selfHarm: false,
    },
  ],
  weeks: [{ weekStart: '2026-11-11', duringSession: false, startDate: '2026-11-11' }],
}

const fileWith = (changes: Record<string, unknown>) =>
  JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    settings: { name: '' },
    days: [],
    weeks: [],
    ...changes,
  })

describe('tryParseBackupFile', () => {
  it('returns the same contents when the file was built by buildBackupFile', () => {
    const file = buildBackupFile(contents, new Date('2026-11-12T10:00:00Z'))

    expect(tryParseBackupFile(file)).toEqual({ ok: true, value: contents })
  })

  it('rejects text that is not JSON', () => {
    expect(tryParseBackupFile('not json').ok).toBe(false)
  })

  it('rejects JSON of another format', () => {
    expect(tryParseBackupFile(JSON.stringify({ format: 'other', version: 1 })).ok).toBe(false)
  })

  it('restores days and name of a version 1 file without its Monday week headers', () => {
    const day = { date: '2026-11-10', ratings: { anger: 1 }, substances: {} }
    const mondayWeek = { weekStart: '2026-11-09', duringSession: true, startDate: '2026-11-09' }

    const result = tryParseBackupFile(
      fileWith({ version: 1, settings: { name: 'Анна' }, days: [day], weeks: [mondayWeek] }),
    )

    expect(result).toEqual({
      ok: true,
      value: { settings: { name: 'Анна' }, days: [day], weeks: [] },
    })
  })

  it('rejects a current-version file with a week header that does not start on a Wednesday', () => {
    const weeks = [{ weekStart: '2026-11-09', duringSession: true }]

    expect(tryParseBackupFile(fileWith({ weeks })).ok).toBe(false)
  })

  it('rejects a file written by a newer version of the app', () => {
    const result = tryParseBackupFile(fileWith({ version: BACKUP_VERSION + 1 }))

    expect(result).toEqual({
      ok: false,
      reason: 'копия сделана более новой версией приложения; обновите приложение',
    })
  })

  it('rejects the whole file when one day is invalid', () => {
    const days = [contents.days[0], { date: '2026-11-10', ratings: { anger: 9 }, substances: {} }]

    expect(tryParseBackupFile(fileWith({ days })).ok).toBe(false)
  })

  it('rejects a file with the same date twice', () => {
    const day = { date: '2026-11-10', ratings: { anger: 1 }, substances: {} }

    expect(tryParseBackupFile(fileWith({ days: [day, day] }))).toEqual({
      ok: false,
      reason: 'день 2026-11-10 записан дважды',
    })
  })
})
