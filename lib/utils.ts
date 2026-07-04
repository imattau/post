import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSize(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`
  if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} KB`
  return `${(bytes / 1_000_000).toFixed(1)} MB`
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return "now"
  if (diff < 86_400_000) return formatDistanceToNow(ts, { includeSeconds: false })
  return format(ts, "MMM d")
}

export function formatDate(ts: number): string {
  return format(ts, "MMM d, h:mm a")
}

export function wrapTextareaSelection(
  textarea: HTMLTextAreaElement,
  prefix: string,
  suffix: string,
  body: string,
  fallback = ""
): string {
  const start = textarea.selectionStart ?? body.length
  const end = textarea.selectionEnd ?? body.length
  const selection = body.slice(start, end)
  const content = selection || fallback
  const insertion = `${prefix}${content}${suffix}`
  const next = `${body.slice(0, start)}${insertion}${body.slice(end)}`
  return next
}
