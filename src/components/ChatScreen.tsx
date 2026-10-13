import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '../App'
import { chat } from '../services'
import {
  ERROR_TEXT,
  LIMITS,
  toChatError,
  type ChatErrorCode,
  type Message,
  type PresenceUser,
} from '../services/types'
import { Composer } from './Composer'
import { ConnectionBanner } from './ConnectionBanner'
import { DevPanel } from './DevPanel'
import { ConfirmDialog, ImageViewer } from './Dialogs'
import { IconChat, IconChevron, IconLogout } from './Icons'
import { MessageList, type ChatItem } from './MessageList'
import { OnlineList } from './OnlineList'

interface Props {
  session: Session
  onLeave: () => void
}

const msgItem = (message: Message): ChatItem => ({ kind: 'msg', id: message.id, message })

/** 把新訊息加到列表尾端;已經有的(例如補訊息時重複收到)不會再加一次 */
function appendUnique(prev: ChatItem[], message: Message): ChatItem[] {
  return prev.some((i) => i.id === message.id) ? prev : [...prev, msgItem(message)]
}

let sysCounter = 0
const sysItem = (text: string): ChatItem => ({ kind: 'sys', id: `sys-${++sysCounter}`, text })

export function ChatScreen({ session, onLeave }: Props) {
  const { userId, nickname } = session
  const [items, setItems] = useState<ChatItem[]>([])
  const [online, setOnline] = useState<PresenceUser[]>(session.online)
  const [connected, setConnected] = useState(true)
  const [panelOpen, setPanelOpen] = useState(false)
  const [viewImage, setViewImage] = useState<string | null>(null)
  const [retractId, setRetractId] = useState<string | null>(null)
  const [retractBusy, setRetractBusy] = useState(false)
  const [retractError, setRetractError] = useState<string | null>(null)
  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(() => {
    let alive = true
    const offs = [
      chat.on('message:new', (m) => setItems((prev) => appendUnique(prev, m))),
      chat.on('message:retracted', ({ id }) => setItems((prev) => prev.filter((i) => i.id !== id))),
      chat.on('presence:join', (u) => {
        setOnline((prev) => (prev.some((x) => x.userId === u.userId) ? prev : [...prev, u]))
        setItems((prev) => [...prev, sysItem(`${u.nickname} 進來了`)])
      }),
      chat.on('presence:leave', (u) => {
        setOnline((prev) => prev.filter((x) => x.userId !== u.userId))
        setItems((prev) => [...prev, sysItem(`${u.nickname} 離開了`)])
      }),
      // 重連後整份名單換掉,不產生進出提示
      chat.on('presence:sync', (users) => setOnline(users)),
      chat.on('connection:lost', () => setConnected(false)),
      chat.on('connection:restored', () => setConnected(true)),
    ]
    chat
      .loadRecent(LIMITS.recentCount)
      .then((recent) => {
        if (!alive) return
        // 載入期間可能已經收到新訊息,合併時以 id 去重
        setItems((prev) => {
          const ids = new Set(recent.map((m) => m.id))
          return [...recent.map(msgItem), ...prev.filter((i) => !ids.has(i.id))]
        })
      })
      .catch(() => alive && setConnected(false))
    return () => {
      alive = false
      offs.forEach((off) => off())
    }
  }, [])

  const send = useCallback(
    async (text: string, image?: File): Promise<ChatErrorCode | null> => {
      try {
        const m = await chat.send(text, image)
        setItems((prev) => appendUnique(prev, m))
        return null
      } catch (e) {
        const code = toChatError(e).code
        if (code !== 'NETWORK') return code
        // 網路造成的失敗:留在列表上,讓使用者按「重送」
        setItems((prev) => [
          ...prev,
          {
            kind: 'failed',
            id: `failed-${Date.now()}`,
            nickname,
            text: text.trim(),
            image,
            previewUrl: image ? URL.createObjectURL(image) : undefined,
            createdAt: new Date().toISOString(),
            error: code,
          },
        ])
        return null
      }
    },
    [nickname],
  )

  function retry(id: string) {
    const failed = itemsRef.current.find((i) => i.id === id)
    if (!failed || failed.kind !== 'failed') return
    setItems((prev) => prev.filter((i) => i.id !== id))
    void send(failed.text, failed.image)
  }

  async function confirmRetract() {
    if (!retractId) return
    setRetractBusy(true)
    setRetractError(null)
    try {
      await chat.retract(retractId)
      setItems((prev) => prev.filter((i) => i.id !== retractId))
      setRetractId(null)
    } catch (e) {
      setRetractError(ERROR_TEXT[toChatError(e).code])
    } finally {
      setRetractBusy(false)
    }
  }

  const sorted = [...online].sort((a, b) => (a.userId === userId ? -1 : b.userId === userId ? 1 : 0))

  return (
    <div className="chat">
      <header className="chat__header">
        <div className="brand">
          <span className="logo">
            <IconChat />
          </span>
          <h1>隨口聊聊</h1>
        </div>
        <div className="chat__tools">
          <span className="online-count">
            <span className="dot dot--ok" />
            {online.length} 人在線上
          </span>
          <button
            type="button"
            className={`btn online-toggle${panelOpen ? ' is-open' : ''}`}
            aria-expanded={panelOpen}
            aria-controls="online-panel"
            onClick={() => setPanelOpen((v) => !v)}
          >
            <span className={`dot ${connected ? 'dot--ok' : 'dot--off'}`} />
            {online.length} 人在線上
            <IconChevron up={panelOpen} style={{ width: 16, height: 16 }} />
          </button>
          <button type="button" className="btn leave" onClick={onLeave} aria-label="離開聊天室">
            <IconLogout />
            <span>離開</span>
          </button>
        </div>
      </header>

      {!connected && <ConnectionBanner />}

      <div className="chat__body">
        <main className="chat__main">
          <MessageList
            items={items}
            myUserId={userId}
            onRetract={(id) => {
              setRetractError(null)
              setRetractId(id)
            }}
            onRetry={retry}
            onDismiss={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
            onOpenImage={setViewImage}
          />
          <Composer disabled={!connected} onSend={send} />
        </main>

        {panelOpen && <div className="scrim" onClick={() => setPanelOpen(false)} />}
        <aside id="online-panel" className={`online${panelOpen ? ' is-open' : ''}`} aria-label="線上名單">
          <OnlineList users={sorted} myUserId={userId} />
        </aside>
      </div>

      {retractId && (
        <ConfirmDialog
          title="收回這則訊息?"
          body="收回後,所有人的畫面都會看不到它(包含圖片),無法復原。"
          confirmLabel="收回"
          busy={retractBusy}
          error={retractError}
          onCancel={() => setRetractId(null)}
          onConfirm={confirmRetract}
        />
      )}
      {viewImage && <ImageViewer url={viewImage} onClose={() => setViewImage(null)} />}
      {chat.dev && <DevPanel dev={chat.dev} connected={connected} />}
    </div>
  )
}
