import { useCallback, useEffect, useRef, useState } from 'react'
import { emptyDayEntry, type DayEntry } from '../card/dayEntry.ts'
import type { IsoDate } from '../card/dates.ts'
import { describeError } from './describeError.ts'
import { useDiaryStore } from './diaryStoreContext.ts'

export interface DayDraft {
  /** The editing copy of the day; null while the stored entry is loading. */
  draft: DayEntry | null
  /** Applies a change to the draft and saves the result at once (autosave). */
  change: (update: (entry: DayEntry) => DayEntry) => void
  error: string | null
}

/**
 * The editing copy of one day. Every change is saved immediately, so nothing is lost when the app is
 * closed in the middle of filling in. The draft, not a re-read record, stays on screen while editing:
 * the stored form drops blank substance rows, and re-reading would remove a row the user is typing into.
 */
export function useDayDraft(date: IsoDate): DayDraft {
  const store = useDiaryStore()
  const [loaded, setLoaded] = useState<DayEntry | null>(null)
  const [error, setError] = useState<string | null>(null)
  // The latest draft, read by change() so that two quick taps do not both start from the same old copy.
  const latest = useRef<DayEntry | null>(null)

  useEffect(() => {
    let cancelled = false
    latest.current = null
    store.loadDay(date).then(
      (entry) => {
        if (cancelled) return
        const draft = entry ?? emptyDayEntry(date)
        latest.current = draft
        setLoaded(draft)
        setError(null)
      },
      (failure: unknown) => {
        if (!cancelled) setError(`Не удалось загрузить день: ${describeError(failure)}`)
      },
    )
    return () => {
      cancelled = true
    }
  }, [store, date])

  const change = useCallback(
    (update: (entry: DayEntry) => DayEntry) => {
      const current = latest.current
      if (!current) return
      const next = update(current)
      latest.current = next
      setLoaded(next)
      store.saveDay(next).then(
        () => setError(null),
        (failure: unknown) => setError(`Не удалось сохранить: ${describeError(failure)}`),
      )
    },
    [store],
  )

  return { draft: loaded?.date === date ? loaded : null, change, error }
}
