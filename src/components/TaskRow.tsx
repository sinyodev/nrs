import { useState } from 'react'
import type { Task } from '../data/types'

interface TaskRowProps {
  task: Task
  children?: React.ReactNode
  expanded: boolean
  onToggleExpanded: () => void
  onAddAction: (title: string) => void
  onCalendarDragEnter?: (task: Task, event: React.DragEvent<HTMLDivElement>) => void
  onCalendarDragOver?: (task: Task, event: React.DragEvent<HTMLDivElement>) => void
  onCalendarDrop?: (task: Task, event: React.DragEvent<HTMLDivElement>) => void
}

export function TaskRow({
  task,
  children,
  expanded,
  onToggleExpanded,
  onAddAction,
  onCalendarDragEnter,
  onCalendarDragOver,
  onCalendarDrop,
}: TaskRowProps) {
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')

  const submit = () => {
    const next = text.trim()
    if (next) onAddAction(next)
    setText('')
    setAdding(false)
  }

  const badgeClass = 'bg-slate-500 text-white'

  return (
    <div className="group">
      <div
        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 transition-colors hover:bg-surface-2"
        onClick={onToggleExpanded}
        onDragEnter={onCalendarDragEnter ? (e) => onCalendarDragEnter(task, e) : undefined}
        onDragOver={onCalendarDragOver ? (e) => onCalendarDragOver(task, e) : undefined}
        onDrop={onCalendarDrop ? (e) => onCalendarDrop(task, e) : undefined}
      >
        <span className="w-4 shrink-0 text-center text-xs text-ink-60">{expanded ? '-' : '+'}</span>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${badgeClass}`}>
          T
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-100">
          {task.title}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setAdding(true)
          }}
          className="whitespace-nowrap px-1 py-1 text-xs text-ink-50 opacity-0 transition-opacity group-hover:opacity-100 hover:text-brand-500"
        >
          + Action
        </button>
      </div>

      {expanded && (
        <div className="pl-6">
          {children}

          {adding ? (
            <div className="flex items-center gap-2 px-2 py-2">
              <span className="h-4 w-4 shrink-0 rounded-full border-2 border-line" />
              <input
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={submit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    submit()
                  } else if (e.key === 'Escape') {
                    setText('')
                    setAdding(false)
                  }
                }}
                placeholder="Action title + Enter"
                className="flex-1 bg-transparent text-sm text-ink-100 outline-none placeholder:text-ink-40"
              />
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="px-2 py-1.5 text-xs text-ink-50 hover:text-brand-500"
            >
              + Action
            </button>
          )}
        </div>
      )}
    </div>
  )
}
