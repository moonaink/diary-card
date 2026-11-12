import { useEffect, useState } from 'react'
import { toIsoDate, type IsoDate } from '../card/dates.ts'

/**
 * Today's date, updated when the date changes while the app is open and when the app returns from the
 * background: an installed app on the iPhone is often resumed days after it was last opened.
 */
export function useToday(): IsoDate {
  const [today, setToday] = useState(() => toIsoDate(new Date()))
  useEffect(() => {
    const refresh = () => setToday(toIsoDate(new Date()))
    const timer = window.setInterval(refresh, 60_000)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])
  return today
}
