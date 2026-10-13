import { formatTime } from '../lib/image'
import { nickColor } from '../lib/nickname'
import type { Message } from '../services/types'
import { IconAlert, IconImage, IconRefresh, IconUndo, IconX } from './Icons'

interface Props {
  message: Pick<Message, 'nickname' | 'text' | 'imageUrl' | 'createdAt'>
  mine: boolean
  /** 只有自己的訊息會傳入 */
  onRetract?: () => void
  onOpenImage?: (url: string) => void
  /** 送出失敗的訊息 */
  failed?: { onRetry: () => void; onDismiss: () => void }
}

export function MessageBubble({ message, mine, onRetract, onOpenImage, failed }: Props) {
  const color = nickColor(message.nickname)
  const nick = (
    <span className="nick" style={{ color }}>
      {message.nickname}
      {mine ? '(你)' : ''}
    </span>
  )
  const time = <span>{formatTime(message.createdAt)}</span>

  return (
    <div className={`row${mine ? ' row--me' : ''}`}>
      <div className="meta">
        {mine ? (
          <>
            {time}
            {nick}
          </>
        ) : (
          <>
            {nick}
            {time}
          </>
        )}
      </div>

      {message.imageUrl && (
        <button
          type="button"
          className="img"
          aria-label="放大圖片"
          onClick={() => onOpenImage?.(message.imageUrl!)}
        >
          <img src={message.imageUrl} alt="" loading="lazy" />
        </button>
      )}
      {message.text && <div className={`bubble${failed ? ' bubble--failed' : ''}`}>{message.text}</div>}
      {!message.text && !message.imageUrl && (
        <div className="bubble bubble--failed">
          <IconImage /> 圖片
        </div>
      )}

      {onRetract && !failed && (
        <button type="button" className="link-btn" aria-label="收回這則訊息" onClick={onRetract}>
          <IconUndo style={{ width: 14, height: 14 }} />
          收回
        </button>
      )}

      {failed && (
        <div className="fail">
          <IconAlert style={{ width: 14, height: 14 }} />
          送出失敗
          <button type="button" className="link-btn link-btn--danger" onClick={failed.onRetry}>
            <IconRefresh style={{ width: 14, height: 14 }} />
            重送
          </button>
          <button type="button" className="link-btn" onClick={failed.onDismiss}>
            <IconX style={{ width: 14, height: 14 }} />
            移除
          </button>
        </div>
      )}
    </div>
  )
}
