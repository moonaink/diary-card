# System Map

Status: Active

The architectural map of the application: layers in dependency order, the main runtime flows and what each layer
must not do. It does not describe behavior in detail and does not replace system documents.

## Layers

Listed from the layer with no dependencies to the layer that depends on all others.

1. **Card model** — `src/card/`, [CardModel.md](../Systems/CardModel.md). The domain: the column declarations, the
   day entry, the week card, dates, validation, every derived value. Plain TypeScript; imports no React, no browser
   storage, no PDF library.
2. **Storage** — `src/storage/`, [DiaryStorage.md](../Systems/DiaryStorage.md). The owner of persisted records and
   settings (IndexedDB) and of the backup file format.
3. **PDF export** — `src/pdf/`, [CardPdf.md](../Systems/CardPdf.md). Turns one week card into the PDF in the layout
   of the paper card.
4. **UI** — `src/ui/`, [Overview.md](../Features/DiaryCard/Overview.md). React screens and components, the browser
   file hand-off (`src/ui/deliverFile.ts`) and the visual style.

The app shell around the layers — `src/main.tsx`, `index.html`, `vite.config.ts` — registers the service worker and
describes the installed app ([OfflineApp.md](../Systems/OfflineApp.md)).

## Main Flows

Fill in a day:

```text
UI (draft of the day) → card model (edit, normalize) → storage (save the day entry) → UI (shows the draft)
```

Export a week to PDF:

```text
UI (pick week) → storage (load the week's day entries, header, settings) → card model (week card)
  → PDF export (layout, render) → UI (share sheet / download)
```

Backup and restore:

```text
UI (save backup) → storage (export all records, build file) → UI (share sheet / download)
UI (pick file) → storage (parse) → card model (validate every record) → storage (replace records) → UI
```

## Dependency Summary

| Layer | May depend on |
| --- | --- |
| Card model | nothing in the app |
| Storage | card model |
| PDF export | card model |
| UI | card model, storage, PDF export |

## Layer Rules

- The card model does not import React, browser storage, the PDF library or any browser API.
- Storage holds no business rules: it does not derive values and does not decide what is valid; it calls the card
  model for that.
- PDF export does not read storage; it receives the week card from its caller.
- The UI does not hold card data as truth: it keeps drafts and view state, and reads saved records from storage.
- The UI does not write to IndexedDB directly; it calls `DiaryStore`.
- The UI loads the PDF code on demand, not at start, because the PDF library is most of the app's code.
