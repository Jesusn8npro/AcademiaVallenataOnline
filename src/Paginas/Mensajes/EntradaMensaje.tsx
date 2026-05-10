import React, { useState, useRef, useEffect } from 'react'
import './EntradaMensaje.css'

interface Props {
    onEnviar: (contenido: string) => void
    disabled?: boolean
}

export default function EntradaMensaje({ onEnviar, disabled }: Props) {
    const [contenido, setContenido] = useState('')
    const [mostrarEmojis, setMostrarEmojis] = useState(false)
    const [enviando, setEnviando] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const emojisComunes = [
        '😀', '😂', '😍', '😊', '😎', '🤣', '🥰', '😘',
        '😉', '😋', '🤪', '😜', '🤩', '😇', '🙂', '🙃',
        '👍', '👋', '🙏', '💪', '🔥', '✨', '🎉', '❤️',
        '👏', '🙌', '🤝', '🤙', '☝️', '👌', '✌️', '🤘',
    ]

    useEffect(() => {
        ajustarAltura()
    }, [contenido])

    const ajustarAltura = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
        }
    }

    const manejarEnvio = async () => {
        if (!contenido.trim() || enviando) return
        setEnviando(true)
        try {
            await onEnviar(contenido.trim())
            setContenido('')
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
                textareaRef.current.focus()
            }
        } finally {
            setEnviando(false)
        }
    }

    const manejarKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            manejarEnvio()
        }
    }

    const insertarEmoji = (emoji: string) => {
        setContenido(prev => prev + emoji)
        setMostrarEmojis(false)
        if (textareaRef.current) textareaRef.current.focus()
    }

    return (
        <div className="em-wrapper" id="seccion-enviar-mensaje">
            <div className="em-container">
                <div style={{ position: 'relative' }}>
                    <button
                        type="button"
                        className="em-btn"
                        onClick={() => setMostrarEmojis(v => !v)}
                        title="Emojis"
                        aria-label="Insertar emoji"
                    >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>

                    {mostrarEmojis && (
                        <>
                            <div
                                style={{ position: 'fixed', inset: 0, zIndex: 55 }}
                                onClick={() => setMostrarEmojis(false)}
                            />
                            <div className="em-emoji-picker">
                                {emojisComunes.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => insertarEmoji(emoji)}
                                        className="em-emoji-btn"
                                        type="button"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="em-textarea-wrapper">
                    <textarea
                        ref={textareaRef}
                        value={contenido}
                        onChange={e => setContenido(e.target.value)}
                        onKeyDown={manejarKeyDown}
                        placeholder="Escribe un mensaje..."
                        className="em-textarea"
                        disabled={disabled || enviando}
                        rows={1}
                    />
                </div>

                <button
                    onClick={manejarEnvio}
                    disabled={!contenido.trim() || enviando || disabled}
                    className="em-btn em-btn-send"
                    title="Enviar"
                    aria-label="Enviar mensaje"
                >
                    {enviando ? (
                        <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"></circle>
                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
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
