import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../servicios/clienteSupabase'
import { generarSlug } from '../../utilidades/slug'
import ReproductorLecciones from '../../componentes/VisualizadorDeLeccionesDeCursos/ReproductorLecciones'
import EncabezadoLeccion from '../../componentes/VisualizadorDeLeccionesDeCursos/EncabezadoLeccion'
import BarraLateralCurso from '../../componentes/VisualizadorDeLeccionesDeCursos/BarraLateralCurso'
import PestañasLeccion from '../../componentes/VisualizadorDeLeccionesDeCursos/PestañasLeccion'
import SkeletonClase from '../../componentes/Skeletons/SkeletonClase'
import './contenido-tutorial.css'

export default function ClaseTutorial() {
  const { slug = '', claseSlug = '' } = useParams()
  const [tutorial, setTutorial] = useState<any>(null)
  const [clases, setClases] = useState<any[]>([])
  const [completada, setCompletada] = useState(false)
  const [cargandoCompletar, setCargandoCompletar] = useState(false)
  const [errorCompletar, setErrorCompletar] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mostrarSidebar, setMostrarSidebar] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return true
  })

  const [progresoMap, setProgresoMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    document.body.classList.add('tutorial-pantalla-completa')
    return () => { document.body.classList.remove('tutorial-pantalla-completa') }
  }, [])
  useEffect(() => { cargarTutorial() }, [slug])

  async function cargarTutorial() {
    if (!slug) return
    setCargando(true); setError(null)
    try {
      const { data: tuts, error: errT } = await supabase.from('tutoriales').select('*')
      if (errT) {
        setError(errT.message);
        return
      }

      let tut = (tuts || []).find((t: any) => generarSlug(t.titulo) === slug) || (tuts || []).find((t: any) => (t as any).slug === slug)
      if (!tut) {
        setError('Tutorial no encontrado');
        return
      }
      setTutorial(tut)

      const { data: partes, error: errP } = await supabase
        .from('partes_tutorial')
        .select('id, titulo, slug, video_url, orden, descripcion')
        .eq('tutorial_id', tut.id)
        .order('orden', { ascending: true })

      if (errP) {
        setError(errP.message);
        return
      }
      const lista = partes || []
      setClases(lista)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: progAll } = await supabase
          .from('progreso_tutorial')
          .select('parte_tutorial_id, completado')
          .eq('usuario_id', user.id)
          .eq('tutorial_id', tut.id)

        const map: Record<string, boolean> = {}
        if (progAll) {
          progAll.forEach((p: any) => {
            if (p.completado) {
              map[p.parte_tutorial_id] = true
            }
          })
        }
        setProgresoMap(map)
      } else {
        setProgresoMap({})
      }
    } catch (e: any) {
      setError(e.message || 'Error cargando clase')
    } finally {
      setCargando(false)
    }
  }

  const clase = useMemo(() => {
    if (!clases.length) return null
    const safeGenerateSlug = (text: string) => {
      try { return generarSlug(text || ''); } catch { return ''; }
    };
    return clases.find((p: any) =>
      p.slug === claseSlug ||
      safeGenerateSlug(p.titulo) === claseSlug ||
      p.id === claseSlug
    ) || clases[0]
  }, [clases, claseSlug])

  useEffect(() => {
    if (clase) setCompletada(!!progresoMap[clase.id])
  }, [clase, progresoMap])

  const estadisticasProgreso = useMemo(() => {
    const total = clases.length
    const completadas = Object.values(progresoMap).filter(Boolean).length
    const porcentaje = total ? Math.round((completadas / total) * 100) : 0
    return { completadas, total, porcentaje }
  }, [clases, progresoMap])

  const indice = useMemo(() => clases.findIndex((p: any) => p.id === clase?.id), [clases, clase])
  const claseAnterior = indice > 0 ? clases[indice - 1] : null
  const claseSiguiente = indice >= 0 && indice < clases.length - 1 ? clases[indice + 1] : null

  async function marcarComoCompletada() {
    setCargandoCompletar(true); setErrorCompletar('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !tutorial || !clase) return
      const { data: existente } = await supabase
        .from('progreso_tutorial')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('parte_tutorial_id', clase.id)
        .maybeSingle()

      if (existente) {
        const { error: errUpd } = await supabase
          .from('progreso_tutorial')
          .update({
            completado: true,
            fecha_actualizacion: new Date().toISOString()
          })
          .eq('id', existente.id)
        if (errUpd) setErrorCompletar(errUpd.message)
        else {
          setCompletada(true)
          setProgresoMap(prev => ({ ...prev, [clase.id]: true }))
        }
      } else {
        const { error: errIns } = await supabase
          .from('progreso_tutorial')
          .insert({
            usuario_id: user.id,
            tutorial_id: tutorial.id,
            parte_tutorial_id: clase.id,
            completado: true,
            fecha_inicio: new Date().toISOString(),
            fecha_actualizacion: new Date().toISOString()
          })
        if (errIns) setErrorCompletar(errIns.message)
        else {
          setCompletada(true)
          setProgresoMap(prev => ({ ...prev, [clase.id]: true }))
        }
      }
    } catch (e: any) {
      setErrorCompletar(e.message)
    } finally { setCargandoCompletar(false) }
  }

  if (cargando) return <SkeletonClase />
  if (error || !tutorial || !clase) return (<div className="estado-error"><div className="error-icono">⚠</div><h2>¡Oops! Algo salió mal</h2><p>{error || 'No se encontró contenido'}</p><div className="botones-error"><a href={`/tutoriales/${slug}/contenido`} className="boton-volver">Volver</a></div></div>)

  return (
    <div className="contenido-detalle-tutorial-legacy">
      <EncabezadoLeccion
        cursoTitulo={tutorial.titulo}
        leccionTitulo={clase.titulo}
        cursoId={tutorial.id}
        leccionId={clase.id}
        tipo="clase"
        mostrarSidebar={mostrarSidebar}
        onToggleSidebar={() => setMostrarSidebar((v) => !v)}
        curso={{ ...tutorial, clases_tutorial: clases }}
        moduloActivo={''}
        progreso={progresoMap}
        estadisticasProgreso={estadisticasProgreso}
        usuarioActual={null}
        leccionAnterior={claseAnterior}
        leccionSiguiente={claseSiguiente}
      />
      <div className="contenedor-clase">
        <div className="area-video">
          <ReproductorLecciones
            leccionAnterior={claseAnterior}
            leccionSiguiente={claseSiguiente}
            parteId={clase.id}
            thumbnailUrl={''}
            titulo={clase.titulo}
            tipo="clase"
            completada={completada}
            cargandoCompletar={cargandoCompletar}
            marcarComoCompletada={marcarComoCompletada}
            errorCompletar={errorCompletar}
            autoplay={false}
          />
          <div className="tutorial-scroll-container">
            <PestañasLeccion
              cursoId={tutorial.id}
              leccionId={clase.id}
              tipo="clase"
              curso={{ ...tutorial, clases_tutorial: clases }}
              clases={clases}
              progreso={progresoMap}
              mostrarSidebar={mostrarSidebar}
              usuarioActual={null}
            />
          </div>
        </div>
        <div className={`leccion-sidebar ${mostrarSidebar ? 'visible' : ''}`}>
          <BarraLateralCurso
            curso={{ ...tutorial, clases_tutorial: clases }}
            moduloActivo={''}
            leccionActiva={clase?.id}
            progreso={progresoMap}
            tipo="tutorial"
            mostrarSidebar={mostrarSidebar}
            onCerrarSidebar={() => setMostrarSidebar(false)}
          />
        </div>
      </div>
    </div>
  )
}
