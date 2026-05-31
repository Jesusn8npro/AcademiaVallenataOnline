'use client';

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from '@/compat/router'
import { supabase } from '../../servicios/clienteSupabase'
import { generarSlug } from '../../utilidades/slug'
import ReproductorLecciones from '../../componentes/VisualizadorDeLeccionesDeCursos/ReproductorLecciones'
import EncabezadoLeccion from '../../componentes/VisualizadorDeLeccionesDeCursos/EncabezadoLeccion'
import BarraLateralCurso from '../../componentes/VisualizadorDeLeccionesDeCursos/BarraLateralCurso'
import PanelAcordeonEnClase from '../../componentes/VisualizadorDeLeccionesDeCursos/PanelAcordeonEnClase'
import PestañasLeccion from '../../componentes/VisualizadorDeLeccionesDeCursos/PestañasLeccion'
import SkeletonClase from '../../componentes/Skeletons/SkeletonClase'
import FormularioEvaluacion from '../../componentes/Tutoriales/FormularioEvaluacion'
import { prefetchVideoFirmado } from '../../hooks/useVideoFirmado'
import './contenido-tutorial.css'

export default function ClaseTutorial() {
  const { slug = '', claseSlug = '' } = useParams()
  const [claseActivaSlug, setClaseActivaSlug] = useState(claseSlug)
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
  const [mostrarAcordeon, setMostrarAcordeon] = useState(false)

  const [progresoMap, setProgresoMap] = useState<Record<string, boolean>>({})
  const [usuarioActual, setUsuarioActual] = useState<any>(null)

  // Cuando el alumno vuelve del simulador con ?t=N, retomamos el video en ese segundo.
  const [searchParams] = useSearchParams()
  const tiempoInicialParam = searchParams.get('t')
  const tiempoInicialVideo = tiempoInicialParam ? Math.max(0, parseInt(tiempoInicialParam, 10) || 0) : 0

  function cambiarClase(leccion: any) {
    const nuevoSlug = leccion.slug || leccion.id || ''
    if (!nuevoSlug) return
    setClaseActivaSlug(nuevoSlug)
    window.scrollTo(0, 0)
  }

  // Al volver del simulador con ?t=N el navegador puede restaurar la posición
  // de scroll previa Y el iframe del video con autoplay puede pedir foco —
  // ambos empujan el scroll hacia abajo. Forzamos scrollRestoration manual y
  // hacemos varios intentos para vencer ambos efectos.
  useEffect(() => {
    if (tiempoInicialParam === null) return
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    document.body.classList.remove('bloquear-scroll-simulador')
    const irArriba = () => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
    irArriba()
    const timers = [50, 200, 500, 1000].map((ms) => window.setTimeout(irArriba, ms))
    return () => { timers.forEach(window.clearTimeout) }
  }, [tiempoInicialParam])

  // Ref con el segundo actual del iframe — el header lo lee al abrir el simulador en móvil.
  const tiempoVideoRef = useRef(0)
  const obtenerTiempoVideo = () => tiempoVideoRef.current

  useEffect(() => {
    document.body.classList.add('tutorial-pantalla-completa')
    return () => { document.body.classList.remove('tutorial-pantalla-completa') }
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuarioActual(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => { cargarTutorial() }, [slug])

  async function cargarTutorial() {
    if (!slug) return
    setCargando(true); setError(null)
    try {
      // 1) Lista LIGERA (solo id+titulo) para resolver el slug — evita traer las
      //    69 filas con todas sus columnas (`select('*')`), que hacía el esqueleto largo.
      const { data: tuts, error: errT } = await supabase.from('tutoriales').select('id, titulo')
      if (errT) { setError(errT.message); return }

      const match = (tuts || []).find((t: any) => generarSlug(t.titulo) === slug)
      if (!match) { setError('Tutorial no encontrado'); return }

      // 2) Tutorial completo + partes + sesión EN PARALELO (no en cascada).
      const [tutRes, partesRes, sessionRes] = await Promise.all([
        supabase.from('tutoriales').select('*').eq('id', match.id).single(),
        supabase
          .from('partes_tutorial')
          .select('id, titulo, slug, video_url, orden, descripcion, tipo_contenido, monedas_recompensa')
          .eq('tutorial_id', match.id)
          .order('orden', { ascending: true }),
        supabase.auth.getSession(),
      ])

      if (tutRes.error || !tutRes.data) { setError(tutRes.error?.message || 'Tutorial no encontrado'); return }
      if (partesRes.error) { setError(partesRes.error.message); return }

      setTutorial(tutRes.data)
      setClases(partesRes.data || [])

      const user = sessionRes.data?.session?.user ?? null
      setUsuarioActual(user)
      if (user) {
        const { data: progAll } = await supabase
          .from('progreso_tutorial')
          .select('parte_tutorial_id, completado')
          .eq('usuario_id', user.id)
          .eq('tutorial_id', match.id)

        const map: Record<string, boolean> = {}
        ;(progAll || []).forEach((p: any) => { if (p.completado) map[p.parte_tutorial_id] = true })
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
      p.slug === claseActivaSlug ||
      safeGenerateSlug(p.titulo) === claseActivaSlug ||
      p.id === claseActivaSlug
    ) || clases[0]
  }, [clases, claseActivaSlug])

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

  // Prefetch del video de la clase activa y las adyacentes → navegar entre
  // clases es instantáneo (cache hit), sin esperar la URL firmada cada vez.
  useEffect(() => {
    if (clase?.id) prefetchVideoFirmado({ parteId: clase.id })
    if (claseSiguiente?.id) prefetchVideoFirmado({ parteId: claseSiguiente.id })
    if (claseAnterior?.id) prefetchVideoFirmado({ parteId: claseAnterior.id })
  }, [clase?.id, claseSiguiente?.id, claseAnterior?.id])

  async function marcarComoCompletada() {
    setCargandoCompletar(true); setErrorCompletar('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !tutorial || !clase) return
      const { error } = await supabase.rpc('marcar_parte_completada', {
        p_usuario_id: user.id,
        p_tutorial_id: tutorial.id,
        p_parte_id: clase.id,
      })
      if (error) setErrorCompletar(error.message)
      else {
        setCompletada(true)
        setProgresoMap(prev => ({ ...prev, [clase.id]: true }))
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
        mostrarAcordeon={mostrarAcordeon}
        onToggleAcordeon={() => setMostrarAcordeon((v) => !v)}
        obtenerTiempoVideo={obtenerTiempoVideo}
        curso={{ ...tutorial, clases_tutorial: clases }}
        moduloActivo={''}
        progreso={progresoMap}
        estadisticasProgreso={estadisticasProgreso}
        usuarioActual={usuarioActual}
        leccionAnterior={claseAnterior}
        leccionSiguiente={claseSiguiente}
        onCambiarClase={cambiarClase}
      />
      <div className="contenedor-clase">
        <div className="area-video">
          {clase.tipo_contenido === 'evaluacion' ? (
            <>
              <div className="evaluacion-movil-nav">
                <button
                  type="button"
                  className="evaluacion-movil-nav-btn"
                  onClick={() => {
                    const destino = claseAnterior || clases.find((c: any) => c.tipo_contenido !== 'evaluacion') || null
                    if (destino) cambiarClase(destino)
                  }}
                >
                  ← {claseAnterior ? claseAnterior.titulo : 'Ver clases'}
                </button>
              </div>
              <FormularioEvaluacion
                parteId={clase.id}
                tutorialId={tutorial.id}
                monedasRecompensa={clase.monedas_recompensa ?? 10}
              />
            </>
          ) : (
            <>
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
                autoplay={tiempoInicialVideo > 0}
                tiempoInicial={tiempoInicialVideo}
                onTiempoActualizado={(seg) => { tiempoVideoRef.current = seg }}
                onCambiarClase={cambiarClase}
              />
              <div className="tutorial-scroll-container">
                <PestañasLeccion
                  leccionId={clase.id}
                  tipo="clase"
                  curso={{ ...tutorial, clases_tutorial: clases }}
                  clases={clases}
                  progreso={progresoMap}
                  mostrarSidebar={mostrarSidebar}
                  usuarioActual={usuarioActual}
                  onCambiarLeccion={cambiarClase}
                />
              </div>
            </>
          )}
        </div>
        <div className={`leccion-sidebar ${(mostrarSidebar || mostrarAcordeon) ? 'visible' : ''} ${mostrarAcordeon ? 'con-acordeon' : ''}`}>
          {mostrarAcordeon ? (
            <PanelAcordeonEnClase onCerrar={() => setMostrarAcordeon(false)} />
          ) : (
            <BarraLateralCurso
              curso={{ ...tutorial, clases_tutorial: clases }}
              moduloActivo={''}
              leccionActiva={clase?.id}
              progreso={progresoMap}
              tipo="tutorial"
              onCerrarSidebar={() => setMostrarSidebar(false)}
              onIrAClase={cambiarClase}
            />
          )}
        </div>
      </div>
    </div>
  )
}
