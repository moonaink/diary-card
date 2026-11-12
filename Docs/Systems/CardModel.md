# Card Model

## Summary

Status: Active

The domain of the diary card: which columns the card has, the record of one day, the week card that the PDF
prints, calendar weeks, and the reading of untrusted records from a backup file. Plain TypeScript; it imports no
React, no storage and no PDF code.

## Responsibility

- Declares the columns of the paper card once, with their Russian labels, order and scales.
- Changes a day entry immutably, one value at a time.
- Defines the stored form of a day and when a day counts as not filled.
- Derives the week card and its fill frequency from stored records.
- Turns untrusted data into valid records or a reason for rejecting it.
- Does calendar arithmetic on local dates with Monday-based weeks.

## Source of truth

- The declarations in `src/card/cardColumns.ts` (`URGES`, `STATES`, `EMOTIONS`, `SUBSTANCE_CATEGORIES`,
  `ACTION_LABELS`, `SKILLS_USE_SCALE`) are the source of truth for which columns the card has, their labels, order
  and scales. The day screen, the PDF layout and the validation iterate them; none of them keeps its own list.
- `DayEntry` is the shape of one day. The persisted copy is owned by `DiaryStore`
  ([DiaryStorage.md](DiaryStorage.md)); screens hold editing drafts only.
- `resolveFillFrequency()` is the only definition of the thresholds of «Как часто Вы заполняете эту сторону в
  неделю?». The value is derived each time and never stored.

## Primary code directory

`src/card/`

## Key types and files

- `src/card/cardColumns.ts` — column declarations, `RatingKey`, `SubstanceCategory`, `RATING_LABELS` for messages.
- `src/card/dayEntry.ts` — `DayEntry`, `SubstanceEntry`, the `apply*`, `addSubstance` and `removeSubstance` edits,
  `normalizeDayEntry()`, `isDayEntryEmpty()`, `tryParseDayEntry()`.
- `src/card/weekCard.ts` — `WeekHeader`, `DiarySettings`, `WeekCard`, `FillFrequency`, `buildWeekCard()`,
  `collectSubstanceNames()`, `tryParseWeekHeader()`, `tryParseSettings()`.
- `src/card/dates.ts` — `IsoDate` and week arithmetic: `weekStartOf()`, `isInPastWeek()`.
- `src/card/parseResult.ts` — `ParseResult`, the outcome of reading untrusted data.

## Runtime flow

1. The day screen applies one change to its draft with an edit function; each returns a new `DayEntry` and leaves the
   old one untouched.
2. `DiaryStore.saveDay` stores `normalizeDayEntry()` of the draft, or deletes the day when `isDayEntryEmpty()` is
   true.
3. For the week screen and the PDF, `buildWeekCard()` takes the stored entries, keeps the non-empty ones of the week
   by date, adds the week header and the name, and derives the fill frequency.
4. A restore reads every record of the file through `tryParseDayEntry()`, `tryParseWeekHeader()` and
   `tryParseSettings()`; the first invalid record rejects the whole file.

## Rules and invariants

- An absent value is a blank cell, which is different from 0. A day whose values are all absent is not filled and has
  no stored record, so the fill frequency counts only days with at least one value.
- Ratings are integers from 0 to `RATING_MAX`, skills use from 0 to `SKILLS_USE_MAX`, lies a non-negative integer.
  An edit function throws `RangeError` for a value outside its range (a programmer error); a `tryParse*` function
  returns a reason instead (untrusted input).
- The stored form trims substance rows, drops rows whose name and quantity are both empty, and drops empty
  categories. The editing draft keeps blank rows, so a row the user has just added does not vanish.
- Fill frequency: seven filled days — `daily`, four to six — `fourToSix`, two or three — `twoToThree`, one — `once`,
  none — no value.
- Dates are local calendar dates written `YYYY-MM-DD`; a week runs Monday to Sunday. Adding days moves by calendar
  days, so a daylight-saving change does not shift a date.
- Rejection reasons are in Russian: the restore screen shows them to the user.

## Edge cases

- An entry of another week passed to `buildWeekCard()` is ignored; a week start that is not a Monday throws.
- `collectSubstanceNames()` trims names, ignores empty ones, orders by how often a name was used, then
  alphabetically.
- A backup record with a known date but an unknown column key is rejected rather than silently dropped.

## Extension notes

- A new column is added to the declarations in `src/card/cardColumns.ts`; the day screen, the PDF and the validation
  pick it up. The PDF column widths in `src/pdf/cardLayout.ts` must then be re-checked against the page width
  ([CardPdf.md](CardPdf.md)).
- A change of the stored shape of a record needs a storage version change
  ([DiaryStorage.md](DiaryStorage.md) `## Extension notes`).

## Related features

- [Overview.md](../Features/DiaryCard/Overview.md)
- [DailyEntry.md](../Features/DiaryCard/DailyEntry.md)
- [WeekExport.md](../Features/DiaryCard/WeekExport.md)
