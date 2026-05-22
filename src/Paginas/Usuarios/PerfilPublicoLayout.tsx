'use client';
import { Link } from '@/compat/router';

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useParams, OutletContext } from '@/compat/router'
import { supabase } from '../../servicios/clienteSupabase'
import EncabezadoPerfil from '../../componentes/Perfil/EncabezadoPerfil'
import PestanasPerfil from '../../componentes/Perfil/PestanasPerfil'
import { generarSlug } from '../../utilidades/slug'
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
  puntaje: number
  cursos: number
  tutoriales: number
  ranking: number
  monedas: number
}

export default function PerfilPublicoLayout({ slug: slugProp, children }: { slug?: string; children?: ReactNode } = {}) {
  const params = useParams()
  const slug = slugProp ?? params.slug ?? ''
  const [usuarioPublico, setUsuarioPublico] = useState<PerfilPublico | null>(null)
  const [stats, setStats] = useState<StatsPerfil>({ puntaje: 0, cursos: 0, tutoriales: 0, ranking: 0, monedas: 0 })
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
        .select('id,nombre,apellido,nombre_completo,nombre_usuario,url_foto_perfil,portada_url,posicion_img_portada,biografia,ciudad,pais,fecha_creacion,rol,suscripcion')
        .eq('nombre_usuario', slug)
        .maybeSingle()

      let usuario: PerfilPublico | null = (usuarioExacto as unknown as PerfilPublico) || null

      if (!usuario) {
        const { data: todos } = await supabase
          .from('perfiles')
          .select('id,nombre,apellido,nombre_completo,nombre_usuario,url_foto_perfil,portada_url,posicion_img_portada,biografia,ciudad,pais,fecha_creacion,rol,suscripcion')

        const lista = Array.isArray(todos) ? todos as unknown as PerfilPublico[] : []
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

      const [inscripcionesResult, rankingGlobal, monedasData] = await Promise.all([
        supabase.from('inscripciones').select('curso_id, tutorial_id').eq('usuario_id', usuarioId),
        supabase.from('ranking_global').select('puntuacion,posicion').eq('usuario_id', usuarioId).eq('tipo_ranking', 'general').maybeSingle(),
        supabase.from('monedas_usuario').select('saldo').eq('usuario_id', usuarioId).maybeSingle()
      ]);

      const cursosCount = inscripcionesResult.data?.filter(i => i.curso_id).length || 0;
      const tutorialesCount = inscripcionesResult.data?.filter(i => i.tutorial_id).length || 0;

      setStats({
        puntaje: rankingGlobal.data?.puntuacion || 0,
        cursos: cursosCount,
        tutoriales: tutorialesCount,
        ranking: rankingGlobal.data?.posicion || 0,
        monedas: Number(monedasData.data?.saldo || 0)
      })

      setCargando(false)
    } catch {
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
        <div className="error-carga"><h1>Usuario no encontrado</h1><p>{error}</p><Link href="/comunidad" className="btn-volver">Volver a la Comunidad</Link></div>
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
              cargandoStats={false}
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
            <OutletContext.Provider value={{ usuarioPublico, stats } as any}>
              {children}
            </OutletContext.Provider>
          </div>
        </>
      ) : null}
    </div>
  )
}
