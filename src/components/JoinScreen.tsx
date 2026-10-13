import { useState, type FormEvent } from 'react'
import type { Session } from '../App'
import { charCount, validateNickname } from '../lib/nickname'
import { chat } from '../services'
import { ERROR_TEXT, LIMITS, toChatError, type ChatErrorCode } from '../services/types'
import { IconAlert, IconChat } from './Icons'

const STORAGE_KEY = 'chat.nickname'

function readSavedNickname(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function saveNickname(n: string) {
  try {
    localStorage.setItem(STORAGE_KEY, n)
  } catch {
    // 無痕模式等情況存不了,不影響使用
  }
}

export function JoinScreen({ onJoined }: { onJoined: (s: Session) => void }) {
  const [saved] = useState(readSavedNickname)
  const [nickname, setNickname] = useState(saved)
  const [error, setError] = useState<ChatErrorCode | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    const n = nickname.trim()
    const invalid = validateNickname(n)
    if (invalid) {
      setError(invalid)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { userId, online } = await chat.join(n)
      saveNickname(n)
      onJoined({ userId, nickname: n, online })
    } catch (err) {
      setError(toChatError(err).code)
      setBusy(false)
    }
  }

  const count = charCount(nickname)

  return (
    <main className="join">
      <div className="join__blob join__blob--a" aria-hidden="true" />
      <div className="join__blob join__blob--b" aria-hidden="true" />
      <div className="join__card">
        <div className="join__head">
          <span className="logo logo--lg">
            <IconChat />
          </span>
          <h1>隨口聊聊</h1>
          <p className="muted">不用註冊、不用登入。取一個代號,就能和大家聊天。</p>
        </div>

        <form className="join__form" onSubmit={submit} noValidate>
          <div className="field-group">
            <label htmlFor="nick">你的代號</label>
            <input
              id="nick"
              className={`field${error ? ' field--error' : ''}`}
              type="text"
              value={nickname}
              maxLength={LIMITS.nicknameMax * 2}
              autoComplete="off"
              autoFocus
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'nick-error' : 'nick-hint'}
              onChange={(e) => {
                setNickname(e.target.value)
                if (error) setError(null)
              }}
            />
            {error && (
              <div id="nick-error" role="alert" className="form-error">
                <IconAlert style={{ width: 16, height: 16 }} />
                {ERROR_TEXT[error]}
              </div>
            )}
            <div id="nick-hint" className="field-meta">
              <span>{saved && nickname === saved ? '1 到 12 個字・已填入上次的代號' : '1 到 12 個字'}</span>
              <span className={count > LIMITS.nicknameMax ? 'over' : undefined}>
                {count}/{LIMITS.nicknameMax}
              </span>
            </div>
          </div>
          <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
            {busy ? '進入中…' : '進入聊天室'}
          </button>
        </form>
      </div>
    </main>
  )
}
