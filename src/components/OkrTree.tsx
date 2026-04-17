import { useMemo, useState } from 'react'
import { mockGoals } from '../data/mock'
import type { Action, Goal, Task } from '../data/types'
import { ActionRow } from './ActionRow'
import { TaskRow } from './TaskRow'

const ME_ID = 1000

interface OkrTreeProps {
  tasks: Task[]
  actions: Action[]
  hoveredActionId?: number | null
  onActionToggleComplete?: (action: Action) => void
  onActionSelect?: (action: Action) => void
  onActionHover?: (action: Action | null) => void
  onActionDragStart?: (action: Action) => void
  onAddAction: (taskId: number | null, title: string) => void
  onLinkAction: (actionId: number, anchor: { top: number; left: number }) => void
  onCalendarDropToTask: (calendarEventId: string, taskId: number) => void
}

type GoalNode = Goal & { children: GoalNode[] }

function buildGoalTree(goals: Goal[]): GoalNode[] {
  const map = new Map<number, GoalNode>()
  for (const goal of goals) map.set(goal.id, { ...goal, children: [] })

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

function goalRowClass(goal: Goal) {
  if (goal.okitType === 'OBJECTIVE') return 'text-base font-semibold text-ink-100'
  if (goal.okitType === 'KEY_RESULT') return 'text-sm font-semibold text-ink-90'
  return 'text-sm font-medium text-ink-80'
}

function goalBadge(goal: Goal) {
  if (goal.okitType === 'OBJECTIVE') return { label: 'O', className: 'bg-rose-500 text-white' }
  if (goal.okitType === 'KEY_RESULT') return { label: 'KR', className: 'bg-indigo-500 text-white' }
  return { label: 'I', className: 'bg-cyan-500 text-white' }
}

function hasCalendarDrag(types: ReadonlyArray<string>) {
  return types.includes('application/x-nrs-calendar-event-id') || types.includes('text/calendar-event-id')
}

function GoalNodeRow({
  goal,
  expanded,
  onToggle,
  onCalendarDragEnter,
  children,
}: {
  goal: Goal
  expanded: boolean
  onToggle: () => void
  onCalendarDragEnter?: (event: React.DragEvent<HTMLDivElement>) => void
  children: React.ReactNode
}) {
  return (
    <div>
      <div
        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 transition-colors hover:bg-surface-2"
        onClick={onToggle}
        onDragEnter={onCalendarDragEnter}
        onDragOver={
          onCalendarDragEnter
            ? (e) => {
                if (hasCalendarDrag(Array.from(e.dataTransfer.types))) e.preventDefault()
              }
            : undefined
        }
      >
        <span className="w-4 shrink-0 text-center text-xs text-ink-60">{expanded ? '-' : '+'}</span>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${goalBadge(goal).className}`}>
          {goalBadge(goal).label}
        </span>
        <span className={`min-w-0 flex-1 truncate ${goalRowClass(goal)}`}>{goal.title}</span>
      </div>
      {expanded ? <div className="ml-[14px] border-l border-surface-4 pl-3">{children}</div> : null}
    </div>
  )
}

function InitiativeChildren({
  initiative,
  tasks,
  actions,
  taskExpanded,
  hoveredActionId,
  onToggleTask,
  onActionToggleComplete,
  onActionSelect,
  onActionHover,
  onActionDragStart,
  onAddAction,
  onCalendarDropToTask,
  onOpenTask,
}: {
  initiative: Goal
  tasks: Task[]
  actions: Action[]
  taskExpanded: Record<number, boolean>
  hoveredActionId?: number | null
  onToggleTask: (taskId: number) => void
  onActionToggleComplete?: (action: Action) => void
  onActionSelect?: (action: Action) => void
  onActionHover?: (action: Action | null) => void
  onActionDragStart?: (action: Action) => void
  onAddAction: (taskId: number | null, title: string) => void
  onCalendarDropToTask: (calendarEventId: string, taskId: number) => void
  onOpenTask: (taskId: number) => void
}) {
  const myTasks = tasks.filter((task) => task.initiativeId === initiative.id && task.memberId === ME_ID)

  if (myTasks.length === 0) {
    return <div className="px-2 py-2 text-xs italic text-ink-40">연결된 Task가 없습니다.</div>
  }

  return (
    <>
      {myTasks.map((task) => {
        const taskActions = actions.filter((action) => action.taskId === task.id)

        return (
          <TaskRow
            key={task.id}
            task={task}
            expanded={taskExpanded[task.id] ?? true}
            onToggleExpanded={() => onToggleTask(task.id)}
            onAddAction={(title) => onAddAction(task.id, title)}
            onCalendarDragEnter={(rowTask, event) => {
              if (!hasCalendarDrag(Array.from(event.dataTransfer.types))) return
              event.preventDefault()
              onOpenTask(rowTask.id)
            }}
            onCalendarDragOver={(rowTask, event) => {
              if (!hasCalendarDrag(Array.from(event.dataTransfer.types))) return
              event.preventDefault()
              onOpenTask(rowTask.id)
            }}
            onCalendarDrop={(rowTask, event) => {
              const eventId =
                event.dataTransfer.getData('application/x-nrs-calendar-event-id') ||
                event.dataTransfer.getData('text/calendar-event-id')
              if (!eventId) return
              event.preventDefault()
              onCalendarDropToTask(eventId, rowTask.id)
            }}
          >
            {taskActions.map((action) => (
              <ActionRow
                key={action.id}
                action={action}
                highlighted={hoveredActionId === action.id}
                onToggleComplete={onActionToggleComplete}
                onSelect={onActionSelect}
                onHover={onActionHover}
                onDragStart={onActionDragStart}
              />
            ))}
          </TaskRow>
        )
      })}
    </>
  )
}

export function OkrTree({
  tasks,
  actions,
  hoveredActionId,
  onActionToggleComplete,
  onActionSelect,
  onActionHover,
  onActionDragStart,
  onAddAction,
  onLinkAction,
  onCalendarDropToTask,
}: OkrTreeProps) {
  const tree = useMemo(() => buildGoalTree(mockGoals), [])

  const [goalExpanded, setGoalExpanded] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {}
    for (const goal of mockGoals) initial[goal.id] = goal.depth <= 2
    return initial
  })
  const [taskExpanded, setTaskExpanded] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {}
    for (const task of tasks) initial[task.id] = true
    return initial
  })
  const [unlinkedExpanded, setUnlinkedExpanded] = useState(true)

  const toggleGoal = (id: number) => setGoalExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  const toggleTask = (id: number) =>
    setTaskExpanded((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }))
  const openTask = (id: number) => setTaskExpanded((prev) => ({ ...prev, [id]: true }))

  const renderGoal = (goal: GoalNode): React.ReactNode => {
    if (goal.okitType === null || !goal.title.trim()) return null

    const expanded = goalExpanded[goal.id] ?? false
    const isInitiative = goal.okitType === 'INITIATIVE'

    return (
      <GoalNodeRow
        key={goal.id}
        goal={goal}
        expanded={expanded}
        onToggle={() => toggleGoal(goal.id)}
        onCalendarDragEnter={(event) => {
          if (!hasCalendarDrag(Array.from(event.dataTransfer.types))) return
          event.preventDefault()
          setGoalExpanded((prev) => ({ ...prev, [goal.id]: true }))
        }}
      >
        {isInitiative ? (
          <InitiativeChildren
            initiative={goal}
            tasks={tasks}
            actions={actions}
            taskExpanded={taskExpanded}
            hoveredActionId={hoveredActionId}
            onToggleTask={toggleTask}
            onActionToggleComplete={onActionToggleComplete}
            onActionSelect={onActionSelect}
            onActionHover={onActionHover}
            onActionDragStart={onActionDragStart}
            onAddAction={onAddAction}
            onCalendarDropToTask={onCalendarDropToTask}
            onOpenTask={openTask}
          />
        ) : (
          goal.children.map((child) => renderGoal(child))
        )}
      </GoalNodeRow>
    )
  }

  const unlinkedActions = actions.filter((action) => action.taskId === null)

  return (
    <div className="space-y-2">
      {tree.map((goal) => renderGoal(goal))}

      <div className="mt-6 rounded-md border border-dashed border-warn-border bg-warn-bg/50">
        <div
          className="flex cursor-pointer items-center gap-2 px-3 py-2"
          onClick={() => setUnlinkedExpanded((prev) => !prev)}
        >
          <span className="w-4 shrink-0 text-center text-xs text-warn-text">
            {unlinkedExpanded ? '-' : '+'}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-warn-text">
            Unlinked Action
          </span>
        </div>
        {unlinkedExpanded ? (
          <div className="px-2 pb-2">
            {unlinkedActions.map((action) => (
              <ActionRow
                key={action.id}
                action={action}
                highlighted={hoveredActionId === action.id}
                onToggleComplete={onActionToggleComplete}
                onSelect={onActionSelect}
                onHover={onActionHover}
                onDragStart={onActionDragStart}
                onLink={onLinkAction}
                unlinkedStyle
              />
            ))}
            <button
              onClick={() => {
                const title = window.prompt('Action title')
                if (title && title.trim()) onAddAction(null, title.trim())
              }}
              className="px-2 py-1.5 text-xs text-ink-50 hover:text-brand-500"
            >
              + Action
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
