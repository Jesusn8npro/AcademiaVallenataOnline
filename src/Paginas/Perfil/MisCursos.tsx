import React, { useEffect, useState } from 'react'
import GridMisCursos from '../../componentes/MisCursos/GridMisCursos'
import PorcentajePerfil from '../../componentes/Perfil/PorcentajePerfil'
import BannerSlider from '../../componentes/Banners/BannerSlider'
import { usePerfilStore } from '../../stores/perfilStore'
import { supabase } from '../../servicios/supabaseCliente'
import SkeletonMisCursos from '../../componentes/Skeletons/SkeletonMisCursos'

import { useUsuario } from '../../contextos/UsuarioContext'

export default function MisCursos() {
  const { perfil } = usePerfilStore()
  const { usuario } = useUsuario()
  const [inscripciones, setInscripciones] = useState<any[]>([])
  const [cargandoCursos, setCargandoCursos] = useState(true)
  const [errorCursos, setErrorCursos] = useState<string | null>(null)

  async function cargarInscripciones() {
    if (!usuario) return

    try {
      setCargandoCursos(true); setErrorCursos(null)

      // Promesa de carga con los datos
      const fetchPromise = async () => {
        const { data: insc, error } = await supabase.from('inscripciones').select('*').eq('usuario_id', usuario.id).order('fecha_inscripcion', { ascending: false })
        if (error) throw error
        return insc
      }

      // Timeout de 5 segundos
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera agotado al cargar cursos')), 5000))

      const insc = await Promise.race([fetchPromise(), timeoutPromise]) as any[]

      if (!insc || !insc.length) { setInscripciones([]); return }
      const insCursos = insc.filter((i: any) => i.curso_id)
      const insTuts = insc.filter((i: any) => i.tutorial_id)
      let cursosData: any[] = [], tutorialesData: any[] = []

      // Parallel fetches for details (also could benefit from timeout but let's secure the main first)
      if (insCursos.length) { const ids = insCursos.map((i: any) => i.curso_id); const { data } = await supabase.from('cursos').select('id, titulo, descripcion, imagen_url, nivel, duracion_estimada, precio_normal, slug').in('id', ids); cursosData = data || [] }
      if (insTuts.length) { const ids = insTuts.map((i: any) => i.tutorial_id); const { data } = await supabase.from('tutoriales').select('id, titulo, descripcion, imagen_url, nivel, duracion_estimada, precio_normal, artista, acordeonista, tonalidad').in('id', ids); tutorialesData = data || [] }

      const combinadas = [
        ...insCursos.map((ins: any) => ({ ...ins, cursos: cursosData.find((c: any) => c.id === ins.curso_id) })),
        ...insTuts.map((ins: any) => ({ ...ins, tutoriales: tutorialesData.find((t: any) => t.id === ins.tutorial_id) }))
      ].sort((a: any, b: any) => new Date(b.fecha_inscripcion).getTime() - new Date(a.fecha_inscripcion).getTime())

      setInscripciones(combinadas)
    } catch (e: any) {
      console.error('Error cargando cursos:', e)
      setErrorCursos(e.message || 'Error desconocido al cargar los cursos')
    } finally {
      setCargandoCursos(false)
    }
  }

  useEffect(() => {
    if (usuario) {
      cargarInscripciones()
    }
  }, [usuario])

  // Mostrar skeleton mientras carga
  if (cargandoCursos) {
    return <SkeletonMisCursos />
  }

  return (
    <div className="contenido-mis-cursos">
      <div className="layout-mis-cursos">
        <div className="columna-principal" style={{ minWidth: 0, overflow: 'hidden' }}>
          <div className="header-mis-cursos" style={{ marginBottom: '2rem', display: 'block' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1f2937', margin: '0 0 .5rem 0' }}>Mis Cursos</h1>
            <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Continúa con tu aprendizaje de acordeón vallenato</p>
          </div>
          <GridMisCursos inscripciones={inscripciones} isLoading={false} error={errorCursos} />
        </div>
        <aside className="columna-lateral">
          <div className="widgets-contenedor" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            {perfil && (<PorcentajePerfil perfil={perfil} />)}
            <BannerSlider />
          </div>
        </aside>
      </div>
    </div>
  )
}
