'use client'
import * as React from 'react'
import { BAILES } from '../animaciones'
import { usePersonajeEstudio } from '../contextoPersonajeEstudio'

// Secuenciador de animaciones: el usuario arma una lista ORDENADA de bailes con la DURACIÓN de cada
// uno; al reproducir, el driver los recorre en orden y en loop, firme (cadena de setTimeout que se
// limpia al detener/editar). Reusa el crossfade de useBailes (cada paso = setBaile(clip)).

let _uid = 0

export default function SecuenciadorBailes() {
  const { secuencia, setSecuencia, secuenciaActiva, setSecuenciaActiva, setBaile } = usePersonajeEstudio()

  // Driver: mientras está activa, avanza por la secuencia (cada paso su duración) en loop.
  React.useEffect(() => {
    if (!secuenciaActiva || secuencia.length === 0) return
    let cancel = false
    let timer: ReturnType<typeof setTimeout>
    const paso = (i: number) => {
      if (cancel) return
      const item = secuencia[i % secuencia.length]
      setBaile(item.clip)
      timer = setTimeout(() => paso(i + 1), Math.max(0.3, item.segundos) * 1000)
    }
    paso(0)
    return () => { cancel = true; clearTimeout(timer) }
  }, [secuenciaActiva, secuencia, setBaile])

  // Al detener (o arrancar vacío) → personaje quieto. No pisa la selección manual mientras está parada.
  React.useEffect(() => { if (!secuenciaActiva) setBaile(null) }, [secuenciaActiva, setBaile])

  const agregar = (clip: string, nombre: string) =>
    setSecuencia((s) => [...s, { id: `p${_uid++}`, clip, nombre, segundos: 4 }])
  const quitar = (id: string) => setSecuencia((s) => s.filter((p) => p.id !== id))
  const mover = (id: string, dir: -1 | 1) => setSecuencia((s) => {
    const i = s.findIndex((p) => p.id === id); const j = i + dir
    if (i < 0 || j < 0 || j >= s.length) return s
    const c = [...s]; const [x] = c.splice(i, 1); c.splice(j, 0, x); return c
  })
  const setDur = (id: string, seg: number) =>
    setSecuencia((s) => s.map((p) => (p.id === id ? { ...p, segundos: seg } : p)))

  return (
    <div className="secuenciador-bailes">
      {/* Paleta: agregar un baile al final de la secuencia */}
      <div className="visor-personaje-bailes en-panel">
        {BAILES.map((b) => (
          <button key={b.id} type="button" className="visor-baile-btn" onClick={() => agregar(b.clip, b.nombre)}>
            + {b.nombre}
          </button>
        ))}
      </div>

      {/* Lista ordenada con duración + reordenar + borrar */}
      {secuencia.length === 0 ? (
        <div style={{ opacity: 0.6, fontSize: 12, marginTop: 8 }}>Agrega bailes y define cuántos segundos dura cada uno.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {secuencia.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ opacity: 0.55, fontSize: 12, width: 16 }}>{i + 1}.</span>
              <span style={{ flex: 1, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre}</span>
              <input
                type="number" min={0.3} step={0.5} value={p.segundos}
                onChange={(e) => setDur(p.id, parseFloat(e.target.value) || 1)}
                style={{ width: 50 }}
                aria-label={`Duración de ${p.nombre} en segundos`}
              />
              <span style={{ fontSize: 12, opacity: 0.7 }}>s</span>
              <button type="button" onClick={() => mover(p.id, -1)} disabled={i === 0} title="Subir">↑</button>
              <button type="button" onClick={() => mover(p.id, 1)} disabled={i === secuencia.length - 1} title="Bajar">↓</button>
              <button type="button" onClick={() => quitar(p.id)} title="Quitar">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Reproducir / detener la secuencia */}
      <button
        type="button"
        className={`visor-personaje-fuelle-btn ${secuenciaActiva ? 'activo' : ''}`}
        style={{ marginTop: 8 }}
        disabled={secuencia.length === 0}
        onClick={() => setSecuenciaActiva(!secuenciaActiva)}
      >
        {secuenciaActiva ? '⏹ Detener secuencia' : '▶ Reproducir en orden'}
      </button>
    </div>
  )
}
