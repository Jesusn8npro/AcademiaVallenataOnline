'use client';

import { useEffect, useState } from 'react'
import { Link } from '@/compat/router'
import { Crown } from 'lucide-react'
import GridMisCursos from '../../componentes/MisCursos/GridMisCursos'
import PorcentajePerfil from '../../componentes/Perfil/PorcentajePerfil'
import BannerSlider from '../../componentes/Banners/BannerSlider'
import { usePerfilStore } from '../../stores/perfilStore'
import { supabase } from '../../servicios/clienteSupabase'
import SkeletonMisCursos from '../../componentes/Skeletons/SkeletonMisCursos'
import { useUsuario } from '../../contextos/UsuarioContext'
import { obtenerPlanUsuario, type PlanUsuario } from '../../config/accesoPlan'

export default function MisCursos() {
  const { perfil } = usePerfilStore()
  const { usuario } = useUsuario()
  const [inscripciones, setInscripciones] = useState<any[]>([])
  const [cargandoCursos, setCargandoCursos] = useState(true)
  const [errorCursos, setErrorCursos] = useState<string | null>(null)
  const [plan, setPlan] = useState<PlanUsuario | null>(null)

  async function cargarInscripciones() {
    if (!usuario) return

    try {
      setCargandoCursos(true); setErrorCursos(null)

      const fetchPromise = async () => {
        const { data: insc, error } = await supabase.from('inscripciones').select('*').eq('usuario_id', usuario.id).order('fecha_inscripcion', { ascending: false })
        if (error) throw error
        return insc
      }

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera agotado al cargar cursos')), 5000))

      const insc = await Promise.race([fetchPromise(), timeoutPromise]) as any[]

      if (!insc || !insc.length) { setInscripciones([]); return }
      const insCursos = insc.filter((i: any) => i.curso_id)
      const insTuts = insc.filter((i: any) => i.tutorial_id)
      let cursosData: any[] = [], tutorialesData: any[] = []

      if (insCursos.length) { const ids = insCursos.map((i: any) => i.curso_id); const { data } = await supabase.from('cursos').select('id, titulo, descripcion, imagen_url, nivel, duracion_estimada, precio_normal, slug').in('id', ids); cursosData = data || [] }
      if (insTuts.length) { const ids = insTuts.map((i: any) => i.tutorial_id); const { data } = await supabase.from('tutoriales').select('id, titulo, descripcion, imagen_url, nivel, duracion_estimada, precio_normal, artista, acordeonista, tonalidad').in('id', ids); tutorialesData = data || [] }

      const combinadas = [
        ...insCursos.map((ins: any) => ({ ...ins, cursos: cursosData.find((c: any) => c.id === ins.curso_id) })),
        ...insTuts.map((ins: any) => ({ ...ins, tutoriales: tutorialesData.find((t: any) => t.id === ins.tutorial_id) }))
      ].sort((a: any, b: any) => new Date(b.fecha_inscripcion).getTime() - new Date(a.fecha_inscripcion).getTime())

      setInscripciones(combinadas)
    } catch (e: any) {
      setErrorCursos(e.message || 'Error desconocido al cargar los cursos')
    } finally {
      setCargandoCursos(false)
    }
  }

  useEffect(() => {
    if (usuario) cargarInscripciones()
  }, [usuario])

  useEffect(() => {
    if (!usuario) return
    let activo = true
    obtenerPlanUsuario(usuario.id).then((p) => { if (activo) setPlan(p) }).catch(() => {})
    return () => { activo = false }
  }, [usuario])

  if (cargandoCursos) return <SkeletonMisCursos />

  return (
    <div className="contenido-mis-cursos">
      <div className="layout-mis-cursos">
        <div className="columna-principal" style={{ minWidth: 0, overflow: 'hidden' }}>
          <div className="header-mis-cursos" style={{ marginBottom: '2rem', display: 'block' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1f2937', margin: '0 0 .5rem 0' }}>Mis Cursos</h1>
            <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Continúa con tu aprendizaje de acordeón vallenato</p>
          </div>

          {plan && (plan.permisos?.contenido?.tutoriales_video || plan.permisos?.contenido?.cursos) && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
              background: 'linear-gradient(135deg, #1b1430 0%, #2a1d4d 100%)', color: '#fff',
              borderRadius: 16, padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flex: 1, minWidth: 220 }}>
                <span style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, borderRadius: '50%', background: 'rgba(168,85,247,.25)', color: '#c4b5fd', flexShrink: 0 }}>
                  <Crown size={22} />
                </span>
                <div>
                  <strong style={{ display: 'block', fontSize: '1.05rem' }}>Tienes el plan {plan.nombre} activo 🎉</strong>
                  <span style={{ color: 'rgba(255,255,255,.7)', fontSize: '.92rem' }}>
                    Tienes acceso a todo el contenido. Ve agregando los tutoriales y cursos que quieras
                    estudiar — poco a poco, sin saturarte. Aparecerán aquí en Mis Cursos.
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
                <Link to="/tutoriales-de-acordeon" style={{ background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: '.9rem', padding: '.6rem 1.1rem', borderRadius: 10, textDecoration: 'none' }}>Ver tutoriales</Link>
                <Link to="/cursos" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', fontWeight: 700, fontSize: '.9rem', padding: '.6rem 1.1rem', borderRadius: 10, textDecoration: 'none' }}>Ver cursos</Link>
              </div>
            </div>
          )}

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
