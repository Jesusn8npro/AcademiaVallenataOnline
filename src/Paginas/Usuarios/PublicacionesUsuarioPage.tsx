import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../servicios/supabaseCliente'
import FeedPublicaciones from '../../componentes/ComponentesComunidad/FeedPublicaciones'
import './publicaciones-usuario.css'

interface PerfilPublico { id: string; nombre?: string | null; nombre_completo?: string | null }
interface Publicacion { id: string; titulo?: string; contenido?: string; fecha_creacion?: string }

export default function PublicacionesUsuarioPage() {
  const { usuarioPublico } = useOutletContext<{ usuarioPublico: PerfilPublico | null }>()
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { cargarPublicaciones() }, [usuarioPublico?.id])

  async function cargarPublicaciones() {
    if (!usuarioPublico?.id) return
    setCargando(true); setError('')
    try {
      const { data, error: err } = await supabase
        .from('comunidad_publicaciones')
        .select('*')
        .eq('usuario_id', usuarioPublico.id)
        .not('tipo', 'in', '("foto_perfil","foto_portada")')
        .order('fecha_creacion', { ascending: false })
        .limit(20)
      if (err) { setError('Error al cargar las publicaciones'); setCargando(false); return }
      setPublicaciones(Array.isArray(data) ? data as Publicacion[] : [])
      setCargando(false)
    } catch (e) { setError('Error al cargar las publicaciones'); setCargando(false) }
  }

  return (
    <div className="publicaciones-contenido">
      {cargando ? (
        <div className="estado-carga"><div className="spinner" /><h3>Cargando publicaciones...</h3><p>Obteniendo el contenido compartido</p></div>
      ) : error ? (
        <div className="estado-error"><div className="error-icono">⚠️</div><h3>Error al cargar publicaciones</h3><p>{error}</p><button className="btn-reintentar" onClick={cargarPublicaciones}>Reintentar</button></div>
      ) : publicaciones.length === 0 ? (
        <div className="estado-vacio"><div className="vacio-icono">📝</div><h3>Sin publicaciones aún</h3><p>Este usuario no ha compartido publicaciones todavía.</p><div className="vacio-acciones"><a href="/comunidad" className="btn-comunidad">Explorar la Comunidad</a></div><div className="vacio-decoracion"><span>🎵</span><span>📚</span><span>🎶</span></div></div>
      ) : (
        <div className="seccion">
          <div className="seccion-header"><h2>📝 Publicaciones</h2><div className="estadisticas-publicaciones"><span className="contador-publicaciones">{publicaciones.length} publicaciones</span></div></div>
          <div className="feed-container">
            {publicaciones.map((p) => (
              <FeedPublicaciones
                key={p.id}
                id={p.id}
                usuario_id={usuarioPublico!.id}
                usuario_nombre={(usuarioPublico!.nombre_completo || usuarioPublico!.nombre || '') || 'Usuario'}
                url_foto_perfil={undefined}
                usuario_slug={undefined}
                fecha={(p as any).fecha_creacion || (p as any).fecha_publicacion || ''}
                contenido={p.contenido || p.titulo || ''}
                url_imagen={(p as any).url_imagen}
                url_video={(p as any).url_video}
                url_gif={(p as any).url_gif}
                tipo={(p as any).tipo || 'texto'}
                encuesta={(p as any).encuesta}
                me_gusta={(p as any).me_gusta || []}
                total_comentarios={(p as any).total_comentarios || 0}
                total_compartidos={(p as any).total_compartidos || 0}
                usuario={{ id: usuarioPublico!.id, nombre: (usuarioPublico!.nombre || usuarioPublico!.nombre_completo || 'Usuario') as string }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
