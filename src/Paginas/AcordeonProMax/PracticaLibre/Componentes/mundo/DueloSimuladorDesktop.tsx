'use client'
import * as React from 'react'
import AcordeonProMaxSimulador from '../../../Pantallas/AcordeonProMaxSimulador'

// Duelo en COMPUTADOR (Rebanada 2): EMBEBE la pantalla REAL de AcordeonProMax (la misma de
// /acordeon-pro-max/acordeon/:slug que ya funciona perfecto) → MISMO tono, MISMO tiempo de reproducción,
// MISMA latencia. autoIniciar = sin pantalla de pre-juego: arranca solo en competitivo, SIN maestro (sin
// doble acordeón), directo en la sección acordada. "Volver" se queda en el mundo (onSalir); al terminar
// reporta el puntaje (onResultado).

export default function DueloSimuladorDesktop({ cancionId, seccionId, metaRival, onResultado, onAbandonar }: {
  cancionId: string
  seccionId?: string | null
  metaRival?: number | null
  onResultado: (puntos: number) => void
  onAbandonar: () => void
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: '#0a0d14' }}>
      <AcordeonProMaxSimulador idDirecto={cancionId} seccionId={seccionId} metaRival={metaRival} autoIniciar onResultado={onResultado} onSalir={onAbandonar} />
    </div>
  )
}
