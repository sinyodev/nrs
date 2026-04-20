import { useMemo, useState } from 'react'

interface DateRangePickerProps {
  value: { startDate: string; endDate: string }
  onCommit: (value: { startDate: string; endDate: string }) => void
}

function toDate(iso: string) {
  return new Date(`${iso}T00:00:00`)
}

function toIso(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

function buildMonthCells(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1)
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const cells: Array<Date | null> = []

  for (let i = 0; i < start.getDay(); i += 1) cells.push(null)
  for (let day = 1; day <= end.getDate(); day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function shortDate(iso: string) {
  if (!iso) return ''
  const date = toDate(iso)
  const yy = String(date.getFullYear()).slice(2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}.${mm}.${dd}`
}

function MonthGrid({
  month,
  startDate,
  endDate,
  onPick,
}: {
  month: Date
  startDate: string | null
  endDate: string | null
  onPick: (iso: string) => void
}) {
  const cells = useMemo(() => buildMonthCells(month), [month])

  return (
    <div>
      <div className="mb-2 text-[13px] font-bold text-ink-100">
        {month.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10px] font-semibold text-ink-40">
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <div key={day} className="text-center">
            {day}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell, index) => {
          if (!cell) return <div key={index} className="h-7" />

          const iso = toIso(cell)
          const active = iso === startDate || iso === endDate
          const inRange =
            startDate && endDate
              ? toDate(startDate).getTime() <= cell.getTime() &&
                cell.getTime() <= toDate(endDate).getTime()
              : false

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onPick(iso)}
              className={`h-7 rounded text-[11px] font-semibold transition-colors ${
                active
                  ? 'bg-ink-100 text-white'
                  : inRange
                    ? 'bg-brand-50 text-brand-500'
                    : 'text-ink-80 hover:bg-surface-2'
              }`}
            >
              {cell.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-ink-40" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 1.5h1v2h6v-2h1v2h1.5v10h-11v-10H4v-2Zm-0.5 5v6h9v-6h-9Z"
      />
    </svg>
  )
}

export function DateRangePicker({ value, onCommit }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [draftStart, setDraftStart] = useState<string | null>(value.startDate || null)
  const [draftEnd, setDraftEnd] = useState<string | null>(value.endDate || null)
  const [viewMonth, setViewMonth] = useState(() =>
    value.startDate ? toDate(value.startDate) : new Date(),
  )

  const nextMonth = addMonths(viewMonth, 1)
  const display =
    value.startDate && value.endDate
      ? `${shortDate(value.startDate)} ~ ${shortDate(value.endDate)}`
      : '날짜 지정'

  const resetDraft = () => {
    setDraftStart(value.startDate || null)
    setDraftEnd(value.endDate || null)
    setViewMonth(value.startDate ? toDate(value.startDate) : new Date())
  }

  const pick = (iso: string) => {
    if (!draftStart || draftEnd) {
      setDraftStart(iso)
      setDraftEnd(null)
      return
    }

    if (toDate(iso).getTime() < toDate(draftStart).getTime()) {
      setDraftStart(iso)
      setDraftEnd(draftStart)
      onCommit({ startDate: iso, endDate: draftStart })
      setOpen(false)
      return
    }

    setDraftEnd(iso)
    onCommit({ startDate: draftStart, endDate: iso })
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev)
          resetDraft()
        }}
        className="inline-flex h-7 w-full items-center gap-1.5 rounded bg-surface-2 px-2 text-left text-[12px] font-semibold text-ink-60 ring-1 ring-inset ring-line transition-colors hover:bg-surface-3 hover:text-ink-100"
      >
        <CalendarIcon />
        <span className="min-w-0 truncate">{display}</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-[560px] rounded-md border border-line bg-surface p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between border-b border-line pb-3">
            <button
              type="button"
              onClick={() => setViewMonth((prev) => addMonths(prev, -1))}
              className="inline-flex h-7 items-center rounded bg-surface-2 px-2 text-xs font-semibold text-ink-60 hover:bg-surface-3 hover:text-ink-100"
            >
              이전
            </button>
            <div className="text-[13px] font-bold text-ink-100">시작 / 종료 날짜</div>
            <button
              type="button"
              onClick={() => setViewMonth((prev) => addMonths(prev, 1))}
              className="inline-flex h-7 items-center rounded bg-surface-2 px-2 text-xs font-semibold text-ink-60 hover:bg-surface-3 hover:text-ink-100"
            >
              다음
            </button>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <MonthGrid month={viewMonth} startDate={draftStart} endDate={draftEnd} onPick={pick} />
            <MonthGrid month={nextMonth} startDate={draftStart} endDate={draftEnd} onPick={pick} />
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <button
              type="button"
              onClick={() => {
                setDraftStart(null)
                setDraftEnd(null)
                onCommit({ startDate: '', endDate: '' })
                setOpen(false)
              }}
              className="text-xs font-semibold text-ink-50 hover:text-ink-100"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-ink-50 hover:text-ink-100"
            >
              닫기
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
