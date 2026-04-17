import type { Action } from '../data/types'

interface ActionRowProps {
  action: Action
  highlighted?: boolean
  onDragStart?: (action: Action) => void
  onToggleComplete?: (action: Action) => void
  onSelect?: (action: Action) => void
  onHover?: (action: Action | null) => void
  onLink?: (actionId: number, anchor: { top: number; left: number }) => void
  unlinkedStyle?: boolean
}

export function ActionRow({
  action,
  highlighted,
  onDragStart,
  onToggleComplete,
  onSelect,
  onHover,
  onLink,
  unlinkedStyle,
}: ActionRowProps) {
  const isDone = action.status === 'DONE'
  const isDraggable = Boolean(onDragStart)
  const badgeClass = 'bg-emerald-500 text-white'

  return (
    <div
      draggable={isDraggable}
      onDragStart={
        isDraggable
          ? (e) => {
              e.dataTransfer.effectAllowed = 'move'
              e.dataTransfer.setData('text/task-id', String(action.id))
              onDragStart?.(action)
            }
          : undefined
      }
      onMouseEnter={onHover ? () => onHover(action) : undefined}
      onMouseLeave={onHover ? () => onHover(null) : undefined}
      className={`flex min-h-11 items-center gap-3 rounded-md border border-transparent px-2 py-2.5 transition-colors ${
        highlighted ? 'bg-brand-50 ring-1 ring-brand-500/40' : 'hover:bg-surface-2'
      } ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${badgeClass}`}>
        A
      </span>
      <span
        role={onToggleComplete ? 'checkbox' : undefined}
        aria-checked={isDone}
        aria-label={isDone ? '완료됨' : '미완료'}
        tabIndex={onToggleComplete ? 0 : undefined}
        onClick={
          onToggleComplete
            ? (e) => {
                e.stopPropagation()
                onToggleComplete(action)
              }
            : undefined
        }
        onKeyDown={
          onToggleComplete
            ? (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  onToggleComplete(action)
                }
              }
            : undefined
        }
        className={`h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
          isDone
            ? 'border-task-done bg-task-done'
            : onToggleComplete
              ? 'cursor-pointer border-line hover:border-task-done hover:bg-task-done/10'
              : 'border-line'
        }`}
      />

      <span
        onClick={onSelect ? () => onSelect(action) : undefined}
        className={`min-w-0 flex-1 truncate text-sm ${
          isDone ? 'text-ink-60 line-through' : 'text-ink-100'
        } ${onSelect ? 'cursor-pointer hover:underline' : ''}`}
      >
        {action.title}
      </span>

      {unlinkedStyle && onLink ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
            onLink(action.id, { top: rect.bottom + 4, left: Math.max(8, rect.left - 360) })
          }}
          className="shrink-0 rounded-sm bg-warn-text px-2 py-1 text-xs font-semibold whitespace-nowrap text-surface hover:brightness-110"
        >
          목표 연결
        </button>
      ) : null}
    </div>
  )
}
