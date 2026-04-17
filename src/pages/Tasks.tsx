import { useEffect, useRef, useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { OkitPanel } from '../components/OkitPanel'
import { TodoPanel } from '../components/TodoPanel'
import { loadBoardState, saveBoardState } from '../data/board'
import type { Action, BoardState, Goal, Task } from '../data/types'

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

  const toggleTaskDone = (taskId: number) => {
    updateTasks((tasks) =>
      tasks.map((task) => (task.id === taskId ? { ...task, isDone: !task.isDone } : task)),
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
      isDone: false,
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

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-line px-6 py-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-40">
                OKIT / TODO
              </div>
              <h1 className="mt-1 text-2xl font-bold text-ink-100">할일 구조 재정리</h1>
              <p className="mt-1 text-sm text-ink-50">
                왼쪽은 OKIT, 오른쪽은 TODO입니다. Task를 끌어다가 Action에 연결하세요.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-surface-2 px-4 py-3 text-right">
              <div className="text-[11px] text-ink-50">레이아웃</div>
              <div className="text-sm font-semibold text-ink-100">OKIT 40% / TODO 60%</div>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">
          <div className="min-w-0 basis-[40%]">
            <OkitPanel
              goals={board.goals}
              tasks={board.tasks}
              onEditGoalTitle={editGoalTitle}
              onEditTaskTitle={editTaskTitle}
              onToggleTaskDone={toggleTaskDone}
              onEditTaskDates={editTaskDates}
              onAddTask={addTask}
            />
          </div>

          <div className="min-w-0 basis-[60%]">
            <TodoPanel
              activeDay={activeDay}
              actions={board.actions}
              tasks={board.tasks}
              goals={board.goals}
              onChangeDay={setActiveDay}
              onAddAction={addAction}
              onEditActionTitle={editActionTitle}
              onLinkTaskToAction={linkTaskToAction}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
