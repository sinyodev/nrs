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
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
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
      <div className="mb-2 text-sm font-semibold text-ink-100">
        {month.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10px] text-ink-40">
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
              className={`h-7 rounded text-[11px] transition-colors ${
                active || inRange
                  ? 'bg-brand-500 text-white'
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

export function DateRangePicker({ value, onCommit }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [draftStart, setDraftStart] = useState<string | null>(value.startDate || null)
  const [draftEnd, setDraftEnd] = useState<string | null>(value.endDate || null)

  const base = value.startDate ? toDate(value.startDate) : new Date()
  const nextMonth = addMonths(base, 1)
  const display =
    value.startDate && value.endDate ? `${value.startDate} ~ ${value.endDate}` : '날짜 지정'

  const resetDraft = () => {
    setDraftStart(value.startDate || null)
    setDraftEnd(value.endDate || null)
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
        className="h-7 w-full rounded border border-line bg-surface px-2 text-left text-xs text-ink-60 hover:bg-surface-2"
      >
        {display}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-[560px] rounded border border-line bg-surface p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-ink-100">시작 / 종료 날짜</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-ink-50 hover:text-ink-100"
            >
              닫기
            </button>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <MonthGrid month={base} startDate={draftStart} endDate={draftEnd} onPick={pick} />
            <MonthGrid month={nextMonth} startDate={draftStart} endDate={draftEnd} onPick={pick} />
          </div>

          <button
            type="button"
            onClick={() => {
              setDraftStart(null)
              setDraftEnd(null)
              onCommit({ startDate: '', endDate: '' })
              setOpen(false)
            }}
            className="mt-3 text-xs text-ink-50 hover:text-ink-100"
          >
            초기화
          </button>
        </div>
      ) : null}
    </div>
  )
}
