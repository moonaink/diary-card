# Document Map

One line per document under `Docs/`. Test area documents under `Docs/Tests/` are routed by
[TestSuiteMap.md](TestSuiteMap.md), not listed here. A new document gets its line here in the same change that
creates it.

## Overview

- [ProductOverview.md](../Overview/ProductOverview.md) — what the app is, the diary card it replaces, what exists, what is undecided, what is rejected

## Core

- [DocumentationRules.md](DocumentationRules.md) — how documents are structured, marked, written, sized and kept in sync with code
- [CodeArchitectureRules.md](CodeArchitectureRules.md) — the shape of new code: role names, ownership, boundaries, failure policy
- [TestingRules.md](TestingRules.md) — the shape of tests, what to test, how suites are documented
- [TestSuiteMap.md](TestSuiteMap.md) — which test area document covers which code folder
- [Glossary.md](Glossary.md) — canonical meaning of diary card terms: day entry, rating, urge, substance entry, skills use
- [SystemMap.md](SystemMap.md) — layers of the app in dependency order, main flows, what each layer must not do

## Systems

### Card

- [CardModel.md](../Systems/CardModel.md) — the card's columns, the day entry, the week card, dates and validation (`DayEntry`)
- [CardPdf.md](../Systems/CardPdf.md) — how a week becomes a PDF in the layout of the paper card (`buildCardLayout`)

### Platform

- [DiaryStorage.md](../Systems/DiaryStorage.md) — where records live on the phone, how they are saved, backed up and restored (`DiaryStore`)
- [OfflineApp.md](../Systems/OfflineApp.md) — installation to the home screen, offline caching, updates, the Pages path prefix

## Features

- [Overview.md](../Features/DiaryCard/Overview.md) — the app's tabs, navigation between days and weeks, main rules, install checklist
- [DailyEntry.md](../Features/DiaryCard/DailyEntry.md) — filling in a day: autosave, past-week confirmation, manual checklist
- [WeekExport.md](../Features/DiaryCard/WeekExport.md) — the week tab: filled days, card header, PDF download, manual checklist
- [Backup.md](../Features/DiaryCard/Backup.md) — settings tab: name, saving and restoring the backup file, manual checklist

## Decisions

- [LocalOnlyPwa.md](../Decisions/LocalOnlyPwa.md) — why the app is an installable web app with records only on the phone, and what follows

## Multi-area changes

- A new column of the card usually needs [CardModel.md](../Systems/CardModel.md) + [CardPdf.md](../Systems/CardPdf.md) (column widths), and [DiaryStorage.md](../Systems/DiaryStorage.md) when the stored shape changes.
- A new kind of asset (font, image) usually needs [OfflineApp.md](../Systems/OfflineApp.md) (precache patterns), and [CardPdf.md](../Systems/CardPdf.md) when the PDF uses it.
- A change of what is stored usually needs [DiaryStorage.md](../Systems/DiaryStorage.md) + [Backup.md](../Features/DiaryCard/Backup.md) (file version).
