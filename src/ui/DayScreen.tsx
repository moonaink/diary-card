import { useEffect, useState } from 'react'
import {
  ACTION_LABELS,
  EMOTIONS,
  RATING_MAX,
  SKILLS_USE_MAX,
  SKILLS_USE_SCALE,
  STATES,
  SUBSTANCES_TITLE,
  ACTIONS_TITLE,
  URGES,
  type RatingGroup,
  type SubstanceCategory,
} from '../card/cardColumns.ts'
import { addDays, isInPastWeek, type IsoDate } from '../card/dates.ts'
import {
  applyLies,
  applyRating,
  applySelfHarm,
  applySkillsUse,
  emptyDayEntry,
  isDayEntryEmpty,
  type DayEntry,
} from '../card/dayEntry.ts'
import { collectAllSubstanceNames } from '../card/weekCard.ts'
import { ConfirmDialog } from './ConfirmDialog.tsx'
import { formatDayTitle } from './dateLabels.ts'
import { Bow, Heart } from './decorations.tsx'
import { useDiaryStore } from './diaryStoreContext.ts'
import { ScaleButtons } from './ScaleButtons.tsx'
import { SubstanceEditor } from './SubstanceEditor.tsx'
import { useDayDraft } from './useDayDraft.ts'

interface DayScreenProps {
  date: IsoDate
  today: IsoDate
  onSelectDate: (date: IsoDate) => void
}

type Update = (entry: DayEntry) => DayEntry

export function DayScreen({ date, today, onSelectDate }: DayScreenProps) {
  const { draft, change, error } = useDayDraft(date)
  const suggestions = useSubstanceSuggestions()
  const [unlockedDate, setUnlockedDate] = useState<IsoDate | null>(null)
  const [pending, setPending] = useState<{ update: Update; clearing: boolean } | null>(null)

  // A day of a past week changes only after a confirmation, asked once per opened day.
  const needsConfirmation = isInPastWeek(date, today) && unlockedDate !== date
  const guardedChange = (update: Update) => {
    if (needsConfirmation) setPending({ update, clearing: false })
    else change(update)
  }

  return (
    <>
      <header className="topbar">
        <button
          type="button"
          className="nav-button"
          aria-label="Предыдущий день"
          onClick={() => onSelectDate(addDays(date, -1))}
        >
          ‹
        </button>
        <div className="topbar-title">
          <h1>{formatDayTitle(date, today)}</h1>
          {date === today ? (
            <span className="today-badge">сегодня</span>
          ) : (
            <button type="button" className="link-button" onClick={() => onSelectDate(today)}>
              к сегодняшнему дню
            </button>
          )}
        </div>
        <button
          type="button"
          className="nav-button"
          aria-label="Следующий день"
          disabled={date >= today}
          onClick={() => onSelectDate(addDays(date, 1))}
        >
          ›
        </button>
      </header>

      {error && <p className="notice error">{error}</p>}
      {isInPastWeek(date, today) && (
        <p className="notice">
          Это день прошлой недели — перед изменением приложение спросит подтверждение.
        </p>
      )}

      {draft === null ? (
        <div className="loading">
          <Bow size={48} />
        </div>
      ) : (
        <DayForm entry={draft} suggestions={suggestions} onChange={guardedChange} />
      )}

      {draft !== null && !isDayEntryEmpty(draft) && (
        <button
          type="button"
          className="button secondary wide"
          onClick={() => setPending({ update: () => emptyDayEntry(date), clearing: true })}
        >
          Очистить день
        </button>
      )}

      {pending && (
        <ConfirmDialog
          title={pending.clearing ? 'Очистить этот день?' : 'Изменить запись за прошлую неделю?'}
          confirmLabel={pending.clearing ? 'Очистить' : 'Изменить'}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            if (isInPastWeek(date, today)) setUnlockedDate(date)
            change(pending.update)
            setPending(null)
          }}
        >
          <p>
            {pending.clearing
              ? 'Все значения дня будут удалены, день станет незаполненным.'
              : 'Неделя уже закончилась. После подтверждения этот день можно будет менять, пока он открыт.'}
          </p>
        </ConfirmDialog>
      )}
    </>
  )
}

function DayForm({
  entry,
  suggestions,
  onChange,
}: {
  entry: DayEntry
  suggestions: Record<SubstanceCategory, string[]>
  onChange: (update: Update) => void
}) {
  const filled = !isDayEntryEmpty(entry)
  return (
    <>
      <p className={filled ? 'day-status filled' : 'day-status'}>
        <Heart size={16} filled={filled} /> {filled ? 'День заполнен' : 'День пока не заполнен'}
      </p>

      <RatingSection group={URGES} entry={entry} onChange={onChange} />
      <RatingSection group={STATES} entry={entry} onChange={onChange} />

      <section className="card-section">
        <SectionTitle title={SUBSTANCES_TITLE} />
        <SubstanceEditor entry={entry} suggestions={suggestions} onChange={onChange} />
      </section>

      <section className="card-section">
        <SectionTitle title={ACTIONS_TITLE} />
        <div className="field">
          <div className="field-label">{ACTION_LABELS.selfHarm}</div>
          <div className="choice" role="group" aria-label={ACTION_LABELS.selfHarm}>
            {[false, true].map((value) => (
              <button
                key={String(value)}
                type="button"
                aria-pressed={entry.selfHarm === value}
                onClick={() =>
                  onChange((e) => applySelfHarm(e, e.selfHarm === value ? undefined : value))
                }
              >
                {value ? 'Да' : 'Нет'}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <div className="field-label">{ACTION_LABELS.lies}</div>
          <div className="stepper">
            <button
              type="button"
              aria-label="Меньше"
              disabled={entry.lies === undefined}
              onClick={() =>
                onChange((e) =>
                  applyLies(e, e.lies === undefined || e.lies === 0 ? undefined : e.lies - 1),
                )
              }
            >
              −
            </button>
            <output aria-live="polite">{entry.lies ?? '—'}</output>
            <button
              type="button"
              aria-label="Больше"
              onClick={() => onChange((e) => applyLies(e, (e.lies ?? -1) + 1))}
            >
              +
            </button>
          </div>
        </div>
        <div className="field">
          <div className="field-label">{ACTION_LABELS.skillsUse}</div>
          <ScaleButtons
            max={SKILLS_USE_MAX}
            value={entry.skillsUse}
            label={ACTION_LABELS.skillsUse}
            onChange={(value) => onChange((e) => applySkillsUse(e, value))}
          />
          {entry.skillsUse !== undefined && (
            <p className="hint">
              {entry.skillsUse} — {SKILLS_USE_SCALE[entry.skillsUse]}
            </p>
          )}
        </div>
      </section>

      <RatingSection group={EMOTIONS} entry={entry} onChange={onChange} />
    </>
  )
}

function RatingSection({
  group,
  entry,
  onChange,
}: {
  group: RatingGroup
  entry: DayEntry
  onChange: (update: Update) => void
}) {
  return (
    <section className="card-section">
      <SectionTitle title={group.title} subtitle={group.subtitle} />
      {group.fields.map((field) => (
        <div className="field" key={field.key}>
          <div className="field-label">{field.label}</div>
          <ScaleButtons
            max={RATING_MAX}
            value={entry.ratings[field.key]}
            label={field.label}
            onChange={(value) => onChange((e) => applyRating(e, field.key, value))}
          />
        </div>
      ))}
    </section>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="section-title">
      <Bow size={30} />
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  )
}

const NO_SUGGESTIONS = collectAllSubstanceNames([])

/** Substance names from all stored days, read once per opened day screen. */
function useSubstanceSuggestions(): Record<SubstanceCategory, string[]> {
  const store = useDiaryStore()
  const [names, setNames] = useState(NO_SUGGESTIONS)
  useEffect(() => {
    let cancelled = false
    store.loadAllDays().then(
      (days) => {
        if (!cancelled) setNames(collectAllSubstanceNames(days))
      },
      // Suggestions are a convenience; without them the fields still work.
      () => undefined,
    )
    return () => {
      cancelled = true
    }
  }, [store])
  return names
}
