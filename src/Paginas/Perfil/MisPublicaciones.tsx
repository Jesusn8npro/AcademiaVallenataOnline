import { useState, useEffect } from 'react'
import { supabase } from '../../servicios/clienteSupabase'
import { useUsuario } from '../../contextos/UsuarioContext'
import { usePerfilStore } from '../../stores/perfilStore'
import FeedPublicaciones from '../../componentes/ComponentesComunidad/FeedPublicaciones'
import RankingComunidadNuevo from '../../componentes/ComponentesComunidad/RankingComunidadNuevo'
import PorcentajePerfil from '../../componentes/Perfil/PorcentajePerfil'
import BannerSlider from '../../componentes/Banners/BannerSlider'
import SliderCursos from '../../componentes/ComponentesComunidad/SliderCursos'
import './MisPublicaciones.css'

export default function MisPublicaciones() {
    const { usuario } = useUsuario()
    const { perfil } = usePerfilStore()
    const [publicaciones, setPublicaciones] = useState<any[]>([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        cargarPublicaciones()
    }, [usuario])

    async function cargarPublicaciones() {
        if (!usuario?.id) return

        try {
            const { data, error } = await supabase
                .from('comunidad_publicaciones')
                .select(`
          *,
          perfiles!inner(nombre_usuario, nombre_completo, url_foto_perfil)
        `)
                .eq('usuario_id', usuario.id)
                .order('fecha_creacion', { ascending: false })

            if (error) throw error

            const publicacionesMapeadas = (data || []).map((pub: any) => ({
                ...pub,
                usuario_slug: pub.perfiles?.nombre_usuario || '',
                usuario_nombre: pub.perfiles?.nombre_completo || pub.usuario_nombre || 'Usuario',
                usuario_avatar: pub.perfiles?.url_foto_perfil || pub.usuario_avatar || ''
            }))

            setPublicaciones(publicacionesMapeadas)
        } catch {
            // silent
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="contenido-publicaciones">
            <div className="timeline-grid">
                <div className="columna-timeline columna-izquierda">
                    <div className="bloque-ranking-nuevo">
                        <RankingComunidadNuevo />
                    </div>
                </div>

                <div className="columna-timeline columna-central">
                    <div className="header-seccion">
                        <h1>Mis Publicaciones</h1>
                        <p>Todas tus contribuciones a la comunidad</p>
                    </div>

                    {cargando ? (
                        <div className="estado-carga">
                            <div className="spinner"></div>
                            <p>Cargando tus publicaciones...</p>
                        </div>
                    ) : publicaciones.length === 0 ? (
                        <div className="estado-vacio">
                            <div className="icono-vacio">📝</div>
                            <h3>Aún no tienes publicaciones</h3>
                            <p>¡Comparte tu progreso con la comunidad!</p>
                            <a href="/comunidad" className="boton-accion">Ir a la comunidad</a>
                        </div>
                    ) : (
                        <div className="feed-publicaciones">
                            {publicaciones.map(pub => (
                                <FeedPublicaciones
                                    key={pub.id}
                                    id={pub.id}
                                    usuario_id={pub.usuario_id}
                                    usuario_nombre={pub.usuario_nombre}
                                    url_foto_perfil={pub.usuario_avatar}
                                    usuario_slug={pub.usuario_slug}
                                    fecha={pub.fecha_creacion}
                                    contenido={pub.descripcion}
                                    url_imagen={pub.url_imagen}
                                    url_video={pub.url_video}
                                    url_gif={pub.url_gif}
                                    tipo={pub.tipo}
                                    encuesta={pub.encuesta}
                                    me_gusta={pub.me_gusta}
                                    total_comentarios={pub.total_comentarios}
                                    total_compartidos={pub.total_compartidos}
                                    usuario={usuario}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="columna-timeline columna-derecha">
                    <SliderCursos />
                    <PorcentajePerfil perfil={perfil} />
                    <BannerSlider />
                </div>
            </div>
        </div>
    )
}
