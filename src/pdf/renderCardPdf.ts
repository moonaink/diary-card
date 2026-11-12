import fontkit from '@pdf-lib/fontkit'
import { PDFDocument, degrees, rgb } from 'pdf-lib'
import type { WeekCard } from '../card/weekCard.ts'
import { buildCardLayout, type PdfFont } from './cardLayout.ts'

/** TrueType files with Cyrillic glyphs; the standard PDF fonts cannot print Russian text. */
export interface PdfFonts {
  regular: Uint8Array
  bold: Uint8Array
}

/** Draws the card of one week into a one-page PDF and returns the file bytes. */
export async function renderCardPdf(card: WeekCard, fonts: PdfFonts): Promise<Uint8Array> {
  const document = await PDFDocument.create()
  document.registerFontkit(fontkit)
  // Fonts are embedded whole: fontkit subsetting is known to corrupt glyphs of some TrueType fonts.
  const embedded: Record<PdfFont, Awaited<ReturnType<PDFDocument['embedFont']>>> = {
    regular: await document.embedFont(fonts.regular),
    bold: await document.embedFont(fonts.bold),
  }
  const layout = buildCardLayout(card, (text, size, font) =>
    embedded[font].widthOfTextAtSize(text, size),
  )
  const page = document.addPage([layout.width, layout.height])
  const black = rgb(0, 0, 0)
  for (const op of layout.ops) {
    if (op.kind === 'line') {
      page.drawLine({
        start: { x: op.x1, y: layout.height - op.y1 },
        end: { x: op.x2, y: layout.height - op.y2 },
        thickness: op.thickness,
        color: black,
      })
    } else {
      page.drawText(op.text, {
        x: op.x,
        y: layout.height - op.y,
        size: op.size,
        font: embedded[op.font],
        color: black,
        rotate: op.rotated ? degrees(90) : undefined,
      })
    }
  }
  document.setTitle(`Дневниковая карточка, неделя с ${card.weekStart}`)
  document.setCreator('Дневниковая карточка')
  return document.save()
}

export function cardPdfFileName(card: WeekCard): string {
  return `diary-card-${card.weekStart}.pdf`
}
