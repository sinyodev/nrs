import { getAvatarColor, getInitial } from '../data/tree'

interface AvatarProps {
  name: string | null | undefined
  size?: number
}

/**
 * 이니셜 + 안정적 배경색 아바타.
 * mock 프로필 이미지는 존재하지 않으므로 항상 이니셜로 그림.
 */
export function Avatar({ name, size = 22 }: AvatarProps) {
  const initial = getInitial(name)
  const bg = getAvatarColor(name)
  return (
    <div
      className="inline-flex items-center justify-center rounded-full text-white font-semibold select-none shrink-0"
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: Math.max(10, Math.floor(size * 0.45)),
      }}
      aria-label={name ?? '담당자 없음'}
    >
      {initial}
    </div>
  )
}
