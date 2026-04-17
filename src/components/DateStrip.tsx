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
    <div className="flex items-center gap-1 overflow-x-auto">
      {days.map((day) => {
        const date = new Date(`${day}T00:00:00`)
        const active = day === activeDay
        return (
          <button
            key={day}
            type="button"
            onClick={() => onChange(day)}
            className={`h-8 min-w-[62px] border-b-2 px-1 text-center text-xs transition-colors ${
              active
                ? 'border-brand-500 font-semibold text-ink-100'
                : 'border-transparent text-ink-50 hover:border-line hover:text-ink-80'
            }`}
          >
            <span className="block leading-3">
              {date.toLocaleDateString('ko-KR', { weekday: 'short' })}
            </span>
            <span className="block leading-4 tabular-nums">
              {date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
            </span>
          </button>
        )
      })}
    </div>
  )
}
