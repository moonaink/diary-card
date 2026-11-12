interface ScaleButtonsProps {
  max: number
  value: number | undefined
  /** Called with undefined when the chosen value is tapped again: the cell becomes blank. */
  onChange: (value: number | undefined) => void
  label: string
}

/** A row of round buttons 0..max. Tapping the chosen value again clears it. */
export function ScaleButtons({ max, value, onChange, label }: ScaleButtonsProps) {
  const values = Array.from({ length: max + 1 }, (_, i) => i)
  return (
    <div
      className="scale"
      role="group"
      aria-label={label}
      style={{ gridTemplateColumns: `repeat(${values.length}, 1fr)` }}
    >
      {values.map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(value === v ? undefined : v)}
        >
          {v}
        </button>
      ))}
    </div>
  )
}
