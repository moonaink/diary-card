import { createContext, useContext } from 'react'
import type { DiaryStore } from '../storage/diaryStore.ts'

export const DiaryStoreContext = createContext<DiaryStore | null>(null)

/** The app-wide store. Screens read and write records only through it. */
export function useDiaryStore(): DiaryStore {
  const store = useContext(DiaryStoreContext)
  if (!store) throw new Error('useDiaryStore must be used inside StoreProvider')
  return store
}
