import React, { useState, useRef, useEffect } from 'react'

interface Props {
    onEnviar: (contenido: string) => void
    onTyping?: (escribiendo: boolean) => void
    disabled?: boolean
}

const EMOJIS = [
    '😀', '😂', '😍', '😊', '😎', '🤣', '🥰', '😘',
    '😉', '😋', '🤪', '😜', '🤩', '😇', '🙂', '🙃',
    '👍', '👋', '🙏', '💪', '🔥', '✨', '🎉', '❤️',
    '👏', '🙌', '🤝', '🤙', '☝️', '👌', '✌️', '🤘',
]

export default function EntradaMensaje({ onEnviar, onTyping, disabled }: Props) {
    const [contenido, setContenido] = useState('')
    const [mostrarEmojis, setMostrarEmojis] = useState(false)
    const [enviando, setEnviando] = useState(false)
    const ref = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (!ref.current) return
        ref.current.style.height = 'auto'
        ref.current.style.height = Math.min(ref.current.scrollHeight, 120) + 'px'
    }, [contenido])

    const enviar = async () => {
        if (!contenido.trim() || enviando) return
        setEnviando(true)
        try {
            await onEnviar(contenido.trim())
            setContenido('')
            if (ref.current) { ref.current.style.height = 'auto'; ref.current.focus() }
        } finally {
            setEnviando(false)
        }
    }

    const onKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
    }

    return (
        <div className="em_wrapper">
            <div className="em_container">
                <div style={{ position: 'relative' }}>
                    <button type="button" className="em_btn" onClick={() => setMostrarEmojis(v => !v)} aria-label="Insertar emoji">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    {mostrarEmojis && (
                        <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={() => setMostrarEmojis(false)} />
                            <div className="em_emoji_picker">
                                {EMOJIS.map(e => (
                                    <button key={e} type="button" className="em_emoji" onClick={() => { setContenido(p => p + e); setMostrarEmojis(false); ref.current?.focus() }}>
                                        {e}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="em_input_wrapper">
                    <textarea
                        ref={ref}
                        value={contenido}
                        onChange={e => { setContenido(e.target.value); onTyping?.(true) }}
                        onKeyDown={onKey}
                        placeholder="Escribe un mensaje..."
                        className="em_textarea"
                        disabled={disabled || enviando}
                        rows={1}
                    />
                </div>

                <button onClick={enviar} disabled={!contenido.trim() || enviando || disabled} className="em_btn em_send" aria-label="Enviar">
                    {enviando ? (
                        <svg className="spin" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".3" />
                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    ) : (
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    )
}
