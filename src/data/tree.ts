import type { Goal } from './types'

/**
 * parentId 기반 평탄화 정렬:
 *  - 루트(parentId === null) 먼저, order 오름차순
 *  - 각 루트의 자식을 DFS로 따라가며 같은 순서로 정렬
 *  - 결과 배열은 화면에 보이는 순서 그대로
 */
export function flattenTree(goals: Goal[]): Goal[] {
  const byParent = new Map<number | null, Goal[]>()
  for (const g of goals) {
    const arr = byParent.get(g.parentId) ?? []
    arr.push(g)
    byParent.set(g.parentId, arr)
  }
  for (const arr of byParent.values()) {
    arr.sort((a, b) => a.order - b.order)
  }

  const result: Goal[] = []
  const visit = (parentId: number | null) => {
    const children = byParent.get(parentId) ?? []
    for (const child of children) {
      result.push(child)
      visit(child.id)
    }
  }
  visit(null)
  return result
}

/**
 * 특정 행이 펼쳐진 조상에 의해 표시되어야 하는지 결정.
 * `collapsedIds`에 포함된 ID의 모든 후손은 숨김.
 */
export function isVisible(
  goal: Goal,
  goalsById: Map<number, Goal>,
  collapsedIds: Set<number>,
): boolean {
  let cursor: Goal | undefined = goal
  while (cursor && cursor.parentId !== null) {
    if (collapsedIds.has(cursor.parentId)) return false
    cursor = goalsById.get(cursor.parentId)
  }
  return true
}

/** "2026-01-01" → "26.01.01" */
export function formatShortDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${y.slice(2)}.${m}.${d}`
}

/** ISO 두 개를 "26.01.01 ~ 26.06.30" 형식으로 */
export function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return '—'
  return `${formatShortDate(start)} ~ ${formatShortDate(end)}`
}

/** 대상 값 + 단위 → "100.0%" / "80.0점" / "13.0건" */
export function formatTarget(value: number, unit: Goal['unitType']): string {
  const v = value.toFixed(1)
  switch (unit) {
    case 'PERCENT': return `${v}%`
    case 'SCORE':   return `${v}점`
    case 'COUNT':   return `${v}건`
    default:        return v
  }
}

/** 진행률/달성률 → "54.0%" */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

/** 이름 → 한글 마지막 글자 또는 영문 첫 글자 (이니셜 아바타용) */
export function getInitial(name: string | undefined | null): string {
  if (!name) return '?'
  const trimmed = name.trim()
  if (!trimmed) return '?'
  // 한글이면 마지막 글자(국문 이니셜 관습), 영문이면 첫 글자
  const isHangul = /[\u3131-\uD79D]/.test(trimmed[0])
  return isHangul ? trimmed.slice(-1) : trimmed[0].toUpperCase()
}

/** 이름 → 안정적인 색상 (이니셜 아바타 배경) */
export function getAvatarColor(name: string | undefined | null): string {
  if (!name) return '#aeaeae'
  const palette = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return palette[Math.abs(hash) % palette.length]
}
