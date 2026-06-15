'use client'
import * as React from 'react'
import { usePersonajeEstudio } from '../contextoPersonajeEstudio'
import { ESCENARIOS_GLB, esEscenarioGLB } from './visor/escenarios'

// Editor de posición fija del personaje por escenario (SOLO admin). Mueve el escenario en vivo (X/Z =
// dónde se para el personaje, Y = ajuste fino vertical, rotación, escala, aterrizaje auto) y guarda los
// valores en Supabase → quedan fijos para todos los usuarios. Solo aparece en escenarios .glb.
const grados = (rad: number) => Math.round((rad * 180) / Math.PI)
const aRad = (deg: number) => (deg * Math.PI) / 180

const Fila: React.FC<{ label: string; children: React.ReactNode; valor: string }> = ({ label, children, valor }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0' }}>
    <span style={{ width: 70, fontSize: 12, opacity: 0.8 }}>{label}</span>
    <div style={{ flex: 1 }}>{children}</div>
    <span style={{ width: 48, textAlign: 'right', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{valor}</span>
  </div>
)

const EditorPosEscenario: React.FC = () => {
  const { escenarioId, esAdmin, posEscenario, setPosLocal, guardarPos, guardandoPos } = usePersonajeEstudio()
  const [msg, setMsg] = React.useState<string | null>(null)

  if (!esAdmin || !esEscenarioGLB(escenarioId)) return null
  const pos = posEscenario(escenarioId)
  if (!pos) return null

  const set = (patch: Parameters<typeof setPosLocal>[1]) => { setMsg(null); setPosLocal(escenarioId, patch) }
  const restablecer = () => {
    const d = ESCENARIOS_GLB[escenarioId]
    set({ x: d.offset[0], y: d.offset[1], z: d.offset[2], rotY: d.rotY, escala: d.escala, autoPiso: d.autoPiso })
  }
  const guardar = async () => {
    const r = await guardarPos(escenarioId)
    setMsg(r.ok ? '✓ Guardado para todos' : `Error: ${r.error || 'no se pudo guardar'}`)
  }

  return (
    <div style={{ border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: 10, marginTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, marginBottom: 6 }}>
        🛠️ Posición del personaje (admin)
      </div>

      <Fila label="Izq / Der" valor={pos.x.toFixed(2)}>
        <input type="range" min={-6} max={6} step={0.05} value={pos.x} onChange={(e) => set({ x: +e.target.value })} style={{ width: '100%' }} />
      </Fila>
      <Fila label="Atrás / Frente" valor={pos.z.toFixed(2)}>
        <input type="range" min={-6} max={6} step={0.05} value={pos.z} onChange={(e) => set({ z: +e.target.value })} style={{ width: '100%' }} />
      </Fila>
      {/* La Altura SOLO aplica con el aterrizaje automático apagado (si no, el auto la ignora y flota). */}
      {!pos.autoPiso && (
        <Fila label="Altura" valor={pos.y.toFixed(2)}>
          <input type="range" min={-4} max={4} step={0.05} value={pos.y} onChange={(e) => set({ y: +e.target.value })} style={{ width: '100%' }} />
        </Fila>
      )}
      <Fila label="Rotación" valor={`${grados(pos.rotY)}°`}>
        <input type="range" min={-180} max={180} step={1} value={grados(pos.rotY)} onChange={(e) => set({ rotY: aRad(+e.target.value) })} style={{ width: '100%' }} />
      </Fila>
      <Fila label="Escala" valor={(pos.escala ?? 1).toFixed(3)}>
        <input
          type="number" min={0.001} max={5} step={0.001} value={pos.escala ?? 1}
          onChange={(e) => set({ escala: +e.target.value })}
          style={{ width: '100%', background: 'rgba(0,0,0,.25)', color: '#fff', border: '1px solid rgba(255,255,255,.18)', borderRadius: 6, padding: '4px 6px', fontSize: 12 }}
        />
      </Fila>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, margin: '8px 0', cursor: 'pointer' }}>
        <input type="checkbox" checked={pos.autoPiso} onChange={(e) => set({ autoPiso: e.target.checked })} />
        Aterrizar solo sobre la plataforma (auto)
      </label>

      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button
          type="button" onClick={guardar} disabled={guardandoPos}
          style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: 'none', background: '#f5a623', color: '#1a1208', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: guardandoPos ? 0.6 : 1 }}
        >
          {guardandoPos ? 'Guardando…' : '💾 Guardar posición'}
        </button>
        <button
          type="button" onClick={restablecer}
          style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer' }}
        >
          Restablecer
        </button>
      </div>
      {msg && <div style={{ fontSize: 12, marginTop: 6, opacity: 0.9 }}>{msg}</div>}
    </div>
  )
}

export default EditorPosEscenario
