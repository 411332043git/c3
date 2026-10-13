import type { ChatService } from './ChatService'
import { createMockChatService } from './mockChatService'

// 整個專案唯一決定「用哪個服務」的地方。
// 階段二:把這一行換成 createSupabaseChatService(),畫面程式不用改。
export const chat: ChatService = createMockChatService()
