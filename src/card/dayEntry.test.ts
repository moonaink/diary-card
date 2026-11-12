import { describe, expect, it } from 'vitest'
import {
  addSubstance,
  applyLies,
  applyRating,
  applySubstance,
  emptyDayEntry,
  isDayEntryEmpty,
  normalizeDayEntry,
  removeSubstance,
  tryParseDayEntry,
} from './dayEntry.ts'

describe('isDayEntryEmpty', () => {
  it('is true for a new entry', () => {
    expect(isDayEntryEmpty(emptyDayEntry('2026-11-12'))).toBe(true)
  })

  it('is false when one rating is 0, because 0 is a filled cell', () => {
    const entry = applyRating(emptyDayEntry('2026-11-12'), 'anger', 0)

    expect(isDayEntryEmpty(entry)).toBe(false)
  })

  it('is true when the only substance row is blank', () => {
    const entry = addSubstance(emptyDayEntry('2026-11-12'), 'alcohol')

    expect(isDayEntryEmpty(entry)).toBe(true)
  })
})

describe('applyRating', () => {
  it('removes the rating when the value is undefined', () => {
    const rated = applyRating(emptyDayEntry('2026-11-12'), 'fear', 3)

    const cleared = applyRating(rated, 'fear', undefined)

    expect(cleared.ratings).toEqual({})
  })

  it('does not change the original entry', () => {
    const original = emptyDayEntry('2026-11-12')

    applyRating(original, 'fear', 3)

    expect(original.ratings).toEqual({})
  })

  it('throws when the value is outside 0-5', () => {
    expect(() => applyRating(emptyDayEntry('2026-11-12'), 'fear', 6)).toThrow(RangeError)
  })
})

describe('applyLies', () => {
  it('throws when the count is negative', () => {
    expect(() => applyLies(emptyDayEntry('2026-11-12'), -1)).toThrow(RangeError)
  })
})

describe('substance rows', () => {
  it('edits and removes the row at the given index only', () => {
    let entry = emptyDayEntry('2026-11-12')
    entry = addSubstance(entry, 'prescribed')
    entry = addSubstance(entry, 'prescribed')
    entry = applySubstance(entry, 'prescribed', 1, { name: 'Сертралин', quantity: '50 мг' })

    entry = removeSubstance(entry, 'prescribed', 0)

    expect(entry.substances.prescribed).toEqual([{ name: 'Сертралин', quantity: '50 мг' }])
  })
})

describe('normalizeDayEntry', () => {
  it('trims substance rows and drops blank rows and empty categories', () => {
    const entry = {
      ...emptyDayEntry('2026-11-12'),
      substances: {
        alcohol: [
          { name: '  Вино ', quantity: ' 2 бокала ' },
          { name: ' ', quantity: '' },
        ],
        drugs: [{ name: '', quantity: '' }],
      },
    }

    const normalized = normalizeDayEntry(entry)

    expect(normalized.substances).toEqual({ alcohol: [{ name: 'Вино', quantity: '2 бокала' }] })
  })
})

describe('tryParseDayEntry', () => {
  it('accepts a full valid entry', () => {
    const raw = {
      date: '2026-11-12',
      ratings: { urgeSuicide: 0, anxiety: 5 },
      substances: { otc: [{ name: 'Ибупрофен', quantity: '1 таб' }] },
      selfHarm: false,
      lies: 2,
      skillsUse: 7,
    }

    const result = tryParseDayEntry(raw)

    expect(result).toEqual({ ok: true, value: raw })
  })

  it('rejects a rating above 5 and names the column in Russian', () => {
    const result = tryParseDayEntry({ date: '2026-11-12', ratings: { anger: 6 }, substances: {} })

    expect(result).toEqual({
      ok: false,
      reason: 'день 2026-11-12: оценка «Эмоции: Гнев» должна быть от 0 до 5',
    })
  })

  it('rejects an unknown rating key', () => {
    const result = tryParseDayEntry({ date: '2026-11-12', ratings: { boredom: 1 }, substances: {} })

    expect(result).toEqual({ ok: false, reason: 'день 2026-11-12: неизвестная оценка boredom' })
  })

  it('rejects skills use above 7', () => {
    const result = tryParseDayEntry({
      date: '2026-11-12',
      ratings: {},
      substances: {},
      skillsUse: 8,
    })

    expect(result.ok).toBe(false)
  })

  it('rejects a date that does not exist', () => {
    const result = tryParseDayEntry({ date: '2026-02-30', ratings: {}, substances: {} })

    expect(result.ok).toBe(false)
  })
})
