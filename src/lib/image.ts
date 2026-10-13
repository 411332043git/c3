import { ALLOWED_IMAGE_TYPES, LIMITS, type ChatErrorCode } from '../services/types'

export function validateImage(file: File): ChatErrorCode | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'IMAGE_TYPE'
  if (file.size > LIMITS.imageMaxBytes) return 'IMAGE_TOO_BIG'
  return null
}

export function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
}
