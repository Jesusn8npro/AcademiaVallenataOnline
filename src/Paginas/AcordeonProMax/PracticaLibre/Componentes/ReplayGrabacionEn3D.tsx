'use client'
import * as React from 'react'
import { Music2 } from 'lucide-react'
import { obtenerGrabacionesUsuario } from '../../../../servicios/grabaciones/consultas'
import type { GrabacionReplayHero } from '../../../Perfil/MisGrabaciones/Componentes/tiposReplay'
import { useUsuario } from '../../../../contextos/UsuarioContext'
import MotorReplayGrabacion from './MotorReplayGrabacion'

// Lista de grabaciones del usuario (panel derecho de la pestaña 3D). Al elegir una, monta el motor
// de replay (MotorReplayGrabacion) que la reproduce SOBRE la vista 3D. El motor solo existe mientras
// hay una grabación seleccionada → cuando el alumno está tocando no hay un segundo motor de acordeón
// que interfiera (eso causaba lag y notas pegadas).

const ReplayGrabacionEn3D: React.FC = () => {
  const { usuario } = useUsuario()
  const [grabaciones, setGrabaciones] = React.useState<GrabacionReplayHero[]>([])
  const [cargandoLista, setCargandoLista] = React.useState(false)
  const [grabacion, setGrabacion] = React.useState<GrabacionReplayHero | null>(null)

  React.useEffect(() => {
    if (!usuario?.id) return
    let vivo = true
    setCargandoLista(true)
    obtenerGrabacionesUsuario(usuario.id, {})
      .then((data) => { if (vivo) setGrabaciones(data as unknown as GrabacionReplayHero[]) })
      .catch(() => { if (vivo) setGrabaciones([]) })
      .finally(() => { if (vivo) setCargandoLista(false) })
    return () => { vivo = false }
  }, [usuario?.id])

  return (
    <div className="replay-3d-panel">
      {grabacion && <MotorReplayGrabacion grabacion={grabacion} onCerrar={() => setGrabacion(null)} />}

      <div className="replay-3d-lista-panel">
        {cargandoLista ? (
          <div className="replay-3d-lista-vacia"><Music2 size={16} /> Cargando…</div>
        ) : grabaciones.length === 0 ? (
          <div className="replay-3d-lista-vacia"><Music2 size={16} /> No tienes grabaciones todavía</div>
        ) : (
          grabaciones.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`replay-3d-item ${grabacion?.id === g.id ? 'activo' : ''}`}
              onClick={() => setGrabacion(g)}
            >
              <span className="replay-3d-item-titulo">{g.titulo || 'Grabación sin título'}</span>
              <span className="replay-3d-item-meta">
                {g.canciones_hero?.titulo || (g.modo === 'competencia' ? 'Competencia' : 'Práctica libre')}
                {g.notas_totales ? ` · ${g.notas_totales} notas` : ''}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export default ReplayGrabacionEn3D
