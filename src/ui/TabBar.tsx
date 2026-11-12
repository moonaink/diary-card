import type { ReactNode } from 'react'
import { CalendarIcon, GearIcon, Heart } from './decorations.tsx'

export type Tab = 'day' | 'week' | 'settings'

const TABS: { tab: Tab; label: string; icon: ReactNode }[] = [
  { tab: 'day', label: 'День', icon: <Heart size={24} /> },
  { tab: 'week', label: 'Неделя', icon: <CalendarIcon size={24} /> },
  { tab: 'settings', label: 'Настройки', icon: <GearIcon size={24} /> },
]

export function TabBar({ active, onSelect }: { active: Tab; onSelect: (tab: Tab) => void }) {
  return (
    <nav className="tabbar" aria-label="Разделы">
      {TABS.map(({ tab, label, icon }) => (
        <button
          key={tab}
          type="button"
          aria-current={active === tab ? 'page' : undefined}
          onClick={() => onSelect(tab)}
        >
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
