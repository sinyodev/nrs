import raw from '../captured/api-mock.json'
import tasksRaw from '../captured/tasks/tasks-mock.json'
import type {
  Action,
  Goal,
  MenuItem,
  Organization,
  PointInfo,
  Task,
  TimeBlock,
  User,
} from './types'

/**
 * 캡처된 mock JSON을 타입 단언과 함께 모듈로 export.
 * Vite의 resolveJsonModule + isolatedModules 환경에서
 * 좁은 union type(`'OBJECTIVE'` 등)이 string으로 추론되는 문제를 해결.
 */
export const mockGoals = raw.goals as Goal[]
export const mockUser = raw.user as User
export const mockOrganization = raw.organization as Organization
export const mockPoint = raw.point as PointInfo
export const mockNotifications = raw.notifications as { unreadCount: number }
export const mockMenus = raw.menus as MenuItem[]

/* ── Tasks / Actions ── */

/** Initiative 하위 Task(가설검증 과정) 배열 */
export const mockTasks = tasksRaw.tasks as Task[]
/** 일일 등록 단위 Action 배열 (구 mockTasks) */
export const mockActions = tasksRaw.actions as Action[]
export const mockTimeBlocks = tasksRaw.timeBlocks as TimeBlock[]
export const mockCalendarPlaceholders = tasksRaw.calendarPlaceholders as Array<{
  title: string
  startAt: string
  durationMinutes: number
}>
