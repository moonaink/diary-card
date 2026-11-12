# Backup

## Summary

Status: Active

Saving all records into one file and restoring them from it, on the «Настройки» tab, together with the name for the
card header.

## Scenario / responsibility

The user regularly saves a backup to Files or iCloud Drive. On a new phone, or after the app icon was removed, the
user installs the app again and restores the file.

## Systems used

- [DiaryStorage.md](../../Systems/DiaryStorage.md) — export, file format, validation and replacement.

## Runtime flow

1. «Сохранить копию» calls `DiaryStore.exportAll`, builds the file with `buildBackupFile()` and hands it to
   `deliverFile()`; the same «открыть «Поделиться»» fallback as for the PDF applies.
2. «Восстановить из копии» opens the file picker; the chosen file is read and checked by `tryParseBackupFile()`.
3. An invalid file shows «Копия не восстановлена: <reason>.» and changes nothing.
4. A valid file shows `ConfirmDialog` with the number of days and week headers in it; «Заменить» calls
   `DiaryStore.replaceAll` and reports «Восстановлено дней: N».
5. The name field saves with `DiaryStore.saveSettings` on every keystroke.

## Feature-specific rules

- A restore replaces all records, including the name; nothing is merged.
- The screen states that the records live only in the home-screen app and disappear with its icon.
- It also says whether the browser has granted persistent storage (`isStoragePersistent()`).

## Edge cases

- A file of another kind, a damaged file, or a file from a newer app version — rejected with the reason; records
  unchanged.
- Writing the restore fails — «Не удалось восстановить, прежние записи не тронуты».

## Manual test checklist

1. «Настройки» → «Сохранить копию» → the share sheet opens with `diary-card-backup-<date>.json` → «Сохранить в
   „Файлы“» → the file is in Files.
2. Change a value of today, then «Восстановить из копии» → pick that file → the dialog shows the number of days →
   «Заменить» → «Восстановлено дней: N», and today's value is as it was when the copy was saved.
3. «Восстановить из копии» → pick a PDF → «Копия не восстановлена: файл не является резервной копией: это не
   JSON.», records unchanged.
4. Pick a valid file and choose «Отмена» in the dialog → nothing changes.
5. Type a name → switch to «Неделя» → the name is shown in the header.
