import { useEffect, useState } from 'react'

interface EditableTextProps {
  value: string
  onCommit: (value: string) => void
  className?: string
  placeholder?: string
}

export function EditableText({ value, onCommit, className, placeholder }: EditableTextProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  const commit = () => {
    const next = draft.trim()
    if (next && next !== value) onCommit(next)
    setEditing(false)
    setDraft(value)
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Escape') {
            setDraft(value)
            setEditing(false)
          }
        }}
        className={className}
        placeholder={placeholder}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={className}
      title="Click to edit"
    >
      {value || placeholder || 'Untitled'}
    </button>
  )
}
