import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../servicios/supabaseCliente'
import './actividad-usuario.css'

interface PerfilPublico { id: string; nombre?: string | null; nombre_completo?: string | null }
interface ActividadItem { tipo: string; tipo_display?: string; fecha: string; fecha_creacion?: string; [k: string]: unknown }

export default function ActividadUsuarioPage() {
  const { usuarioPublico } = useOutletContext<{ usuarioPublico: PerfilPublico | null }>()
  const [actividades, setActividades] = useState<ActividadItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { cargar() }, [usuarioPublico?.id])

  async function cargar() {
    if (!usuarioPublico?.id) return
    setCargando(true); setError(null)
    try {
      const [pubRes, cursosRes] = await Promise.all([
        supabase.from('comunidad_publicaciones').select('*').eq('usuario_id', usuarioPublico.id).in('tipo', ['video', 'audio', 'grabacion']).order('fecha_publicacion', { ascending: false }),
        supabase.from('cursos').select('*').eq('creado_por', usuarioPublico.id).order('created_at', { ascending: false })
      ])
      const pubs = Array.isArray(pubRes.data) ? pubRes.data.map(p => ({ ...p, tipo_actividad: 'publicacion_musical', fecha: (p as any).fecha_publicacion })) : []
      const cursos = Array.isArray(cursosRes.data) ? cursosRes.data.map(c => ({ ...c, tipo_actividad: 'curso_creado', fecha: (c as any).created_at })) : []
      const todas = [...pubs, ...cursos].sort((a, b) => new Date(String(b.fecha)).getTime() - new Date(String(a.fecha)).getTime())
      setActividades(todas)
      setCargando(false)
    } catch (e) { setError('Error inesperado al cargar la actividad'); setCargando(false) }
  }

  function formatearTiempoRelativo(fecha: string): string {
    if (!fecha) return 'Fecha no disponible'
    try {
      const fechaObjeto = new Date(fecha)
      const ahora = new Date()
      const diferencia = ahora.getTime() - fechaObjeto.getTime()
      const minutos = Math.floor(diferencia / (1000 * 60))
      const horas = Math.floor(diferencia / (1000 * 60 * 60))
      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24))
      const semanas = Math.floor(dias / 7)
      const meses = Math.floor(dias / 30)
      if (minutos < 60) return `Hace ${minutos} min`
      if (horas < 24) return `Hace ${horas}h`
      if (dias < 7) return `Hace ${dias} días`
      if (semanas < 4) return `Hace ${semanas} semanas`
      if (meses < 12) return `Hace ${meses} meses`
      return fechaObjeto.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch { return 'Fecha inválida' }
  }

  const resumen = useMemo(() => ({
    total: actividades.length,
    publicaciones: actividades.filter(a => (a as any).tipo === 'publicacion').length,
    comentarios: actividades.filter(a => (a as any).tipo === 'comentario').length,
    likes: actividades.filter(a => (a as any).tipo === 'like').length
  }), [actividades])

  return (
    <div className="actividad-contenido">
      {actividades.length > 0 ? (
        <>
          <div className="seccion resumen-actividad">
            <h2>📊 Resumen de actividad</h2>
            <div className="resumen-stats">
              <div className="stat-item"><span className="stat-numero">{resumen.total}</span><span className="stat-label">Actividades totales</span></div>
              <div className="stat-item"><span className="stat-numero">{resumen.publicaciones}</span><span className="stat-label">Publicaciones</span></div>
              <div className="stat-item"><span className="stat-numero">{resumen.comentarios}</span><span className="stat-label">Comentarios</span></div>
              <div className="stat-item"><span className="stat-numero">{resumen.likes}</span><span className="stat-label">Me gusta</span></div>
            </div>
          </div>
          <div className="seccion timeline-actividades">
            <h2>⏰ Actividad reciente</h2>
            <div className="timeline">
              {actividades.map((actividad, index) => (
                <div key={index} className={`timeline-item${index === actividades.length - 1 ? ' ultima' : ''}`}>
                  <div className="timeline-marker"><span className="timeline-icono">🔸</span></div>
                  <div className="timeline-contenido">
                    <div className="actividad-card">
                      <div className="actividad-header">
                        <div className="actividad-tipo"><span className="tipo-badge">Actividad</span></div>
                        <div className="actividad-tiempo">{formatearTiempoRelativo(String(actividad.fecha || actividad.fecha_creacion || ''))}</div>
                      </div>
                      <div className="actividad-body"><p>Actividad registrada</p></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : cargando ? (
        <div className="estado-carga"><div className="spinner" /><h3>Cargando actividad...</h3></div>
      ) : error ? (
        <div className="estado-error"><div className="error-icono">⚠️</div><h3>Error al cargar actividad</h3><p>{error}</p></div>
      ) : (
        <div className="estado-vacio"><div className="vacio-icono">📝</div><h3>Sin actividad aún</h3><p>Este usuario no tiene actividad reciente.</p></div>
      )}
    </div>
  )
}

