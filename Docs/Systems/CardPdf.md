# Card PDF

## Summary

Status: Active

The PDF of one week in the layout of the front side of the paper card: the header, the daily table and the
«Применение навыков» legend, black and white, on a landscape A4 page, generated on the device.

## Responsibility

- Computes where every line and text of the form goes (layout), without a PDF library.
- Draws the layout into a PDF with fonts that have Cyrillic glyphs.
- Loads the fonts and the PDF code only when the first export starts.

## Source of truth

- `buildCardLayout()` in `src/pdf/cardLayout.ts` is the source of truth for the geometry of the printed form and for
  the wording that only the paper form has (title, header questions). Column titles and the legend come from the card
  model ([CardModel.md](CardModel.md)).
- Page 1 of [DiaryCardForm.pdf](../Overview/DiaryCardForm.pdf), without its bottom weekly block, is the visual
  reference.

## Primary code directory

`src/pdf/`

## Key types and files

- `src/pdf/cardLayout.ts` — `buildCardLayout()`, `CardLayout`, `TextOp`, `LineOp`, `MeasureText`.
- `src/pdf/renderCardPdf.ts` — `renderCardPdf()`, `PdfFonts`, `cardPdfFileName()`.
- `src/pdf/pdfFonts.ts` — `loadPdfFonts()`: PT Serif regular and bold from the `@expo-google-fonts/pt-serif`
  package, bundled by Vite.

## Runtime flow

1. On «Скачать PDF», `WeekScreen` re-reads the week from the store and builds the `WeekCard`, so the PDF never shows
   values older than the stored ones.
2. It imports `src/pdf/renderCardPdf.ts` and `src/pdf/pdfFonts.ts` dynamically; `loadPdfFonts()` fetches the two TTF
   files (from the service worker cache when offline).
3. `renderCardPdf()` embeds the fonts, calls `buildCardLayout()` with a measure function based on the real font
   metrics, and draws every operation; the result is the file bytes.
4. `WeekScreen` wraps the bytes in a file named by `cardPdfFileName()` and hands it to `deliverFile()`
   ([WeekExport.md](../Features/DiaryCard/WeekExport.md)).

## Rules and invariants

- The layout is plain arithmetic in points with y growing downwards; the renderer only flips y. Rotated text runs
  upwards, like the column titles on paper.
- The columns of the table come from the card declarations; the layout keeps no list of its own.
- Text shrinks to fit its cell, down to 4 pt. In the substance cells the quantity and the name of one category share
  one font size per day and one entry per line, so a quantity stays on the line of its name; a single long name
  shrinks only to 5.5 pt and is then cut with «…».
- A blank value prints an empty cell. A chosen header option («Да»/«Нет», the fill frequency) is an X written on its
  blank, as a person would mark the paper form.
- The paper wording is kept as printed on the original, including «Диалектика Поведенческая Терапия».
- Fonts are embedded whole: fontkit subsetting is known to corrupt glyphs of some TrueType fonts. A PDF is about
  230 KB.

## Edge cases

- A week without filled days prints an empty table and no fill frequency mark.
- No start date — the month, year and day blanks stay empty.
- More substance entries in one category than fit at 4 pt (about seven per day) overflow the cell.

## Extension notes

- A new column changes the widths: the narrow column widths are constants in `src/pdf/cardLayout.ts`, the substance
  columns share what remains of the page width. Check the page with a sample PDF after the change.
- The legend text is `SKILLS_USE_SCALE`; changing it changes both the day screen hint and the PDF.

## Related features

- [WeekExport.md](../Features/DiaryCard/WeekExport.md)
