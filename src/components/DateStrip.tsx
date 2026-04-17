interface DateStripProps {
  activeDay: string
  onChange: (day: string) => void
}

function addDays(iso: string, offset: number): string {
  const date = new Date(`${iso}T00:00:00`)
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

export function DateStrip({ activeDay, onChange }: DateStripProps) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(activeDay, index - 3))

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {days.map((day) => {
        const date = new Date(`${day}T00:00:00`)
        const isActive = day === activeDay
        return (
          <button
            key={day}
            type="button"
            onClick={() => onChange(day)}
            className={`min-w-[84px] rounded-xl border px-3 py-2 text-left transition-colors ${
              isActive
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-line bg-surface text-ink-80 hover:bg-surface-2'
            }`}
          >
            <div className="text-[10px] font-semibold uppercase opacity-70">
              {date.toLocaleDateString('ko-KR', { weekday: 'short' })}
            </div>
            <div className="text-sm font-bold tabular-nums">
              {date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
            </div>
          </button>
        )
      })}
    </div>
  )
}
