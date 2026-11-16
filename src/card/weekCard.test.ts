import { describe, expect, it } from 'vitest'
import { applyRating, emptyDayEntry, type DayEntry } from './dayEntry.ts'
import {
  buildWeekCard,
  collectSubstanceNames,
  resolveFillFrequency,
  tryParseWeekHeader,
} from './weekCard.ts'

const ratedDay = (date: string): DayEntry => applyRating(emptyDayEntry(date), 'anger', 1)

describe('resolveFillFrequency', () => {
  it.each([
    { days: 7, expected: 'daily' },
    { days: 6, expected: 'fourToSix' },
    { days: 4, expected: 'fourToSix' },
    { days: 3, expected: 'twoToThree' },
    { days: 2, expected: 'twoToThree' },
    { days: 1, expected: 'once' },
    { days: 0, expected: null },
  ])('returns $expected when $days days are filled', ({ days, expected }) => {
    expect(resolveFillFrequency(days)).toBe(expected)
  })
})

describe('buildWeekCard', () => {
  it('places entries on their weekdays and leaves other days null', () => {
    const card = buildWeekCard('2026-11-11', [ratedDay('2026-11-16')], undefined, { name: 'А' })

    expect(card.days.map((day) => day?.date ?? null)).toEqual([
      null,
      null,
      null,
      null,
      null,
      '2026-11-16',
      null,
    ])
  })

  it('ignores entries outside the week and empty entries for the fill frequency', () => {
    const entries = [ratedDay('2026-11-10'), ratedDay('2026-11-12'), emptyDayEntry('2026-11-13')]

    const card = buildWeekCard('2026-11-11', entries, undefined, { name: '' })

    expect(card.fillFrequency).toBe('once')
  })

  it('uses an empty header with the week start when no header is stored', () => {
    const card = buildWeekCard('2026-11-11', [], undefined, { name: '' })

    expect(card.header).toEqual({ weekStart: '2026-11-11' })
  })

  it('throws when the week start is not a Wednesday', () => {
    expect(() => buildWeekCard('2026-11-09', [], undefined, { name: '' })).toThrow()
  })
})

describe('collectSubstanceNames', () => {
  it('returns distinct names, the most used first', () => {
    const day = (date: string, names: string[]): DayEntry => ({
      ...emptyDayEntry(date),
      substances: { prescribed: names.map((name) => ({ name, quantity: '' })) },
    })
    const entries = [
      day('2026-11-09', ['Кветиапин', 'Сертралин']),
      day('2026-11-10', ['Сертралин']),
      day('2026-11-11', [' Сертралин ', '']),
    ]

    expect(collectSubstanceNames(entries, 'prescribed')).toEqual(['Сертралин', 'Кветиапин'])
  })
})

describe('tryParseWeekHeader', () => {
  it('rejects a week start that is not a Wednesday', () => {
    expect(tryParseWeekHeader({ weekStart: '2026-11-09' }).ok).toBe(false)
  })

  it('accepts a header with both values', () => {
    const raw = { weekStart: '2026-11-11', duringSession: true, startDate: '2026-11-11' }

    expect(tryParseWeekHeader(raw)).toEqual({ ok: true, value: raw })
  })
})
