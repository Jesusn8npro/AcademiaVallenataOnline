'use client'
import * as React from 'react'
import { Play, Pause, RotateCcw, X } from 'lucide-react'
import { useLogicaAcordeon } from '../../../../Core/hooks/useLogicaAcordeon'
import { useReproductorHero } from '../../../../Core/hooks/useReproductorHero'
import { useReproductorReplay } from '../../../Perfil/MisGrabaciones/Componentes/useReproductorReplay'
import type { GrabacionReplayHero } from '../../../Perfil/MisGrabaciones/Componentes/tiposReplay'

// Motor + transporte del replay. Vive SOLO mientras hay una grabación seleccionada — así, cuando el
// alumno está tocando (sin replay), NO existe un segundo useLogicaAcordeon que pelee con el motor
// real por el store global de botones (eso causaba lag y notas pegadas).
//
// OJO (gotchas):
//  - deshabilitarInteraccion DEBE ser false: con true, actualizarBotonActivo hace early-return y no
//    suena ni emite.
//  - suscribirBotonesGlobal se deja en el DEFAULT (true): ponerlo en false hace que botonesActivos
//    cambie de identidad cada render → useReproductorReplay entra en loop y el play nunca se habilita.
//    No hace falta aislar: este motor solo existe MIENTRAS se reproduce (el alumno no toca a la vez).

function fmt(ticks: number, bpm: number, resolucion: number) {
  const s = Math.max(0, Math.floor((ticks / Math.max(1, resolucion)) * (60 / Math.max(1, bpm))))
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

const MotorReplayGrabacion: React.FC<{ grabacion: GrabacionReplayHero; onCerrar: () => void }> = ({ grabacion, onCerrar }) => {
  const [bpm, setBpm] = React.useState(120)

  const logica = useLogicaAcordeon({ deshabilitarInteraccion: false })

  const reproductor = useReproductorHero(
    logica.actualizarBotonActivo,
    logica.setDireccionSinSwap,
    logica.reproduceTono,
    bpm,
    undefined,
    () => {},
  )

  const { preparandoReplay, totalTicksCalculados, tonalidadReplayLista,
    reproducirOReanudar, pausar, buscarTick, reiniciar } = useReproductorReplay({
      abierta: true, grabacion, logica, reproductor, bpm, setBpm,
    })

  const resolucion = grabacion.resolucion || 192
  const totalTicks = reproductor.totalTicks || totalTicksCalculados
  const replayListo = logica.disenoCargado && !logica.cargando && tonalidadReplayLista && !preparandoReplay
  const reproduciendoActivo = reproductor.reproduciendo && !reproductor.pausado
  const progreso = totalTicks > 0 ? Math.min(100, (reproductor.tickActual / totalTicks) * 100) : 0

  return (
    <div className="replay-3d-activa">
      <div className="replay-3d-activa-head">
        <span className="replay-3d-activa-titulo">{grabacion.titulo || 'Grabación'}</span>
        <button type="button" className="replay-3d-btn" onClick={onCerrar} title="Cerrar grabación">
          <X size={14} />
        </button>
      </div>
      <div className="replay-3d-transporte">
        <button type="button" className="replay-3d-btn" onClick={reiniciar} title="Reiniciar">
          <RotateCcw size={15} />
        </button>
        {reproduciendoActivo ? (
          <button type="button" className="replay-3d-btn primaria" onClick={pausar} title="Pausar">
            <Pause size={16} />
          </button>
        ) : (
          <button
            type="button"
            className="replay-3d-btn primaria"
            onClick={reproducirOReanudar}
            disabled={!replayListo}
            title={replayListo ? 'Reproducir' : 'Preparando…'}
          >
            <Play size={16} />
          </button>
        )}
        <span className="replay-3d-tiempo">{fmt(reproductor.tickActual, bpm, resolucion)}</span>
        <input
          className="replay-3d-slider"
          type="range"
          min={0}
          max={Math.max(totalTicks, 1)}
          value={Math.min(reproductor.tickActual, Math.max(totalTicks, 1))}
          onChange={(e) => buscarTick(Number(e.target.value))}
        />
        <span className="replay-3d-tiempo">{fmt(totalTicks, bpm, resolucion)}</span>
      </div>
      <div className="replay-3d-barra-progreso"><span style={{ width: `${progreso}%` }} /></div>
    </div>
  )
}

export default MotorReplayGrabacion
