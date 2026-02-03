import { useEffect, useRef } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export default function EditorQuill({ value, onChange, placeholder }: Props){
  const ref = useRef<HTMLTextAreaElement|null>(null)
  useEffect(() => { if (ref.current && ref.current.value !== value) ref.current.value = value }, [value])
  return (
    <textarea
      ref={ref}
      defaultValue={value}
      placeholder={placeholder}
      onChange={(e)=>onChange(e.target.value)}
      style={{ minHeight: 200, width: '100%', padding: '0.75rem', borderRadius: 12, border: '1px solid #e5e7eb', fontFamily: 'inherit', fontSize: '0.95rem' }}
    />
  )
}

