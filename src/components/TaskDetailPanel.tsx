import type { Action, Goal, Task } from '../data/types'

interface Props {
  action: Action | null
  /** 상위 Task(가설검증 과정). null이면 "Task 미연결" */
  parentTask: Task | null
  /** 상위 Initiative — parentTask가 있을 때만 채워짐 */
  parentInitiative: Goal | null
  onClose: () => void
  onChangeStatus: (status: Action['status']) => void
  onChangePriority: (priority: Action['priority']) => void
  onToggleKeyTask: () => void
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-surface-4">
      <div className="w-20 text-ink-60 text-xs shrink-0 pt-0.5">{label}</div>
      <div className="flex-1 text-ink-100 text-sm">{children}</div>
    </div>
  )
}

/** 일일 Action 상세 패널. 상태/우선순위/핵심/마감/소요 등 주요 필드 편집. */
export function TaskDetailPanel({
  action,
  parentTask,
  parentInitiative,
  onClose,
  onChangeStatus,
  onChangePriority,
  onToggleKeyTask,
}: Props) {
  if (!action) return null
  return (
    <>
      {/* 백드롭 — 배경 클릭/ESC로 닫힘 */}
      <div
        className="fixed inset-0 bg-black/20 z-30"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
        }}
        role="button"
        aria-label="닫기"
        tabIndex={-1}
      />
      <aside
        className="fixed right-0 top-0 h-screen w-[380px] border-l border-line bg-surface shadow-xl z-40 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-line">
          <h2 className="text-sm font-semibold text-ink-100">업무 상세</h2>
          <button
            onClick={onClose}
            className="text-ink-60 hover:text-ink-100 text-lg leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-surface-3"
            aria-label="닫기"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-base font-semibold text-ink-100 mb-3">{action.title}</div>

          <Row label="연결된 Task">
            {parentTask ? (
              <div>
                <div className="text-sm">{parentTask.title}</div>
                <div className="text-[11px] text-ink-60 mt-0.5">· {parentTask.hypothesis}</div>
              </div>
            ) : (
              <span className="text-no-goal text-sm">Task 미연결</span>
            )}
          </Row>

          {parentInitiative && (
            <Row label="Initiative">
              <span className="text-sm text-ink-80">{parentInitiative.title}</span>
            </Row>
          )}

          <Row label="상태">
            <select
              value={action.status}
              onChange={(e) => onChangeStatus(e.target.value as Action['status'])}
              className="border border-line rounded-md px-2 py-1 text-xs bg-surface text-ink-100"
            >
              <option value="TODO">대기</option>
              <option value="IN_PROGRESS">진행</option>
              <option value="DONE">완료</option>
            </select>
          </Row>

          <Row label="우선순위">
            <select
              value={action.priority}
              onChange={(e) => onChangePriority(e.target.value as Action['priority'])}
              className="border border-line rounded-md px-2 py-1 text-xs bg-surface text-ink-100"
            >
              <option value="LOW">낮음</option>
              <option value="MEDIUM">보통</option>
              <option value="HIGH">높음</option>
            </select>
          </Row>

          <Row label="핵심 업무">
            <button
              onClick={onToggleKeyTask}
              className={`text-xs font-semibold px-2 py-1 rounded-md ${
                action.isKeyTask
                  ? 'bg-key-task text-surface'
                  : 'border border-line text-ink-80 hover:bg-surface-3'
              }`}
            >
              {action.isKeyTask ? '★ 핵심' : '☆ 일반'}
            </button>
          </Row>

          <Row label="마감일">{action.dueDate ?? '미지정'}</Row>
          <Row label="추정 소요">{action.estimatedMinutes}분</Row>
          {action.subtaskCount > 0 && <Row label="하위 업무">{action.subtaskCount}개</Row>}
        </div>
      </aside>
    </>
  )
}
