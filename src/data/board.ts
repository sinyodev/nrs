import { mockActions, mockGoals, mockTasks, mockTimeBlocks } from './mock'
import type { Action, BoardState, Goal, Task } from './types'

export const BOARD_STORAGE_KEY = 'nrs-board-state-v2'

function dayFromIso(iso: string | null | undefined): string | null {
  if (!iso) return null
  return iso.split('T')[0] ?? null
}

function normalizeGoals(goals: Goal[]): Goal[] {
  return goals.map((goal) => ({ ...goal }))
}

function normalizeTasks(tasks: Task[]): Task[] {
  return tasks.map((task) => ({ ...task, isDone: task.isDone ?? false }))
}

function normalizeActions(actions: Action[]): Action[] {
  return actions.map((action) => ({ ...action, scheduledDay: action.scheduledDay ?? null }))
}

export function createInitialBoardState(): BoardState {
  const scheduledByActionId = new Map<number, string | null>()
  for (const block of mockTimeBlocks) {
    scheduledByActionId.set(block.actionId, dayFromIso(block.startAt))
  }

  const actions = mockActions.map((action) => ({
    ...action,
    scheduledDay: scheduledByActionId.get(action.id) ?? null,
  }))

  return {
    goals: normalizeGoals(mockGoals),
    tasks: normalizeTasks(mockTasks),
    actions: normalizeActions(actions),
  }
}

export function loadBoardState(): BoardState {
  if (typeof window === 'undefined') return createInitialBoardState()

  const raw = window.localStorage.getItem(BOARD_STORAGE_KEY)
  if (!raw) return createInitialBoardState()

  try {
    const parsed = JSON.parse(raw) as BoardState
    return {
      goals: normalizeGoals(parsed.goals ?? mockGoals),
      tasks: normalizeTasks(parsed.tasks ?? mockTasks),
      actions: normalizeActions(parsed.actions ?? mockActions),
    }
  } catch {
    return createInitialBoardState()
  }
}

export function saveBoardState(state: BoardState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(state))
}
