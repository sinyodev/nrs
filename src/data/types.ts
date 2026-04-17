export type OkitType = 'OBJECTIVE' | 'KEY_RESULT' | 'INITIATIVE' | null
export type GoalStatus = 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED'
export type UnitType = 'PERCENT' | 'SCORE' | 'COUNT' | null

export interface Member {
  memberId: number
  name: string
  profileImagePath: string
  organizationName: string | null
  disable: boolean
}

export interface Goal {
  id: number
  title: string
  okitType: OkitType
  depth: 0 | 1 | 2
  status: GoalStatus
  startDate: string | null
  endDate: string | null
  member: Member | null
  organizationName: string | null
  isOpen: boolean
  targetValue: number
  monthlyAchievementRate: number
  cumulativeAchievementRate: number
  unitType: UnitType
  progressRate: number
  parentId: number | null
  order: number
  rollupEnabled: boolean
}

export interface User {
  memberId: number
  name: string
  email: string
  profileImagePath: string
  organizationId: number
  organizationName: string
  role: string
}

export interface Organization {
  organizationId: number
  name: string
  parentId: number | null
  type: string
  memberCount: number
}

export interface PointInfo {
  groupId: number
  groupName: string
  total: number
  consecutiveDays: number
  tier: string
  pointsToNextTier: number
  weeklyMine: number
  weeklyGroupAvg: number
  rankingPercent: number
}

export interface MenuItem {
  id: string
  label: string
  path: string
  icon: string
  active?: boolean
  expandable?: boolean
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Action {
  id: number
  title: string
  taskId: number | null
  scheduledDay?: string | null
  status: TaskStatus
  priority: TaskPriority
  isKeyTask: boolean
  dueDate: string | null
  subtaskCount: number
  estimatedMinutes: number
}

export interface Task {
  id: number
  title: string
  initiativeId: number
  memberId: number
  isDone?: boolean
  startDate: string
  endDate: string
  hypothesis: string
  progressRate: number
}

export interface TimeBlock {
  id: number
  actionId: number
  startAt: string
  durationMinutes: number
}

export interface BoardState {
  goals: Goal[]
  tasks: Task[]
  actions: Action[]
}
