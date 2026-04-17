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

/* ── Tasks / Actions ── */

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

/**
 * 일일 업무 단위 (구 `Task`).
 * 체크박스/상태/마감/우선순위/추정시간 등 개별 등록 필드를 가짐.
 * `taskId`가 null이면 "Task 미연결" 섹션에 묶인다.
 */
export interface Action {
  id: number
  title: string
  /** 상위 Task 참조. null이면 "Task 미연결" */
  taskId: number | null
  status: TaskStatus
  priority: TaskPriority
  /** 사용자가 직접 표시한 핵심 업무 플래그 */
  isKeyTask: boolean
  /** ISO 날짜. null이면 마감 미지정 */
  dueDate: string | null
  /** 하위 업무 개수. 0이면 표시 안 함 */
  subtaskCount: number
  /** 추정 소요 분 — 캘린더 블록 길이로 변환 */
  estimatedMinutes: number
}

/**
 * Initiative(가설) 하위의 Task — 가설 검증의 시계열·업무적 과정.
 * 여러 Action의 묶음으로 구성되며, 진행률 게이지로 표시.
 */
export interface Task {
  id: number
  title: string
  /** 상위 Initiative(Goal.id, okitType='INITIATIVE') */
  initiativeId: number
  /** 담당자 memberId (1000 = "나") */
  memberId: number
  startDate: string
  endDate: string
  /** 한 줄 가설 설명 */
  hypothesis: string
  /** 0~100 (UI 게이지) */
  progressRate: number
}

/** 캘린더에 등록된 시간 블록. 연결된 Action을 가리킴. */
export interface TimeBlock {
  id: number
  actionId: number
  /** "YYYY-MM-DDTHH:MM" 로컬 시간 */
  startAt: string
  durationMinutes: number
}
