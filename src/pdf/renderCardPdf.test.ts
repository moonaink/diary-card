import { readFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { applyRating, emptyDayEntry } from '../card/dayEntry.ts'
import { buildWeekCard } from '../card/weekCard.ts'
import { renderCardPdf } from './renderCardPdf.ts'

const font = (file: string) =>
  new Uint8Array(
    readFileSync(
      new URL(`../../node_modules/@expo-google-fonts/pt-serif/${file}`, import.meta.url),
    ),
  )

describe('renderCardPdf', () => {
  it('renders a one-page landscape A4 PDF with Russian text', async () => {
    const card = buildWeekCard(
      '2026-11-11',
      [applyRating(emptyDayEntry('2026-11-11'), 'anxiety', 4)],
      { weekStart: '2026-11-11', duringSession: false },
      { name: 'Анна' },
    )

    const bytes = await renderCardPdf(card, {
      regular: font('400Regular/PTSerif_400Regular.ttf'),
      bold: font('700Bold/PTSerif_700Bold.ttf'),
    })

    const document = await PDFDocument.load(bytes)
    expect(document.getPageCount()).toBe(1)
    const { width, height } = document.getPage(0).getSize()
    expect(Math.round(width)).toBe(842)
    expect(Math.round(height)).toBe(595)
  })
})
