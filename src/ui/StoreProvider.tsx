import { useEffect, useState, type ReactNode } from 'react'
import { DiaryStore, requestPersistentStorage } from '../storage/diaryStore.ts'
import { Bow } from './decorations.tsx'
import { describeError } from './describeError.ts'
import { DiaryStoreContext } from './diaryStoreContext.ts'

type OpenState =
  | { status: 'opening' }
  | { status: 'open'; store: DiaryStore }
  | { status: 'failed'; reason: string }

/**
 * Opens the store once for the whole app. If the browser refuses storage, the app stops on an error screen
 * instead of running on without a place to save records.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OpenState>({ status: 'opening' })

  useEffect(() => {
    let opened: DiaryStore | null = null
    let cancelled = false
    DiaryStore.open().then(
      (store) => {
        if (cancelled) {
          store.close()
          return
        }
        opened = store
        setState({ status: 'open', store })
        void requestPersistentStorage()
      },
      (error: unknown) => {
        if (!cancelled) setState({ status: 'failed', reason: describeError(error) })
      },
    )
    return () => {
      cancelled = true
      opened?.close()
    }
  }, [])

  if (state.status === 'opening') {
    return (
      <div className="splash">
        <Bow size={72} />
      </div>
    )
  }
  if (state.status === 'failed') {
    return (
      <div className="splash">
        <Bow size={72} />
        <h1>Не получается открыть хранилище</h1>
        <p>
          Браузер не дал приложению место для записей, поэтому сохранять дневник сейчас нельзя.
          Частый случай — режим «Частный доступ» в Safari: откройте приложение с иконки на экране
          «Домой».
        </p>
        <p className="muted">Подробности: {state.reason}</p>
      </div>
    )
  }
  return <DiaryStoreContext.Provider value={state.store}>{children}</DiaryStoreContext.Provider>
}
