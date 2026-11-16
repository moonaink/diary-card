# Glossary

Status: Active

Terms that have a special meaning in this project. The product description of each term is in
[ProductOverview.md](../Overview/ProductOverview.md) `## The Diary Card`; the code is described in
[CardModel.md](../Systems/CardModel.md).

### Diary card

One week, Wednesday to Tuesday: seven day entries plus the week header. The unit of the PDF export. In code: `WeekCard`,
built by `buildWeekCard()`. Russian label: «Дневниковая карточка».

Should not be confused with: day entry. A day entry is one row of a card.

### Day entry

The record of one calendar date: all ratings, substance entries and actions of that day. In code: `DayEntry`. A date
has at most one day entry. A day without an entry is "not filled", which is different from a day filled with zeros.

### Week header

The values printed above the daily table: the name, whether the card is filled in during the session, the fill
frequency and the start date. In code: `WeekHeader` holds the two values entered per week; the name comes from
`DiarySettings`; the fill frequency is derived.

### Fill frequency

The header value «Как часто Вы заполняете эту сторону в неделю?», derived from the number of day entries in the week:
seven — «Ежедневно», four to six — «4-6 р.», two or three — «2-3 р.», one — «Один». In code: `FillFrequency`, computed
by `resolveFillFrequency()`. Never entered by hand and never stored.

### Rating

An integer from 0 to 5 that records the maximum intensity during the day. Used by urges, states and emotions. In
code: a value of `DayEntry.ratings`, keyed by `RatingKey`.

Should not be confused with: skills use, which has its own scale from 0 to 7.

### Urge

«Побуждение к»: a rating of the urge to commit suicide, to self-harm, or to use drugs.

Should not be confused with: action. An urge rates a wish; the action «Самоповреждение» records whether it happened.

### State

«Состояния»: ratings of emotional misery, physical misery and pleasure («Удовольствие»).

Should not be confused with: emotion. «Удовольствие» is a state; «Счастье» is an emotion; they are separate columns.

### Emotion

«Эмоции»: ratings of eight emotions — anger, happiness, sadness, guilt, shame, fear, anxiety, disappointment.

### Substance entry

One name with a quantity inside one of four substance categories: alcohol, drugs, prescribed medication,
over-the-counter medication. In code: `SubstanceEntry` in `DayEntry.substances`, keyed by `SubstanceCategory`. A day
may have several substance entries per category; the PDF prints them one per line, each quantity on the line of its
name.

### Action

«Действия»: self-harm (yes / no), lies (a count) and skills use.

### Skills use

«Применение навыков»: a value from 0 to 7 on the scale printed on the paper card, from "did not think about skills"
(0) to "used skills automatically, and they helped" (7). In code: `DayEntry.skillsUse`, meanings in
`SKILLS_USE_SCALE`.

### Past week

A week that ended before the week of today. Its days change only after a confirmation. In code: `isInPastWeek()`.
