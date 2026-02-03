import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../servicios/supabaseCliente'
import BarraProgresoAvanzada from '../../componentes/Tutoriales/BarraProgresoAvanzada'
import TutorialClases from '../../componentes/Tutoriales/TutorialClases'
import './contenido-tutorial.css'
import { generarSlug } from '../../utilidades/slug'

export default function ContenidoTutorial() {
  const { slug = '' } = useParams()
  const [tutorial, setTutorial] = useState<any>(null)
  const [inscripcion, setInscripcion] = useState<any>(null)
  const [progreso, setProgreso] = useState<Record<string, { completado: boolean }>>({})
  const [estadisticasProgreso, setEstadisticas] = useState({ completadas: 0, total: 0, porcentaje: 0 })
  const [proximaClase, setProximaClase] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(()=> { cargarTutorial() }, [slug])

  async function cargarTutorial() {
    if (!slug) return
    setCargando(true); setError(null)
    try {
      const { data: todos, error: errTodos } = await supabase.from('tutoriales').select('*')
      if (errTodos) { setError(errTodos.message || 'Error cargando tutoriales'); return }
      let tut = (todos || []).find((t:any)=> generarSlug(t.titulo) === slug)
      if (!tut) tut = (todos || []).find((t:any)=> t.slug === slug)
      if (!tut) { setError('Tutorial no encontrado.'); return }
      const { data: partes, error: errPartes } = await supabase.from('partes_tutorial').select('*').eq('tutorial_id', tut.id).order('orden',{ ascending:true })
      if (errPartes) { setError(errPartes.message || 'Error cargando clases'); return }
      const { data: { user } } = await supabase.auth.getUser()
      let insc=null
      if (user) { const { data: ins, error: errIns } = await supabase.from('inscripciones').select('*').eq('usuario_id', user.id).eq('tutorial_id', tut.id).single(); if (errIns) { /* ignore */ } insc = ins || null }
      setInscripcion(insc)
      const t = { ...tut, partes: partes || [] }
      setTutorial(t)
      if (user) {
        const { data: prog, error: errProg } = await supabase.from('progreso_tutorial').select('parte_tutorial_id, completado').eq('usuario_id', user.id).eq('tutorial_id', t.id)
        if (errProg) { setEstadisticas({ completadas: 0, total: (t.partes||[]).length, porcentaje: 0 }) }
        const mapa: Record<string, { completado: boolean }> = {}
        (prog||[]).forEach((p:any)=> { mapa[p.parte_tutorial_id] = { completado: !!p.completado } })
        setProgreso(mapa)
        const completadas = (prog||[]).filter((p:any)=> p.completado).length
        const total = (t.partes||[]).length
        const porcentaje = total ? Math.round((completadas/total)*100) : 0
        setEstadisticas({ completadas, total, porcentaje })
        const pendiente = (t.partes||[]).find((p:any)=> !mapa[p.id] || !mapa[p.id].completado)
        if (pendiente) setProximaClase({ clase: pendiente, ruta: `/tutoriales/${slug}/clase/${pendiente.slug || pendiente.titulo}` })
      }
    } catch (e:any) { setError(e?.message || 'Error al cargar el tutorial. Inténtalo nuevamente.') }
    finally { setCargando(false) }
  }

  return (
    <div className="contenido-detalle-tutorial">
      {cargando ? (
        <div className="estado-carga"><div className="spinner" /><h2>Cargando tu tutorial...</h2><p>Preparando todas las clases para ti</p></div>
      ) : error ? (
        <div className="estado-error"><div className="error-icono">⚠</div><h2>¡Oops! Algo salió mal</h2><p>{error}</p><div className="botones-error"><button className="boton-reintentar" onClick={cargarTutorial}>Intentar de nuevo</button><a href="/tutoriales" className="boton-volver">Volver a Tutoriales</a></div></div>
      ) : tutorial ? (
        <>
          <div className="header-contenido">
            <div className="breadcrumb"><a href="/tutoriales">Tutoriales</a><span className="separador">/</span><span className="actual">{tutorial.titulo}</span></div>
            <div className="info-principal">
              <div className="imagen-contenido"><img src={tutorial.imagen_url || '/images/default-tutorial.jpg'} alt={tutorial.titulo} loading="lazy" /><div className="badge-tipo tutorial">Tutorial</div></div>
              <div className="detalles-contenido"><h1>{tutorial.titulo}</h1><p className="descripcion">{tutorial.descripcion}</p>
                <div className="metadatos">
                  <div className="metadato"><span>⏱</span><span>{estadisticasProgreso.total} clases</span></div>
                  <div className="metadato"><span>⭐</span><span>Nivel {tutorial.nivel}</span></div>
                  {inscripcion && (<div className="metadato"><span>📅</span><span>Inscrito el {new Date(inscripcion.fecha_inscripcion).toLocaleDateString('es-ES')}</span></div>)}
                </div>
              </div>
            </div>
          </div>
          <div className="contenido-principal">
            <div className="columna-izquierda">
              <div className="seccion-progreso"><h2>Tu Progreso</h2><BarraProgresoAvanzada estadisticasProgreso={estadisticasProgreso} tipoContenido="tutorial" /></div>
              <div className="seccion-navegacion">
                {proximaClase ? (
                  <div className="acciones-aprendizaje">
                    <a href={proximaClase.ruta} style={{ background:'#a855f7', color:'#fff', padding:'12px 24px', borderRadius:12, textDecoration:'none', fontWeight:600 }}>Continuar →</a>
                    <div className="navegacion-hint"><span>O explora todas las clases abajo</span></div>
                  </div>
                ) : (
                  <div className="tutorial-completado" style={{ textAlign:'center', padding:'2rem' }}><h3>¡Felicidades! Has completado este tutorial</h3><p>Has terminado todas las clases disponibles.</p><a href="/tutoriales" className="boton-volver-tutoriales">Ver Más Tutoriales</a></div>
                )}
              </div>
              <div className="seccion-contenido"><div className="contenido-header"><h2>Todas las Clases del Tutorial</h2><p className="contenido-descripcion">Haz clic en cualquier clase para acceder directamente a ella</p></div><TutorialClases tutorial={tutorial} progreso={progreso} slug={slug} /></div>
            </div>
            <div className="columna-derecha">
              <div className="widget-informacion"><h3>Información del Tutorial</h3><div className="info-widget"><div className="stat"><div className="stat-numero">{estadisticasProgreso.porcentaje}%</div><div className="stat-label">Completado</div></div><div className="stat"><div className="stat-numero">{estadisticasProgreso.completadas}</div><div className="stat-label">Clases Vistas</div></div><div className="stat"><div className="stat-numero">{estadisticasProgreso.total - estadisticasProgreso.completadas}</div><div className="stat-label">Pendientes</div></div></div></div>
            </div>
          </div>
        </>
      ) : null }
    </div>
  )
}
