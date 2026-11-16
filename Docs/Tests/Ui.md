# UI Tests

## Summary

Status: Active

Suites of the plain functions of the UI layer. Router: [TestSuiteMap.md](../Core/TestSuiteMap.md).

## Suites

### File delivery

Files:

- `src/ui/deliverFile.test.ts`

Contract: the share sheet is chosen only on an iPhone or iPad, including an iPad that reports itself as a Mac; a
touch-screen Windows computer and a Mac get a download.

Canonical docs:

- [WeekExport.md](../Features/DiaryCard/WeekExport.md)

Not covered (intentionally): the share sheet and the download themselves — browser APIs, checked with the manual
checklists of [WeekExport.md](../Features/DiaryCard/WeekExport.md) and [Backup.md](../Features/DiaryCard/Backup.md).
