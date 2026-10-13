import { useEffect, useLayoutEffect, useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent } from 'react'
import { formatSize, validateImage } from '../lib/image'
import { charCount } from '../lib/nickname'
import { ERROR_TEXT, LIMITS, type ChatErrorCode } from '../services/types'
import { IconAlert, IconClock, IconImage, IconSend, IconX } from './Icons'

interface Props {
  disabled: boolean
  /** 成功(或已轉成「送出失敗」訊息)回傳 null;需要留在輸入區讓使用者修改的錯誤回傳錯誤代碼 */
  onSend: (text: string, image?: File) => Promise<ChatErrorCode | null>
}

const SHOW_COUNTER_AT = 20

export function Composer({ disabled, onSend }: Props) {
  const [text, setText] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<ChatErrorCode | null>(null)
  const [sending, setSending] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const [dragging, setDragging] = useState(false)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // 文字框隨內容長高,最高約 5 行
  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }, [text])

  useEffect(() => {
    if (!image) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(image)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  useEffect(() => {
    if (error !== 'RATE_LIMITED') return
    const t = setTimeout(() => setError(null), LIMITS.sendCooldownMs)
    return () => clearTimeout(t)
  }, [error])

  const length = charCount(text)
  const remaining = LIMITS.textMax - length
  const empty = text.trim().length === 0 && !image
  const blocked = disabled || sending || cooldown || empty || remaining < 0

  function pickImage(file: File | undefined) {
    if (!file) return
    const bad = validateImage(file)
    if (bad) {
      setError(bad)
      return
    }
    setError(null)
    setImage(file)
  }

  async function submit() {
    if (disabled || sending || empty || remaining < 0) return
    if (cooldown) {
      setError('RATE_LIMITED')
      return
    }
    setSending(true)
    const err = await onSend(text, image ?? undefined)
    setSending(false)
    if (err) {
      setError(err)
      return
    }
    setText('')
    setImage(null)
    setError(null)
    setCooldown(true)
    setTimeout(() => setCooldown(false), LIMITS.sendCooldownMs)
    areaRef.current?.focus()
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // 手機上 Enter 是換行;電腦上 Enter 送出、Shift+Enter 換行。
    // isComposing:正在用注音等輸入法選字時,Enter 是「確定選字」,不能當成送出。
    const touch = window.matchMedia('(pointer: coarse)').matches
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && !touch) {
      e.preventDefault()
      void submit()
    }
  }

  function onPaste(e: ClipboardEvent) {
    const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith('image/'))
    if (file) {
      e.preventDefault()
      pickImage(file)
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    pickImage(Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/')))
  }

  return (
    <div className="composer">
      {error && (
        <div role={error === 'RATE_LIMITED' ? 'status' : 'alert'} className={error === 'RATE_LIMITED' ? 'hint hint--warn' : 'hint hint--error'}>
          {error === 'RATE_LIMITED' ? <IconClock style={{ width: 16, height: 16 }} /> : <IconAlert style={{ width: 16, height: 16 }} />}
          {ERROR_TEXT[error]}
        </div>
      )}

      <div
        className={`composer__box${dragging ? ' composer__box--drag' : ''}${remaining < 0 ? ' composer__box--over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {dragging && (
          <div className="composer__drop">
            <IconImage />
            放開即可加入圖片
          </div>
        )}

        {image && preview && (
          <div className="preview">
            <img src={preview} alt="" />
            <span className="preview__name">
              {image.name}
              <span className="muted">{formatSize(image.size)}</span>
            </span>
            <button type="button" className="icon-btn" aria-label="移除圖片" onClick={() => setImage(null)}>
              <IconX />
            </button>
          </div>
        )}

        <div className="composer__row">
          <button type="button" className="icon-btn" aria-label="選擇圖片" onClick={() => fileRef.current?.click()}>
            <IconImage />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif"
            hidden
            onChange={(e) => {
              pickImage(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <textarea
            ref={areaRef}
            rows={1}
            aria-label="輸入訊息"
            placeholder="說點什麼…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
          />
          {remaining <= SHOW_COUNTER_AT && (
            <span className={remaining < 0 ? 'counter counter--over' : 'counter'} aria-live="polite">
              {remaining < 0 ? `超過 ${-remaining} 字` : `剩 ${remaining} 字`}
            </span>
          )}
          <button type="button" className="send" aria-label="送出" disabled={blocked} onClick={() => void submit()}>
            <IconSend />
          </button>
        </div>
      </div>

      <div className="composer__tip">Enter 送出・Shift+Enter 換行・也可以貼上或拖進圖片</div>
    </div>
  )
}
