import { useMemo, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
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

function TrashButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
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
  )
}

function ResizeCell({
  index,
  onResizeStart,
}: {
  index: number
  onResizeStart: (index: number, event: ReactMouseEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      onMouseDown={(event) => onResizeStart(index, event)}
      className="group flex cursor-col-resize items-stretch justify-center"
      title="열 너비 조절"
    >
      <div className="w-px bg-line transition-colors group-hover:bg-ink-40" />
    </div>
  )
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
  const [columns, setColumns] = useState([1.2, 0.85, 0.85, 0.75])
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

  const templateColumns = `${columns[0]}fr 8px ${columns[1]}fr 8px ${columns[2]}fr 8px ${columns[3]}fr 28px`
  const dataCellClass = 'min-w-0 border-r border-line/80 px-2'

  const submitDraft = () => {
    const title = draftTitle.trim()
    if (!title) return
    onAddAction(title)
    setDraftTitle('')
  }

  const startColumnResize = (index: number, event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    const startX = event.clientX
    const startColumns = [...columns]

    const move = (moveEvent: MouseEvent) => {
      const delta = (moveEvent.clientX - startX) / 180
      const next = [...startColumns]
      next[index] = Math.max(0.45, startColumns[index] + delta)
      next[index + 1] = Math.max(0.45, startColumns[index + 1] - delta)
      setColumns(next)
    }

    const stop = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', stop)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', stop)
  }

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="shrink-0 border-b border-line bg-surface-2/80 px-4 py-3">
        <div className="grid grid-cols-[150px_minmax(420px,1fr)] items-center gap-4">
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-ink-40">TODO</div>
            <h2 className="mt-1 text-lg font-semibold text-ink-100">액션 관리</h2>
          </div>
          <div className="min-w-0">
            <DateStrip activeDay={activeDay} onChange={onChangeDay} />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">
        <div
          className="sticky top-0 z-10 grid min-w-[820px] border-b border-line bg-surface py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-40 shadow-[0_6px_14px_rgba(15,23,42,0.03)]"
          style={{ gridTemplateColumns: templateColumns }}
        >
          <div className="border-r border-line/80 px-2">Action</div>
          <ResizeCell index={0} onResizeStart={startColumnResize} />
          <div className="border-r border-line/80 px-2">Task</div>
          <ResizeCell index={1} onResizeStart={startColumnResize} />
          <div className="border-r border-line/80 px-2">Initiative</div>
          <ResizeCell index={2} onResizeStart={startColumnResize} />
          <div className="px-2">KR</div>
          <div />
        </div>

        <div
          className="grid min-w-[820px] border-b border-dashed border-line-mid/80 py-1.5 text-sm transition-colors hover:bg-surface-3"
          style={{ gridTemplateColumns: templateColumns }}
        >
          <div className="flex items-center gap-2 border-r border-line/80 px-2">
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
              placeholder="액션 입력"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-40"
            />
            <button
              type="button"
              onClick={submitDraft}
              className="rounded bg-surface-2 px-2 py-1 text-xs text-ink-80 hover:text-brand-500"
            >
              + Action
            </button>
          </div>
          <ResizeCell index={0} onResizeStart={startColumnResize} />
          <div className={`${dataCellClass} text-xs italic text-ink-40`}>공란</div>
          <ResizeCell index={1} onResizeStart={startColumnResize} />
          <div className={`${dataCellClass} text-xs italic text-ink-40`}>공란</div>
          <ResizeCell index={2} onResizeStart={startColumnResize} />
          <div className="px-2 text-xs italic text-ink-40">공란</div>
          <div />
        </div>

        {rows.length === 0 ? (
          <div className="min-w-[820px] border-b border-dashed border-line-mid/80 px-2 py-5 text-sm italic text-ink-40">
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
              className={`group grid min-h-8 min-w-[820px] items-center border-b border-dashed border-line-mid/80 py-1 text-sm transition-all ${
                isDropTarget
                  ? 'bg-brand-50 ring-2 ring-inset ring-brand-500 shadow-[inset_4px_0_0_var(--color-brand-500)]'
                  : 'hover:bg-surface-3'
              }`}
              style={{ gridTemplateColumns: templateColumns }}
            >
              <div className="flex min-w-0 items-center gap-2 border-r border-line/80 px-2">
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
              <ResizeCell index={0} onResizeStart={startColumnResize} />
              <div className={`${dataCellClass} truncate text-ink-80`}>{chain.task}</div>
              <ResizeCell index={1} onResizeStart={startColumnResize} />
              <div className={`${dataCellClass} truncate text-ink-80`}>{chain.initiative}</div>
              <ResizeCell index={2} onResizeStart={startColumnResize} />
              <div className="min-w-0 truncate px-2 text-ink-80">{chain.kr}</div>
              <TrashButton onClick={() => onDeleteAction(action.id)} />
            </div>
          )
        })}
      </div>
    </section>
  )
}
