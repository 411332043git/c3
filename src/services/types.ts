// 通訊約定:事件名稱、資料格式、錯誤代碼。
// 假服務(階段一)與 Supabase 服務(階段二)都必須遵守這份檔案,畫面程式只認這份約定。

export interface Message {
  id: string
  userId: string
  nickname: string
  text?: string
  imageUrl?: string
  /** ISO 8601 時間字串,以伺服器時間為準 */
  createdAt: string
}

export interface PresenceUser {
  userId: string
  nickname: string
}

export type ChatErrorCode =
  | 'NICKNAME_INVALID'
  | 'NICKNAME_TAKEN'
  | 'ROOM_FULL'
  | 'RATE_LIMITED'
  | 'TEXT_TOO_LONG'
  | 'IMAGE_TYPE'
  | 'IMAGE_TOO_BIG'
  | 'NETWORK'

export const ERROR_TEXT: Record<ChatErrorCode, string> = {
  NICKNAME_INVALID: '代號要 1 到 12 個字',
  NICKNAME_TAKEN: '這個代號有人在用了,請換一個',
  ROOM_FULL: '聊天室人數已滿,請稍後再試',
  RATE_LIMITED: '請稍等一下',
  TEXT_TOO_LONG: '訊息最多 200 字',
  IMAGE_TYPE: '只能傳 JPG、PNG、GIF',
  IMAGE_TOO_BIG: '圖片不能超過 2 MB',
  NETWORK: '連線失敗,請檢查網路後再試',
}

export class ChatError extends Error {
  readonly code: ChatErrorCode
  constructor(code: ChatErrorCode) {
    super(ERROR_TEXT[code])
    this.name = 'ChatError'
    this.code = code
  }
}

export function toChatError(e: unknown): ChatError {
  return e instanceof ChatError ? e : new ChatError('NETWORK')
}

/** 服務會發出的事件,以及每個事件帶的資料 */
export interface ChatEventMap {
  'message:new': Message
  'message:retracted': { id: string }
  'presence:join': PresenceUser
  'presence:leave': PresenceUser
  'presence:sync': PresenceUser[]
  'connection:lost': undefined
  'connection:restored': undefined
}

export type ChatEventName = keyof ChatEventMap

export const LIMITS = {
  nicknameMax: 12,
  textMax: 200,
  imageMaxBytes: 2 * 1024 * 1024,
  recentCount: 50,
  sendCooldownMs: 2000,
} as const

export const ALLOWED_IMAGE_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/gif']
