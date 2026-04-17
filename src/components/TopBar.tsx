import { useState } from 'react'

export type ViewMode = 'list' | 'map'

interface TopBarProps {
  view: ViewMode
  onViewChange: (v: ViewMode) => void
  includeCompleted: boolean
  onIncludeCompletedChange: (v: boolean) => void
}

export function TopBar({
  view,
  onViewChange,
  includeCompleted,
  onIncludeCompletedChange,
}: TopBarProps) {
  const [period, setPeriod] = useState<'CUMULATIVE' | 'MONTHLY'>('CUMULATIVE')

  return (
    <div className="h-[var(--layout-topbar-h)] border-b border-line flex items-center px-4 gap-3 bg-surface shrink-0">
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-gradient text-surface text-sm font-semibold">
        <span>✦</span>
        <span>경영전략실</span>
        <span className="text-[10px]">▾</span>
      </button>

      <div className="flex items-center gap-1 ml-1 p-0.5 rounded-md bg-surface-4">
        <button
          onClick={() => onViewChange('map')}
          className={`flex items-center gap-1 px-3 py-1 rounded-sm text-base font-medium transition-colors ${
            view === 'map' ? 'bg-ink-100 text-surface font-semibold' : 'text-ink-80'
          }`}
        >
          🗺 맵
        </button>
        <button
          onClick={() => onViewChange('list')}
          className={`flex items-center gap-1 px-3 py-1 rounded-sm text-base font-medium transition-colors ${
            view === 'list' ? 'bg-ink-100 text-surface font-semibold' : 'text-ink-80'
          }`}
        >
          ☰ 리스트
        </button>
      </div>

      <input
        className="flex-1 max-w-[300px] px-3 py-1.5 rounded-md border border-line bg-surface-3 text-sm text-ink-60 outline-none focus:border-brand-500 focus:bg-surface"
        placeholder="🔍 목표, 조직, 담당자 명으로 목표를 검색할 수 있어요."
      />

      <div className="ml-auto flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-sm text-ink-80 cursor-pointer">
          <input
            type="checkbox"
            checked={includeCompleted}
            onChange={(e) => onIncludeCompletedChange(e.target.checked)}
            className="accent-brand-500"
          />
          완료 목표 포함
        </label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as 'CUMULATIVE' | 'MONTHLY')}
          className="px-2.5 py-1 border border-line-mid rounded-md text-sm text-ink-80 bg-surface"
        >
          <option value="CUMULATIVE">누적</option>
          <option value="MONTHLY">당월</option>
        </select>
        <button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-ink-100 text-surface text-base font-semibold">
          <span>＋</span>
          목표 생성
        </button>
      </div>
    </div>
  )
}
