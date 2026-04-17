import { useEffect } from 'react'

interface Props {
  message: string
  onUndo: () => void
  onDismiss: () => void
  /** 자동 사라지는 시간 (ms). 0이면 수동 닫기만 */
  autoDismissMs?: number
}

/** 5초 후 자동 사라지는 실행취소 토스트.
 *  V2에서 체크박스 1-클릭 완료의 안전망으로 사용. */
export function UndoToast({ message, onUndo, onDismiss, autoDismissMs = 5000 }: Props) {
  useEffect(() => {
    if (!autoDismissMs) return
    const timer = setTimeout(onDismiss, autoDismissMs)
    return () => clearTimeout(timer)
  }, [autoDismissMs, onDismiss])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink-100 text-surface rounded-md shadow-lg px-4 py-2.5 flex items-center gap-4 text-sm">
      <span>{message}</span>
      <button
        onClick={onUndo}
        className="font-semibold text-brand-200 hover:text-brand-300 whitespace-nowrap"
      >
        실행 취소
      </button>
      <button
        onClick={onDismiss}
        className="text-ink-40 hover:text-surface leading-none"
        aria-label="닫기"
      >
        ✕
      </button>
    </div>
  )
}
