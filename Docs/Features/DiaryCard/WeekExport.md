# Week Export

## Summary

Status: Active

The «Неделя» tab: which days of the week are filled, the header of the card, and «Скачать PDF».

## Scenario / responsibility

Before a session the user opens the week, marks whether the card is filled in during the session, enters the start
date, and downloads the PDF to save it to Files or send it.

## Systems used

- [CardModel.md](../../Systems/CardModel.md) — `buildWeekCard()` and the fill frequency.
- [DiaryStorage.md](../../Systems/DiaryStorage.md) — the week's days, the week header and the name.
- [CardPdf.md](../../Systems/CardPdf.md) — the PDF.

## Runtime flow

1. `WeekScreen` loads the days of the week, its header and the settings, and builds the `WeekCard`. The screen is
   recreated for every week, so nothing of the previous week stays on it.
2. A change of «Вы заполняете дневник во время сессии?» or of the start date is shown at once and saved with
   `DiaryStore.saveWeekHeader`.
3. «Скачать PDF» re-reads the week, renders the PDF ([CardPdf.md](../../Systems/CardPdf.md) `## Runtime flow`) and
   calls `deliverFile()` from `src/ui/deliverFile.ts`.
4. `deliverFile()` opens the share sheet on an iPhone or iPad (`isAppleMobile()`) and downloads the file everywhere
   else, including touch-screen computers, whose share windows cannot save a file. When Safari refuses the
   share sheet because the tap has expired during rendering, the screen shows «PDF готов — открыть «Поделиться»»,
   whose tap opens the share sheet directly.

## Feature-specific rules

- A filled day is marked with a filled heart and «заполнен»; future days are disabled and show «—».
- «Как часто вы заполняете эту сторону в неделю?» is shown, not entered; it follows the filled days.
- The name comes from the settings; without a name the screen says where to enter it.
- Tapping the chosen «Да» or «Нет» again clears it.
- The header of a past week changes without the past-week confirmation.

## Edge cases

- The share sheet is closed without choosing anything — nothing is reported, the button can be pressed again.
- The PDF cannot be created (fonts missing from the cache) — a red notice with the reason.

## Manual test checklist

1. Open «Неделя» → the current week with «эта неделя»; filled days show a filled heart and «заполнен»; future days
   show «—» and do not open.
2. Fill one more day on «День», come back → «Как часто…» changes accordingly (for example from «Один» to «2-3 р.»).
3. Choose «Нет» and enter a start date, switch to «Настройки» and back → both are kept.
4. Tap «Скачать PDF» → the share sheet opens with `diary-card-<Monday>.pdf`; save it to Files and open it → a
   landscape table like the paper card: values in the cells of their days, X on «Нет», on the fill frequency, the
   start date in the blanks, the «Применение навыков*» legend under the table.
5. Go one week back with «‹» and download its PDF → the PDF shows that week's dates and values.
