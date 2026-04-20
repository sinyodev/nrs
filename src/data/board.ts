import { mockActions, mockGoals, mockTasks, mockTimeBlocks } from './mock'
import type { Action, Assignee, BoardState, Goal, Task } from './types'

export const BOARD_STORAGE_KEY = 'nrs-board-state-v2'

const sampleAssignees: Assignee[] = [
  { memberId: 1000, name: '이재원' },
  { memberId: 1001, name: '심재현' },
  { memberId: 1002, name: '김지은' },
  { memberId: 1003, name: '박도윤' },
  { memberId: 1004, name: '오하린' },
]

function dayFromIso(iso: string | null | undefined): string | null {
  if (!iso) return null
  return iso.split('T')[0] ?? null
}

function pickAssignees(seed: number, count: number): Assignee[] {
  return Array.from({ length: count }, (_, index) => {
    const assignee = sampleAssignees[(seed + index) % sampleAssignees.length]
    return { ...assignee }
  })
}

function normalizeGoals(goals: Goal[]): Goal[] {
  return goals.map((goal, index) => ({
    ...goal,
    assignees:
      goal.assignees?.length
        ? goal.assignees
        : pickAssignees(goal.id, goal.okitType === 'OBJECTIVE' || index % 4 === 0 ? 2 : 1),
  }))
}

function normalizeTasks(tasks: Task[]): Task[] {
  return tasks.map((task) => ({
    ...task,
    assignees:
      task.assignees?.length
        ? task.assignees
        : pickAssignees(task.id, task.id % 5 === 0 ? 3 : task.id % 2 === 0 ? 2 : 1),
    isDone: task.isDone ?? task.workStatus === 'DONE',
    workStatus: task.workStatus ?? (task.isDone ? 'DONE' : 'NOT_STARTED'),
  }))
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
