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

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function buildMonthCells(base: Date) {
  const cells: Array<Date | null> = []
  const monthStart = startOfMonth(base)
  const monthEnd = endOfMonth(base)
  const leading = monthStart.getDay()

  for (let i = 0; i < leading; i += 1) cells.push(null)
  for (let day = 1; day <= monthEnd.getDate(); day += 1) {
    cells.push(new Date(base.getFullYear(), base.getMonth(), day))
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
    <div className="rounded-2xl border border-line bg-surface p-3">
      <div className="mb-2 text-sm font-semibold text-ink-100">
        {month.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10px] text-ink-40">
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
          <div key={d} className="text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell, index) => {
          if (!cell) return <div key={index} className="h-8" />
          const iso = toIso(cell)
          const active = iso === startDate || iso === endDate
          const isBetween =
            startDate && endDate
              ? toDate(startDate).getTime() <= cell.getTime() &&
                cell.getTime() <= toDate(endDate).getTime()
              : false
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onPick(iso)}
              className={`h-8 rounded-lg text-[11px] transition-colors ${
                active || isBetween
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
      setDraftEnd(draftStart)
      setDraftStart(iso)
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
        className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-left text-sm text-ink-80 hover:bg-surface-2"
      >
        {display}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[640px] rounded-3xl border border-line bg-surface p-4 shadow-xl">
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

          <div className="grid grid-cols-2 gap-4">
            <MonthGrid month={base} startDate={draftStart} endDate={draftEnd} onPick={pick} />
            <MonthGrid month={nextMonth} startDate={draftStart} endDate={draftEnd} onPick={pick} />
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDraftStart(null)
                setDraftEnd(null)
                onCommit({ startDate: '', endDate: '' })
                setOpen(false)
              }}
              className="rounded-xl border border-line px-3 py-2 text-xs text-ink-60 hover:bg-surface-2"
            >
              초기화
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
