# System Map

Status: Draft

The architectural map of the application: layers in dependency order, the main runtime flows and what each layer
must not do. It does not describe behavior in detail and does not replace system documents.

The code is the Vite skeleton only: `src/main.tsx` mounts `src/App.tsx`, a placeholder page. The layers below are the
agreed starting layout; each gets its folder and its system document with its first code, and this map is revised
then.

## Layers

Listed from the layer with no dependencies to the layer that depends on all others.

1. **Card model.** The domain: the shape of a day entry and of the week header, the scales, validation, and every
   derived value (the fill frequency, the rows of the PDF table). Plain TypeScript; imports no React, no browser
   storage, no PDF library.
   Not implemented: the folder is `src/card/`, created with the first model code.
2. **Storage.** The owner of persisted records and settings on the device (IndexedDB), and the backup file format:
   export of everything into one file and validated restore from it.
   Not implemented: the folder is `src/storage/`, created with the first store.
3. **PDF export.** Turns one week of records into the PDF in the layout of the paper card and hands it to the share
   sheet or download.
   Not implemented: the folder is `src/pdf/`, created with the first export code.
4. **UI.** React screens and components: the daily entry, the week view, settings, backup, the visual style.
   Not implemented: the folder is `src/ui/`; `src/App.tsx` is the only component today.

## Main Flows

Fill in a day:

```text
UI (draft of the day) → card model (validate) → storage (save the day entry) → UI (re-read and show)
```

Export a week to PDF:

```text
UI (pick week) → storage (load the week's day entries and settings) → card model (derive header and rows)
  → PDF export (build the document) → UI (share sheet / download)
```

Backup and restore:

```text
UI (save backup) → storage (export all records) → file
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
- PDF export does not read storage; it receives records from its caller.
- The UI does not hold card data as truth: it keeps drafts and view state, and reads saved records from storage.
- The UI does not write to storage directly; it calls the store's save operation.
