import { mockGoals, mockTasks } from './mock'
import type { Action, Goal, Task } from './types'

/** Action이 속한 전체 OKR 체인 (O → KR → I → Task). 하나라도 없으면 null */
export interface GoalChain {
  objective: Goal | null
  keyResult: Goal | null
  initiative: Goal | null
  task: Task | null
}

const goalById = new Map(mockGoals.map((g) => [g.id, g]))
const taskById = new Map(mockTasks.map((t) => [t.id, t]))

/** Initiative(goal id) → {KR, Objective} 캐싱 */
const initiativeAncestry = new Map<number, { kr: Goal | null; obj: Goal | null }>()
for (const g of mockGoals) {
  if (g.okitType !== 'INITIATIVE') continue
  const kr = g.parentId != null ? goalById.get(g.parentId) ?? null : null
  const obj = kr?.parentId != null ? goalById.get(kr.parentId) ?? null : null
  initiativeAncestry.set(g.id, { kr, obj })
}

export function resolveChain(action: Action): GoalChain {
  if (action.taskId == null) {
    return { objective: null, keyResult: null, initiative: null, task: null }
  }
  const task = taskById.get(action.taskId) ?? null
  if (!task) return { objective: null, keyResult: null, initiative: null, task: null }
  const init = goalById.get(task.initiativeId) ?? null
  const anc = init ? initiativeAncestry.get(init.id) : undefined
  return {
    task,
    initiative: init,
    keyResult: anc?.kr ?? null,
    objective: anc?.obj ?? null,
  }
}

/** Objective → KR → Initiative 트리 (연결 드롭다운용) */
export interface ObjectiveOption {
  goal: Goal
  keyResults: Array<{
    goal: Goal
    initiatives: Array<{
      goal: Goal
      tasks: Task[]
    }>
  }>
}

export function buildObjectiveOptions(): ObjectiveOption[] {
  const objs = mockGoals.filter((g) => g.okitType === 'OBJECTIVE')
  return objs.map((obj) => {
    const krs = mockGoals.filter((g) => g.okitType === 'KEY_RESULT' && g.parentId === obj.id)
    return {
      goal: obj,
      keyResults: krs.map((kr) => {
        const inits = mockGoals.filter(
          (g) => g.okitType === 'INITIATIVE' && g.parentId === kr.id,
        )
        return {
          goal: kr,
          initiatives: inits.map((init) => ({
            goal: init,
            tasks: mockTasks.filter((t) => t.initiativeId === init.id),
          })),
        }
      }),
    }
  })
}

/** 액션 배열에서 목표 연결률 계산 */
export function calcLinkRate(actions: Action[]): {
  total: number
  linked: number
  unlinked: number
  rate: number
} {
  const total = actions.length
  const linked = actions.filter((a) => a.taskId != null).length
  return {
    total,
    linked,
    unlinked: total - linked,
    rate: total === 0 ? 0 : Math.round((linked / total) * 100),
  }
}
