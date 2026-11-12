import { SUBSTANCE_CATEGORIES, type SubstanceCategory } from '../card/cardColumns.ts'
import { addSubstance, applySubstance, removeSubstance, type DayEntry } from '../card/dayEntry.ts'

interface SubstanceEditorProps {
  entry: DayEntry
  suggestions: Record<SubstanceCategory, string[]>
  onChange: (update: (entry: DayEntry) => DayEntry) => void
}

/** Entries «название + количество» per category; names entered before are offered as suggestions. */
export function SubstanceEditor({ entry, suggestions, onChange }: SubstanceEditorProps) {
  return (
    <div className="substances">
      {SUBSTANCE_CATEGORIES.map(({ key, label }) => {
        const rows = entry.substances[key] ?? []
        const listId = `substance-names-${key}`
        return (
          <div className="substance-category" key={key}>
            <div className="field-label">{label}</div>
            {rows.map((row, index) => (
              <div className="substance-row" key={index}>
                <input
                  className="input"
                  placeholder="Название"
                  aria-label={`${label}: название`}
                  list={listId}
                  value={row.name}
                  onChange={(event) => {
                    // Read now: the update may run later (after a confirmation), when the controlled
                    // input has already been reset to the stored value.
                    const name = event.target.value
                    onChange((e) => applySubstance(e, key, index, { name }))
                  }}
                />
                <input
                  className="input quantity"
                  placeholder="Кол-во"
                  aria-label={`${label}: количество`}
                  value={row.quantity}
                  onChange={(event) => {
                    const quantity = event.target.value
                    onChange((e) => applySubstance(e, key, index, { quantity }))
                  }}
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Удалить: ${row.name || label}`}
                  onClick={() => onChange((e) => removeSubstance(e, key, index))}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className="add-button"
              onClick={() => onChange((e) => addSubstance(e, key))}
            >
              + Добавить
            </button>
            <datalist id={listId}>
              {suggestions[key].map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
        )
      })}
    </div>
  )
}
