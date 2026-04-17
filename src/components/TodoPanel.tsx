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

function goalMap(goals: Goal[]) {
  return new Map(goals.map((goal) => [goal.id, goal]))
}

function chainFor(task: Task | undefined, goalsById: Map<number, Goal>) {
  if (!task) return { task: '', initiative: '', kr: '' }
  const initiative = goalsById.get(task.initiativeId)
  const kr = initiative?.parentId ? goalsById.get(initiative.parentId) : null
  return {
    task: task.title,
    initiative: initiative?.title ?? '',
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
  const goalsById = useMemo(() => goalMap(goals), [goals])
  const windowDays = useMemo(() => buildWindow(activeDay), [activeDay])
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks])

  const visibleActions = useMemo(
    () => windowDays.flatMap((day) =>
      actions
        .filter((action) => (action.scheduledDay ?? activeDay) === day)
        .map((action) => ({ day, action })),
    ),
    [actions, activeDay, windowDays],
  )

  const submitDraft = () => {
    const title = draftTitle.trim()
    if (!title) return
    onAddAction(title)
    setDraftTitle('')
  }

  return (
    <section className="flex min-h-0 flex-col overflow-hidden border border-line bg-surface">
      <div className="border-b border-line px-4 py-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-40">TODO</div>
            <h2 className="mt-1 text-lg font-semibold text-ink-100">액션 관리</h2>
          </div>
          <div className="text-right text-xs text-ink-50">
            <div>선택 날짜</div>
            <div className="mt-0.5 text-sm font-semibold text-ink-100">{dayLabel(activeDay)}</div>
          </div>
        </div>

        <div className="mt-3">
          <DateStrip activeDay={activeDay} onChange={onChangeDay} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="border-b border-line">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-40">
                Action
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-40">
                Task
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-40">
                Initiative
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-40">
                KR
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line/60">
              <td className="px-4 py-3 align-top">
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
                    className="w-full border-0 bg-transparent px-0 py-1 text-sm outline-none placeholder:text-ink-40"
                  />
                  <button
                    type="button"
                    onClick={submitDraft}
                    className="shrink-0 text-xs font-semibold text-brand-600 hover:underline"
                  >
                    추가
                  </button>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-ink-40">공란</td>
              <td className="px-4 py-3 text-xs text-ink-40">공란</td>
              <td className="px-4 py-3 text-xs text-ink-40">공란</td>
            </tr>

            {visibleActions.length === 0 ? (
              <tr className="border-b border-line/60">
                <td colSpan={4} className="px-4 py-6 text-sm text-ink-40">
                  이 날짜 구간에는 액션이 없습니다.
                </td>
              </tr>
            ) : null}

            {visibleActions.map(({ day, action }) => {
              const chain = chainFor(taskById.get(action.taskId ?? -1), goalsById)
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
                    isDropTarget ? 'bg-brand-50/40' : 'hover:bg-surface-2/40'
                  }`}
                >
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-40">
                        {dayLabel(day)}
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="mt-1 shrink-0 text-[10px] font-bold text-rose-500">A</span>
                        <EditableText
                          value={action.title}
                          onCommit={(title) => onEditActionTitle(action.id, title)}
                          className="min-w-0 flex-1 bg-transparent text-sm text-ink-100 outline-none"
                          placeholder="Action"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-ink-80">{chain.task}</td>
                  <td className="px-4 py-3 align-top text-sm text-ink-80">{chain.initiative}</td>
                  <td className="px-4 py-3 align-top text-sm text-ink-80">{chain.kr}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
