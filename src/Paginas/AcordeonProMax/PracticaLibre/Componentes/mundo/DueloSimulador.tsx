'use client'
import * as React from 'react'
import { supabase } from '../../../../../servicios/clienteSupabase'
import type { ConfigCancion } from '../../../../SimuladorApp/Juego/Hooks/useConfigCancion'

// Overlay del DUELO (Modo Competencia, Rebanada 2): cuando es TU turno, carga la canción acordada y
// lanza el simulador real (JuegoSimuladorApp) en modo competitivo a pantalla completa. Al terminar la
// partida (onResultado) reporta el puntaje al reto. Mientras juegas, tus notas REALES viajan por el
// emisor global → tu rival te VE y te OYE tocar tu turno en el mundo (sin trabajo extra). Carga la
// fila completa de canciones_hero (con la secuencia parseada), igual que useAcordeonProMaxSimulador.

const JuegoSimuladorApp = React.lazy(() => import('../../../../SimuladorApp/Juego/JuegoSimuladorApp'))

export default function DueloSimulador({ cancionId, seccionId, onResultado, onAbandonar }: {
  cancionId: string
  seccionId?: string | null
  onResultado: (puntos: number) => void
  onAbandonar: () => void
}) {
  const [config, setConfig] = React.useState<ConfigCancion | null>(null)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    let vivo = true
    supabase.from('canciones_hero').select('*').eq('id', cancionId).single().then(({ data, error }) => {
      if (!vivo) return
      if (error || !data) { setError(true); return }
      const c: any = data
      let secuenciaStr = c.secuencia_json || c.secuencia
      let secuencia: any[] = []
      if (typeof secuenciaStr === 'string') { try { secuencia = JSON.parse(secuenciaStr) } catch { secuencia = [] } }
      else if (Array.isArray(secuenciaStr)) secuencia = secuenciaStr
      // guiaAudio:false → SIN acordeón guía (maestro) → no hay doble sonido; seccionId = la sección acordada.
      setConfig({ cancion: { ...c, secuencia } as any, modo: 'competitivo', velocidad: 1, guiaAudio: false, seccionId: seccionId ?? null })
    })
    return () => { vivo = false }
  }, [cancionId, seccionId])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: '#000' }}>
      {error ? (
        <div style={{ color: '#fff', padding: 24, fontFamily: 'system-ui' }}>
          No se pudo cargar la canción del duelo.
          <button type="button" onClick={onAbandonar} style={{ marginLeft: 12, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#c0392b', color: '#fff', cursor: 'pointer' }}>Salir</button>
        </div>
      ) : !config ? (
        <div style={{ color: '#fff', padding: 24, fontFamily: 'system-ui' }}>Preparando el duelo…</div>
      ) : (
        <React.Suspense fallback={<div style={{ color: '#fff', padding: 24, fontFamily: 'system-ui' }}>Cargando simulador…</div>}>
          <JuegoSimuladorApp
            config={config}
            onResultado={(est: any) => onResultado(est?.puntos ?? 0)}
            onSalir={onAbandonar}
          />
        </React.Suspense>
      )}
    </div>
  )
}
