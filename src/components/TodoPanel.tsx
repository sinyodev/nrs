import { useMemo, useState } from 'react'
import type { Action, Goal, Task } from '../data/types'
import { DateStrip } from './DateStrip'
import { EditableText } from './EditableText'

function shiftDay(iso: string, offset: number): string {
  const date = new Date(`${iso}T00:00:00`)
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

function buildWindow(activeDay: string) {
  return [activeDay, shiftDay(activeDay, -1), shiftDay(activeDay, -2)]
}

function dayLabel(iso: string) {
  const date = new Date(`${iso}T00:00:00`)
  return date.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  })
}

interface TodoPanelProps {
  activeDay: string
  actions: Action[]
  tasks: Task[]
  goals: Goal[]
  onChangeDay: (day: string) => void
  onAddAction: (title: string) => void
  onEditActionTitle: (actionId: number, title: string) => void
  onLinkTaskToAction: (actionId: number, taskId: number) => void
}

function getGoalById(goals: Goal[]) {
  return new Map(goals.map((goal) => [goal.id, goal]))
}

function resolveChain(task: Task | undefined, goalsById: Map<number, Goal>) {
  if (!task) return { task: '', initiative: '', kr: '' }

  const initiative = goalsById.get(task.initiativeId)
  if (!initiative) {
    return { task: task.title, initiative: '', kr: '' }
  }

  const kr = initiative.parentId ? goalsById.get(initiative.parentId) : null

  return {
    task: task.title,
    initiative: initiative.title,
    kr: kr?.title ?? '',
  }
}

export function TodoPanel({
  activeDay,
  actions,
  tasks,
  goals,
  onChangeDay,
  onAddAction,
  onEditActionTitle,
  onLinkTaskToAction,
}: TodoPanelProps) {
  const [draftTitle, setDraftTitle] = useState('')
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const goalsById = useMemo(() => getGoalById(goals), [goals])
  const windowDays = useMemo(() => buildWindow(activeDay), [activeDay])
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks])

  const rows = useMemo(
    () =>
      windowDays.map((day) => ({
        day,
        actions: actions.filter((action) => (action.scheduledDay ?? activeDay) === day),
      })),
    [actions, activeDay, windowDays],
  )

  const submitDraft = () => {
    const title = draftTitle.trim()
    if (!title) return
    onAddAction(title)
    setDraftTitle('')
  }

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
      <div className="border-b border-line px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-40">
              TODO
            </div>
            <h2 className="mt-1 text-lg font-bold text-ink-100">액션 관리</h2>
            <p className="mt-1 text-xs text-ink-50">
              위 날짜를 눌러 오늘, 어제, 그저께 액션을 넘겨보세요.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface-2 px-3 py-2 text-right">
            <div className="text-[11px] text-ink-50">선택 날짜</div>
            <div className="text-sm font-semibold text-ink-100">{dayLabel(activeDay)}</div>
          </div>
        </div>

        <div className="mt-4">
          <DateStrip activeDay={activeDay} onChange={onChangeDay} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="border-b border-line px-5 py-3">
          <div className="grid grid-cols-[1.4fr_0.9fr_0.9fr_0.8fr] gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-40">
            <div>Action</div>
            <div>Task</div>
            <div>Initiative</div>
            <div>KR</div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b border-line/70 bg-brand-50/50">
                <td className="px-5 py-3 align-top">
                  <div className="flex items-center gap-2">
                    <input
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          submitDraft()
                        }
                      }}
                      placeholder="새 액션 입력"
                      className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none placeholder:text-ink-40"
                    />
                    <button
                      type="button"
                      onClick={submitDraft}
                      className="shrink-0 rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white"
                    >
                      추가
                    </button>
                  </div>
                </td>
                <td className="px-5 py-3 text-xs text-ink-40">공란</td>
                <td className="px-5 py-3 text-xs text-ink-40">공란</td>
                <td className="px-5 py-3 text-xs text-ink-40">공란</td>
              </tr>

              {rows.map(({ day, actions: dayActions }) => (
                <FragmentSection
                  key={day}
                  day={day}
                  actions={dayActions}
                  taskById={taskById}
                  goalsById={goalsById}
                  dropTarget={dropTarget}
                  setDropTarget={setDropTarget}
                  onEditActionTitle={onEditActionTitle}
                  onLinkTaskToAction={onLinkTaskToAction}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function FragmentSection({
  day,
  actions,
  taskById,
  goalsById,
  dropTarget,
  setDropTarget,
  onEditActionTitle,
  onLinkTaskToAction,
}: {
  day: string
  actions: Action[]
  taskById: Map<number, Task>
  goalsById: Map<number, Goal>
  dropTarget: number | null
  setDropTarget: (value: number | null) => void
  onEditActionTitle: (actionId: number, title: string) => void
  onLinkTaskToAction: (actionId: number, taskId: number) => void
}) {
  return (
    <>
      <tr className="border-b border-line bg-surface-2/70">
        <td colSpan={4} className="px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-40">
          {dayLabel(day)}
        </td>
      </tr>

      {actions.length === 0 ? (
        <tr className="border-b border-line/60">
          <td colSpan={4} className="px-5 py-4 text-sm text-ink-40">
            이 날짜에는 액션이 없습니다.
          </td>
        </tr>
      ) : (
        actions.map((action) => {
          const chain = resolveChain(taskById.get(action.taskId ?? -1), goalsById)
          const isDropTarget = dropTarget === action.id
          return (
            <tr
              key={action.id}
              onDragOver={(e) => {
                if (!Array.from(e.dataTransfer.types).includes('application/x-nrs-task-id')) {
                  return
                }
                e.preventDefault()
                setDropTarget(action.id)
              }}
              onDragLeave={() => {
                if (dropTarget === action.id) setDropTarget(null)
              }}
              onDrop={(e) => {
                const raw = e.dataTransfer.getData('application/x-nrs-task-id')
                if (!raw) return
                const taskId = Number(raw)
                if (!Number.isNaN(taskId)) onLinkTaskToAction(action.id, taskId)
                setDropTarget(null)
              }}
              className={`border-b border-line/60 transition-colors ${
                isDropTarget ? 'bg-brand-50/70' : 'hover:bg-surface-2/60'
              }`}
            >
              <td className="px-5 py-3 align-top">
                <div className="flex items-start gap-2">
                  <span className="mt-1 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white">
                    A
                  </span>
                  <EditableText
                    value={action.title}
                    onCommit={(title) => onEditActionTitle(action.id, title)}
                    className="block min-w-0 flex-1 bg-transparent text-left text-sm font-medium text-ink-100 outline-none"
                    placeholder="Action"
                  />
                </div>
              </td>
              <td className="px-5 py-3 align-top">
                <div className="text-sm text-ink-80">{chain.task}</div>
              </td>
              <td className="px-5 py-3 align-top">
                <div className="text-sm text-ink-80">{chain.initiative}</div>
              </td>
              <td className="px-5 py-3 align-top">
                <div className="text-sm text-ink-80">{chain.kr}</div>
              </td>
            </tr>
          )
        })
      )}
    </>
  )
}
