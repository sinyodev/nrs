import { useEffect, useMemo, useRef, useState } from 'react'
import { resolveChain } from '../data/chain'
import type { Action } from '../data/types'

const HOURS = Array.from({ length: 10 }, (_, i) => 9 + i) // 09~18
const SLOT_HEIGHT = 40
const PX_PER_MIN = SLOT_HEIGHT / 60
const MIN_DURATION = 15
const SNAP_MIN = 15
const DAY_START = 9 * 60
const DAY_END = 18 * 60

const WEEK = [
  { label: '일', date: 12 },
  { label: '월', date: 13 },
  { label: '화', date: 14 },
  { label: '수', date: 15 },
  { label: '목', date: 16 },
  { label: '금', date: 17 },
  { label: '토', date: 18 },
] as const

/**
 * 캘린더에 표시되는 단일 이벤트. 연결된 Action이 있을 수도(`action`), 없을 수도(placeholder) 있음.
 * 보고용 단일 색상 UI라 locked 구분은 없음 — 모든 블록이 이동/리사이즈 가능.
 */
export interface CalEvent {
  id: string
  title: string
  startAt: string // 'YYYY-MM-DDTHH:mm'
  durationMinutes: number
  action?: Action
}

interface Props {
  activeDay: string // 'YYYY-MM-DD'
  onChangeActiveDay: (day: string) => void
  events: CalEvent[]
  onMove: (id: string, newStartAt: string) => void
  onResize: (id: string, newDurationMinutes: number) => void
  onCreateAtSlot: (startAt: string, durationMinutes: number, title: string) => void
  onSelect: (ev: CalEvent) => void
  /** Action 체크박스 드래그 → 캘린더 드롭. dataTransfer['text/task-id']는 action.id */
  onDropActionId: (actionId: number, startAt: string) => void
  highlightActionId?: number | null
  /** 이벤트 호버 → 트리 하이라이트 전파 */
  onHoverAction?: (action: Action | null) => void
}

function dayOf(startAt: string): string {
  return startAt.split('T')[0]
}
function minsOf(startAt: string): number {
  const [h, m] = startAt.split('T')[1].split(':').map(Number)
  return h * 60 + m
}
function toStartAt(day: string, mins: number): string {
  const clamped = Math.max(DAY_START, Math.min(DAY_END - MIN_DURATION, mins))
  const h = String(Math.floor(clamped / 60)).padStart(2, '0')
  const m = String(clamped % 60).padStart(2, '0')
  return `${day}T${h}:${m}`
}
function snap(mins: number): number {
  return Math.round(mins / SNAP_MIN) * SNAP_MIN
}
function fmt(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

type DragState = {
  id: string
  mode: 'move' | 'resize'
  startClientY: number
  origMins: number
  origDur: number
  curMins: number
  curDur: number
}

/**
 * 주간 캘린더 (하루 초점). 모든 블록 단색 파란색.
 * 기능: 블록 pointer drag → 시간 이동 / 하단 엣지 → 길이 조정 /
 *       빈 슬롯 클릭 → 인라인 업무 추가 / Action 드래그 → 그 시간에 배치.
 */
export function WeeklyCalendar({
  activeDay,
  onChangeActiveDay,
  events,
  onMove,
  onResize,
  onCreateAtSlot,
  onSelect,
  onDropActionId,
  highlightActionId,
  onHoverAction,
}: Props) {
  const gridRef = useRef<HTMLDivElement | null>(null)
  const [inlineAdd, setInlineAdd] = useState<{ mins: number; text: string } | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [dropHover, setDropHover] = useState<number | null>(null)

  const visible = useMemo(
    () =>
      events
        .filter((e) => dayOf(e.startAt) === activeDay)
        .map((e) => ({ ...e, mins: minsOf(e.startAt) })),
    [events, activeDay],
  )

  /** 수직 드래그 — 전역 pointermove/up 리스너로 추적 */
  useEffect(() => {
    if (!drag) return
    const onPointerMove = (e: PointerEvent) => {
      const deltaMin = snap((e.clientY - drag.startClientY) / PX_PER_MIN)
      setDrag((prev) => {
        if (!prev) return prev
        if (prev.mode === 'move') {
          const next = Math.max(DAY_START, Math.min(DAY_END - prev.origDur, prev.origMins + deltaMin))
          return { ...prev, curMins: next }
        } else {
          const next = Math.max(MIN_DURATION, Math.min(DAY_END - prev.origMins, prev.origDur + deltaMin))
          return { ...prev, curDur: next }
        }
      })
    }
    const onPointerUp = () => {
      setDrag((prev) => {
        if (!prev) return null
        if (prev.mode === 'move' && prev.curMins !== prev.origMins) {
          onMove(prev.id, toStartAt(activeDay, prev.curMins))
        } else if (prev.mode === 'resize' && prev.curDur !== prev.origDur) {
          onResize(prev.id, prev.curDur)
        }
        return null
      })
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [drag, activeDay, onMove, onResize])

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) return
    const target = e.target as HTMLElement
    if (target.closest('[data-calendar-block]') || target.closest('[data-calendar-inline]')) return
    const rect = gridRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const mins = Math.max(DAY_START, Math.min(DAY_END - 30, snap(DAY_START + y / PX_PER_MIN)))
    setInlineAdd({ mins, text: '' })
  }

  const submitInline = () => {
    if (!inlineAdd) return
    const text = inlineAdd.text.trim()
    if (text) {
      onCreateAtSlot(toStartAt(activeDay, inlineAdd.mins), 30, text)
    }
    setInlineAdd(null)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes('text/task-id')) return
    e.preventDefault()
    if (!gridRef.current) return
    const rect = gridRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    setDropHover(snap(DAY_START + y / PX_PER_MIN))
  }
  const handleDragLeave = () => setDropHover(null)
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const actionIdStr = e.dataTransfer.getData('text/task-id')
    setDropHover(null)
    if (!actionIdStr || !gridRef.current) return
    e.preventDefault()
    const rect = gridRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const mins = snap(DAY_START + y / PX_PER_MIN)
    onDropActionId(Number(actionIdStr), toStartAt(activeDay, mins))
  }

  return (
    <aside className="w-[280px] shrink-0 border-l border-line bg-surface p-3 flex flex-col">
      <div className="text-base font-bold text-center mb-2">2026.04</div>

      <div className="grid grid-cols-7 gap-0.5 mb-2">
        {WEEK.map((d) => {
          const day = `2026-04-${String(d.date).padStart(2, '0')}`
          const isActive = day === activeDay
          return (
            <button
              key={d.date}
              onClick={() => onChangeActiveDay(day)}
              className={`py-1 rounded-full text-xs flex flex-col items-center ${
                isActive
                  ? 'bg-calendar-today text-surface font-semibold'
                  : 'text-ink-80 hover:bg-surface-3'
              }`}
            >
              <span>{d.label}</span>
              <span>{d.date}</span>
            </button>
          )
        })}
      </div>

      <div className="text-[11px] text-ink-60 py-1 border-t border-line">종일</div>

      <div
        ref={gridRef}
        className="relative flex-1 overflow-y-auto"
        style={{ minHeight: HOURS.length * SLOT_HEIGHT }}
        onClick={handleGridClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {HOURS.map((h) => (
          <div key={h} className="border-t border-surface-4" style={{ height: SLOT_HEIGHT }}>
            <div className="text-[10px] text-ink-60 px-1 pointer-events-none select-none">
              {String(h).padStart(2, '0')}:00
            </div>
          </div>
        ))}

        {/* 드롭 프리뷰 라인 */}
        {dropHover !== null && (
          <div
            className="absolute left-8 right-1 border-t-2 border-dashed border-calendar-event-bar pointer-events-none"
            style={{ top: (dropHover - DAY_START) * PX_PER_MIN }}
          >
            <span className="text-[10px] text-calendar-event-bar font-semibold bg-surface px-1 rounded">
              {fmt(dropHover)}에 배치
            </span>
          </div>
        )}

        <div className="absolute inset-0 pl-8 pr-1">
          {visible.map((ev) => {
            const isDragging = drag?.id === ev.id
            const mins = isDragging && drag?.mode === 'move' ? drag.curMins : ev.mins
            const dur = isDragging && drag?.mode === 'resize' ? drag.curDur : ev.durationMinutes
            const top = (mins - DAY_START) * PX_PER_MIN
            const height = Math.max(18, dur * PX_PER_MIN)
            const highlighted =
              highlightActionId !== undefined &&
              highlightActionId !== null &&
              ev.action?.id === highlightActionId
            const isDone = ev.action?.status === 'DONE'
            const chain = ev.action ? resolveChain(ev.action) : null
            const linked = Boolean(chain?.initiative)
            // 연결됨: 청록 초록 레일 + 연한 배경 / 미연결: 주의 색상
            const eventStyle = !ev.action
              ? { bg: 'bg-surface-3', border: 'border-ink-40' }
              : linked
                ? { bg: 'bg-initiative-bg', border: 'border-initiative-text' }
                : { bg: 'bg-warn-bg', border: 'border-warn-border' }
            return (
              <div
                key={ev.id}
                data-calendar-block
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('application/x-nrs-calendar-event-id', ev.id)
                  e.dataTransfer.setData('text/calendar-event-id', ev.id)
                  e.dataTransfer.setData('text/plain', ev.id)
                }}
                onMouseEnter={onHoverAction && ev.action ? () => onHoverAction(ev.action!) : undefined}
                onMouseLeave={onHoverAction ? () => onHoverAction(null) : undefined}
                onPointerDown={(e) => {
                  const target = e.target as HTMLElement
                  if (target.dataset.resizeHandle === 'true') return
                  e.stopPropagation()
                  setDrag({
                    id: ev.id,
                    mode: 'move',
                    startClientY: e.clientY,
                    origMins: ev.mins,
                    origDur: ev.durationMinutes,
                    curMins: ev.mins,
                    curDur: ev.durationMinutes,
                  })
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(ev)
                }}
                className={`absolute left-8 right-1 rounded-sm border-l-[3px] ${eventStyle.bg} ${eventStyle.border} cursor-move hover:shadow-md px-1.5 py-0.5 text-[11px] overflow-hidden select-none transition-shadow ${
                  highlighted ? 'ring-2 ring-brand-500' : ''
                } ${isDragging ? 'opacity-80 shadow-lg z-20' : ''} ${isDone ? 'opacity-60' : ''}`}
                style={{ top, height }}
              >
                <div
                  className={`font-medium truncate ${
                    isDone ? 'line-through text-ink-60' : 'text-ink-100'
                  }`}
                >
                  {!ev.action && <span className="text-ink-40 mr-1">⚠️</span>}
                  {ev.title}
                </div>
                <div className="text-[10px] text-ink-60">
                  {fmt(mins)} - {fmt(mins + dur)}
                  <span className="ml-1 text-ink-40">· {dur}분</span>
                </div>
                {chain?.initiative && (
                  <div className="text-[9px] text-initiative-text truncate mt-0.5">
                    ▸ {chain.initiative.title}
                  </div>
                )}
                {ev.action && !linked && (
                  <div className="text-[9px] text-warn-text truncate mt-0.5 font-semibold">
                    목표 미연결
                  </div>
                )}
                <div
                  data-resize-handle="true"
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    setDrag({
                      id: ev.id,
                      mode: 'resize',
                      startClientY: e.clientY,
                      origMins: ev.mins,
                      origDur: ev.durationMinutes,
                      curMins: ev.mins,
                      curDur: ev.durationMinutes,
                    })
                  }}
                  className="absolute left-0 right-0 bottom-0 h-1.5 cursor-ns-resize hover:bg-calendar-event-bar/50"
                />
              </div>
            )
          })}

          {/* 인라인 인풋 — 빈 슬롯 클릭 시 등장 */}
          {inlineAdd && (
            <div
              data-calendar-inline
              className="absolute left-8 right-1 bg-surface border-2 border-calendar-event-bar rounded-sm px-1.5 py-1 z-30 shadow-md"
              style={{ top: (inlineAdd.mins - DAY_START) * PX_PER_MIN, minHeight: 30 * PX_PER_MIN }}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="text-[10px] text-ink-60 mb-0.5">
                {fmt(inlineAdd.mins)} – {fmt(inlineAdd.mins + 30)} (기본 30분)
              </div>
              <input
                autoFocus
                placeholder="업무 제목 + Enter"
                value={inlineAdd.text}
                onChange={(e) => setInlineAdd({ ...inlineAdd, text: e.target.value })}
                onBlur={submitInline}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    submitInline()
                  } else if (e.key === 'Escape') {
                    setInlineAdd(null)
                  }
                }}
                className="w-full text-[11px] outline-none bg-transparent text-ink-100 placeholder:text-ink-40"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 text-[10px] text-ink-60 leading-relaxed px-1">
        💡 빈 슬롯 클릭 → 그 시간에 추가 · 블록 드래그 → 이동 · 하단 엣지 → 길이 조절
      </div>
    </aside>
  )
}
