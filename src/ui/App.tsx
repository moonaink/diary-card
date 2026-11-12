import { useState } from 'react'
import { weekStartOf, type IsoDate } from '../card/dates.ts'
import { DayScreen } from './DayScreen.tsx'
import { SettingsScreen } from './SettingsScreen.tsx'
import { StoreProvider } from './StoreProvider.tsx'
import { TabBar, type Tab } from './TabBar.tsx'
import { useToday } from './useToday.ts'
import { WeekScreen } from './WeekScreen.tsx'

export function App() {
  return (
    <StoreProvider>
      <DiaryApp />
    </StoreProvider>
  )
}

function DiaryApp() {
  const today = useToday()
  const [tab, setTab] = useState<Tab>('day')
  const [selectedDate, setSelectedDate] = useState<IsoDate>(today)
  const [openedOn, setOpenedOn] = useState<IsoDate>(today)

  // The app opens on today: when the date changes (the app resumed on a later day), jump to the new day.
  if (openedOn !== today) {
    setOpenedOn(today)
    setSelectedDate(today)
  }

  // Days after today cannot be filled in.
  const date = selectedDate > today ? today : selectedDate

  return (
    <div className="app">
      <main>
        {tab === 'day' && <DayScreen date={date} today={today} onSelectDate={setSelectedDate} />}
        {tab === 'week' && (
          <WeekScreen
            // A new week starts from a clean screen: no PDF state or values of the previous week.
            key={weekStartOf(date)}
            weekStart={weekStartOf(date)}
            today={today}
            onChangeWeek={setSelectedDate}
            onOpenDay={(day) => {
              setSelectedDate(day)
              setTab('day')
            }}
          />
        )}
        {tab === 'settings' && <SettingsScreen />}
      </main>
      <TabBar active={tab} onSelect={setTab} />
    </div>
  )
}
