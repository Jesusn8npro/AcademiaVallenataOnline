import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../servicios/clienteSupabase'
import BarraProgresoAvanzada from '../../componentes/Tutoriales/BarraProgresoAvanzada'
import TutorialClases from '../../componentes/Tutoriales/TutorialClases'
import './ContenidoTutorialPremium.css'
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
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    cargarTutorial()

    const timer = setTimeout(() => {
      document.body.style.backgroundColor = '#f8fafc';
      document.body.classList.remove('tutorial-pantalla-completa');
      document.body.classList.remove('vista-premium-activa');
      document.body.classList.add('tutorial-premium-view-active');
    }, 0);

    return () => {
      clearTimeout(timer);
      document.body.style.backgroundColor = '';
      document.body.classList.remove('tutorial-premium-view-active');
    }
  }, [slug])

  async function compartirProgreso() {
    const url = `${window.location.origin}/tutoriales/${slug}/contenido`
    const porcentaje = estadisticasProgreso.porcentaje
    const nombreTutorial = tutorial?.titulo || 'un tutorial'
    const texto = porcentaje >= 100
      ? `¡Completé el tutorial "${nombreTutorial}" en Academia Vallenata Online! 🎹🎵`
      : `Llevo un ${porcentaje}% del tutorial "${nombreTutorial}" en Academia Vallenata Online 🎹`

    if (navigator.share) {
      await navigator.share({ title: nombreTutorial, text: texto, url })
    } else {
      await navigator.clipboard.writeText(`${texto}\n${url}`)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  async function cargarTutorial() {
    if (!slug) return
    setCargando(true); setError(null)
    try {
      const { data: todos, error: errTodos } = await supabase.from('tutoriales').select('*')
      if (errTodos) throw errTodos

      const safeGenerateSlug = (text: string) => {
        try { return generarSlug(text || ''); } catch { return ''; }
      };

      let tut = (todos || []).find((t: any) => safeGenerateSlug(t.titulo) === slug);
      if (!tut) {
        tut = (todos || []).find((t: any) => {
          const s = safeGenerateSlug(t.titulo);
          return t.id === slug || s.includes(slug);
        });
      }

      if (!tut) {
        setError(`No pudimos encontrar el tutorial "${slug}".`);
        return
      }

      const { data: partes, error: errPartes } = await supabase
        .from('partes_tutorial')
        .select('*')
        .eq('tutorial_id', tut.id)
        .order('orden', { ascending: true })

      if (errPartes) throw errPartes

      const { data: { user } } = await supabase.auth.getUser()
      let insc = null
      if (user) {
        const { data: ins } = await supabase
          .from('inscripciones')
          .select('*')
          .eq('usuario_id', user.id)
          .eq('tutorial_id', tut.id)
          .maybeSingle();
        insc = ins || null
      }

      setInscripcion(insc)
      const t = { ...tut, partes: partes || [] }
      setTutorial(t)

      if (user) {
        const { data: prog } = await supabase
          .from('progreso_tutorial')
          .select('parte_tutorial_id, completado')
          .eq('usuario_id', user.id)
          .eq('tutorial_id', t.id)

        const mapa: Record<string, { completado: boolean }> = {}
        const progresoData = prog || [];
        progresoData.forEach((p: any) => {
          mapa[p.parte_tutorial_id] = { completado: !!p.completado }
        })
        setProgreso(mapa)

        const completadas = progresoData.filter((p: any) => p.completado).length
        const total = (t.partes || []).length
        const porcentaje = total ? Math.round((completadas / total) * 100) : 0
        setEstadisticas({ completadas, total, porcentaje })

        const pendiente = (t.partes || []).find((p: any) => !mapa[p.id] || !mapa[p.id].completado)
        if (pendiente) {
          const claseSlugReal = pendiente.slug || generarSlug(pendiente.titulo);
          setProximaClase({
            clase: pendiente,
            ruta: `/tutoriales/${slug}/clase/${claseSlugReal}`
          })
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Error al cargar el tutorial.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="contenido-tutorial-premium-root">
      {cargando ? (
        <div className="estado-carga-global">
          <div className="spinner-premium" />
          <h2 style={{ color: '#1e293b' }}>Cargando tu tutorial...</h2>
          <p style={{ color: '#64748b' }}>Preparando todas las clases para ti</p>
        </div>
      ) : error ? (
        <div className="tp-estado-error">
          <div className="error-icono">⚠</div>
          <h2>¡Oops! Algo salió mal</h2>
          <p>{error}</p>
          <div className="botones-error">
            <button className="tp-btn-reintentar" onClick={cargarTutorial}>Intentar de nuevo</button>
            <a href="/tutoriales" className="tp-link-volver">Volver a Tutoriales</a>
          </div>
        </div>
      ) : tutorial ? (
        <>
          <div className="tp-header-contenido">
            <div className="tp-breadcrumb">
              <a href="/tutoriales">Tutoriales</a>
              <span className="separador">/</span>
              <span className="actual">{tutorial.titulo}</span>
            </div>
            <div className="tp-info-principal">
              <div className="tp-imagen-contenido">
                <img src={tutorial.imagen_url || '/images/default-tutorial.jpg'} alt={tutorial.titulo} loading="lazy" />
                <div className="tp-badge-tipo">Tutorial</div>
              </div>
              <div className="tp-detalles-contenido">
                <h1>{tutorial.titulo}</h1>
                <p className="tp-descripcion">{tutorial.descripcion}</p>
                <div className="tp-metadatos">
                  <div className="tp-metadato"><span>⏱</span><span>{estadisticasProgreso.total} clases</span></div>
                  <div className="tp-metadato"><span>⭐</span><span>Nivel {tutorial.nivel}</span></div>
                  {inscripcion && (<div className="tp-metadato"><span>📅</span><span>Inscrito el {new Date(inscripcion.fecha_inscripcion).toLocaleDateString('es-ES')}</span></div>)}
                </div>
              </div>
            </div>
          </div>

          <div className="tp-contenido-principal">
            <div className="tp-columna-izquierda">
              <div className="tp-seccion-card">
                <div className="tp-progreso-header">
                  <h2>Tu Progreso</h2>
                  <button className="ct-btn-compartir" onClick={compartirProgreso}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    {copiado ? '¡Enlace copiado!' : 'Compartir progreso'}
                  </button>
                </div>
                <BarraProgresoAvanzada estadisticasProgreso={estadisticasProgreso} tipoContenido="tutorial" />
              </div>

              <div className="tp-acciones-navegacion">
                {proximaClase ? (
                  <div className="tp-acciones-aprendizaje">
                    <a href={proximaClase.ruta}>Continuar Aprendiendo →</a>
                    <div className="tp-navegacion-hint">
                      <span>O explora todas las clases abajo</span>
                    </div>
                  </div>
                ) : (
                  <div className="tp-seccion-card" style={{ textAlign: 'center' }}>
                    <h3>¡Felicidades! Has completado este tutorial</h3>
                    <p>Has terminado todas las clases disponibles.</p>
                    <a href="/tutoriales" className="tp-btn-final">Ver Más Tutoriales</a>
                  </div>
                )}
              </div>

              <div className="tp-seccion-card">
                <div className="tp-contenido-header">
                  <h2>Todas las Clases del Tutorial</h2>
                  <p className="tp-subtitulo">Haz clic en cualquier clase para acceder directamente a ella</p>
                </div>
                <TutorialClases tutorial={tutorial} progreso={progreso} slug={slug} />
              </div>
            </div>

            <div className="tp-columna-derecha">
              <div className="tp-widget-info">
                <h3>Información del Tutorial</h3>
                <div className="tp-stat-list">
                  <div className="tp-stat-row">
                    <div className="tp-stat-value">{estadisticasProgreso.porcentaje}%</div>
                    <div className="tp-stat-label">Completado</div>
                  </div>
                  <div className="tp-stat-row">
                    <div className="tp-stat-value">{estadisticasProgreso.completadas}</div>
                    <div className="tp-stat-label">Clases Vistas</div>
                  </div>
                  <div className="tp-stat-row">
                    <div className="tp-stat-value">{estadisticasProgreso.total - estadisticasProgreso.completadas}</div>
                    <div className="tp-stat-label">Pendientes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
