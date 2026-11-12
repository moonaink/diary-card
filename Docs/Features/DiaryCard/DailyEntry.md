# Daily Entry

## Summary

Status: Active

Filling in the card of one day on the «День» tab, with autosave and the confirmation for days of past weeks.

## Scenario / responsibility

The user opens the app, rates the day's urges, states and emotions, lists substances, marks actions, and closes the
app. Every tap is saved immediately. The same screen opens earlier days through the back arrow.

## Systems used

- [CardModel.md](../../Systems/CardModel.md) — the columns shown on the screen and the edit functions of `DayEntry`.
- [DiaryStorage.md](../../Systems/DiaryStorage.md) — loading and saving the day.

## Runtime flow

1. `DayScreen` gets the selected date; `useDayDraft()` loads the stored entry of that date, or starts from an empty
   one, and shows nothing editable until the load has finished.
2. A tap builds an update with an edit function of the card model. If the day lies in a past week and has not been
   unlocked yet, `DayScreen` keeps the update pending and shows `ConfirmDialog`; on «Изменить» the day is unlocked
   and the update applied, on «Отмена» it is dropped.
3. `useDayDraft()` applies the update to the latest draft, shows it, and calls `DiaryStore.saveDay`.
4. Substance name suggestions come from all stored days through `collectSubstanceNames()`, read once when the screen
   opens.

## Feature-specific rules

- The sections follow the paper card: «Побуждение к», «Состояния», «Наркотики/Медикаменты», «Действия», «Эмоции».
- Tapping the chosen value of a scale again clears it; the cell becomes blank, which is different from 0.
- «Ложь» is a counter: «+» from blank gives 0, «−» at 0 gives blank again.
- «Применение навыков» shows the meaning of the chosen value under the scale.
- «Очистить день» asks for confirmation and removes every value; the day becomes not filled.
- Each update starts from the latest draft, not from the copy of the last render, so two quick taps do not overwrite
  each other.
- Text typed into a substance field is read when typed, so a keystroke that waits for the past-week confirmation is
  applied as typed.

## Edge cases

- Saving fails (storage full or broken) — a red notice «Не удалось сохранить: …» stays on the screen; the draft is
  still shown.
- A blank substance row stays on screen while typing but is not stored.
- The day is changed while its entry is still loading — the change is ignored; the form is not shown until loaded.

## Manual test checklist

1. Open the app → the title shows today's date with «сегодня» and «День пока не заполнен».
2. Tap 2 under «Совершению суицида» → the 2 turns pink, the status becomes «День заполнен».
3. Tap the same 2 again → the 2 is no longer chosen; with no other values the status returns to «День пока не
   заполнен».
4. Under «Алкоголь» tap «+ Добавить», type «Вино» and «2 бокала», close the app completely, open it again → «Вино»
   and «2 бокала» are there.
5. Go to the previous day, add an «Алкоголь» row, type «В» → «Вино» is offered as a suggestion.
6. On today → the «›» arrow is disabled.
7. Tap «‹» until a day of the previous week, tap any value → the dialog «Изменить запись за прошлую неделю?» appears;
   «Отмена» → the value is not set; tap again and choose «Изменить» → the value is set, further taps on this day
   need no confirmation.
8. On «Ложь» tap «+» twice → 1; tap «−» twice → «—».
9. Tap «Очистить день» → «Очистить» → all values are gone, the status is «День пока не заполнен».
10. Leave the app in the background overnight and open it the next day → it opens on the new date with «сегодня».
