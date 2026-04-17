import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LinkGoalMenu } from '../components/LinkGoalMenu'
import { OkrTree } from '../components/OkrTree'
import { Sidebar } from '../components/Sidebar'
import { TaskDetailPanel } from '../components/TaskDetailPanel'
import { UndoToast } from '../components/UndoToast'
import { WeeklyCalendar, type CalEvent } from '../components/WeeklyCalendar'
import { calcLinkRate } from '../data/chain'
import {
  mockActions,
  mockCalendarPlaceholders,
  mockGoals,
  mockTasks,
  mockTimeBlocks,
} from '../data/mock'
import type { Action, Task } from '../data/types'

const TODAY = '2026-04-17'

function initialEvents(): CalEvent[] {
  const placeholders: CalEvent[] = mockCalendarPlaceholders.map((p, i) => ({
    id: `pl-${i}`,
    title: p.title,
    startAt: p.startAt,
    durationMinutes: p.durationMinutes,
  }))
  const actionsById = new Map(mockActions.map((a) => [a.id, a]))
  const fromBlocks: CalEvent[] = mockTimeBlocks
    .filter((b) => actionsById.has(b.actionId))
    .map((b) => {
      const action = actionsById.get(b.actionId)!
      return {
        id: `tb-${b.id}`,
        title: action.title,
        startAt: b.startAt,
        durationMinutes: b.durationMinutes,
        action,
      }
    })
  return [...placeholders, ...fromBlocks]
}

export default function TasksPage() {
  const [actions, setActions] = useState<Action[]>(mockActions)
  const [tasks] = useState<Task[]>(mockTasks)
  const [events, setEvents] = useState<CalEvent[]>(initialEvents)
  const [activeDay, setActiveDay] = useState<string>(TODAY)
  const [selectedActionId, setSelectedActionId] = useState<number | null>(null)
  const [highlightActionId, setHighlightActionId] = useState<number | null>(null)
  const [hoveredActionId, setHoveredActionId] = useState<number | null>(null)
  const [linkingAction, setLinkingAction] = useState<{
    actionId: number
    anchor: { top: number; left: number }
  } | null>(null)

  const [undoAction, setUndoAction] = useState<{
    message: string
    revert: () => void
  } | null>(null)

  const eventIdCounter = useRef(1000)
  const actionIdCounter = useRef(10_000)

  const actionsById = useMemo(() => new Map(actions.map((a) => [a.id, a])), [actions])
  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks])
  const goalsById = useMemo(() => new Map(mockGoals.map((g) => [g.id, g])), [])

  const selectedAction =
    selectedActionId !== null ? actionsById.get(selectedActionId) ?? null : null
  const parentTask =
    selectedAction?.taskId != null ? tasksById.get(selectedAction.taskId) ?? null : null
  const parentInitiative =
    parentTask ? goalsById.get(parentTask.initiativeId) ?? null : null

  const linkRate = useMemo(() => calcLinkRate(actions), [actions])

  useEffect(() => {
    setEvents((prev) =>
      prev.map((e) => {
        if (!e.action) return e
        const live = actionsById.get(e.action.id)
        if (!live) return e
        return { ...e, action: live, title: live.title }
      }),
    )
  }, [actionsById])

  const toggleComplete = useCallback((action: Action) => {
    const prevStatus = action.status
    const nextStatus: Action['status'] = prevStatus === 'DONE' ? 'TODO' : 'DONE'
    setActions((prev) =>
      prev.map((a) => (a.id === action.id ? { ...a, status: nextStatus } : a)),
    )
    setUndoAction({
      message:
        nextStatus === 'DONE' ? `"${action.title}" 완료 처리됨` : `"${action.title}" 다시 대기`,
      revert: () => {
        setActions((prev) =>
          prev.map((a) => (a.id === action.id ? { ...a, status: prevStatus } : a)),
        )
        setUndoAction(null)
      },
    })
  }, [])

  const openPanelForEvent = useCallback((ev: CalEvent) => {
    if (!ev.action) return
    setSelectedActionId(ev.action.id)
  }, [])

  const changeStatus = (status: Action['status']) => {
    if (!selectedAction) return
    setActions((prev) => prev.map((a) => (a.id === selectedAction.id ? { ...a, status } : a)))
  }
  const changePriority = (priority: Action['priority']) => {
    if (!selectedAction) return
    setActions((prev) => prev.map((a) => (a.id === selectedAction.id ? { ...a, priority } : a)))
  }
  const toggleKeyTask = () => {
    if (!selectedAction) return
    setActions((prev) =>
      prev.map((a) => (a.id === selectedAction.id ? { ...a, isKeyTask: !a.isKeyTask } : a)),
    )
  }

  const moveEvent = (id: string, newStartAt: string) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, startAt: newStartAt } : e)))
  }
  const resizeEvent = (id: string, newDur: number) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, durationMinutes: newDur } : e)))
  }

  const createAtSlot = (startAt: string, durationMinutes: number, title: string) => {
    const id = actionIdCounter.current++
    const newAction: Action = {
      id,
      title,
      taskId: null,
      status: 'TODO',
      priority: 'MEDIUM',
      isKeyTask: false,
      dueDate: null,
      subtaskCount: 0,
      estimatedMinutes: durationMinutes,
    }
    setActions((prev) => [newAction, ...prev])
    const evId = `new-${eventIdCounter.current++}`
    setEvents((prev) => [
      ...prev,
      { id: evId, title, startAt, durationMinutes, action: newAction },
    ])
    setHighlightActionId(id)
    setTimeout(() => setHighlightActionId(null), 1800)
  }

  const dropActionOnCalendar = (actionId: number, startAt: string) => {
    const action = actionsById.get(actionId)
    if (!action) return
    const evId = `drop-${eventIdCounter.current++}`
    setEvents((prev) => [
      ...prev,
      {
        id: evId,
        title: action.title,
        startAt,
        durationMinutes: action.estimatedMinutes,
        action,
      },
    ])
    setHighlightActionId(actionId)
    setTimeout(() => setHighlightActionId(null), 1800)
  }

  const dropCalendarEventToTask = (calendarEventId: string, taskId: number) => {
    const event = events.find((item) => item.id === calendarEventId)
    if (!event) return

    if (event.action) {
      const actionId = event.action.id
      setActions((prev) => prev.map((a) => (a.id === actionId ? { ...a, taskId } : a)))
      setHighlightActionId(actionId)
    } else {
      const id = actionIdCounter.current++
      const newAction: Action = {
        id,
        title: event.title,
        taskId,
        status: 'TODO',
        priority: 'MEDIUM',
        isKeyTask: false,
        dueDate: null,
        subtaskCount: 0,
        estimatedMinutes: event.durationMinutes,
      }
      setActions((prev) => [newAction, ...prev])
      setEvents((prev) =>
        prev.map((item) => (item.id === calendarEventId ? { ...item, action: newAction } : item)),
      )
      setHighlightActionId(id)
    }

    setTimeout(() => setHighlightActionId(null), 1800)
  }

  const addAction = (taskId: number | null, title: string) => {
    const id = actionIdCounter.current++
    const newAction: Action = {
      id,
      title,
      taskId,
      status: 'TODO',
      priority: 'MEDIUM',
      isKeyTask: false,
      dueDate: null,
      subtaskCount: 0,
      estimatedMinutes: 30,
    }
    setActions((prev) => [...prev, newAction])
    setHighlightActionId(id)
    setTimeout(() => setHighlightActionId(null), 1800)
  }

  const linkActionToTask = (actionId: number, task: Task) => {
    setActions((prev) => prev.map((a) => (a.id === actionId ? { ...a, taskId: task.id } : a)))
    setLinkingAction(null)
    setHighlightActionId(actionId)
    setTimeout(() => setHighlightActionId(null), 1800)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedActionId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3 border-b border-line shrink-0 gap-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-ink-100">할 일</h1>
            <div className="text-[11px] text-ink-60 leading-tight">
              Objective › KR › Initiative › Task › Action
              <br />
              <span className="text-ink-40">일일 업무(Action)를 목표에 연결해 성과로 이어지게 하세요</span>
            </div>
          </div>

          {/* 성과 연결률 배너 */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="flex-1">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-ink-80 font-semibold">성과 연결률</span>
                <span className="text-ink-60 tabular-nums">
                  <span className="text-ink-100 font-bold">{linkRate.linked}</span>
                  <span className="text-ink-40"> / {linkRate.total} 액션</span>
                  {linkRate.unlinked > 0 && (
                    <span className="text-warn-text font-semibold ml-2">
                      미연결 {linkRate.unlinked}
                    </span>
                  )}
                </span>
              </div>
              <div className="h-2 bg-surface-4 rounded-full overflow-hidden relative">
                <div
                  className="absolute inset-y-0 left-0 bg-brand-500 rounded-full transition-all"
                  style={{ width: `${linkRate.rate}%` }}
                />
              </div>
            </div>
            <div className="text-2xl font-bold text-brand-500 tabular-nums">
              {linkRate.rate}%
            </div>
          </div>

          <button className="px-3 py-1.5 border border-line rounded-md text-sm bg-surface hover:bg-surface-3 shrink-0">
            ☰ 완료 목표, 업무
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <OkrTree
            tasks={tasks}
            actions={actions}
            hoveredActionId={hoveredActionId}
            onActionToggleComplete={toggleComplete}
            onActionSelect={(a) => setSelectedActionId(a.id)}
            onActionHover={(a) => setHoveredActionId(a?.id ?? null)}
            onActionDragStart={() => {}}
            onAddAction={addAction}
            onLinkAction={(actionId, anchor) => setLinkingAction({ actionId, anchor })}
            onCalendarDropToTask={dropCalendarEventToTask}
          />
        </div>
      </main>

      <WeeklyCalendar
        activeDay={activeDay}
        onChangeActiveDay={setActiveDay}
        events={events}
        onMove={moveEvent}
        onResize={resizeEvent}
        onCreateAtSlot={createAtSlot}
        onSelect={openPanelForEvent}
        onDropActionId={dropActionOnCalendar}
        highlightActionId={hoveredActionId ?? highlightActionId}
        onHoverAction={(a) => setHoveredActionId(a?.id ?? null)}
      />

      <TaskDetailPanel
        action={selectedAction}
        parentTask={parentTask}
        parentInitiative={parentInitiative}
        onClose={() => setSelectedActionId(null)}
        onChangeStatus={changeStatus}
        onChangePriority={changePriority}
        onToggleKeyTask={toggleKeyTask}
      />

      {linkingAction && (
        <LinkGoalMenu
          anchor={linkingAction.anchor}
          onClose={() => setLinkingAction(null)}
          onLink={(task) => linkActionToTask(linkingAction.actionId, task)}
        />
      )}

      {undoAction && (
        <UndoToast
          message={undoAction.message}
          onUndo={undoAction.revert}
          onDismiss={() => setUndoAction(null)}
        />
      )}
    </div>
  )
}
