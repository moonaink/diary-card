# Diary Storage

## Summary

Status: Active

The records of the app on the device (IndexedDB) and the backup file that carries all of them. `DiaryStore` is the
only code that reads and writes the records.

## Responsibility

- Opens the database once per app start and asks the browser to keep it.
- Saves and loads days, week headers and settings in their stored form.
- Exports everything into a backup file and restores everything from one, all or nothing.

## Source of truth

- `DiaryStore` (IndexedDB database `diary-card`, named by `DIARY_DB_NAME`) is the source of truth for every record:
  days keyed by date, week headers keyed by the Wednesday that starts the week, and one settings record. Screens hold
  drafts and view state only and re-read records from the store.
- `BACKUP_FORMAT` and `BACKUP_VERSION` in `src/storage/backupFile.ts` define what counts as a backup file.

## Primary code directory

`src/storage/`

## Key types and files

- `src/storage/diaryStore.ts` — `DiaryStore`, `requestPersistentStorage()`, `isStoragePersistent()`.
- `src/storage/backupFile.ts` — `DiaryContents`, `buildBackupFile()`, `tryParseBackupFile()`, `backupFileName()`.
- `src/ui/StoreProvider.tsx` — opens the store at start; `useDiaryStore()` in `src/ui/diaryStoreContext.ts` hands
  it to screens.

## Runtime flow

Start: `StoreProvider` calls `DiaryStore.open` once, then `requestPersistentStorage()`. If the browser refuses the
database, the app stops on an error screen and does not run without a place to save.

Saving a day: `DiaryStore.saveDay` normalizes the entry through the card model; an empty day is deleted, any other
replaces the stored entry of its date. Saves are applied in call order, because IndexedDB runs read-write
transactions on the same store in the order they were created, so the last autosave of a quick series wins.

Saving a week header: `DiaryStore.saveWeekHeader` stores the header, or deletes it when it has no values left.

Backup: `DiaryStore.exportAll` reads all records in one read transaction, `buildBackupFile()` writes them as JSON
with the format name, version and export time, and the settings screen hands the file to `deliverFile()`.

Restore: the file text goes to `tryParseBackupFile()`, which checks the format, the version, every record (through
the card model) and duplicate dates before anything is written. After the user confirms, `DiaryStore.replaceAll`
clears all stores and writes the contents in one read-write transaction.

## Rules and invariants

- Only `DiaryStore` touches IndexedDB.
- Stored days are always in normalized form and never empty.
- A restore is all or nothing: an invalid file changes nothing, and a failing write aborts the transaction so the
  previous records stay.
- A backup file of a newer `version` than `BACKUP_VERSION` is refused with a request to update the app.
- Week headers exist only for weeks that start on a Wednesday. Version 1 of the database and of the backup file
  kept headers of Monday-to-Sunday weeks: opening a version 1 database deletes them in the `upgrade` callback, and a
  version 1 file is restored with its days and name but without its week headers.
- Storage belongs to one origin and one installation: the dev server address, a Safari tab and the home-screen app
  each have their own records ([LocalOnlyPwa.md](../Decisions/LocalOnlyPwa.md)).

## Edge cases

- Private browsing or a browser that refuses storage — the error screen of `StoreProvider`.
- Persistent storage not granted — the settings screen says that the browser may clear records and suggests regular
  backups.
- A day of the backup that is empty after normalization is not written.

## Extension notes

- A change of object stores or of the stored record shape raises `DIARY_DB_VERSION` in `src/storage/diaryStore.ts`
  and migrates older data in the `upgrade` callback of `DiaryStore.open`.
- A change of the file shape raises `BACKUP_VERSION`; `tryParseBackupFile()` must keep reading files of the older
  versions, because the user's only copy may be old.

## Related features

- [Overview.md](../Features/DiaryCard/Overview.md)
- [DailyEntry.md](../Features/DiaryCard/DailyEntry.md)
- [Backup.md](../Features/DiaryCard/Backup.md)
