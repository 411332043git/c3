import { useState } from 'react'
import type { DevTools } from '../services/ChatService'
import { IconWrench, IconX } from './Icons'

// 階段一專用的測試面板:模擬真實環境裡不容易重現的情況。
// 只有假服務(有 dev 工具)才會顯示,接上 Supabase 後自動消失。
export function DevPanel({ dev, connected }: { dev: DevTools; connected: boolean }) {
  const [open, setOpen] = useState(false)
  const [armed, setArmed] = useState(false)

  if (!open) {
    return (
      <button type="button" className="dev__toggle" onClick={() => setOpen(true)}>
        <IconWrench style={{ width: 16, height: 16 }} />
        測試工具
      </button>
    )
  }

  return (
    <section className="dev" aria-label="測試工具">
      <div className="dev__head">
        <strong>測試工具</strong>
        <button type="button" className="icon-btn" aria-label="收起測試工具" onClick={() => setOpen(false)}>
          <IconX style={{ width: 18, height: 18 }} />
        </button>
      </div>
      <p className="muted dev__note">階段一專用,用來模擬真實情況。</p>
      <button type="button" className="btn btn--sm" onClick={() => dev.botSpeak()}>
        讓別人說一句話
      </button>
      {connected ? (
        <button type="button" className="btn btn--sm" onClick={() => dev.disconnect()}>
          模擬斷線
        </button>
      ) : (
        <button type="button" className="btn btn--sm" onClick={() => dev.reconnect()}>
          恢復連線
        </button>
      )}
      <button
        type="button"
        className="btn btn--sm"
        aria-pressed={armed}
        onClick={() => {
          dev.failNextSend()
          setArmed(true)
          setTimeout(() => setArmed(false), 4000)
        }}
      >
        {armed ? '下一則會失敗' : '讓下一則送出失敗'}
      </button>
    </section>
  )
}
