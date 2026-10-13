import { useEffect, useRef } from 'react'
import { IconX } from './Icons'

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
}

interface ConfirmProps {
  title: string
  body: string
  confirmLabel: string
  busy?: boolean
  error?: string | null
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({ title, body, confirmLabel, busy, error, onCancel, onConfirm }: ConfirmProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEscape(onCancel)
  useEffect(() => cancelRef.current?.focus(), [])

  return (
    <div className="overlay" onClick={onCancel}>
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dlg-title"
        aria-describedby="dlg-body"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="dlg-title">{title}</h3>
        <p id="dlg-body" className="muted">
          {body}
        </p>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="dialog__actions">
          <button ref={cancelRef} type="button" className="btn" onClick={onCancel}>
            取消
          </button>
          <button type="button" className="btn btn--danger" disabled={busy} onClick={onConfirm}>
            {busy ? '處理中…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ImageViewer({ url, onClose }: { url: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEscape(onClose)
  useEffect(() => closeRef.current?.focus(), [])

  return (
    <div className="overlay overlay--dark" onClick={onClose}>
      <div className="viewer" role="dialog" aria-modal="true" aria-label="圖片">
        <img src={url} alt="" onClick={(e) => e.stopPropagation()} />
        <button ref={closeRef} type="button" className="icon-btn viewer__close" aria-label="關閉" onClick={onClose}>
          <IconX />
        </button>
      </div>
    </div>
  )
}
