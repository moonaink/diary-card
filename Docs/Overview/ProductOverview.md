# Product Overview

## What The Product Is

A personal web application for keeping a DBT (dialectical behavior therapy) diary card on an iPhone. It replaces the
front side of the paper card «Дневниковая карточка» ([DiaryCardForm.pdf](DiaryCardForm.pdf): page 1 is the front
side, page 2 the back side): the owner rates the day's urges, states, substances, actions and emotions, and before a
therapy session downloads the week as a PDF that looks like the paper card.

There is one user, the owner of the phone. There are no accounts, no server and no sync: the records stay on the
phone (see [LocalOnlyPwa.md](../Decisions/LocalOnlyPwa.md)). The interface is in Russian.

## Main User Loop

1. Once: open the site in Safari and add it to the home screen; enter the name in «Настройки».
2. Each day, or when catching up on missed days: open the app from the home-screen icon. It opens on today's card;
   the arrows move to earlier days. Every tap is saved at once.
3. Before a session: on «Неделя», pick the week, enter the start date of the card, mark whether the card is being
   filled in during the session, press «Скачать PDF», and save or send the file from the iPhone share sheet.
4. From time to time: on «Настройки», save a backup file of all records to Files / iCloud Drive; restore from it on a
   new phone or after the app was removed.

## The Diary Card

A card covers one week, Wednesday to Tuesday: the therapy session is on Wednesday, so one card holds exactly the
days since the previous session. Each day of the week has one row with these groups (Russian labels as on
the paper card):

- «Побуждение к» — urges, each 0–5: «Совершению суицида», «Самоповреждению», «Употреблению наркотиков».
- «Состояния» — the maximum during the day, each 0–5: «Эмоциональное страдание», «Физическое страдание»,
  «Удовольствие».
- «Наркотики/Медикаменты» — four categories: «Алкоголь», «Наркотики», «Лекарственные препараты (по рецепту)»,
  «Лекарственные препараты (без рецепта)». In each category a day may have several entries, each with a name and a
  quantity. The app suggests names entered before.
- «Действия» — «Самоповреждение» (yes / no), «Ложь» (a count), «Применение навыков» (0–7, scale below).
- «Эмоции» — the maximum during the day, each 0–5: «Гнев», «Счастье», «Печаль», «Вина», «Стыд», «Страх», «Тревога»,
  «Разочарование».

The «Применение навыков» scale, as printed on the paper card:

- 0 — did not think about skills and did not use them;
- 1 — thought about skills, did not want to use them, did not use them;
- 2 — thought about skills, wanted to use them, but did not;
- 3 — tried, but could not use skills;
- 4 — tried, could use skills, but they did not help;
- 5 — tried, could use skills, they helped;
- 6 — used skills without trying (automatically), they did not help;
- 7 — used skills without trying (automatically), they helped.

The card header of a week:

- «Имя» — entered once in the settings.
- «Вы заполняете дневник во время сессии?» — yes / no, set per week.
- «Как часто Вы заполняете эту сторону в неделю?» — not entered: derived from the number of days of the week that
  have an entry: all seven — «Ежедневно»; four to six — «4-6 р.»; two or three — «2-3 р.»; one — «Один».
- «Дата начала заполнения» — entered by hand per week; the app does not fill it in.

## Editing Rules

- The app opens on today and returns to today when it is resumed on a later date.
- Days after today cannot be filled in.
- A day of a past week changes only after a confirmation, asked once per opened day.
- Changes are saved automatically; there is no save button.

## PDF Export

The PDF covers one chosen week: the card header, the daily table and, under it, the «Применение навыков» 0–7 legend,
in the layout of the front side of the paper card (page 1 of [DiaryCardForm.pdf](DiaryCardForm.pdf), without its
bottom weekly block), on a landscape A4 page, black and white like the original. It is generated on the phone. On the
iPhone the button opens the share sheet, from which the file is saved to Files or sent.

## Backup

Because the records exist only on the phone, the app saves all records and settings into one backup file and
restores them from such a file. Restoring a file that is not a valid backup changes nothing.

## Visual Style

A kawaii style in the spirit of Hello Kitty: pastel pink, red bows, hearts, polka dots, a rounded font, soft shadows.
The Hello Kitty character itself (a Sanrio trademark) is not drawn by agents. If the owner adds their own pictures to
the repository, they are used as decorations, for personal use. The style applies to the app screens, not to the PDF.

## Implementation Status

Everything described above exists: daily entry with autosave and the past-week confirmation, storage on the phone,
the week header, the PDF export with the legend, backup and restore, installation to the home screen with offline
work, and the pink style with bows, hearts and polka dots. The behavior is described in
[Overview.md](../Features/DiaryCard/Overview.md).

## Design Not Yet Fixed

No open design questions at the moment.

## Explicitly Out Of Scope

An agent does not propose these again:

- the weekly block at the bottom of the paper card's front side («Перемены в здоровье», «Домашнее задание»,
  urges at the session, «Я верю, что могу измениться», «Изучаемые навыки») and the back side of the card (skills
  practiced per day) — the owner chose the daily table and the header only;
- a PIN code or another lock inside the app — the phone's own lock is enough;
- a server, accounts, cloud sync or sharing between devices — the records stay on the phone;
- the pink style in the PDF — the PDF is black and white like the original card.
