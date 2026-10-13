import { validateImage } from '../lib/image'
import { validateNickname } from '../lib/nickname'
import type { ChatService, DevTools, JoinResult } from './ChatService'
import {
  ChatError,
  LIMITS,
  type ChatEventMap,
  type ChatEventName,
  type Message,
  type PresenceUser,
} from './types'

// 階段一的假服務:所有「其他人」都是程式模擬的。
// 測試用的特殊代號:輸入「測試已滿」會得到聊天室已滿,輸入「測試斷線」會得到連線失敗。
// 其他人的代號(小雨、阿宏、花捲、Nina)視為線上有人在用。

const PHRASES = [
  '大家早安～今天好冷',
  '真的,我早上出門差點凍僵',
  '有人吃早餐了嗎?',
  '我剛剛喝了熱可可,整個人活過來了',
  '週末有人要去看展嗎?',
  '昨天那部電影你們看了嗎',
  '剛下班,終於可以坐下來',
  '推一下路口那家新開的豆花店',
  '今天的雲好漂亮',
  '誰要一起去吃宵夜',
  '我貓剛剛把杯子推下桌了…',
  '早知道就多帶一件外套',
]

const REPLIES = ['哈哈對啊', '真的假的', '我也是!', '好想去', '+1', '這個可以', '笑死']

const CAT_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 170"><rect width="260" height="170" fill="#FBEBA6"/><circle cx="205" cy="45" r="22" fill="#F4B942"/><path d="M0 130 Q70 95 130 125 T260 110 V170 H0Z" fill="#CFE3B4"/><g fill="#3B2F2A"><ellipse cx="110" cy="112" rx="34" ry="24"/><circle cx="143" cy="94" r="17"/><path d="M131 82 L134 66 L144 78Z M146 78 L156 66 L158 84Z"/></g><circle cx="139" cy="93" r="2.2" fill="#FBEBA6"/><circle cx="149" cy="93" r="2.2" fill="#FBEBA6"/></svg>`,
  )

const BOT_NAMES = ['小雨', '阿宏', '花捲', 'Nina', 'Momo']

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const rand = (min: number, max: number) => min + Math.random() * (max - min)
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)]

export function createMockChatService(): ChatService {
  const handlers = new Map<ChatEventName, Set<(p: never) => void>>()
  const bots: (PresenceUser & { online: boolean })[] = BOT_NAMES.map((nickname) => ({
    userId: `bot-${nickname}`,
    nickname,
    online: nickname !== 'Momo',
  }))

  let me: PresenceUser | null = null
  let messages: Message[] = seedMessages()
  let offline = false
  let missed: Message[] = []
  let failNext = false
  let lastSentAt = 0
  let timers: ReturnType<typeof setTimeout>[] = []

  function emit<K extends ChatEventName>(event: K, payload: ChatEventMap[K]) {
    handlers.get(event)?.forEach((h) => (h as (p: ChatEventMap[K]) => void)(payload))
  }

  function later(fn: () => void, ms: number) {
    timers.push(setTimeout(fn, ms))
  }

  function onlineList(): PresenceUser[] {
    const list = bots.filter((b) => b.online).map(({ userId, nickname }) => ({ userId, nickname }))
    return me ? [me, ...list] : list
  }

  function botSay(text: string, withImage = false) {
    const speakers = bots.filter((b) => b.online)
    if (!me || speakers.length === 0) return
    const bot = pick(speakers)
    const msg: Message = {
      id: crypto.randomUUID(),
      userId: bot.userId,
      nickname: bot.nickname,
      text,
      imageUrl: withImage ? CAT_IMAGE : undefined,
      createdAt: new Date().toISOString(),
    }
    messages.push(msg)
    if (offline) missed.push(msg)
    else emit('message:new', msg)
  }

  function scheduleChatter() {
    later(() => {
      botSay(pick(PHRASES), Math.random() < 0.12)
      scheduleChatter()
    }, rand(7000, 15000))
  }

  function scheduleMomo() {
    later(() => {
      const momo = bots.find((b) => b.nickname === 'Momo')
      if (me && momo) {
        momo.online = !momo.online
        if (!offline) {
          const user = { userId: momo.userId, nickname: momo.nickname }
          emit(momo.online ? 'presence:join' : 'presence:leave', user)
        }
      }
      scheduleMomo()
    }, rand(25000, 45000))
  }

  function stopAll() {
    timers.forEach(clearTimeout)
    timers = []
  }

  const dev: DevTools = {
    isOffline: () => offline,
    disconnect() {
      if (offline || !me) return
      offline = true
      emit('connection:lost', undefined)
    },
    reconnect() {
      if (!offline || !me) return
      later(async () => {
        offline = false
        // 補上斷線期間漏掉的訊息(依序),再同步線上名單,最後才通知畫面「已恢復」
        const backlog = missed
        missed = []
        backlog.forEach((m) => emit('message:new', m))
        emit('presence:sync', onlineList())
        emit('connection:restored', undefined)
      }, 700)
    },
    failNextSend() {
      failNext = true
    },
    botSpeak() {
      botSay(pick(PHRASES), Math.random() < 0.3)
    },
  }

  return {
    dev,

    async join(nickname): Promise<JoinResult> {
      await sleep(500)
      const n = nickname.trim()
      if (validateNickname(n)) throw new ChatError('NICKNAME_INVALID')
      if (n === '測試已滿') throw new ChatError('ROOM_FULL')
      if (n === '測試斷線') throw new ChatError('NETWORK')
      const taken = onlineList().some((u) => u.nickname.toLowerCase() === n.toLowerCase())
      if (taken) throw new ChatError('NICKNAME_TAKEN')
      me = { userId: crypto.randomUUID(), nickname: n }
      offline = false
      missed = []
      scheduleChatter()
      scheduleMomo()
      return { userId: me.userId, online: onlineList() }
    },

    async leave() {
      stopAll()
      me = null
      offline = false
      missed = []
    },

    async loadRecent(limit) {
      await sleep(250)
      return messages.slice(-limit)
    },

    async loadSince(time) {
      return messages.filter((m) => m.createdAt > time)
    },

    async send(text, image) {
      if (!me || offline) throw new ChatError('NETWORK')
      if (Array.from(text).length > LIMITS.textMax) throw new ChatError('TEXT_TOO_LONG')
      if (image) {
        const bad = validateImage(image)
        if (bad) throw new ChatError(bad)
      }
      if (Date.now() - lastSentAt < LIMITS.sendCooldownMs) throw new ChatError('RATE_LIMITED')
      await sleep(300)
      if (failNext) {
        failNext = false
        throw new ChatError('NETWORK')
      }
      if (offline) throw new ChatError('NETWORK')
      lastSentAt = Date.now()
      const msg: Message = {
        id: crypto.randomUUID(),
        userId: me.userId,
        nickname: me.nickname,
        text: text.trim() || undefined,
        imageUrl: image ? URL.createObjectURL(image) : undefined,
        createdAt: new Date().toISOString(),
      }
      messages.push(msg)
      emit('message:new', msg)
      if (Math.random() < 0.5) later(() => botSay(pick(REPLIES)), rand(1500, 3500))
      return msg
    },

    async retract(messageId) {
      if (!me || offline) throw new ChatError('NETWORK')
      const target = messages.find((m) => m.id === messageId)
      if (!target || target.userId !== me.userId) throw new ChatError('NETWORK')
      await sleep(200)
      messages = messages.filter((m) => m.id !== messageId)
      emit('message:retracted', { id: messageId })
    },

    on(event, handler) {
      let set = handlers.get(event)
      if (!set) {
        set = new Set()
        handlers.set(event, set)
      }
      set.add(handler as (p: never) => void)
      return () => {
        set.delete(handler as (p: never) => void)
      }
    },
  }
}

/** 預先寫好的 50 則歷史訊息,時間從一小時前排到一分鐘前 */
function seedMessages(): Message[] {
  const speakers = BOT_NAMES.filter((n) => n !== 'Momo')
  const now = Date.now()
  const out: Message[] = []
  for (let i = 0; i < 50; i++) {
    const nickname = speakers[(i * 7 + (i % 3)) % speakers.length]
    out.push({
      id: `seed-${i}`,
      userId: `bot-${nickname}`,
      nickname,
      text: PHRASES[(i * 5) % PHRASES.length],
      imageUrl: i === 44 ? CAT_IMAGE : undefined,
      createdAt: new Date(now - (51 - i) * 70_000).toISOString(),
    })
  }
  return out
}
