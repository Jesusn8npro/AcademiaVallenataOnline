'use client'
import * as React from 'react'
import { useUsuario } from '../../../contextos/UsuarioContext'
import {
  useEncuadreAcordeon, setEncuadreAcordeon, type EncuadreAcordeonValores, type EncuadreId,
} from '../Modos/acordeon3dCompartido'
import { guardarEncuadreAcordeon } from '../PracticaLibre/Servicios/servicioEncuadreAcordeon'

// Editor de POSICIÓN del acordeón 3D (solo admin). Son los mismos controles que /modo-competitivo-muestra
// ("Prueba pisar maestro") pero embebidos en la página de la canción: el admin "cuadra" el acordeón
// (orientación + tamaño + centrado) viéndolo EN VIVO en el modo actual y lo guarda en Supabase (global).
// El cambio aplica al instante a todos los modos (leen el mismo store useEncuadreAcordeon).

const DEG = (r: number) => (r * 180) / Math.PI
const RAD = (g: number) => (g * Math.PI) / 180

interface EditorEncuadreAcordeonProps {
  // Qué encuadre edita: 'global' (modos de juego) o 'estudio' (pestaña Acordeón de Práctica Libre).
  encuadreId?: EncuadreId
  titulo?: string
}

const EditorEncuadreAcordeon: React.FC<EditorEncuadreAcordeonProps> = ({ encuadreId = 'global', titulo }) => {
  const { esAdmin } = useUsuario()
  const enc = useEncuadreAcordeon(encuadreId)
  const [abierto, setAbierto] = React.useState(false)
  const [estado, setEstado] = React.useState<'idle' | 'guardando' | 'ok' | 'error'>('idle')
  const [mensajeError, setMensajeError] = React.useState('')

  if (!esAdmin) return null

  const aplicar = (patch: Partial<EncuadreAcordeonValores>) => {
    setEncuadreAcordeon(encuadreId, { ...enc, ...patch })
    setEstado('idle')
  }
  const setRot = (i: number, gradosVal: number) => {
    const r: [number, number, number] = [enc.rotacion[0], enc.rotacion[1], enc.rotacion[2]]
    r[i] = RAD(gradosVal)
    aplicar({ rotacion: r })
  }

  const guardar = async () => {
    setEstado('guardando')
    const r = await guardarEncuadreAcordeon(encuadreId, enc)
    if (r.ok) setEstado('ok')
    else { setEstado('error'); setMensajeError(r.error || 'error') }
  }

  const fila = (label: string, val: number, min: number, max: number, step: number, onCambiar: (v: number) => void) => (
    <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 92, fontSize: 12 }}>{label}: {Number(val.toFixed(2))}</span>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={(e) => onCambiar(+e.target.value)} style={{ flex: 1 }} />
    </label>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        title="Acomodar la posición/encuadre del acordeón 3D (admin)"
        style={{
          position: 'fixed', bottom: 16, right: 16, zIndex: 9998,
          padding: '10px 16px', borderRadius: 999, border: '2px solid rgba(255,255,255,0.35)',
          cursor: 'pointer', fontWeight: 800, fontSize: 14,
          background: abierto ? 'rgba(99,102,241,0.92)' : 'rgba(20,24,40,0.92)', color: '#fff',
          backdropFilter: 'blur(6px)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        📐 Posición
      </button>

      {abierto && (
        <div
          style={{
            position: 'fixed', bottom: 70, right: 16, zIndex: 9998,
            display: 'flex', flexDirection: 'column', gap: 6, width: 340, maxWidth: 'calc(100vw - 32px)',
            background: 'rgba(10,12,24,0.94)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12, padding: '14px 18px', color: '#fff',
            backdropFilter: 'blur(6px)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 4 }}>{titulo ?? 'Posición del acordeón (admin)'}</div>
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>
            Se ve en vivo en este modo y se guarda para todos.
          </div>
          {fila('Rot X', DEG(enc.rotacion[0]), -180, 180, 1, (v) => setRot(0, v))}
          {fila('Rot Y', DEG(enc.rotacion[1]), -180, 180, 1, (v) => setRot(1, v))}
          {fila('Rot Z (ladeo)', DEG(enc.rotacion[2]), -180, 180, 1, (v) => setRot(2, v))}
          {fila('Tamaño (fill)', enc.fill, 0.3, 2.5, 0.01, (v) => aplicar({ fill: v }))}
          {fila('Offset X', enc.offX, -3, 3, 0.01, (v) => aplicar({ offX: v }))}
          {fila('Offset Y', enc.offY, -3, 3, 0.01, (v) => aplicar({ offY: v }))}

          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={guardar}
              disabled={estado === 'guardando'}
              style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              {estado === 'guardando' ? 'Guardando…' : '💾 Guardar'}
            </button>
            <button
              type="button"
              onClick={() => aplicar(encuadreId === 'estudio'
                ? { rotacion: [-1.3788, -0.0698, 0], fill: 0.55, offX: 0, offY: 0 }
                : { rotacion: [-1.3788, -0.0698, 0], fill: 1.15, offX: 0.06, offY: 0 })}
              style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', cursor: 'pointer' }}
            >
              Reset
            </button>
            {estado === 'ok' && <span style={{ color: '#34d399', fontSize: 13 }}>✓ Guardado</span>}
            {estado === 'error' && <span style={{ color: '#f87171', fontSize: 12 }}>✗ {mensajeError}</span>}
          </div>
        </div>
      )}
    </>
  )
}

export default EditorEncuadreAcordeon
