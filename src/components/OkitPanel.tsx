import { useMemo, useState } from 'react'
import type { Goal, Task } from '../data/types'
import { DateRangePicker } from './DateRangePicker'
import { EditableText } from './EditableText'

const ME_ID = 1000

type GoalNode = Goal & { children: GoalNode[] }

function buildGoalTree(goals: Goal[]): GoalNode[] {
  const map = new Map<number, GoalNode>()
  for (const goal of goals) {
    map.set(goal.id, { ...goal, children: [] })
  }

  const roots: GoalNode[] = []
  for (const node of map.values()) {
    if (node.parentId === null) {
      roots.push(node)
    } else {
      const parent = map.get(node.parentId)
      if (parent) parent.children.push(node)
      else roots.push(node)
    }
  }

  const sortRec = (list: GoalNode[]) => {
    list.sort((a, b) => a.order - b.order)
    list.forEach((node) => sortRec(node.children))
  }

  sortRec(roots)
  return roots
}

function badgeFor(goal: Goal) {
  if (goal.okitType === 'OBJECTIVE') return { label: 'O', cls: 'bg-rose-500 text-white' }
  if (goal.okitType === 'KEY_RESULT') return { label: 'KR', cls: 'bg-indigo-500 text-white' }
  return { label: 'I', cls: 'bg-cyan-500 text-white' }
}

function todayIso() {
  const date = new Date()
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().slice(0, 10)
}

interface OkitPanelProps {
  goals: Goal[]
  tasks: Task[]
  onEditGoalTitle: (goalId: number, title: string) => void
  onEditTaskTitle: (taskId: number, title: string) => void
  onToggleTaskDone: (taskId: number) => void
  onEditTaskDates: (taskId: number, startDate: string, endDate: string) => void
  onAddTask: (initiativeId: number, title: string, startDate: string, endDate: string) => void
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
    <div className="mt-2 rounded-2xl border border-brand-500/20 bg-brand-50 p-3">
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_auto]">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="태스크 제목"
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none placeholder:text-ink-40"
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
            className="rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white"
          >
            저장
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line px-3 py-2 text-xs text-ink-60 hover:bg-surface-2"
          >
            취소
          </button>
        </div>
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
}: OkitPanelProps) {
  const tree = useMemo(() => buildGoalTree(goals), [goals])
  const [goalExpanded, setGoalExpanded] = useState<Record<number, boolean>>(() => {
    const next: Record<number, boolean> = {}
    for (const goal of goals) next[goal.id] = goal.depth <= 2
    return next
  })
  const [creatingTaskFor, setCreatingTaskFor] = useState<number | null>(null)

  const toggleGoal = (goalId: number) =>
    setGoalExpanded((prev) => ({ ...prev, [goalId]: !prev[goalId] }))

  const renderGoal = (goal: GoalNode) => {
    if (goal.okitType === null) return null

    const badge = badgeFor(goal)
    const expanded = goalExpanded[goal.id] ?? false
    const isInitiative = goal.okitType === 'INITIATIVE'
    const myTasks = isInitiative
      ? tasks.filter((task) => task.initiativeId === goal.id && task.memberId === ME_ID)
      : []

    return (
      <div key={goal.id} className="rounded-2xl border border-line bg-surface">
        <button
          type="button"
          onClick={() => toggleGoal(goal.id)}
          className="flex w-full items-center gap-2 px-3 py-3 text-left transition-colors hover:bg-surface-2"
        >
          <span className="w-4 shrink-0 text-center text-xs text-ink-60">
            {expanded ? '-' : '+'}
          </span>
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${badge.cls}`}>
            {badge.label}
          </span>
          <EditableText
            value={goal.title}
            onCommit={(title) => onEditGoalTitle(goal.id, title)}
            className={`min-w-0 flex-1 bg-transparent text-left outline-none ${
              goal.okitType === 'OBJECTIVE'
                ? 'text-base font-semibold text-ink-100'
                : goal.okitType === 'KEY_RESULT'
                  ? 'text-sm font-semibold text-ink-90'
                  : 'text-sm font-medium text-ink-80'
            }`}
            placeholder="Untitled goal"
          />
        </button>

        {expanded && (
          <div className="space-y-2 border-t border-line px-3 py-3">
            {isInitiative ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-ink-40">
                    Tasks
                  </div>
                  <button
                    type="button"
                    onClick={() => setCreatingTaskFor(goal.id)}
                    className="rounded-full border border-brand-500/30 px-3 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                  >
                    +TASK
                  </button>
                </div>

                {myTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-line px-3 py-4 text-xs text-ink-40">
                    아직 Task가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move'
                          e.dataTransfer.setData('application/x-nrs-task-id', String(task.id))
                          e.dataTransfer.setData('text/nrs-task-id', String(task.id))
                        }}
                        className="rounded-2xl border border-line bg-surface-2/60 px-3 py-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-1 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold bg-slate-500 text-white">
                            T
                          </span>
                          <div className="min-w-0 flex-1 space-y-2">
                            <EditableText
                              value={task.title}
                              onCommit={(title) => onEditTaskTitle(task.id, title)}
                              className="block w-full min-w-0 bg-transparent text-left text-sm font-medium text-ink-100 outline-none"
                              placeholder="태스크 제목"
                            />
                            <div className="grid gap-2 md:grid-cols-[auto_1fr] md:items-center">
                              <label className="flex items-center gap-2 text-xs text-ink-60">
                                <input
                                  type="checkbox"
                                  checked={task.isDone ?? false}
                                  onChange={() => onToggleTaskDone(task.id)}
                                  className="h-4 w-4 rounded border-line"
                                />
                                아직 못했다 / 다 했다
                              </label>
                              <DateRangePicker
                                value={{ startDate: task.startDate, endDate: task.endDate }}
                                onCommit={(next) =>
                                  onEditTaskDates(task.id, next.startDate, next.endDate)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {creatingTaskFor === goal.id ? (
                  <TaskCreateForm
                    initiativeId={goal.id}
                    onAddTask={onAddTask}
                    onClose={() => setCreatingTaskFor(null)}
                  />
                ) : null}
              </>
            ) : (
              goal.children.map((child) => renderGoal(child))
            )}
          </div>
        )}
      </div>
    )
  }

  return <div className="space-y-3">{tree.map((goal) => renderGoal(goal))}</div>
}
