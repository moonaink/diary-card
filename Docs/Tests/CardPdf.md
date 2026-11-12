# Card PDF Tests

## Summary

Status: Active

Suites of the PDF of a week. Router: [TestSuiteMap.md](../Core/TestSuiteMap.md).

## Suites

### Card layout

Files:

- `src/pdf/cardLayout.test.ts`

Contract: every column title of the card is printed, a value lands in the row of its weekday and the column of its
field, the derived fill frequency and the start date are written into the header, the whole legend is printed, a
quantity stays on the line of its name, a long name is cut, and nothing leaves the page.

Canonical docs:

- [CardPdf.md](../Systems/CardPdf.md)

Not covered (intentionally): how the page looks — checked by eye with the manual checklist of
[WeekExport.md](../Features/DiaryCard/WeekExport.md); the layout tests measure text with an approximate width.

### PDF rendering

Files:

- `src/pdf/renderCardPdf.test.ts`

Contract: with the bundled PT Serif fonts the renderer produces a valid one-page landscape A4 PDF containing Russian
text.

Canonical docs:

- [CardPdf.md](../Systems/CardPdf.md)
