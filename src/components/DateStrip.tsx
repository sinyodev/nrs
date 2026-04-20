interface DateStripProps {
  activeDay: string
  onChange: (day: string) => void
}

function addDays(iso: string, offset: number): string {
  const date = new Date(`${iso}T00:00:00`)
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

function monthLabel(iso: string) {
  const date = new Date(`${iso}T00:00:00`)
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit' })
}

export function DateStrip({ activeDay, onChange }: DateStripProps) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(activeDay, index - 3))

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-line bg-surface px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
      <button
        type="button"
        onClick={() => onChange(addDays(activeDay, -7))}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-50 transition-colors hover:bg-surface-3 hover:text-ink-100"
        aria-label="이전 주"
      >
        ‹
      </button>

      <div className="shrink-0 px-1 text-center">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-40">WEEK</div>
        <div className="text-[12px] font-bold tabular-nums text-ink-100">{monthLabel(activeDay)}</div>
      </div>

      <div className="grid min-w-[322px] flex-1 grid-cols-7 gap-1">
        {days.map((day) => {
          const date = new Date(`${day}T00:00:00`)
          const active = day === activeDay
          return (
            <button
              key={day}
              type="button"
              onClick={() => onChange(day)}
              className={`flex h-10 min-w-0 flex-col items-center justify-center rounded-lg text-center transition-colors ${
                active
                  ? 'bg-ink-100 text-white shadow-[0_8px_16px_rgba(15,23,42,0.16)]'
                  : 'text-ink-50 hover:bg-surface-3 hover:text-ink-100'
              }`}
            >
              <span className="text-[10px] font-semibold leading-3">
                {date.toLocaleDateString('ko-KR', { weekday: 'short' })}
              </span>
              <span className="text-[12px] font-bold leading-4 tabular-nums">
                {date.toLocaleDateString('ko-KR', { day: '2-digit' })}
              </span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => onChange(addDays(activeDay, 7))}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-50 transition-colors hover:bg-surface-3 hover:text-ink-100"
        aria-label="다음 주"
      >
        ›
      </button>
    </div>
  )
}
