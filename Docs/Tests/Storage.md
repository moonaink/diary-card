# Storage Tests

## Summary

Status: Active

Suites of the diary storage and the backup file. Router: [TestSuiteMap.md](../Core/TestSuiteMap.md).

## Suites

### Backup file

Files:

- `src/storage/backupFile.test.ts`

Contract: a file built by the app is read back unchanged; text that is not a backup, a file of a newer version, a
file with one invalid record and a file with a repeated date are rejected as a whole.

Canonical docs:

- [DiaryStorage.md](../Systems/DiaryStorage.md)

### Diary store

Files:

- `src/storage/diaryStore.test.ts`

Contract: days are stored normalized, an emptied day is deleted, quick successive saves keep the last value, range
loads return only the days of the range, an emptied week header is deleted, and a restore replaces every record.

Canonical docs:

- [DiaryStorage.md](../Systems/DiaryStorage.md)

Not covered (intentionally): eviction and persistent storage in Safari, and an aborted restore transaction — the
suite runs on `fake-indexeddb` in Node, which models neither.
