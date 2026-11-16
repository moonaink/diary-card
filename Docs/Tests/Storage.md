# Storage Tests

## Summary

Status: Active

Suites of the diary storage and the backup file. Router: [TestSuiteMap.md](../Core/TestSuiteMap.md).

## Suites

### Backup file

Files:

- `src/storage/backupFile.test.ts`

Contract: a file built by the app is read back unchanged; a version 1 file is restored without its Monday week
headers; text that is not a backup, a file of a newer version, a header that does not start on a Wednesday, a
file with one invalid record and a file with a repeated date are rejected as a whole.

Canonical docs:

- [DiaryStorage.md](../Systems/DiaryStorage.md)

### Diary store

Files:

- `src/storage/diaryStore.test.ts`

Contract: days are stored normalized, an emptied day is deleted, quick successive saves keep the last value, range
loads return only the days of the range, an emptied week header is deleted, opening a version 1 database drops its
Monday week headers and keeps its days, and a restore replaces every record.

Canonical docs:

- [DiaryStorage.md](../Systems/DiaryStorage.md)

Not covered (intentionally): eviction and persistent storage in Safari, and an aborted restore transaction — the
suite runs on `fake-indexeddb` in Node, which models neither.
