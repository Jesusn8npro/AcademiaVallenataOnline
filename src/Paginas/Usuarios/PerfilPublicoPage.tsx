import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import './perfil-publico.css'

interface PerfilPublico {
  id: string
  nombre?: string | null
  apellido?: string | null
  nombre_completo?: string | null
  biografia?: string | null
  ciudad?: string | null
  pais?: string | null
  whatsapp?: string | null
  correo_electronico?: string | null
  fecha_creacion?: string | null
  rol?: string | null
  suscripcion?: string | null
  nivel_habilidad?: string | null
  instrumento?: string | null
}

export default function PerfilPublicoPage() {
  const { usuarioPublico, stats } = useOutletContext<{ usuarioPublico: PerfilPublico | null, stats: { publicaciones: number; cursos: number; tutoriales: number; ranking: number } }>()

  const informacionBasica = useMemo(() => {
    if (!usuarioPublico) return null
    return {
      nombre_completo: usuarioPublico.nombre_completo || `${usuarioPublico.nombre || ''} ${usuarioPublico.apellido || ''}`.trim() || 'Usuario',
      biografia: usuarioPublico.biografia || '',
      ciudad: usuarioPublico.ciudad || '',
      pais: usuarioPublico.pais || '',
      whatsapp: usuarioPublico.whatsapp || '',
      correo_electronico: usuarioPublico.correo_electronico || '',
      fecha_creacion: usuarioPublico.fecha_creacion || '',
      rol: usuarioPublico.rol || 'estudiante',
      suscripcion: usuarioPublico.suscripcion || 'free',
      nivel_habilidad: usuarioPublico.nivel_habilidad || '',
      instrumento: usuarioPublico.instrumento || ''
    }
  }, [usuarioPublico])

  function formatearFecha(fecha: string): string {
    if (!fecha) return 'No disponible'
    try {
      const d = new Date(fecha)
      return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch { return 'No disponible' }
  }

  function formatearFechaRelativa(fecha: string): string {
    if (!fecha) return 'No disponible'
    try {
      const date = new Date(fecha)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
      if (dias === 0) return 'Hoy'
      if (dias === 1) return 'Ayer'
      if (dias < 30) return `Hace ${dias} días`
      if (dias < 365) return `Hace ${Math.floor(dias / 30)} meses`
      return `Hace ${Math.floor(dias / 365)} años`
    } catch { return 'No disponible' }
  }

  if (!informacionBasica) return null

  return (
    <div className="perfil-contenido">
      <div className="seccion estadisticas-rapidas">
        <h2>📊 Estadísticas</h2>
        <div className="stats-grid">
          <div className="stat-card card-morado"><div className="stat-numero">{stats?.publicaciones ?? 0}</div><div className="stat-label">Publicaciones</div></div>
          <div className="stat-card card-oro"><div className="stat-numero">{stats?.ranking ? `#${stats.ranking}` : '#--'}</div><div className="stat-label">Ranking</div></div>
          <div className="stat-card card-celeste"><div className="stat-numero">1</div><div className="stat-label">Nivel</div></div>
        </div>
      </div>

      <div className="seccion informacion-personal">
        <h2>👤 Información personal</h2>
        <div className="info-grid">
          {informacionBasica.biografia && (
            <div className="info-item full-width"><div className="info-icon">📖</div><div className="info-content"><div className="info-label">Biografía</div><div className="info-valor biografia">{informacionBasica.biografia}</div></div></div>
          )}
          <div className="info-item"><div className="info-icon">👤</div><div className="info-content"><div className="info-label">Rol</div><div className="info-valor"><span className={`badge badge-${informacionBasica.rol}`}>{informacionBasica.rol}</span></div></div></div>
          <div className="info-item"><div className="info-icon">⭐</div><div className="info-content"><div className="info-label">Suscripción</div><div className="info-valor"><span className="badge">{informacionBasica.suscripcion}</span></div></div></div>
          {(informacionBasica.ciudad || informacionBasica.pais) && (
            <div className="info-item"><div className="info-icon">📍</div><div className="info-content"><div className="info-label">Ubicación</div><div className="info-valor">{`${informacionBasica.ciudad} ${informacionBasica.pais}`.trim()}</div></div></div>
          )}
          <div className="info-item"><div className="info-icon">📅</div><div className="info-content"><div className="info-label">Miembro desde</div><div className="info-valor">{formatearFecha(informacionBasica.fecha_creacion)}</div></div></div>
          {informacionBasica.nivel_habilidad && (
            <div className="info-item"><div className="info-icon">🎵</div><div className="info-content"><div className="info-label">Nivel de habilidad</div><div className="info-valor"><span className="badge badge-habilidad">{informacionBasica.nivel_habilidad}</span></div></div></div>
          )}
          {informacionBasica.instrumento && (
            <div className="info-item"><div className="info-icon">🪗</div><div className="info-content"><div className="info-label">Instrumento principal</div><div className="info-valor">{informacionBasica.instrumento}</div></div></div>
          )}
        </div>
      </div>

      <div className="seccion informacion-adicional">
        <h2>🎯 Detalles del perfil</h2>
        <div className="detalles-grid">
          <div className="detalle-item"><div className="detalle-icon">🏆</div><div className="detalle-content"><div className="detalle-label">Posición en ranking</div><div className="detalle-valor ranking">Sin clasificar</div></div></div>
          <div className="detalle-item"><div className="detalle-icon">⭐</div><div className="detalle-content"><div className="detalle-label">Nivel actual</div><div className="detalle-valor nivel">Nivel 1</div></div></div>
          <div className="detalle-item"><div className="detalle-icon">📈</div><div className="detalle-content"><div className="detalle-label">Progreso</div><div className="detalle-valor progreso"><div className="barra-progreso"><div className="barra-relleno" style={{ width: '20%' }} /></div><span className="porcentaje">20%</span></div></div></div>
          <div className="detalle-item"><div className="detalle-icon">🕒</div><div className="detalle-content"><div className="detalle-label">Tiempo en la plataforma</div><div className="detalle-valor tiempo">{formatearFechaRelativa(informacionBasica.fecha_creacion)}</div></div></div>
          <div className="detalle-item"><div className="detalle-icon">📍</div><div className="detalle-content"><div className="detalle-label">Última actividad</div><div className="detalle-valor actividad">Recientemente</div></div></div>
        </div>
      </div>
    </div>
  )
}
