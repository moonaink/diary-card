import { describe, expect, it } from 'vitest'
import { EMOTIONS, SKILLS_USE_SCALE, STATES, URGES } from '../card/cardColumns.ts'
import { applyRating, emptyDayEntry, type DayEntry } from '../card/dayEntry.ts'
import { buildWeekCard } from '../card/weekCard.ts'
import {
  PAGE_HEIGHT,
  PAGE_WIDTH,
  buildCardLayout,
  type MeasureText,
  type TextOp,
} from './cardLayout.ts'

// Width proportional to the number of characters: enough to test placement without a real font.
const measure: MeasureText = (text, size) => text.length * size * 0.5

const texts = (ops: ReturnType<typeof buildCardLayout>['ops']) =>
  ops.filter((op): op is TextOp => op.kind === 'text')

const layoutOf = (days: DayEntry[], header = {}, name = '') =>
  buildCardLayout(
    buildWeekCard('2026-11-09', days, { weekStart: '2026-11-09', ...header }, { name }),
    measure,
  )

describe('buildCardLayout', () => {
  it('prints every rating column title of the card, rotated', () => {
    const rotated = texts(layoutOf([]).ops)
      .filter((op) => op.rotated)
      .map((op) => op.text)
      .join(' ')

    for (const field of [...URGES.fields, ...STATES.fields, ...EMOTIONS.fields]) {
      for (const word of field.label.split(' ')) expect(rotated).toContain(word)
    }
  })

  it('places a rating in the row of its weekday and the column of its field', () => {
    const wednesday = applyRating(emptyDayEntry('2026-11-11'), 'urgeSuicide', 3)

    const ops = texts(layoutOf([wednesday]).ops)

    const value = ops.find((op) => op.text === '3' && op.size === 10)!
    const wednesdayLabel = ops.find((op) => op.text === 'Ср.')!
    const thursdayLabel = ops.find((op) => op.text === 'Чт.')!
    const columnTitle = ops.find((op) => op.rotated && op.text.startsWith('Совершению'))!
    expect(value.y).toBeGreaterThan(wednesdayLabel.y)
    expect(value.y).toBeLessThan(thursdayLabel.y)
    expect(Math.abs(value.x - columnTitle.x)).toBeLessThan(12)
  })

  it('marks the derived fill frequency with X', () => {
    const days = ['2026-11-09', '2026-11-10'].map((d) => applyRating(emptyDayEntry(d), 'anger', 1))

    const ops = texts(layoutOf(days).ops)

    const mark = ops.find((op) => op.text === 'X')!
    const options = ops.filter((op) => ['Ежедневно', '2-3 р.', '4-6 р.', 'Один'].includes(op.text))
    const nearest = options.sort(
      (a, b) => Math.hypot(a.x - mark.x, a.y - mark.y) - Math.hypot(b.x - mark.x, b.y - mark.y),
    )[0]
    expect(nearest.text).toBe('2-3 р.')
  })

  it('writes the start date into the month, year and day blanks', () => {
    const ops = texts(layoutOf([], { startDate: '2026-11-03' }).ops).map((op) => op.text)

    expect(ops).toEqual(expect.arrayContaining(['11', '2026', '03']))
  })

  it('prints the whole skills-use legend', () => {
    const ops = texts(layoutOf([]).ops).map((op) => op.text)

    SKILLS_USE_SCALE.forEach((meaning, value) => {
      expect(ops).toContain(`${value} – ${meaning}`)
    })
  })

  it('keeps each substance quantity on the line of its name', () => {
    const day: DayEntry = {
      ...emptyDayEntry('2026-11-09'),
      substances: {
        prescribed: [
          { name: 'Сертралин', quantity: '50 мг' },
          { name: 'Кветиапин', quantity: '25 мг' },
        ],
      },
    }

    const ops = texts(layoutOf([day]).ops)

    const baselineOf = (text: string) => ops.find((op) => op.text === text)!.y
    expect(baselineOf('50 мг')).toBe(baselineOf('Сертралин'))
    expect(baselineOf('25 мг')).toBe(baselineOf('Кветиапин'))
    expect(baselineOf('25 мг')).toBeGreaterThan(baselineOf('50 мг'))
  })

  it('cuts a name that does not fit its cell with an ellipsis', () => {
    const day: DayEntry = {
      ...emptyDayEntry('2026-11-09'),
      substances: {
        otc: [{ name: 'Очень длинное название лекарства без пробелов', quantity: '1' }],
      },
    }

    const name = texts(layoutOf([day]).ops).find((op) => op.text.startsWith('Очень'))!

    expect(name.text.endsWith('…')).toBe(true)
  })

  it('keeps every line and text start inside the page', () => {
    const full: DayEntry = {
      ...applyRating(emptyDayEntry('2026-11-15'), 'disappointment', 5),
      selfHarm: true,
      lies: 12,
      skillsUse: 7,
    }

    const { ops } = layoutOf([full], { duringSession: true, startDate: '2026-11-09' }, 'Анна')

    for (const op of ops) {
      const points =
        op.kind === 'line'
          ? [
              [op.x1, op.y1],
              [op.x2, op.y2],
            ]
          : [[op.x, op.y]]
      for (const [x, y] of points) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(PAGE_WIDTH)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(PAGE_HEIGHT)
      }
    }
  })
})
