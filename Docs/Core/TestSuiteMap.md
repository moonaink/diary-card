# Test Suite Map

Router over the test areas. Which suites protect which contracts is in the test area document of each area; how
tests are written is in [TestingRules.md](TestingRules.md).

| Area | Document | Test folders | Canonical documents |
| --- | --- | --- | --- |
| Card model | [CardModel.md](../Tests/CardModel.md) | `src/card/` | [CardModel.md](../Systems/CardModel.md) |
| Storage | [Storage.md](../Tests/Storage.md) | `src/storage/` | [DiaryStorage.md](../Systems/DiaryStorage.md) |
| PDF | [CardPdf.md](../Tests/CardPdf.md) | `src/pdf/` | [CardPdf.md](../Systems/CardPdf.md) |
| UI | [Ui.md](../Tests/Ui.md) | `src/ui/` | [WeekExport.md](../Features/DiaryCard/WeekExport.md) |

## Commands

- `npm test` — every suite once.
- `npx vitest run src/card/weekCard.test.ts` — one file or folder.

## Maintenance

- A new suite is an entry in the test area document of its area.
- A new area is a new document in `Docs/Tests/` plus a row in the table above.
- A single new test inside an existing suite changes nothing here.
