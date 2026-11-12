import { useCallback, useEffect, useState } from 'react'
import {
  WEEKDAY_SHORT_LABELS,
  addDays,
  isIsoDate,
  weekDates,
  weekStartOf,
  type IsoDate,
} from '../card/dates.ts'
import {
  FILL_FREQUENCY_OPTIONS,
  buildWeekCard,
  type WeekCard,
  type WeekHeader,
} from '../card/weekCard.ts'
import { formatShortDate, formatWeekTitle } from './dateLabels.ts'
import { Bow, Heart } from './decorations.tsx'
import { deliverFile } from './deliverFile.ts'
import { describeError } from './describeError.ts'
import { useDiaryStore } from './diaryStoreContext.ts'

interface WeekScreenProps {
  weekStart: IsoDate
  today: IsoDate
  onOpenDay: (date: IsoDate) => void
  onChangeWeek: (weekStart: IsoDate) => void
}

type ExportState =
  | { status: 'idle' }
  | { status: 'working' }
  | { status: 'ready'; file: File }
  | { status: 'done'; message: string }
  | { status: 'failed'; message: string }

export function WeekScreen({ weekStart, today, onOpenDay, onChangeWeek }: WeekScreenProps) {
  const store = useDiaryStore()
  const [card, setCard] = useState<WeekCard | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [exportState, setExportState] = useState<ExportState>({ status: 'idle' })

  const reload = useCallback(async () => {
    const [days, header, settings] = await Promise.all([
      store.loadDaysBetween(weekStart, addDays(weekStart, 6)),
      store.loadWeekHeader(weekStart),
      store.loadSettings(),
    ])
    return buildWeekCard(weekStart, days, header, settings)
  }, [store, weekStart])

  useEffect(() => {
    let cancelled = false
    reload().then(
      (loaded) => {
        if (!cancelled) setCard(loaded)
      },
      (error: unknown) => {
        if (!cancelled) setLoadError(`Не удалось загрузить неделю: ${describeError(error)}`)
      },
    )
    return () => {
      cancelled = true
    }
  }, [reload])

  const saveHeader = (header: WeekHeader) => {
    setCard((current) => (current ? { ...current, header } : current))
    store
      .saveWeekHeader(header)
      .catch((error: unknown) => setLoadError(`Не удалось сохранить: ${describeError(error)}`))
  }

  const deliver = async (file: File) => {
    const outcome = await deliverFile(file)
    if (outcome === 'needsTap') setExportState({ status: 'ready', file })
    else if (outcome === 'cancelled') setExportState({ status: 'idle' })
    else
      setExportState({
        status: 'done',
        message: outcome === 'shared' ? 'PDF отправлен' : 'PDF скачан',
      })
  }

  const exportPdf = async () => {
    setExportState({ status: 'working' })
    try {
      // Read the week again so the PDF never shows values older than the stored ones.
      const fresh = await reload()
      setCard(fresh)
      // The PDF library is most of the app's code; it loads on the first export, not on start.
      const [{ renderCardPdf, cardPdfFileName }, { loadPdfFonts }] = await Promise.all([
        import('../pdf/renderCardPdf.ts'),
        import('../pdf/pdfFonts.ts'),
      ])
      const bytes = await renderCardPdf(fresh, await loadPdfFonts())
      const file = new File([bytes as Uint8Array<ArrayBuffer>], cardPdfFileName(fresh), {
        type: 'application/pdf',
      })
      await deliver(file)
    } catch (error) {
      setExportState({
        status: 'failed',
        message: `Не удалось создать PDF: ${describeError(error)}`,
      })
    }
  }

  const currentWeek = weekStartOf(today)
  const frequencyLabel = FILL_FREQUENCY_OPTIONS.find((o) => o.value === card?.fillFrequency)?.label

  return (
    <>
      <header className="topbar">
        <button
          type="button"
          className="nav-button"
          aria-label="Предыдущая неделя"
          onClick={() => onChangeWeek(addDays(weekStart, -7))}
        >
          ‹
        </button>
        <div className="topbar-title">
          <h1>{formatWeekTitle(weekStart)}</h1>
          {weekStart === currentWeek ? (
            <span className="today-badge">эта неделя</span>
          ) : (
            <button type="button" className="link-button" onClick={() => onChangeWeek(currentWeek)}>
              к этой неделе
            </button>
          )}
        </div>
        <button
          type="button"
          className="nav-button"
          aria-label="Следующая неделя"
          disabled={weekStart >= currentWeek}
          onClick={() => onChangeWeek(addDays(weekStart, 7))}
        >
          ›
        </button>
      </header>

      {loadError && <p className="notice error">{loadError}</p>}

      {card === null ? (
        <div className="loading">
          <Bow size={48} />
        </div>
      ) : (
        <>
          <section className="card-section">
            <ul className="week-days">
              {weekDates(weekStart).map((date, i) => {
                const filled = card.days[i] !== null
                const future = date > today
                return (
                  <li key={date}>
                    <button
                      type="button"
                      className={filled ? 'week-day filled' : 'week-day'}
                      disabled={future}
                      onClick={() => onOpenDay(date)}
                    >
                      <span className="week-day-name">{WEEKDAY_SHORT_LABELS[i]}</span>
                      <span className="week-day-date">{formatShortDate(date)}</span>
                      <span className="week-day-status">
                        {future ? (
                          '—'
                        ) : (
                          <>
                            <Heart size={18} filled={filled} /> {filled ? 'заполнен' : 'пусто'}
                          </>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="card-section">
            <div className="section-title">
              <Bow size={30} />
              <div>
                <h2>Шапка карточки</h2>
              </div>
            </div>
            <div className="field">
              <div className="field-label">Имя</div>
              <p className="value">{card.name || 'не указано — его можно ввести в настройках'}</p>
            </div>
            <div className="field">
              <div className="field-label">Вы заполняете дневник во время сессии?</div>
              <div className="choice" role="group" aria-label="Заполняете во время сессии">
                {[true, false].map((value) => (
                  <button
                    key={String(value)}
                    type="button"
                    aria-pressed={card.header.duringSession === value}
                    onClick={() => {
                      const header = { ...card.header }
                      if (header.duringSession === value) delete header.duringSession
                      else header.duringSession = value
                      saveHeader(header)
                    }}
                  >
                    {value ? 'Да' : 'Нет'}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <div className="field-label">Как часто вы заполняете эту сторону в неделю?</div>
              <p className="value">{frequencyLabel ?? 'пока ни одного заполненного дня'}</p>
              <p className="hint">Считается само по числу заполненных дней.</p>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="start-date">
                Дата начала заполнения
              </label>
              <input
                id="start-date"
                className="input"
                type="date"
                value={card.header.startDate ?? ''}
                onChange={(event) => {
                  const header = { ...card.header }
                  if (isIsoDate(event.target.value)) header.startDate = event.target.value
                  else delete header.startDate
                  saveHeader(header)
                }}
              />
            </div>
          </section>

          <button
            type="button"
            className="button wide"
            disabled={exportState.status === 'working'}
            onClick={exportPdf}
          >
            {exportState.status === 'working' ? 'Готовлю PDF…' : 'Скачать PDF'}
          </button>
          {exportState.status === 'ready' && (
            <button
              type="button"
              className="button secondary wide"
              onClick={() => deliver(exportState.file)}
            >
              PDF готов — открыть «Поделиться»
            </button>
          )}
          {exportState.status === 'done' && <p className="notice">{exportState.message}</p>}
          {exportState.status === 'failed' && <p className="notice error">{exportState.message}</p>}
        </>
      )}
    </>
  )
}
