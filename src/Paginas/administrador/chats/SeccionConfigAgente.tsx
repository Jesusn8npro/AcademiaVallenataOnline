import React, { useState, useEffect } from 'react'
import { Save, RotateCcw, Bot, CheckCircle } from 'lucide-react'
import { supabase } from '../../../servicios/clienteSupabase'

const TONOS = [
  { valor: 'calido_motivador',    label: '🤝 Cálido y motivador' },
  { valor: 'profesional_formal',  label: '💼 Profesional y formal' },
  { valor: 'jovial_energico',     label: '🎵 Jovial y enérgico' },
  { valor: 'experto_tecnico',     label: '🎓 Experto técnico' },
]

const PROMPT_DEFAULT = `Eres un asistente de ventas especializado en Academia Vallenata Online. Tu objetivo es:
1. Entender el nivel musical del usuario (nunca tocó, principiante, intermedio, avanzado)
2. Saber si tiene acordeón o necesita recomendaciones para comprar uno
3. Conocer qué canciones o estilos quiere aprender
4. Guiarlo al curso más apropiado según sus respuestas
5. Capturar nombre y WhatsApp para hacer seguimiento

Siempre pregunta de forma conversacional, una cosa a la vez. No hagas listas de preguntas. Sé amigable y motivador.`

interface Config {
  id: string
  nombre: string
  tono: string
  prompt_adicional: string
  activo: boolean
}

export default function SeccionConfigAgente() {
  const [config, setConfig] = useState<Config | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarConfig()
  }, [])

  const cargarConfig = async () => {
    const { data } = await supabase.from('agente_chat_config').select('*').limit(1).single()
    if (data) setConfig(data)
  }

  const guardar = async () => {
    if (!config) return
    setGuardando(true)
    setError('')
    try {
      const { error: err } = await supabase
        .from('agente_chat_config')
        .update({
          nombre: config.nombre,
          tono: config.tono,
          prompt_adicional: config.prompt_adicional,
          activo: config.activo,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id)
      if (err) throw err
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  if (!config) return <div className="config-loading">Cargando configuración...</div>

  return (
    <div className="config-agente">
      <div className="config-header">
        <div className="config-header-info">
          <Bot size={24} />
          <div>
            <h2>Configuración del Agente</h2>
            <p>Define cómo se comporta Juancho con cada visitante</p>
          </div>
        </div>
        <div className="config-header-actions">
          <label className="toggle-activo">
            <input
              type="checkbox"
              checked={config.activo}
              onChange={e => setConfig({ ...config, activo: e.target.checked })}
            />
            <span>{config.activo ? 'Agente activo' : 'Agente pausado'}</span>
          </label>
        </div>
      </div>

      <div className="config-grid">
        {/* Identidad */}
        <div className="config-card">
          <h3>Identidad del Agente</h3>
          <div className="config-field">
            <label>Nombre del agente</label>
            <input
              type="text"
              value={config.nombre}
              onChange={e => setConfig({ ...config, nombre: e.target.value })}
              placeholder="Ej: Juancho"
            />
          </div>
          <div className="config-field">
            <label>Tono de comunicación</label>
            <div className="tono-grid">
              {TONOS.map(t => (
                <button
                  key={t.valor}
                  className={`tono-btn ${config.tono === t.valor ? 'tono-activo' : ''}`}
                  onClick={() => setConfig({ ...config, tono: t.valor })}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Datos a capturar */}
        <div className="config-card">
          <h3>Datos que captura el agente</h3>
          <p className="config-desc">El agente captura estos datos de forma conversacional</p>
          <div className="captura-lista">
            {[
              { icono: '👤', label: 'Nombre completo' },
              { icono: '📱', label: 'WhatsApp' },
              { icono: '📧', label: 'Email' },
              { icono: '🎵', label: 'Nivel musical (nunca tocó / principiante / intermedio / avanzado)' },
              { icono: '🪗', label: '¿Tiene acordeón? (sí / no / cuál)' },
              { icono: '🎶', label: '¿Qué quiere aprender? (canción, estilo, técnica)' },
              { icono: '🏙️', label: 'Ciudad' },
              { icono: '💰', label: 'Interés en compra (nivel 1-10)' },
              { icono: '🎯', label: 'Cursos consultados' },
            ].map((item, i) => (
              <div key={i} className="captura-item">
                <span className="captura-icono">{item.icono}</span>
                <span>{item.label}</span>
                <CheckCircle size={14} className="captura-check" />
              </div>
            ))}
          </div>
        </div>

        {/* Instrucciones adicionales */}
        <div className="config-card config-card-full">
          <div className="config-field-header">
            <h3>Instrucciones del agente</h3>
            <button
              className="btn-reset"
              onClick={() => setConfig({ ...config, prompt_adicional: PROMPT_DEFAULT })}
            >
              <RotateCcw size={14} /> Restaurar default
            </button>
          </div>
          <p className="config-desc">
            Escribe aquí cómo debe comportarse el agente, qué preguntar, qué evitar y cómo vender.
          </p>
          <textarea
            className="prompt-textarea"
            value={config.prompt_adicional || PROMPT_DEFAULT}
            onChange={e => setConfig({ ...config, prompt_adicional: e.target.value })}
            rows={12}
            placeholder={PROMPT_DEFAULT}
          />
          <div className="prompt-info">
            <span>{(config.prompt_adicional || PROMPT_DEFAULT).length} caracteres</span>
            <span>El agente carga estas instrucciones en cada conversación</span>
          </div>
        </div>

        {/* Vista previa del prompt */}
        <div className="config-card config-card-full preview-card">
          <h3>Vista previa — lo que ve el agente</h3>
          <div className="prompt-preview">
            <div className="preview-bloque">
              <span className="preview-tag">IDENTIDAD</span>
              <p>Soy <strong>{config.nombre}</strong>, asistente de Academia Vallenata Online.</p>
            </div>
            <div className="preview-bloque">
              <span className="preview-tag">TONO</span>
              <p>{TONOS.find(t => t.valor === config.tono)?.label}</p>
            </div>
            <div className="preview-bloque">
              <span className="preview-tag">INSTRUCCIONES</span>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.82rem', color: '#555' }}>
                {(config.prompt_adicional || PROMPT_DEFAULT).slice(0, 300)}
                {(config.prompt_adicional || PROMPT_DEFAULT).length > 300 ? '...' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="config-error">{error}</div>}

      <div className="config-footer">
        <button className={`btn-guardar-config ${guardado ? 'guardado' : ''}`} onClick={guardar} disabled={guardando}>
          {guardando ? (
            <><span className="spinner-mini" /> Guardando...</>
          ) : guardado ? (
            <><CheckCircle size={16} /> Guardado</>
          ) : (
            <><Save size={16} /> Guardar configuración</>
          )}
        </button>
        <span className="config-nota">Los cambios se aplican en el próximo mensaje del chat</span>
      </div>
    </div>
  )
}
