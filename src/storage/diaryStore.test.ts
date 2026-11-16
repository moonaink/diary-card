import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { addSubstance, applyRating, emptyDayEntry } from '../card/dayEntry.ts'
import { openDB } from 'idb'
import { DIARY_DB_NAME, DiaryStore } from './diaryStore.ts'

let store: DiaryStore

const deleteDiaryDb = () =>
  new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DIARY_DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })

beforeEach(async () => {
  store = await DiaryStore.open()
})

afterEach(async () => {
  store.close()
  // Every test starts from an empty database.
  await deleteDiaryDb()
})

describe('DiaryStore.saveDay', () => {
  it('stores the normalized day without blank substance rows', async () => {
    const entry = addSubstance(applyRating(emptyDayEntry('2026-11-12'), 'fear', 2), 'alcohol')

    await store.saveDay(entry)

    expect(await store.loadDay('2026-11-12')).toEqual({
      date: '2026-11-12',
      ratings: { fear: 2 },
      substances: {},
    })
  })

  it('deletes the stored day when every value is cleared', async () => {
    await store.saveDay(applyRating(emptyDayEntry('2026-11-12'), 'fear', 2))

    await store.saveDay(emptyDayEntry('2026-11-12'))

    expect(await store.loadDay('2026-11-12')).toBeUndefined()
  })

  it('keeps the last value when saves follow each other without waiting', async () => {
    const day = emptyDayEntry('2026-11-12')

    await Promise.all([
      store.saveDay(applyRating(day, 'fear', 1)),
      store.saveDay(applyRating(day, 'fear', 4)),
    ])

    expect((await store.loadDay('2026-11-12'))?.ratings.fear).toBe(4)
  })
})

describe('DiaryStore.loadDaysBetween', () => {
  it('returns only the days inside the range, in date order', async () => {
    for (const date of ['2026-11-15', '2026-11-08', '2026-11-09', '2026-11-16']) {
      await store.saveDay(applyRating(emptyDayEntry(date), 'anger', 1))
    }

    const days = await store.loadDaysBetween('2026-11-09', '2026-11-15')

    expect(days.map((day) => day.date)).toEqual(['2026-11-09', '2026-11-15'])
  })
})

describe('DiaryStore.saveWeekHeader', () => {
  it('deletes the header when both values are cleared', async () => {
    await store.saveWeekHeader({ weekStart: '2026-11-11', duringSession: true })

    await store.saveWeekHeader({ weekStart: '2026-11-11' })

    expect(await store.loadWeekHeader('2026-11-11')).toBeUndefined()
  })
})

describe('DiaryStore.open', () => {
  it('drops the Monday week headers of a version 1 database and keeps its days', async () => {
    store.close()
    await deleteDiaryDb()
    const day = { date: '2026-11-10', ratings: { anger: 1 }, substances: {} }
    const versionOne = await openDB(DIARY_DB_NAME, 1, {
      upgrade(database) {
        database.createObjectStore('days', { keyPath: 'date' })
        database.createObjectStore('weeks', { keyPath: 'weekStart' })
        database.createObjectStore('settings')
      },
    })
    await versionOne.put('days', day)
    await versionOne.put('weeks', { weekStart: '2026-11-09', duringSession: true })
    versionOne.close()

    store = await DiaryStore.open()

    const contents = await store.exportAll()
    expect(contents.weeks).toEqual([])
    expect(contents.days).toEqual([day])
  })
})

describe('DiaryStore.replaceAll', () => {
  it('replaces every record, so days absent from the contents disappear', async () => {
    await store.saveDay(applyRating(emptyDayEntry('2026-11-01'), 'anger', 1))
    await store.saveSettings({ name: 'Старое' })
    const contents = {
      settings: { name: 'Новое' },
      days: [applyRating(emptyDayEntry('2026-11-10'), 'sadness', 3)],
      weeks: [{ weekStart: '2026-11-11', startDate: '2026-11-11' }],
    }

    await store.replaceAll(contents)

    expect(await store.exportAll()).toEqual(contents)
  })
})
