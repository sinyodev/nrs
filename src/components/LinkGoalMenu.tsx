import { useEffect, useRef, useState } from 'react'
import { buildObjectiveOptions } from '../data/chain'
import type { Task } from '../data/types'

interface Props {
  onClose: () => void
  onLink: (task: Task) => void
  anchor: { top: number; left: number }
}

/**
 * 캐스케이딩 목표 연결 메뉴.
 * Objective → Key Result → Initiative → Task 4단계를 펼쳐가며 선택.
 * Task를 고르면 onLink(task) 호출.
 */
export function LinkGoalMenu({ onClose, onLink, anchor }: Props) {
  const [objId, setObjId] = useState<number | null>(null)
  const [krId, setKrId] = useState<number | null>(null)
  const [initId, setInitId] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const options = buildObjectiveOptions()
  const obj = options.find((o) => o.goal.id === objId) ?? null
  const kr = obj?.keyResults.find((k) => k.goal.id === krId) ?? null
  const init = kr?.initiatives.find((i) => i.goal.id === initId) ?? null

  const colHeader = 'text-[10px] font-semibold uppercase tracking-wider px-3 pt-2 pb-1'
  const colItem =
    'w-full text-left text-xs px-3 py-1.5 hover:bg-surface-3 truncate flex items-center gap-2'
  const activeItem = 'bg-surface-3 font-semibold'

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="목표 연결 메뉴"
      className="fixed z-50 bg-surface border border-line rounded-md shadow-lg flex text-ink-100"
      style={{ top: anchor.top, left: anchor.left, minHeight: 260 }}
    >
      {/* Objective 컬럼 */}
      <div className="w-48 border-r border-line max-h-80 overflow-y-auto">
        <div className={`${colHeader} text-objective-text bg-objective-bg`}>Objective</div>
        {options.map((o) => (
          <button
            key={o.goal.id}
            onClick={() => {
              setObjId(o.goal.id)
              setKrId(null)
              setInitId(null)
            }}
            className={`${colItem} ${objId === o.goal.id ? activeItem : ''}`}
          >
            <span className="text-objective-text">●</span>
            <span className="truncate">{o.goal.title}</span>
          </button>
        ))}
      </div>

      {/* Key Result 컬럼 */}
      <div className="w-48 border-r border-line max-h-80 overflow-y-auto">
        <div className={`${colHeader} text-keyresult-text bg-keyresult-bg`}>Key Result</div>
        {obj?.keyResults.map((k) => (
          <button
            key={k.goal.id}
            onClick={() => {
              setKrId(k.goal.id)
              setInitId(null)
            }}
            className={`${colItem} ${krId === k.goal.id ? activeItem : ''}`}
          >
            <span className="text-keyresult-text">●</span>
            <span className="truncate">{k.goal.title}</span>
          </button>
        )) ?? <div className="text-[11px] text-ink-40 px-3 py-2">Objective를 선택하세요</div>}
      </div>

      {/* Initiative 컬럼 */}
      <div className="w-48 border-r border-line max-h-80 overflow-y-auto">
        <div className={`${colHeader} text-initiative-text bg-initiative-bg`}>Initiative</div>
        {kr?.initiatives.map((i) => (
          <button
            key={i.goal.id}
            onClick={() => setInitId(i.goal.id)}
            className={`${colItem} ${initId === i.goal.id ? activeItem : ''}`}
          >
            <span className="text-initiative-text">●</span>
            <span className="truncate">{i.goal.title}</span>
          </button>
        )) ?? <div className="text-[11px] text-ink-40 px-3 py-2">Key Result를 선택하세요</div>}
      </div>

      {/* Task 컬럼 */}
      <div className="w-56 max-h-80 overflow-y-auto">
        <div className={`${colHeader} text-ink-80 bg-surface-3`}>Task</div>
        {init?.tasks.length ? (
          init.tasks.map((t) => (
            <button
              key={t.id}
              onClick={() => onLink(t)}
              className={`${colItem} hover:bg-brand-50`}
            >
              <span className="text-ink-60">▸</span>
              <span className="truncate">{t.title}</span>
            </button>
          ))
        ) : (
          <div className="text-[11px] text-ink-40 px-3 py-2">
            {init ? 'Task가 없습니다' : 'Initiative를 선택하세요'}
          </div>
        )}
      </div>
    </div>
  )
}
