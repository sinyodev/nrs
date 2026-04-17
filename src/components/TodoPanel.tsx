import { useMemo, useState } from 'react'
import type { Action, Goal, Task } from '../data/types'
import { DateStrip } from './DateStrip'
import { EditableText } from './EditableText'

function shiftDay(iso: string, offset: number): string {
  const date = new Date(`${iso}T00:00:00`)
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

function dayLabel(iso: string) {
  const date = new Date(`${iso}T00:00:00`)
  return date.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  })
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

interface TodoPanelProps {
  activeDay: string
  actions: Action[]
  tasks: Task[]
  goals: Goal[]
  onChangeDay: (day: string) => void
  onAddAction: (title: string) => void
  onEditActionTitle: (actionId: number, title: string) => void
  onLinkTaskToAction: (actionId: number, taskId: number) => void
  onDeleteAction: (actionId: number) => void
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
  onDeleteAction,
}: TodoPanelProps) {
  const [draftTitle, setDraftTitle] = useState('')
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const goalsById = useMemo(() => goalMap(goals), [goals])
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks])
  const windowDays = useMemo(
    () => [activeDay, shiftDay(activeDay, -1), shiftDay(activeDay, -2)],
    [activeDay],
  )
  const rows = useMemo(
    () =>
      windowDays.flatMap((day) =>
        actions
          .filter((action) => (action.scheduledDay ?? activeDay) === day)
          .map((action) => ({ action, day })),
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
    <section className="flex min-h-0 flex-col overflow-hidden border-l border-line bg-surface pl-5">
      <div className="shrink-0 border-b border-line pb-3 pt-2">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-ink-40">TODO</div>
            <h2 className="mt-1 text-lg font-semibold text-ink-100">액션 관리</h2>
          </div>
          <div className="text-right text-xs text-ink-50">
            <div>선택 날짜</div>
            <div className="mt-0.5 font-semibold text-ink-90">{dayLabel(activeDay)}</div>
          </div>
        </div>
        <div className="mt-3">
          <DateStrip activeDay={activeDay} onChange={onChangeDay} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid min-w-[800px] grid-cols-[1.2fr_0.85fr_0.85fr_0.75fr_28px] border-b border-line bg-surface py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-40">
          <div className="px-2">Action</div>
          <div className="px-2">Task</div>
          <div className="px-2">Initiative</div>
          <div className="px-2">KR</div>
          <div />
        </div>

        <div className="grid min-w-[800px] grid-cols-[1.2fr_0.85fr_0.85fr_0.75fr_28px] border-b border-dashed border-line/80 py-1.5 text-sm">
          <div className="flex items-center gap-2 px-2">
            <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded bg-emerald-600 px-1.5 text-[10px] font-bold leading-none text-white">
              A
            </span>
            <input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  submitDraft()
                }
              }}
              placeholder="새 액션 입력"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-40"
            />
            <button
              type="button"
              onClick={submitDraft}
              className="rounded bg-surface-2 px-2 py-1 text-xs text-ink-80 hover:text-brand-600"
            >
              + Action
            </button>
          </div>
          <div className="px-2 text-xs italic text-ink-40">공란</div>
          <div className="px-2 text-xs italic text-ink-40">공란</div>
          <div className="px-2 text-xs italic text-ink-40">공란</div>
          <div />
        </div>

        {rows.length === 0 ? (
          <div className="min-w-[800px] border-b border-dashed border-line/80 px-2 py-5 text-sm italic text-ink-40">
            선택한 날짜 구간에 액션이 없습니다.
          </div>
        ) : null}

        {rows.map(({ action, day }) => {
          const chain = chainFor(taskById.get(action.taskId ?? -1), goalsById)
          const isDropTarget = dropTarget === action.id

          return (
            <div
              key={action.id}
              onDragOver={(event) => {
                if (!Array.from(event.dataTransfer.types).includes('application/x-nrs-task-id')) {
                  return
                }
                event.preventDefault()
                setDropTarget(action.id)
              }}
              onDragLeave={() => {
                if (dropTarget === action.id) setDropTarget(null)
              }}
              onDrop={(event) => {
                const raw = event.dataTransfer.getData('application/x-nrs-task-id')
                if (!raw) return
                const taskId = Number(raw)
                if (!Number.isNaN(taskId)) onLinkTaskToAction(action.id, taskId)
                setDropTarget(null)
              }}
              className={`group grid min-h-8 min-w-[800px] grid-cols-[1.2fr_0.85fr_0.85fr_0.75fr_28px] items-center border-b border-dashed border-line/80 py-1 text-sm transition-colors ${
                isDropTarget ? 'bg-brand-50/60' : 'hover:bg-surface-2/50'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2 px-2">
                <span className="w-[68px] shrink-0 text-[11px] text-ink-40">{dayLabel(day)}</span>
                <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded bg-emerald-600 px-1.5 text-[10px] font-bold leading-none text-white">
                  A
                </span>
                <EditableText
                  value={action.title}
                  onCommit={(title) => onEditActionTitle(action.id, title)}
                  className="min-w-0 flex-1 bg-transparent text-left text-ink-100 outline-none"
                  placeholder="Action"
                />
              </div>
              <div className="min-w-0 truncate px-2 text-ink-80">{chain.task}</div>
              <div className="min-w-0 truncate px-2 text-ink-80">{chain.initiative}</div>
              <div className="min-w-0 truncate px-2 text-ink-80">{chain.kr}</div>
              <button
                type="button"
                onClick={() => onDeleteAction(action.id)}
                className="flex h-6 w-6 items-center justify-center text-ink-40 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                aria-label="삭제"
                title="삭제"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M5.5 2.5h5l.5 1H14v1H2v-1h3l.5-1Zm-.7 3h6.4l-.4 8H5.2l-.4-8Z"
                  />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
