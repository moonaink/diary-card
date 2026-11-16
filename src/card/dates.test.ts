import { describe, expect, it } from 'vitest'
import {
  addDays,
  isInPastWeek,
  isIsoDate,
  isWeekStart,
  weekDates,
  weekStartOf,
  weekdayShortLabel,
} from './dates.ts'

describe('weekStartOf', () => {
  it('returns the Wednesday before when the date is a Tuesday', () => {
    expect(weekStartOf('2026-11-17')).toBe('2026-11-11')
  })

  it('returns the same date when the date is a Wednesday', () => {
    expect(weekStartOf('2026-11-11')).toBe('2026-11-11')
  })

  it('returns the Wednesday before when the date is a Monday', () => {
    expect(weekStartOf('2026-11-16')).toBe('2026-11-11')
  })

  it('crosses the month boundary when the week starts in the previous month', () => {
    expect(weekStartOf('2026-12-01')).toBe('2026-11-25')
  })
})

describe('isWeekStart', () => {
  it('is true for a Wednesday and false for a Monday', () => {
    expect(isWeekStart('2026-11-11')).toBe(true)
    expect(isWeekStart('2026-11-09')).toBe(false)
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
  it('lists Wednesday to Tuesday', () => {
    expect(weekDates('2026-11-11')).toEqual([
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
      '2026-11-16',
      '2026-11-17',
    ])
  })
})

describe('weekdayShortLabel', () => {
  it('returns the label of the weekday of the date', () => {
    expect(weekdayShortLabel('2026-11-11')).toBe('Ср.')
    expect(weekdayShortLabel('2026-11-15')).toBe('Вс.')
    expect(weekdayShortLabel('2026-11-16')).toBe('Пн.')
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
    expect(isInPastWeek('2026-11-11', '2026-11-17')).toBe(false)
  })

  it('is true for the Tuesday right before the current week', () => {
    expect(isInPastWeek('2026-11-17', '2026-11-18')).toBe(true)
  })
})
