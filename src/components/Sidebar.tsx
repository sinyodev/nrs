import { NavLink } from 'react-router-dom'
import { mockMenus, mockPoint, mockUser } from '../data/mock'
import { Avatar } from './Avatar'
import { BetaBadge } from './Badges'

const ICON_MAP: Record<string, string> = {
  Home: '🏠',
  Target: '🎯',
  CheckSquare: '✅',
  Users: '👥',
  Calendar: '📅',
  BarChart: '📊',
  Book: '📋',
  Activity: '📈',
  Star: '🏆',
}

/** 프로토타입에서 실제 라우팅되는 메뉴만 매핑 (나머지는 정적 표시) */
const ROUTE_MAP: Record<string, string> = {
  goals: '/',
  tasks: '/tasks',
}

export function Sidebar() {
  return (
    <aside className="relative z-10 flex w-[var(--layout-sidebar-w)] shrink-0 flex-col overflow-y-auto border-r border-line bg-surface shadow-[8px_0_30px_rgba(15,23,42,0.04)]">
      {/* 로고 */}
      <div className="flex cursor-pointer items-center gap-2 px-4 py-4">
        <div className="w-8 h-8 rounded-md bg-brand-gradient flex items-center justify-center text-surface font-extrabold text-[13px]">
          N
        </div>
        <span className="text-md font-bold text-ink-100">NRS</span>
        <button
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-base text-ink-60 hover:bg-surface-3"
          aria-label="알림"
        >
          🔔
        </button>
      </div>

      {/* 포인트 배너 */}
      <button className="mx-3 mb-3 flex items-center justify-between rounded-lg bg-brand-gradient px-3 py-2 text-xs font-semibold text-surface shadow-[0_10px_22px_rgba(1,195,213,0.16)]">
        <span>NRS 포인트</span>
        <strong>{mockPoint.total}P</strong>
      </button>

      {/* 메뉴 */}
      <nav className="flex-1 space-y-1 px-2 py-2">
        {mockMenus.map((m) => {
          const route = ROUTE_MAP[m.id]
          const inner = (
            <>
              <span className="text-base shrink-0">{ICON_MAP[m.icon] ?? '·'}</span>
              <span className="flex-1">{m.label}</span>
              {m.expandable && <span className="text-ink-40 text-xs">▾</span>}
            </>
          )
          const baseCls =
            'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-base font-medium cursor-pointer transition-colors'
          if (route) {
            return (
              <NavLink
                key={m.id}
                to={route}
                end={route === '/'}
                className={({ isActive }) =>
                  `${baseCls} ${
                    isActive
                      ? 'bg-surface-3 text-ink-100 font-semibold shadow-[inset_3px_0_0_var(--color-brand-500)]'
                      : 'text-ink-80 hover:bg-surface-3'
                  }`
                }
              >
                {inner}
              </NavLink>
            )
          }
          return (
            <div key={m.id} className={`${baseCls} text-ink-80 hover:bg-surface-3`}>
              {inner}
            </div>
          )
        })}
      </nav>

      {/* 푸터 */}
      <div className="space-y-1 border-t border-line bg-surface-2/60 p-3">
        <button className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-ink-100 hover:bg-surface-3">
          <span>✨</span>
          <span className="flex-1 text-left">NRS 에이전트</span>
          <BetaBadge />
        </button>
        <button className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-ink-100 hover:bg-surface-3">
          <span>❓</span>
          <span className="flex-1 text-left">헬프 데스크</span>
        </button>
        <div className="flex items-center gap-2 px-2.5 py-2.5">
          <Avatar name={mockUser.name} size={28} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-ink-100 truncate">{mockUser.name}</div>
            <div className="text-[11px] text-ink-60 truncate">{mockUser.email}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
