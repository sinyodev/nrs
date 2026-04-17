import { useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import type { Goal, Task } from '../data/types'
import { DateRangePicker } from './DateRangePicker'
import { EditableText } from './EditableText'

const ME_ID = 1000

type GoalNode = Goal & { children: GoalNode[] }

function buildGoalTree(goals: Goal[]): GoalNode[] {
  const byId = new Map<number, GoalNode>()
  for (const goal of goals) byId.set(goal.id, { ...goal, children: [] })

  const roots: GoalNode[] = []
  for (const node of byId.values()) {
    if (node.parentId === null) roots.push(node)
    else {
      const parent = byId.get(node.parentId)
      if (parent) parent.children.push(node)
      else roots.push(node)
    }
  }

  const sortRec = (items: GoalNode[]) => {
    items.sort((a, b) => a.order - b.order)
    items.forEach((item) => sortRec(item.children))
  }

  sortRec(roots)
  return roots
}

function todayIso() {
  const date = new Date()
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().slice(0, 10)
}

function goalBadge(goal: Goal) {
  if (goal.okitType === 'OBJECTIVE') return { label: 'O', className: 'bg-rose-500 text-white' }
  if (goal.okitType === 'KEY_RESULT') return { label: 'KR', className: 'bg-indigo-500 text-white' }
  return { label: 'I', className: 'bg-cyan-500 text-white' }
}

function Chip({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded px-1.5 text-[10px] font-bold leading-none ${className}`}
    >
      {label}
    </span>
  )
}

interface OkitPanelProps {
  goals: Goal[]
  tasks: Task[]
  onEditGoalTitle: (goalId: number, title: string) => void
  onEditTaskTitle: (taskId: number, title: string) => void
  onToggleTaskDone: (taskId: number) => void
  onEditTaskDates: (taskId: number, startDate: string, endDate: string) => void
  onAddTask: (initiativeId: number, title: string, startDate: string, endDate: string) => void
  onDeleteGoal: (goalId: number) => void
  onDeleteTask: (taskId: number) => void
}

function TaskCreateForm({
  initiativeId,
  onAddTask,
  onClose,
}: {
  initiativeId: number
  onAddTask: OkitPanelProps['onAddTask']
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [range, setRange] = useState({ startDate: todayIso(), endDate: todayIso() })

  return (
    <div className="ml-[52px] grid max-w-[760px] grid-cols-[minmax(220px,1fr)_220px_auto] items-center gap-2 border-b border-dashed border-line/80 py-1.5">
      <input
        autoFocus
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Task 제목"
        className="h-7 rounded border border-line bg-surface px-2 text-sm outline-none placeholder:text-ink-40"
      />
      <DateRangePicker value={range} onCommit={setRange} />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (!title.trim()) return
            if (!range.startDate || !range.endDate) return
            onAddTask(initiativeId, title.trim(), range.startDate, range.endDate)
            onClose()
          }}
          className="text-xs font-semibold text-brand-600 hover:underline"
        >
          저장
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-ink-50 hover:text-ink-100"
        >
          취소
        </button>
      </div>
    </div>
  )
}

export function OkitPanel({
  goals,
  tasks,
  onEditGoalTitle,
  onEditTaskTitle,
  onToggleTaskDone,
  onEditTaskDates,
  onAddTask,
  onDeleteGoal,
  onDeleteTask,
}: OkitPanelProps) {
  const tree = useMemo(() => buildGoalTree(goals), [goals])
  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => {
    const next: Record<number, boolean> = {}
    for (const goal of goals) next[goal.id] = goal.depth <= 2
    return next
  })
  const [creatingTaskFor, setCreatingTaskFor] = useState<number | null>(null)

  const toggle = (goalId: number) => {
    setExpanded((prev) => ({ ...prev, [goalId]: !prev[goalId] }))
  }

  const renderGoal = (goal: GoalNode, depth = 0): ReactElement | null => {
    if (goal.okitType === null) return null

    const isOpen = expanded[goal.id] ?? false
    const isInitiative = goal.okitType === 'INITIATIVE'
    const badge = goalBadge(goal)
    const relatedTasks = isInitiative
      ? tasks.filter((task) => task.initiativeId === goal.id && task.memberId === ME_ID)
      : []

    return (
      <div key={goal.id} className={depth > 0 ? 'ml-5 border-l border-line/70 pl-4' : ''}>
        <div className="group flex min-h-8 items-center gap-2 border-b border-dashed border-line/80 pr-1 text-sm hover:bg-surface-2/50">
          <button
            type="button"
            onClick={() => toggle(goal.id)}
            className="w-3 shrink-0 text-center text-xs text-ink-50 hover:text-ink-100"
            aria-label={isOpen ? '접기' : '펼치기'}
          >
            {goal.children.length > 0 || isInitiative ? (isOpen ? '-' : '+') : ''}
          </button>
          <Chip label={badge.label} className={badge.className} />
          <EditableText
            value={goal.title}
            onCommit={(title) => onEditGoalTitle(goal.id, title)}
            className={`min-w-0 flex-1 bg-transparent text-left outline-none ${
              goal.okitType === 'OBJECTIVE'
                ? 'text-[15px] font-bold text-ink-100'
                : goal.okitType === 'KEY_RESULT'
                  ? 'text-sm font-semibold text-ink-100'
                  : 'text-sm text-ink-90'
            }`}
            placeholder="제목 없음"
          />
          <button
            type="button"
            onClick={() => onDeleteGoal(goal.id)}
            className="flex h-6 w-6 items-center justify-center opacity-0 transition-opacity text-ink-40 hover:text-red-500 group-hover:opacity-100"
            aria-label="삭제"
            title="삭제"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
              <path
                fill="currentColor"
                d="M5.5 2.5h5l.5 1H14v1H2v-1h3l.5-1Zm-.7 3h6.4l-.4 8H5.2l-.4-8Z"
              />
            </svg>
          </button>
        </div>

        {isOpen ? (
          <div className="pb-1">
            {isInitiative ? (
              <div className="ml-5 border-l border-line/70 pl-4">
                {relatedTasks.length === 0 ? (
                  <div className="border-b border-dashed border-line/80 py-1 pl-5 text-xs italic text-ink-40">
                    연결된 Task가 없습니다.
                  </div>
                ) : (
                  relatedTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = 'move'
                        event.dataTransfer.setData('application/x-nrs-task-id', String(task.id))
                        event.dataTransfer.setData('text/nrs-task-id', String(task.id))
                      }}
                      className="group grid min-h-8 grid-cols-[20px_18px_18px_minmax(0,1fr)_190px_24px] items-center gap-2 border-b border-dashed border-line/80 pr-1 text-sm hover:bg-surface-2/50"
                    >
                      <span className="text-center text-xs text-ink-50">-</span>
                      <Chip label="T" className="bg-slate-500 text-white" />
                      <input
                        type="checkbox"
                        checked={task.isDone ?? false}
                        onChange={() => onToggleTaskDone(task.id)}
                        className="h-3.5 w-3.5 rounded border-line"
                        aria-label="Task 완료"
                      />
                      <EditableText
                        value={task.title}
                        onCommit={(title) => onEditTaskTitle(task.id, title)}
                        className={`min-w-0 bg-transparent text-left outline-none ${
                          task.isDone ? 'text-ink-40 line-through' : 'text-ink-90'
                        }`}
                        placeholder="Task 제목"
                      />
                      <DateRangePicker
                        value={{ startDate: task.startDate, endDate: task.endDate }}
                        onCommit={(next) =>
                          onEditTaskDates(task.id, next.startDate, next.endDate)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => onDeleteTask(task.id)}
                        className="flex h-6 w-6 items-center justify-center opacity-0 transition-opacity text-ink-40 hover:text-red-500 group-hover:opacity-100"
                        aria-label="삭제"
                        title="삭제"
                      >
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                          <path
                            fill="currentColor"
                            d="M5.5 2.5h5l.5 1H14v1H2v-1h3l.5-1Zm-.7 3h6.4l-.4 8H5.2l-.4-8Z"
                          />
                        </svg>
                      </button>
                    </div>
                  ))
                )}

                <button
                  type="button"
                  onClick={() => setCreatingTaskFor(goal.id)}
                  className="border-b border-dashed border-line/80 py-1 pl-[40px] text-xs text-ink-80 hover:text-brand-600"
                >
                  + Task
                </button>

                {creatingTaskFor === goal.id ? (
                  <TaskCreateForm
                    initiativeId={goal.id}
                    onAddTask={onAddTask}
                    onClose={() => setCreatingTaskFor(null)}
                  />
                ) : null}
              </div>
            ) : (
              goal.children.map((child) => renderGoal(child, depth + 1))
            )}
          </div>
        ) : null}
      </div>
    )
  }

  return <div className="py-1">{tree.map((goal) => renderGoal(goal))}</div>
}
