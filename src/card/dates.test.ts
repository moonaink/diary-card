import { describe, expect, it } from 'vitest'
import { addDays, isInPastWeek, isIsoDate, weekDates, weekStartOf, weekdayIndex } from './dates.ts'

describe('weekStartOf', () => {
  it('returns the Monday before when the date is a Sunday', () => {
    expect(weekStartOf('2026-11-15')).toBe('2026-11-09')
  })

  it('returns the same date when the date is a Monday', () => {
    expect(weekStartOf('2026-11-09')).toBe('2026-11-09')
  })

  it('crosses the month boundary when the week starts in the previous month', () => {
    expect(weekStartOf('2026-12-02')).toBe('2026-11-30')
  })
})

describe('addDays', () => {
  it('moves across the end of a leap February', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2028-02-29', 1)).toBe('2028-03-01')
  })

  it('keeps calendar days across the end of daylight-saving time', () => {
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26')
  })
})

describe('weekDates', () => {
  it('lists Monday to Sunday', () => {
    expect(weekDates('2026-11-09')).toEqual([
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
    ])
  })
})

describe('weekdayIndex', () => {
  it('returns 0 for Monday and 6 for Sunday', () => {
    expect(weekdayIndex('2026-11-09')).toBe(0)
    expect(weekdayIndex('2026-11-15')).toBe(6)
  })
})

describe('isIsoDate', () => {
  it('rejects a date that does not exist in the calendar', () => {
    expect(isIsoDate('2026-02-30')).toBe(false)
  })

  it('rejects a date in another format', () => {
    expect(isIsoDate('12.11.2026')).toBe(false)
  })

  it('accepts a real date', () => {
    expect(isIsoDate('2026-11-12')).toBe(true)
  })
})

describe('isInPastWeek', () => {
  it('is false for an earlier day of the current week', () => {
    expect(isInPastWeek('2026-11-09', '2026-11-12')).toBe(false)
  })

  it('is true for the Sunday right before the current week', () => {
    expect(isInPastWeek('2026-11-08', '2026-11-09')).toBe(true)
  })
})
