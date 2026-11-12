// Decorations of the kawaii style, drawn for this app.

interface IconProps {
  size?: number
  className?: string
}

export function Bow({ size = 32, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 48"
      width={size}
      height={(size * 48) / 64}
      className={className}
      aria-hidden="true"
    >
      <path d="M29 27 L19 45 L26 42 L29 47 L33 28 Z" fill="var(--bow-dark)" />
      <path d="M35 27 L45 45 L38 42 L35 47 L31 28 Z" fill="var(--bow-dark)" />
      <path d="M32 22 C23 8 5 3 4 17 C3 31 22 31 32 25 Z" fill="var(--bow)" />
      <path d="M32 22 C41 8 59 3 60 17 C61 31 42 31 32 25 Z" fill="var(--bow)" />
      <ellipse cx="14" cy="14" rx="5" ry="3" fill="#fff" opacity="0.45" />
      <ellipse cx="50" cy="14" rx="5" ry="3" fill="#fff" opacity="0.45" />
      <ellipse cx="32" cy="23.5" rx="6.5" ry="6" fill="var(--bow-dark)" />
      <ellipse cx="30" cy="21.5" rx="2" ry="1.5" fill="#fff" opacity="0.5" />
    </svg>
  )
}

export function Heart({ size = 16, className, filled = true }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <path
        d="M12 21C5.5 15.4 2 12 2 8.2 2 5.3 4.3 3 7.1 3c1.9 0 3.7 1 4.9 2.6C13.2 4 15 3 16.9 3 19.7 3 22 5.3 22 8.2 22 12 18.5 15.4 12 21Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 2}
      />
    </svg>
  )
}

export function CalendarIcon({ size = 24, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M12 18.5c-2.6-2.1-3.8-3.3-3.8-4.6 0-1 .8-1.8 1.8-1.8.8 0 1.5.4 2 1.1.5-.7 1.2-1.1 2-1.1 1 0 1.8.8 1.8 1.8 0 1.3-1.2 2.5-3.8 4.6Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function GearIcon({ size = 24, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.9 1.9M16.6 16.6l1.9 1.9M5.5 18.5l1.9-1.9M16.6 7.4l1.9-1.9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
