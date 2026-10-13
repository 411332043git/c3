import { LIMITS, type ChatErrorCode } from '../services/types'

/** 用「字」計算長度(一個中文字或 emoji 算 1) */
export function charCount(s: string): number {
  return Array.from(s).length
}

export function validateNickname(raw: string): ChatErrorCode | null {
  const n = raw.trim()
  if (n.length === 0 || charCount(n) > LIMITS.nicknameMax) return 'NICKNAME_INVALID'
  return null
}

const COLOR_COUNT = 6

/** 同一個代號永遠得到同一個顏色(對應 CSS 的 --c1 到 --c6) */
export function nickColor(nickname: string): string {
  let h = 0
  for (const ch of nickname) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0
  return `var(--c${(h % COLOR_COUNT) + 1})`
}
