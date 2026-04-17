import { useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { TopBar, type ViewMode } from '../components/TopBar'
import { GoalTreeTable } from '../components/GoalTreeTable'
import { mockGoals } from '../data/mock'

export default function OriginalPage() {
  const [view, setView] = useState<ViewMode>('list')
  const [includeCompleted, setIncludeCompleted] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-surface-3">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-surface">
        <TopBar
          view={view}
          onViewChange={setView}
          includeCompleted={includeCompleted}
          onIncludeCompletedChange={setIncludeCompleted}
        />
        {view === 'list' ? (
          <GoalTreeTable goals={mockGoals} includeCompleted={includeCompleted} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-ink-60">
            맵 뷰는 다음 단계에서 구현됩니다.
          </div>
        )}
      </main>
    </div>
  )
}
