import type { ReactNode } from 'react'
import { Bow } from './decorations.tsx'

interface ConfirmDialogProps {
  title: string
  children?: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <Bow size={44} className="dialog-bow" />
        <h2>{title}</h2>
        {children}
        <div className="dialog-actions">
          <button type="button" className="button secondary" onClick={onCancel}>
            Отмена
          </button>
          <button type="button" className="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
