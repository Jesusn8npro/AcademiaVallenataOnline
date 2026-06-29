'use client'
import * as React from 'react'
import { usePersonajeEstudio } from '../contextoPersonajeEstudio'
// Editor de POSES DE DEDOS por botón (SOLO admin). Flujo: pisa un botón de melodía (se ilumina) →
// "Editar" congela la mano → elige un hueso y rótalo con el gizmo 3D del visor → ponle nombre y Guardar.
// Queda en Supabase y, al pisar ese botón, el personaje reproduce la pose EXACTA al instante.

// Dedo lógico que pisa el botón (lo usa el IK para que al pisar botones consecutivos se pisen en orden).
const DEDOS_LOGICOS: { id: string; label: string }[] = [
  { id: 'R_Index', label: 'Índice' },
  { id: 'R_Mid', label: 'Corazón' },
  { id: 'R_Ring', label: 'Anular' },
  { id: 'R_Pinky', label: 'Meñique' },
  { id: 'R_Thumb', label: 'Pulgar' },
]

// Partes del brazo derecho. `falanges` = tiene 3 huesos (dedo); si no, es un solo hueso.
const PARTES: { label: string; suf: string; falanges: boolean }[] = [
  { label: 'Muñeca', suf: 'RightHand', falanges: false },
  { label: 'Pulgar', suf: 'RightHandThumb', falanges: true },
  { label: 'Índice', suf: 'RightHandIndex', falanges: true },
  { label: 'Medio', suf: 'RightHandMiddle', falanges: true },
  { label: 'Anular', suf: 'RightHandRing', falanges: true },
  { label: 'Meñique', suf: 'RightHandPinky', falanges: true },
  { label: 'Antebrazo', suf: 'RightForeArm', falanges: false },
  { label: 'Brazo', suf: 'RightArm', falanges: false },
  { label: 'Hombro', suf: 'RightShoulder', falanges: false },
]
// Parte + falange a partir del sufijo seleccionado.
function parseHueso(suf: string): { base: string; ph: number } {
  const m = suf.match(/^(RightHand(?:Thumb|Index|Middle|Ring|Pinky))([123])$/)
  return m ? { base: m[1], ph: +m[2] } : { base: suf, ph: 0 }
}
const chip = (activo: boolean): React.CSSProperties => ({
  padding: '5px 9px', borderRadius: 7, fontSize: 12, cursor: 'pointer',
  border: '1px solid rgba(255,255,255,.18)', background: activo ? '#3b82f6' : 'rgba(255,255,255,.05)',
  color: '#fff', fontWeight: activo ? 600 : 400,
})

const EditorDedos: React.FC = () => {
  const {
    esAdmin, editandoDedos, setEditandoDedos, huesoSelDedo, setHuesoSelDedo,
    botonPoseObjetivo, guardarPoseDedo, guardandoDedos, posesDedos, borrarPoseDedo,
    hayPortapapeles, copiarPose, pegarPose, deshacer, acomodarDedo, dedoSel, setDedoSel, seleccionarObjetivo, limpiarSeleccion,
  } = usePersonajeEstudio()
  const [nombre, setNombre] = React.useState('')
  const [msg, setMsg] = React.useState<string | null>(null)

  // Al elegir botón objetivo, precargar su nombre guardado (si existe) para re-guardar cómodo.
  const poseGuardada = botonPoseObjetivo ? posesDedos[botonPoseObjetivo] : undefined
  React.useEffect(() => { setNombre(poseGuardada?.nombre ?? '') }, [botonPoseObjetivo]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!esAdmin) return null

  const guardar = async () => {
    setMsg(null)
    const r = await guardarPoseDedo(nombre || botonPoseObjetivo || 'pose')
    setMsg(r.ok ? '✓ Guardado para todos' : `Error: ${r.error || 'no se pudo'}`)
  }
  const borrar = async (boton: string) => {
    setMsg(null)
    const r = await borrarPoseDedo(boton)
    setMsg(r.ok ? '✓ Borrado' : `Error: ${r.error || 'no se pudo'}`)
  }
  const copiar = () => { setMsg(copiarPose() ? '📋 Pose copiada — pisa otro botón y pega' : 'No hay pose para copiar') }
  const pegar = async () => {
    setMsg(null)
    const r = await pegarPose()
    setMsg(r.ok ? `✓ Pegada en ${botonPoseObjetivo}` : `Error: ${r.error || 'no se pudo'}`)
  }

  // Categoría (hilera) de un botón/clave: afuera 1-10, medio 11-21, adentro 22-31; claves multi = Acordes.
  const hileraDe = (boton: string): string => {
    const m = boton.match(/^Boton_D_(\d+)$/)
    if (!m) return 'Acordes'
    const n = +m[1]
    return n <= 10 ? 'Afuera' : n <= 21 ? 'Medio' : 'Adentro'
  }
  const ORDEN = ['Afuera', 'Medio', 'Adentro', 'Acordes']
  // Nombre bonito de una clave: 'Boton_D_02+Boton_D_03' → '02 + 03'.
  const lindo = (k: string) => k.replace(/Boton_D_/g, '').replace(/\+/g, ' + ')
  const esAcorde = !!botonPoseObjetivo && botonPoseObjetivo.includes('+')
  const grupos: Record<string, [string, typeof posesDedos[string]][]> = {}
  for (const e of Object.entries(posesDedos).sort(([a], [b]) => a.localeCompare(b))) (grupos[hileraDe(e[0])] ||= []).push(e)
  const totalGuardadas = Object.keys(posesDedos).length

  return (
    <div style={{ border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: 10, marginTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, marginBottom: 6 }}>🖐️ Poses de dedos (admin)</div>

      <div style={{ fontSize: 11, opacity: 0.7, lineHeight: 1.4, marginBottom: 8 }}>
        Pisa un botón de melodía, dale <b>Editar</b>, elige un hueso y rótalo con la manija 3D. Ponle nombre y Guarda.
      </div>

      <div style={{ fontSize: 12, marginBottom: 8 }}>
        {esAcorde ? 'Acorde' : 'Botón'} objetivo: <b style={{ color: '#f5a623' }}>{botonPoseObjetivo ? lindo(botonPoseObjetivo) : '— pisa uno o varios —'}</b>
        {botonPoseObjetivo && !esAcorde && <span style={{ opacity: 0.6 }}> · hilera {hileraDe(botonPoseObjetivo)}</span>}
        {esAcorde && <span style={{ opacity: 0.6 }}> · {botonPoseObjetivo!.split('+').length} botones</span>}
      </div>

      <button
        type="button"
        onClick={() => setEditandoDedos(!editandoDedos)}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: 'none', marginBottom: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, background: editandoDedos ? '#c0392b' : '#2d8f4e', color: '#fff' }}
      >
        {editandoDedos ? '⏹️ Salir de edición' : '✏️ Editar este botón'}
      </button>

      {editandoDedos && (
        <>
          {/* En edición, cada botón que pisas se SUMA al acorde y se queda marcado; Limpiar empieza otro. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 10, opacity: 0.6, flex: 1 }}>Pisa botones para sumarlos al acorde →</span>
            <button type="button" onClick={limpiarSeleccion}
              style={{ padding: '4px 8px', borderRadius: 7, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#fff', fontSize: 11, cursor: 'pointer' }}>
              🧹 Limpiar selección
            </button>
          </div>

          {/* Dedo que PISA este botón (lógica de orden: 02→índice, 03→corazón, …). Solo define CUÁL dedo
              toca el botón cuando no hay pose guardada — NO es lo mismo que el hueso que mueves abajo. */}
          <label style={{ display: 'block', fontSize: 11, opacity: 0.8 }}>👆 Dedo que toca el botón</label>
          <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4 }}>cuál dedo lo pisa (para el auto-acomodo)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
            {DEDOS_LOGICOS.map((d) => (
              <button key={d.id} type="button" style={chip(dedoSel === d.id)} onClick={() => setDedoSel(d.id)}>
                {d.label}
              </button>
            ))}
          </div>

          <label style={{ display: 'block', fontSize: 11, opacity: 0.8 }}>🔧 Hueso a mover con la manija</label>
          <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4 }}>qué parte agarras con el gizmo 3D</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {PARTES.map((p) => {
              const cur = parseHueso(huesoSelDedo)
              const activo = cur.base === p.suf
              return (
                <button key={p.suf} type="button" style={chip(activo)}
                  onClick={() => setHuesoSelDedo(p.falanges ? p.suf + (parseHueso(huesoSelDedo).ph || 1) : p.suf)}>
                  {p.label}
                </button>
              )
            })}
          </div>
          {PARTES.find((p) => p.suf === parseHueso(huesoSelDedo).base)?.falanges && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {[1, 2, 3].map((n) => {
                const cur = parseHueso(huesoSelDedo)
                return (
                  <button key={n} type="button" style={chip(cur.ph === n)}
                    onClick={() => setHuesoSelDedo(cur.base + n)}>
                    {n === 1 ? 'Base' : n === 2 ? 'Media' : 'Punta'}
                  </button>
                )
              })}
            </div>
          )}

          {/* Deshacer el último movimiento del gizmo · Acomodar el dedo automáticamente (lo recoloca el IK). */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <button type="button" onClick={deshacer}
              style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
              ↶ Deshacer
            </button>
            <button type="button" onClick={acomodarDedo}
              title="Borra tus ajustes de este dedo y deja que se acomode solo sobre el botón"
              style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
              🎯 Acomodar dedo
            </button>
          </div>

          <input
            type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de la posición (ej. Do índice)"
            style={{ width: '100%', background: 'rgba(0,0,0,.25)', color: '#fff', border: '1px solid rgba(255,255,255,.18)', borderRadius: 6, padding: '6px', fontSize: 12, marginBottom: 8, boxSizing: 'border-box' }}
          />
          <button
            type="button" onClick={guardar} disabled={guardandoDedos || !botonPoseObjetivo}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: 'none', background: '#f5a623', color: '#1a1208', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: guardandoDedos || !botonPoseObjetivo ? 0.6 : 1 }}
          >
            {guardandoDedos ? 'Guardando…' : `💾 Guardar ${esAcorde ? 'acorde' : 'pose'} ${botonPoseObjetivo ? lindo(botonPoseObjetivo) : '—'}`}
          </button>

          {/* Reusar la lógica de dedos en otros botones / otra hilera: copia esta pose y pégala en otro botón. */}
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button
              type="button" onClick={copiar}
              style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#fff', fontSize: 12, cursor: 'pointer' }}
            >
              📋 Copiar pose
            </button>
            <button
              type="button" onClick={pegar} disabled={!hayPortapapeles || !botonPoseObjetivo || guardandoDedos}
              title={hayPortapapeles ? 'Aplica la pose copiada a este botón' : 'Primero copia una pose'}
              style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#fff', fontSize: 12, cursor: 'pointer', opacity: !hayPortapapeles || !botonPoseObjetivo ? 0.5 : 1 }}
            >
              📌 Pegar aquí
            </button>
          </div>
        </>
      )}

      {msg && <div style={{ fontSize: 12, marginTop: 6, opacity: 0.9 }}>{msg}</div>}

      {totalGuardadas > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Poses guardadas ({totalGuardadas})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
            {ORDEN.filter((g) => grupos[g]?.length).map((g) => (
              <div key={g}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7fc0ff', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                  {g} ({grupos[g].length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {grupos[g].map(([boton, p]) => {
                    const sel = botonPoseObjetivo === boton
                    return (
                      <div key={boton} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: sel ? 'rgba(245,166,35,.18)' : 'rgba(255,255,255,.05)', border: sel ? '1px solid rgba(245,166,35,.5)' : '1px solid transparent', borderRadius: 6, padding: '4px 6px' }}>
                        <button type="button" onClick={() => seleccionarObjetivo(boton)} title="Editar esta pose" style={{ flex: 1, textAlign: 'left', border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 12, padding: 0 }}>
                          ✏️ <b>{lindo(boton)}</b>{p.nombre ? ` · ${p.nombre}` : ''}
                        </button>
                        <button type="button" onClick={() => borrar(boton)} title="Borrar pose" style={{ border: 'none', background: 'transparent', color: '#e57', cursor: 'pointer', fontSize: 14 }}>🗑️</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default EditorDedos
