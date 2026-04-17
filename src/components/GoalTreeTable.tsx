import { useMemo, useState } from 'react'
import type { Goal } from '../data/types'
import {
  flattenTree,
  formatDateRange,
  formatPercent,
  formatTarget,
  isVisible,
} from '../data/tree'
import { Avatar } from './Avatar'
import { StatusBadge, TypeBadge } from './Badges'

interface GoalTreeTableProps {
  goals: Goal[]
  includeCompleted: boolean
}

const COLUMNS = [
  { key: 'type',        label: '목표 유형', width: '110px' },
  { key: 'name',        label: '목표명',    minWidth: '320px' },
  { key: 'status',      label: '상태',      width: '70px' },
  { key: 'period',      label: '기간',      width: '170px' },
  { key: 'assignee',    label: '담당자',    width: '110px' },
  { key: 'team',        label: '팀',        width: '110px' },
  { key: 'target',      label: '목표',      width: '80px' },
  { key: 'progress',    label: '진행률',    width: '110px' },
  { key: 'achievement', label: '달성률',    width: '80px' },
  { key: 'register',    label: '성과 등록', width: '110px' },
] as const

export function GoalTreeTable({ goals, includeCompleted }: GoalTreeTableProps) {
  const [collapsed, setCollapsed] = useState<Set<number>>(() => new Set())

  const filtered = useMemo(
    () => (includeCompleted ? goals : goals.filter((g) => g.status !== 'COMPLETED')),
    [goals, includeCompleted],
  )

  const ordered = useMemo(() => flattenTree(filtered), [filtered])
  const goalsById = useMemo(() => new Map(ordered.map((g) => [g.id, g])), [ordered])
  const visibleRows = useMemo(
    () => ordered.filter((g) => isVisible(g, goalsById, collapsed)),
    [ordered, goalsById, collapsed],
  )

  const hasChildren = (id: number) => ordered.some((g) => g.parentId === id)

  const toggle = (id: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-surface-5 sticky top-0 z-10">
            {COLUMNS.map((c) => (
              <th
                key={c.key}
                className="px-3 py-2 text-xs font-medium text-ink-80 text-left whitespace-nowrap"
                style={{
                  width: 'width' in c ? c.width : undefined,
                  minWidth: 'minWidth' in c ? c.minWidth : undefined,
                }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((g) => {
            const isUnknown = g.okitType === null
            const isCollapsed = collapsed.has(g.id)
            const hasKids = hasChildren(g.id)
            const indentPx = g.depth * 24

            if (isUnknown) {
              return (
                <tr key={g.id} className="border-b border-surface-4 hover:bg-surface-2 text-ink-60">
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2" colSpan={COLUMNS.length - 1}>
                    <div className="flex items-center gap-2" style={{ paddingLeft: indentPx }}>
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-line-mid text-[10px] text-ink-60">
                        ⓘ
                      </span>
                      <span>조회할 수 없는 목표</span>
                      <span className="text-ink-40 text-xs">ⓘ</span>
                    </div>
                  </td>
                </tr>
              )
            }

            return (
              <tr key={g.id} className="border-b border-surface-4 hover:bg-surface-2 transition-colors">
                {/* 목표 유형 */}
                <td className="px-3 py-2 align-middle">
                  <div className="flex items-center gap-1" style={{ paddingLeft: indentPx }}>
                    {hasKids ? (
                      <button
                        onClick={() => toggle(g.id)}
                        className="w-4 h-4 flex items-center justify-center text-ink-60 hover:text-ink-100"
                        aria-label={isCollapsed ? '펼치기' : '접기'}
                      >
                        {isCollapsed ? '▶' : '▼'}
                      </button>
                    ) : (
                      <span className="w-4" />
                    )}
                    <TypeBadge type={g.okitType} />
                  </div>
                </td>

                {/* 목표명 */}
                <td className="px-3 py-2 align-middle">
                  <button className="text-left text-ink-100 hover:underline">{g.title}</button>
                </td>

                {/* 상태 */}
                <td className="px-3 py-2 align-middle">
                  <StatusBadge status={g.status} />
                </td>

                {/* 기간 */}
                <td className="px-3 py-2 align-middle text-ink-80 whitespace-nowrap">
                  {formatDateRange(g.startDate, g.endDate)}
                </td>

                {/* 담당자 */}
                <td className="px-3 py-2 align-middle">
                  {g.member ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={g.member.name} size={22} />
                      <span className="text-ink-100 truncate">{g.member.name}</span>
                    </div>
                  ) : (
                    <span className="text-ink-40">—</span>
                  )}
                </td>

                {/* 팀 */}
                <td className="px-3 py-2 align-middle text-ink-80 truncate">
                  {g.organizationName ?? '—'}
                </td>

                {/* 목표값 */}
                <td className="px-3 py-2 align-middle text-ink-100 whitespace-nowrap">
                  {formatTarget(g.targetValue, g.unitType)}
                </td>

                {/* 진행률 */}
                <td className="px-3 py-2 align-middle">
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
                      <div
                        className="h-full bg-progress-fill rounded-full"
                        style={{ width: `${Math.min(100, g.progressRate)}%` }}
                      />
                    </div>
                    <span className="text-ink-100 text-xs whitespace-nowrap">
                      {formatPercent(g.progressRate)}
                    </span>
                  </div>
                </td>

                {/* 달성률 */}
                <td className="px-3 py-2 align-middle text-ink-100 whitespace-nowrap">
                  {formatPercent(g.cumulativeAchievementRate)}
                </td>

                {/* 성과 등록 */}
                <td className="px-3 py-2 align-middle">
                  {g.rollupEnabled ? (
                    <button className="px-2 py-1 rounded-sm text-xs text-brand-500 hover:bg-brand-50 whitespace-nowrap">
                      ↻ 성과 불입정
                    </button>
                  ) : (
                    <button className="px-2 py-1 rounded-sm border border-line-mid text-xs text-ink-80 bg-surface hover:bg-surface-3 whitespace-nowrap">
                      ✎ 성과 등록
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
