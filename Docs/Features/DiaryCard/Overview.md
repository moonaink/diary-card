# Diary Card

## Summary

Status: Active
Scope: Canonical

The whole user-facing app: the «День» tab with the card of one day, the «Неделя» tab with the week header and the
PDF, and the «Настройки» tab with the name and the backup. Product intent is in
[ProductOverview.md](../../Overview/ProductOverview.md).

## Purpose

Replace the front side of the paper DBT diary card on the iPhone: fill in the day in a few taps, and bring the week
to the session as a PDF that looks like the paper card.

## Systems involved

- [CardModel.md](../../Systems/CardModel.md) — the columns, the day entry, the week card.
- [DiaryStorage.md](../../Systems/DiaryStorage.md) — the records on the phone and the backup file.
- [CardPdf.md](../../Systems/CardPdf.md) — the PDF of a week.
- [OfflineApp.md](../../Systems/OfflineApp.md) — installation and work without internet.

## Feature flow

1. `StoreProvider` opens the store; `DiaryApp` in `src/ui/App.tsx` shows the «День» tab on today, taken from
   `useToday()`.
2. The «День» tab (`DayScreen`) shows the selected day; the arrows move one day back or forward
   ([DailyEntry.md](DailyEntry.md)).
3. The «Неделя» tab (`WeekScreen`) shows the week of the selected day; tapping a day there selects it and switches to
   the «День» tab; the arrows move one week ([WeekExport.md](WeekExport.md)).
4. The «Настройки» tab (`SettingsScreen`) edits the name and saves or restores the backup ([Backup.md](Backup.md)).

## Main rules

- The app opens on today. When it is resumed on a later date, it jumps to the new today.
- Days after today cannot be opened: the forward arrow stops at today, future days of the week are disabled.
- Every change is saved at once; there is no save button.
- A day of a past week changes only after the confirmation «Изменить запись за прошлую неделю?», asked once per opened
  day. The week header of any week changes without confirmation.
- Screens change records only through `DiaryStore`; they hold drafts and view state, not records.

## Subsystem map

| Screen | Code | Systems |
| --- | --- | --- |
| «День» | `src/ui/DayScreen.tsx`, `src/ui/useDayDraft.ts`, `src/ui/SubstanceEditor.tsx` | Card model, storage |
| «Неделя» | `src/ui/WeekScreen.tsx` | Card model, storage, PDF |
| «Настройки» | `src/ui/SettingsScreen.tsx` | Storage |
| App shell | `src/ui/App.tsx`, `src/ui/StoreProvider.tsx`, `src/ui/TabBar.tsx`, `src/main.tsx` | Storage, offline app |
| Style | `src/ui/styles.css`, `src/ui/decorations.tsx` | — |

## Manual test checklist

Installation and offline work, on the iPhone:

1. Open the published address in Safari → «Поделиться» → «На экран „Домой“» → an icon with a red bow appears.
2. Open the app from the icon → it opens full screen on today, without the Safari address bar.
3. Fill in one value, close the app, turn on airplane mode, open the app from the icon → the app opens and the value
   is there.
4. In airplane mode open «Неделя» → «Скачать PDF» → the share sheet opens with the PDF.

## Related docs

- [DailyEntry.md](DailyEntry.md), [WeekExport.md](WeekExport.md), [Backup.md](Backup.md)
- [LocalOnlyPwa.md](../../Decisions/LocalOnlyPwa.md)
