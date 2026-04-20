import { useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { OkitPanel } from '../components/OkitPanel'
import { Sidebar } from '../components/Sidebar'
import { TodoPanel } from '../components/TodoPanel'
import { loadBoardState, saveBoardState } from '../data/board'
import type { Action, BoardState, Goal, Task, TaskWorkStatus } from '../data/types'

function todayIso() {
  const date = new Date()
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().slice(0, 10)
}

function maxId<T extends { id: number }>(items: T[]) {
  return items.reduce((max, item) => Math.max(max, item.id), 0)
}

export default function TasksPage() {
  const [board, setBoard] = useState<BoardState>(() => loadBoardState())
  const [activeDay, setActiveDay] = useState(todayIso())
  const [okitWidth, setOkitWidth] = useState(40)
  const boardAreaRef = useRef<HTMLDivElement | null>(null)

  const nextTaskId = useRef(maxId(board.tasks) + 1)
  const nextActionId = useRef(maxId(board.actions) + 1)

  useEffect(() => {
    saveBoardState(board)
  }, [board])

  const updateGoals = (updater: (goals: Goal[]) => Goal[]) => {
    setBoard((prev) => ({ ...prev, goals: updater(prev.goals) }))
  }

  const updateTasks = (updater: (tasks: Task[]) => Task[]) => {
    setBoard((prev) => ({ ...prev, tasks: updater(prev.tasks) }))
  }

  const updateActions = (updater: (actions: Action[]) => Action[]) => {
    setBoard((prev) => ({ ...prev, actions: updater(prev.actions) }))
  }

  const editGoalTitle = (goalId: number, title: string) => {
    updateGoals((goals) => goals.map((goal) => (goal.id === goalId ? { ...goal, title } : goal)))
  }

  const editTaskTitle = (taskId: number, title: string) => {
    updateTasks((tasks) => tasks.map((task) => (task.id === taskId ? { ...task, title } : task)))
  }

  const setTaskWorkStatus = (taskId: number, workStatus: TaskWorkStatus) => {
    updateTasks((tasks) =>
      tasks.map((task) =>
        task.id === taskId ? { ...task, workStatus, isDone: workStatus === 'DONE' } : task,
      ),
    )
  }

  const editTaskDates = (taskId: number, startDate: string, endDate: string) => {
    updateTasks((tasks) =>
      tasks.map((task) => (task.id === taskId ? { ...task, startDate, endDate } : task)),
    )
  }

  const addTask = (initiativeId: number, title: string, startDate: string, endDate: string) => {
    const nextTask = {
      id: nextTaskId.current++,
      title,
      initiativeId,
      memberId: 1000,
      assignees: [
        { memberId: 1000, name: '이재원' },
        { memberId: 1001, name: '심재현' },
      ],
      isDone: false,
      workStatus: 'NOT_STARTED' as const,
      startDate,
      endDate,
      hypothesis: '',
      progressRate: 0,
    }
    updateTasks((tasks) => [nextTask, ...tasks])
  }

  const addAction = (title: string) => {
    const nextAction = {
      id: nextActionId.current++,
      title,
      taskId: null,
      scheduledDay: activeDay,
      status: 'TODO' as const,
      priority: 'MEDIUM' as const,
      isKeyTask: false,
      dueDate: null,
      subtaskCount: 0,
      estimatedMinutes: 30,
    }
    updateActions((actions) => [nextAction, ...actions])
  }

  const editActionTitle = (actionId: number, title: string) => {
    updateActions((actions) =>
      actions.map((action) => (action.id === actionId ? { ...action, title } : action)),
    )
  }

  const linkTaskToAction = (actionId: number, taskId: number) => {
    updateActions((actions) =>
      actions.map((action) => (action.id === actionId ? { ...action, taskId } : action)),
    )
  }

  const deleteGoal = (goalId: number) => {
    setBoard((prev) => {
      const goalIds = new Set<number>([goalId])
      let changed = true

      while (changed) {
        changed = false
        for (const goal of prev.goals) {
          if (goal.parentId !== null && goalIds.has(goal.parentId) && !goalIds.has(goal.id)) {
            goalIds.add(goal.id)
            changed = true
          }
        }
      }

      const taskIds = new Set(
        prev.tasks.filter((task) => goalIds.has(task.initiativeId)).map((task) => task.id),
      )

      return {
        goals: prev.goals.filter((goal) => !goalIds.has(goal.id)),
        tasks: prev.tasks.filter((task) => !taskIds.has(task.id)),
        actions: prev.actions.filter(
          (action) => action.taskId === null || !taskIds.has(action.taskId),
        ),
      }
    })
  }

  const deleteTask = (taskId: number) => {
    setBoard((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((task) => task.id !== taskId),
      actions: prev.actions.filter((action) => action.taskId !== taskId),
    }))
  }

  const deleteAction = (actionId: number) => {
    updateActions((actions) => actions.filter((action) => action.id !== actionId))
  }

  const startPanelResize = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    const rect = boardAreaRef.current?.getBoundingClientRect()
    if (!rect) return

    const move = (moveEvent: MouseEvent) => {
      const next = ((moveEvent.clientX - rect.left) / rect.width) * 100
      setOkitWidth(Math.min(70, Math.max(25, next)))
    }

    const stop = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', stop)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', stop)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-3">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-line bg-surface/95 px-6 py-4 shadow-[0_8px_26px_rgba(15,23,42,0.04)]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-40">
              OKIT / TODO
            </div>
            <h1 className="mt-1 text-2xl font-bold text-ink-100">할 일</h1>
            <p className="mt-1 text-sm text-ink-50">
              Task를 드래그해서 Action에 연결하세요.
            </p>
          </div>
        </header>

        <div ref={boardAreaRef} className="flex min-h-0 flex-1 overflow-hidden p-4">
          <div
            className="min-w-0 overflow-hidden rounded-xl border border-line bg-surface shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
            style={{ width: `${okitWidth}%` }}
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="shrink-0 border-b border-line bg-surface-2/80 px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-ink-40">
                  OKIT
                </div>
                <div className="mt-1 text-lg font-semibold text-ink-100">목표 구조</div>
              </div>
              <div className="min-h-0 flex-1 overflow-auto px-3 py-2">
                <OkitPanel
                  goals={board.goals}
                  tasks={board.tasks}
                  onEditGoalTitle={editGoalTitle}
                  onEditTaskTitle={editTaskTitle}
                  onSetTaskWorkStatus={setTaskWorkStatus}
                  onEditTaskDates={editTaskDates}
                  onAddTask={addTask}
                  onDeleteGoal={deleteGoal}
                  onDeleteTask={deleteTask}
                />
              </div>
            </div>
          </div>

          <div
            onMouseDown={startPanelResize}
            className="group flex w-5 shrink-0 cursor-col-resize items-center justify-center"
            title="패널 너비 조절"
          >
            <div className="h-14 w-1 rounded-full bg-line-mid/70 transition-all group-hover:h-20 group-hover:bg-brand-500" />
          </div>

          <div className="min-w-0 flex-1 overflow-hidden">
            <TodoPanel
              activeDay={activeDay}
              actions={board.actions}
              tasks={board.tasks}
              goals={board.goals}
              onChangeDay={setActiveDay}
              onAddAction={addAction}
              onEditActionTitle={editActionTitle}
              onLinkTaskToAction={linkTaskToAction}
              onDeleteAction={deleteAction}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
