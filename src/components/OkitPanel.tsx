import { useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { mockUser } from '../data/mock'
import type { Assignee, Goal, Task, TaskWorkStatus } from '../data/types'
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

function goalBadge(goal: Goal, index: number) {
  if (goal.okitType === 'OBJECTIVE') return { label: 'O', className: 'bg-orange-500 text-white' }
  if (goal.okitType === 'KEY_RESULT') return { label: `KR${index}`, className: 'bg-blue-500 text-white' }
  return { label: `I${index}`, className: 'bg-violet-500 text-white' }
}

function fallbackAssignee(memberId?: number): Assignee {
  return {
    memberId: memberId ?? mockUser.memberId,
    name: mockUser.name,
    profileImagePath: mockUser.profileImagePath,
  }
}

function goalAssignees(goal: Goal): Assignee[] {
  if (goal.assignees?.length) return goal.assignees
  if (goal.member) {
    return [
      {
        memberId: goal.member.memberId,
        name: goal.member.name,
        profileImagePath: goal.member.profileImagePath,
      },
    ]
  }
  return [fallbackAssignee()]
}

function taskAssignees(task: Task): Assignee[] {
  if (task.assignees?.length) return task.assignees
  return [fallbackAssignee(task.memberId)]
}

function Chip({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex h-[20px] min-w-[28px] shrink-0 items-center justify-center rounded px-1.5 text-[11px] font-bold leading-none ${className}`}
    >
      {label}
    </span>
  )
}

function FakeFace({ assignee, index }: { assignee: Assignee; index: number }) {
  const palettes = [
    'from-rose-100 to-orange-200 text-rose-900',
    'from-sky-100 to-cyan-200 text-sky-900',
    'from-lime-100 to-emerald-200 text-emerald-900',
    'from-violet-100 to-fuchsia-200 text-violet-900',
    'from-amber-100 to-yellow-200 text-amber-900',
  ]
  const palette = palettes[(assignee.memberId + index) % palettes.length]

  return (
    <span
      className={`relative inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-surface bg-gradient-to-br ${palette}`}
      title={assignee.name}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <circle cx="12" cy="9" r="3.4" fill="currentColor" opacity="0.72" />
        <path d="M5.3 21c.8-4 3.2-6.2 6.7-6.2S17.9 17 18.7 21H5.3Z" fill="currentColor" opacity="0.55" />
        <path d="M7 7.5c1.3-3.1 7.2-3.4 9.1-.2-1.2-.4-2.3-.6-3.5-.6-1.9 0-3.5.3-5.6.8Z" fill="currentColor" />
      </svg>
    </span>
  )
}

function AssigneeFaces({ assignees }: { assignees: Assignee[] }) {
  const visible = assignees.slice(0, 3)
  const extra = assignees.length - visible.length
  const names = assignees.map((assignee) => assignee.name).join(', ')

  return (
    <div className="flex min-w-0 items-center justify-end" title={names}>
      {visible.map((assignee, index) => (
        <span key={`${assignee.memberId}-${assignee.name}`} className={index > 0 ? '-ml-2' : ''}>
          <FakeFace assignee={assignee} index={index} />
        </span>
      ))}
      {extra > 0 ? (
        <span className="-ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-surface bg-ink-80 px-1 text-[10px] font-bold text-white">
          +{extra}
        </span>
      ) : null}
    </div>
  )
}

function TrashButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center text-ink-40 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
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
  )
}

const statusOptions: Array<{
  value: TaskWorkStatus
  label: string
  className: string
  menuClassName: string
}> = [
  {
    value: 'DONE',
    label: '완료',
    className: 'bg-violet-500 text-white',
    menuClassName: 'text-violet-700 hover:bg-violet-50',
  },
  {
    value: 'IN_PROGRESS',
    label: '진행',
    className: 'bg-green-600 text-white',
    menuClassName: 'text-green-700 hover:bg-green-50',
  },
  {
    value: 'NOT_STARTED',
    label: '미진행',
    className: 'bg-amber-500 text-white',
    menuClassName: 'text-amber-700 hover:bg-amber-50',
  },
]

function StatusDropdown({
  value,
  onChange,
}: {
  value: TaskWorkStatus
  onChange: (value: TaskWorkStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const current = statusOptions.find((option) => option.value === value) ?? statusOptions[2]

  return (
    <div className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex h-6 min-w-[58px] items-center justify-center rounded px-2 text-[11px] font-bold leading-none shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)] ${current.className}`}
      >
        {current.label}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+4px)] z-40 w-[88px] overflow-hidden rounded border border-line bg-surface py-1 shadow-lg">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={`block h-7 w-full px-2 text-left text-[12px] font-semibold ${option.menuClassName}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

interface OkitPanelProps {
  goals: Goal[]
  tasks: Task[]
  onEditGoalTitle: (goalId: number, title: string) => void
  onEditTaskTitle: (taskId: number, title: string) => void
  onSetTaskWorkStatus: (taskId: number, status: TaskWorkStatus) => void
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
          className="text-xs font-semibold text-brand-500 hover:underline"
        >
          저장
        </button>
        <button type="button" onClick={onClose} className="text-xs text-ink-50 hover:text-ink-100">
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
  onSetTaskWorkStatus,
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
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null)

  const toggle = (goalId: number) => {
    setExpanded((prev) => ({ ...prev, [goalId]: !prev[goalId] }))
  }

  const renderGoal = (goal: GoalNode, depth = 0, index = 1): ReactElement | null => {
    if (goal.okitType === null) return null

    const isOpen = expanded[goal.id] ?? false
    const isInitiative = goal.okitType === 'INITIATIVE'
    const badge = goalBadge(goal, index)
    const relatedTasks = isInitiative
      ? tasks.filter((task) => task.initiativeId === goal.id && task.memberId === ME_ID)
      : []

    return (
      <div key={goal.id} className={depth > 0 ? 'ml-5 border-l border-line/70 pl-4' : ''}>
        <div className="group grid min-h-8 grid-cols-[16px_42px_minmax(0,1fr)_82px_24px] items-center gap-2 border-b border-dashed border-line/80 pr-1 text-sm transition-colors hover:bg-surface-3">
          <button
            type="button"
            onClick={() => toggle(goal.id)}
            className="text-center text-xs text-ink-50 hover:text-ink-100"
            aria-label={isOpen ? '접기' : '펼치기'}
          >
            {goal.children.length > 0 || isInitiative ? (isOpen ? '-' : '+') : ''}
          </button>
          <Chip label={badge.label} className={badge.className} />
          <EditableText
            value={goal.title}
            onCommit={(title) => onEditGoalTitle(goal.id, title)}
            className={`min-w-0 bg-transparent text-left outline-none ${
              goal.okitType === 'OBJECTIVE'
                ? 'text-[15px] font-bold text-ink-100'
                : goal.okitType === 'KEY_RESULT'
                  ? 'text-sm font-semibold text-ink-100'
                  : 'text-sm text-ink-90'
            }`}
            placeholder="제목 없음"
          />
          <AssigneeFaces assignees={goalAssignees(goal)} />
          <TrashButton onClick={() => onDeleteGoal(goal.id)} />
        </div>

        {isOpen ? (
          <div className="pb-1">
            {isInitiative ? (
              <div className="ml-5 border-l border-line/70 pl-4">
                {relatedTasks.map((task, taskIndex) => {
                  const status = task.workStatus ?? (task.isDone ? 'DONE' : 'NOT_STARTED')

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(event) => {
                        setDraggingTaskId(task.id)
                        event.dataTransfer.effectAllowed = 'move'
                        event.dataTransfer.setData('application/x-nrs-task-id', String(task.id))
                        event.dataTransfer.setData('text/nrs-task-id', String(task.id))
                      }}
                      onDragEnd={() => setDraggingTaskId(null)}
                      className={`group grid min-h-8 grid-cols-[20px_42px_minmax(0,1fr)_176px_70px_78px_24px] items-center gap-2 border-b border-dashed border-line/80 pr-1 text-sm transition-colors ${
                        draggingTaskId === task.id
                          ? 'bg-brand-50 ring-2 ring-inset ring-brand-500/60'
                          : 'hover:bg-brand-50/80'
                      }`}
                    >
                      <span className="text-center text-xs text-ink-50">-</span>
                      <Chip label={`T${taskIndex + 1}`} className="bg-teal-500 text-white" />
                      <EditableText
                        value={task.title}
                        onCommit={(title) => onEditTaskTitle(task.id, title)}
                        className={`min-w-0 bg-transparent text-left outline-none ${
                          status === 'DONE' ? 'text-ink-40 line-through' : 'text-ink-90'
                        }`}
                        placeholder="Task 제목"
                      />
                      <DateRangePicker
                        value={{ startDate: task.startDate, endDate: task.endDate }}
                        onCommit={(next) =>
                          onEditTaskDates(task.id, next.startDate, next.endDate)
                        }
                      />
                      <StatusDropdown
                        value={status}
                        onChange={(nextStatus) => onSetTaskWorkStatus(task.id, nextStatus)}
                      />
                      <AssigneeFaces assignees={taskAssignees(task)} />
                      <TrashButton onClick={() => onDeleteTask(task.id)} />
                    </div>
                  )
                })}

                <button
                  type="button"
                  onClick={() => setCreatingTaskFor(goal.id)}
                  className="border-b border-dashed border-line/80 py-1 pl-[40px] text-xs text-ink-80 hover:text-brand-500"
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
              goal.children.map((child, childIndex) => renderGoal(child, depth + 1, childIndex + 1))
            )}
          </div>
        ) : null}
      </div>
    )
  }

  return <div className="py-1">{tree.map((goal, index) => renderGoal(goal, 0, index + 1))}</div>
}
