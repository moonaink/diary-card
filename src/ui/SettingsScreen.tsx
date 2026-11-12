import { useEffect, useRef, useState } from 'react'
import { DEFAULT_SETTINGS, type DiarySettings } from '../card/weekCard.ts'
import {
  backupFileName,
  buildBackupFile,
  tryParseBackupFile,
  type DiaryContents,
} from '../storage/backupFile.ts'
import { isStoragePersistent } from '../storage/diaryStore.ts'
import { ConfirmDialog } from './ConfirmDialog.tsx'
import { Bow } from './decorations.tsx'
import { deliverFile } from './deliverFile.ts'
import { describeError } from './describeError.ts'
import { useDiaryStore } from './diaryStoreContext.ts'

type Status = { kind: 'info' | 'error'; text: string } | null

export function SettingsScreen() {
  const store = useDiaryStore()
  const [settings, setSettings] = useState<DiarySettings | null>(null)
  const [persistent, setPersistent] = useState<boolean | null>(null)
  const [status, setStatus] = useState<Status>(null)
  const [pendingBackup, setPendingBackup] = useState<File | null>(null)
  const [restoreCandidate, setRestoreCandidate] = useState<DiaryContents | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    store.loadSettings().then(
      (loaded) => {
        if (!cancelled) setSettings(loaded)
      },
      () => {
        if (!cancelled) setSettings(DEFAULT_SETTINGS)
      },
    )
    void isStoragePersistent().then((value) => {
      if (!cancelled) setPersistent(value)
    })
    return () => {
      cancelled = true
    }
  }, [store])

  const changeName = (name: string) => {
    const next = { ...(settings ?? DEFAULT_SETTINGS), name }
    setSettings(next)
    store
      .saveSettings(next)
      .catch((error: unknown) =>
        setStatus({ kind: 'error', text: `Не удалось сохранить имя: ${describeError(error)}` }),
      )
  }

  const deliver = async (file: File) => {
    const outcome = await deliverFile(file)
    setPendingBackup(outcome === 'needsTap' ? file : null)
    if (outcome === 'shared' || outcome === 'downloaded') {
      setStatus({
        kind: 'info',
        text: 'Копия сохранена. Храните файл в «Файлах» или iCloud Drive.',
      })
    }
  }

  const saveBackup = async () => {
    setStatus(null)
    try {
      const now = new Date()
      const contents = await store.exportAll()
      const file = new File([buildBackupFile(contents, now)], backupFileName(now), {
        type: 'application/json',
      })
      await deliver(file)
    } catch (error) {
      setStatus({ kind: 'error', text: `Не удалось сделать копию: ${describeError(error)}` })
    }
  }

  const pickRestoreFile = async (file: File | undefined) => {
    setStatus(null)
    if (!file) return
    const result = tryParseBackupFile(await file.text())
    if (result.ok) setRestoreCandidate(result.value)
    else setStatus({ kind: 'error', text: `Копия не восстановлена: ${result.reason}.` })
  }

  const restore = async (contents: DiaryContents) => {
    setRestoreCandidate(null)
    try {
      await store.replaceAll(contents)
      setSettings(contents.settings)
      setStatus({ kind: 'info', text: `Восстановлено дней: ${contents.days.length}.` })
    } catch (error) {
      setStatus({
        kind: 'error',
        text: `Не удалось восстановить, прежние записи не тронуты: ${describeError(error)}`,
      })
    }
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-title">
          <h1>Настройки</h1>
        </div>
      </header>

      <section className="card-section">
        <div className="section-title">
          <Bow size={30} />
          <div>
            <h2>Карточка</h2>
          </div>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="name">
            Имя (печатается в шапке PDF)
          </label>
          <input
            id="name"
            className="input"
            autoComplete="name"
            value={settings?.name ?? ''}
            disabled={settings === null}
            onChange={(event) => changeName(event.target.value)}
          />
        </div>
      </section>

      <section className="card-section">
        <div className="section-title">
          <Bow size={30} />
          <div>
            <h2>Резервная копия</h2>
          </div>
        </div>
        <p>
          Записи хранятся только на этом телефоне, внутри приложения с экрана «Домой». Если удалить
          иконку, записи удалятся вместе с ней. Сохраняйте копию в «Файлы» или iCloud Drive.
        </p>
        <button type="button" className="button wide" onClick={saveBackup}>
          Сохранить копию
        </button>
        {pendingBackup && (
          <button
            type="button"
            className="button secondary wide"
            onClick={() => deliver(pendingBackup)}
          >
            Копия готова — открыть «Поделиться»
          </button>
        )}
        <button
          type="button"
          className="button secondary wide"
          onClick={() => fileInput.current?.click()}
        >
          Восстановить из копии
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            void pickRestoreFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
        {status && (
          <p className={status.kind === 'error' ? 'notice error' : 'notice'}>{status.text}</p>
        )}
        {persistent !== null && (
          <p className="hint">
            {persistent
              ? 'Телефон не будет очищать записи приложения сам.'
              : 'Браузер может очистить записи при нехватке места — делайте копии регулярно.'}
          </p>
        )}
      </section>

      {restoreCandidate && (
        <ConfirmDialog
          title="Заменить все записи копией?"
          confirmLabel="Заменить"
          onCancel={() => setRestoreCandidate(null)}
          onConfirm={() => void restore(restoreCandidate)}
        >
          <p>
            В копии дней: {restoreCandidate.days.length}, недель с шапкой:{' '}
            {restoreCandidate.weeks.length}. Все текущие записи на телефоне будут заменены.
          </p>
        </ConfirmDialog>
      )}
    </>
  )
}
