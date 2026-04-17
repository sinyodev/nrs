import type { Goal, GoalStatus, OkitType } from '../data/types'

const TYPE_LABEL: Record<NonNullable<OkitType>, string> = {
  OBJECTIVE: 'Objective',
  KEY_RESULT: 'Key Result',
  INITIATIVE: 'Initiative',
}

const TYPE_DOT: Record<NonNullable<OkitType>, string> = {
  OBJECTIVE: 'bg-objective-text',
  KEY_RESULT: 'bg-keyresult-text',
  INITIATIVE: 'bg-initiative-text',
}

const TYPE_CLASS: Record<NonNullable<OkitType>, string> = {
  OBJECTIVE:  'bg-objective-bg text-objective-text',
  KEY_RESULT: 'bg-keyresult-bg text-keyresult-text',
  INITIATIVE: 'bg-initiative-bg text-initiative-text',
}

export function TypeBadge({ type }: { type: OkitType }) {
  if (!type) return null
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-semibold ${TYPE_CLASS[type]}`}
    >
      <span className={`inline-block w-2 h-2 rounded-full ${TYPE_DOT[type]}`} />
      {TYPE_LABEL[type]}
    </span>
  )
}

const STATUS_LABEL: Record<GoalStatus, string> = {
  IN_PROGRESS: '진행',
  COMPLETED: '완료',
  PAUSED: '중지',
}

const STATUS_CLASS: Record<GoalStatus, string> = {
  IN_PROGRESS: 'bg-status-progress-bg text-status-progress-text',
  COMPLETED:   'bg-status-complete-bg text-status-complete-text',
  PAUSED:      'bg-surface-4 text-ink-60',
}

export function StatusBadge({ status }: { status: Goal['status'] }) {
  return (
    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  )
}

export function BetaBadge() {
  return (
    <span className="rounded-sm bg-brand-50 px-1.5 text-xs font-semibold text-brand-500">
      BETA
    </span>
  )
}
