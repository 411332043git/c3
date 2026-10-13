import type { ChatEventMap, ChatEventName, Message, PresenceUser } from './types'

export interface JoinResult {
  /** 自己的身分編號,畫面用它判斷「是不是我送的」 */
  userId: string
  /** 進入當下的完整線上名單(包含自己) */
  online: PresenceUser[]
}

/**
 * 聊天服務合約。畫面只呼叫這裡列出的功能,不知道背後是假資料還是 Supabase。
 * 階段一:mockChatService。階段二:supabaseChatService。
 */
export interface ChatService {
  /** 失敗代碼:NICKNAME_INVALID、NICKNAME_TAKEN、ROOM_FULL、NETWORK */
  join(nickname: string): Promise<JoinResult>
  leave(): Promise<void>
  loadRecent(limit: number): Promise<Message[]>
  /** 取得某個時間之後的訊息。斷線重連時由服務自己用來補訊息 */
  loadSince(time: string): Promise<Message[]>
  /** 失敗代碼:RATE_LIMITED、TEXT_TOO_LONG、IMAGE_TYPE、IMAGE_TOO_BIG、NETWORK */
  send(text: string, image?: File): Promise<Message>
  /** 只能收回自己的訊息 */
  retract(messageId: string): Promise<void>
  /** 訂閱事件,回傳取消訂閱的函式 */
  on<K extends ChatEventName>(event: K, handler: (payload: ChatEventMap[K]) => void): () => void
  /** 只有假服務才有。用來在階段一模擬各種異常情況 */
  dev?: DevTools
}

export interface DevTools {
  isOffline(): boolean
  disconnect(): void
  reconnect(): void
  failNextSend(): void
  botSpeak(): void
}
