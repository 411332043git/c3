import { useLayoutEffect, useRef, useState } from 'react'
import type { ChatErrorCode, Message } from '../services/types'
import { IconArrowDown } from './Icons'
import { MessageBubble } from './MessageBubble'

export type ChatItem =
  | { kind: 'msg'; id: string; message: Message }
  | { kind: 'sys'; id: string; text: string }
  | {
      kind: 'failed'
      id: string
      nickname: string
      text: string
      image?: File
      previewUrl?: string
      createdAt: string
      error: ChatErrorCode
    }

interface Props {
  items: ChatItem[]
  myUserId: string
  onRetract: (id: string) => void
  onRetry: (id: string) => void
  onDismiss: (id: string) => void
  onOpenImage: (url: string) => void
}

const BOTTOM_THRESHOLD = 80

export function MessageList({ items, myUserId, onRetract, onRetry, onDismiss, onOpenImage }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const atBottom = useRef(true)
  const prevLen = useRef(0)
  const [hasNew, setHasNew] = useState(false)

  function scrollToBottom(smooth = false) {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ top: el.scrollHeight, behavior: smooth && !reduce ? 'smooth' : 'auto' })
  }

  function onScroll() {
    const el = ref.current
    if (!el) return
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD
    if (atBottom.current) setHasNew(false)
  }

  useLayoutEffect(() => {
    const grew = items.length > prevLen.current
    const first = prevLen.current === 0
    const last = items[items.length - 1]
    const mine = last && ((last.kind === 'msg' && last.message.userId === myUserId) || last.kind === 'failed')
    if (grew) {
      if (first || atBottom.current || mine) {
        scrollToBottom()
        setHasNew(false)
      } else if (last?.kind === 'msg') {
        setHasNew(true)
      }
    }
    prevLen.current = items.length
  }, [items, myUserId])

  return (
    <div className="list-wrap">
      <div
        ref={ref}
        className="list"
        role="log"
        aria-live="polite"
        aria-label="聊天訊息"
        onScroll={onScroll}
        tabIndex={0}
      >
        {items.length === 0 && (
          <div className="empty">
            <span>還沒有人說話,你先開始吧</span>
          </div>
        )}
        {items.map((item) => {
          if (item.kind === 'sys') {
            return (
              <div key={item.id} className="sys">
                {item.text}
              </div>
            )
          }
          if (item.kind === 'failed') {
            return (
              <MessageBubble
                key={item.id}
                mine
                message={{
                  nickname: item.nickname,
                  text: item.text,
                  imageUrl: item.previewUrl,
                  createdAt: item.createdAt,
                }}
                onOpenImage={onOpenImage}
                failed={{ onRetry: () => onRetry(item.id), onDismiss: () => onDismiss(item.id) }}
              />
            )
          }
          const m = item.message
          const mine = m.userId === myUserId
          return (
            <MessageBubble
              key={item.id}
              message={m}
              mine={mine}
              onRetract={mine ? () => onRetract(m.id) : undefined}
              onOpenImage={onOpenImage}
            />
          )
        })}
      </div>

      {hasNew && (
        <button
          type="button"
          className="btn btn--pink new-msg"
          onClick={() => {
            scrollToBottom(true)
            setHasNew(false)
          }}
        >
          <IconArrowDown style={{ width: 16, height: 16 }} />
          有新訊息
        </button>
      )}
    </div>
  )
}
