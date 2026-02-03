import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Outlet } from 'react-router-dom'
import { supabase } from '../../servicios/supabaseCliente'
import EncabezadoPerfil from '../../componentes/Perfil/EncabezadoPerfil'
import PestanasPerfil from '../../componentes/Perfil/PestanasPerfil'
import { generarSlug } from '../../utilidades/slug'
import { GamificacionServicio } from '../../servicios/gamificacionServicio'
import './perfil-publico-layout.css'

interface PerfilPublico {
  id: string
  nombre?: string | null
  apellido?: string | null
  nombre_completo?: string | null
  nombre_usuario?: string | null
  correo_electronico?: string | null
  url_foto_perfil?: string | null
  portada_url?: string | null
  posicion_img_portada?: number | null
  biografia?: string | null
  ciudad?: string | null
  pais?: string | null
  whatsapp?: string | null
  fecha_creacion?: string | null
  rol?: string | null
  suscripcion?: string | null
}

interface StatsPerfil {
  publicaciones: number
  cursos: number
  tutoriales: number
  ranking: number
}

export default function PerfilPublicoLayout() {
  const { slug = '' } = useParams()
  const [usuarioPublico, setUsuarioPublico] = useState<PerfilPublico | null>(null)
  const [stats, setStats] = useState<StatsPerfil>({ publicaciones: 0, cursos: 0, tutoriales: 0, ranking: 0 })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const scrollYRef = useRef(0)

  useEffect(() => { cargarUsuario() }, [slug])

  async function cargarUsuario() {
    if (!slug) return
    setCargando(true); setError('')
    try {
      const { data: usuarioExacto } = await supabase
        .from('perfiles')
        .select('id,nombre,apellido,nombre_completo,nombre_usuario,correo_electronico,url_foto_perfil,portada_url,posicion_img_portada,biografia,ciudad,pais,whatsapp,fecha_creacion,rol,suscripcion')
        .eq('nombre_usuario', slug)
        .maybeSingle()

      let usuario: PerfilPublico | null = usuarioExacto || null

      if (!usuario) {
        const { data: todos } = await supabase
          .from('perfiles')
          .select('id,nombre,apellido,nombre_completo,nombre_usuario,correo_electronico,url_foto_perfil,portada_url,posicion_img_portada,biografia,ciudad,pais,whatsapp,fecha_creacion,rol,suscripcion')

        const lista = Array.isArray(todos) ? todos as PerfilPublico[] : []
        usuario = lista.find(u => {
          const nc = (u.nombre_completo || `${u.nombre || ''} ${u.apellido || ''}`).trim()
          const s1 = generarSlug(nc)
          const s2 = generarSlug(`${u.nombre || ''} ${u.apellido || ''}`.trim())
          return s1 === slug || s2 === slug
        }) || null
      }

      if (!usuario) { setError('Usuario no encontrado'); setCargando(false); return }

      setUsuarioPublico(usuario)

      const usuarioId = usuario.id

      // Cargar inscripciones para contar cursos y tutoriales
      const { data: inscripciones } = await supabase
        .from('inscripciones')
        .select('curso_id, tutorial_id')
        .eq('usuario_id', usuarioId);

      const cursosCount = inscripciones?.filter(i => i.curso_id).length || 0;
      const tutorialesCount = inscripciones?.filter(i => i.tutorial_id).length || 0;

      // Cargar ranking - Usamos la misma lógica que en la página de Ranking
      let ranking = 0;
      try {
        // Obtenemos el ranking global (top 100) y buscamos al usuario
        // Esto asegura que el número coincida exactamente con lo que se ve en la tabla de líderes
        const rankingList = await GamificacionServicio.obtenerRanking('general', 100);
        const rankingUser = rankingList.find(r => r.usuario_id === usuarioId);

        if (rankingUser) {
          ranking = rankingUser.posicion;
        } else {
          // Fallback: Si no está en el top 100, intentamos buscarlo individualmente
          // aunque obtenerPosicionUsuario consulta la tabla directa y puede diferir del RPC
          const rankingData = await GamificacionServicio.obtenerPosicionUsuario(usuarioId, 'general');
          if (rankingData && rankingData.posicion) {
            ranking = rankingData.posicion;
          }
        }
      } catch (e) {
        console.error('Error cargando ranking:', e);
      }

      // Cargar publicaciones (si se mantiene esta métrica)
      const { count: publicacionesCount } = await supabase
        .from('comunidad_publicaciones')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId);

      setStats({
        publicaciones: publicacionesCount || 0,
        cursos: cursosCount,
        tutoriales: tutorialesCount,
        ranking: ranking
      })

      setCargando(false)
    } catch (e) {
      console.error('Error cargando perfil:', e);
      setError('Error cargando perfil público'); setCargando(false)
    }
  }

  const nombreCompleto = useMemo(() => {
    if (!usuarioPublico) return ''
    const nc = usuarioPublico.nombre_completo || `${usuarioPublico.nombre || ''} ${usuarioPublico.apellido || ''}`.trim()
    return nc || 'Usuario'
  }, [usuarioPublico])

  function manejarModalImagen(abierto: boolean) { setModalAbierto(abierto) }

  return (
    <div className="layout-perfil-publico">
      {cargando ? (
        <div className="loading-container"><div className="spinner" /><p>Cargando perfil...</p></div>
      ) : error ? (
        <div className="error-carga"><h1>Usuario no encontrado</h1><p>{error}</p><a href="/comunidad" className="btn-volver">Volver a la Comunidad</a></div>
      ) : usuarioPublico ? (
        <>
          <div className="encabezado-fijo">
            <EncabezadoPerfil
              urlPortada={usuarioPublico.portada_url || ''}
              urlAvatar={usuarioPublico.url_foto_perfil || ''}
              nombreCompleto={nombreCompleto}
              posicionPortadaY={Number(usuarioPublico.posicion_img_portada || 50)}
              userId={usuarioPublico.id}
              stats={stats}
              nivelUsuario={1}
              rolUsuario={(usuarioPublico.rol || 'Estudiante') || 'Estudiante'}
              suscripcionUsuario={(usuarioPublico.suscripcion || 'Free') || 'Free'}
              esPerfilPublico={true}
              fechaCreacion={usuarioPublico.fecha_creacion || null}
              slugUsuario={slug}
              onModalStateChange={manejarModalImagen}
            />
          </div>
          <div className={`pestanas-fijas${modalAbierto ? ' ocultar-pestanas' : ''}`}>
            <PestanasPerfil modalAbierto={modalAbierto} modoPublico={true} slugUsuario={slug} />
          </div>
          <div className="contenido-dinamico">
            <Outlet context={{ usuarioPublico, stats }} />
          </div>
        </>
      ) : null}
    </div>
  )
}
