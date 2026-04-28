import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../servicios/clienteSupabase'
import { generarSlug } from '../../utilidades/slug'
import ReproductorLecciones from '../../componentes/VisualizadorDeLeccionesDeCursos/ReproductorLecciones'
import EncabezadoLeccion from '../../componentes/VisualizadorDeLeccionesDeCursos/EncabezadoLeccion'
import BarraLateralCurso from '../../componentes/VisualizadorDeLeccionesDeCursos/BarraLateralCurso'
import PestañasLeccion from '../../componentes/VisualizadorDeLeccionesDeCursos/PestañasLeccion'
import SkeletonClase from '../../componentes/Skeletons/SkeletonClase'
import '../Tutoriales/contenido-tutorial.css' // Reutilizamos los estilos de pantalla completa

export default function ClaseCurso() {
    const { slug = '', moduloSlug = '', leccionSlug = '' } = useParams()
    const [curso, setCurso] = useState<any>(null)
    const [modulos, setModulos] = useState<any[]>([])
    const [leccion, setLeccion] = useState<any>(null)
    const [completada, setCompletada] = useState(false)
    const [cargandoCompletar, setCargandoCompletar] = useState(false)
    const [errorCompletar, setErrorCompletar] = useState('')
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // En desktop (>= 1024px) mostrar sidebar por defecto, en móvil/tablet ocultar
    const [mostrarSidebar, setMostrarSidebar] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024
        }
        return true
    })

    const [estadisticasProgreso, setEstadisticasProgreso] = useState({ completadas: 0, total: 0, porcentaje: 0 })
    const [progresoMap, setProgresoMap] = useState<Record<string, number>>({})
    const [usuarioActual, setUsuarioActual] = useState<any>(null)

    // Efectos de layout "Distraction-Free"
    useEffect(() => {
        document.body.classList.add('tutorial-pantalla-completa')
        return () => { document.body.classList.remove('tutorial-pantalla-completa') }
    }, [])

    useEffect(() => {
        if (mostrarSidebar) {
            document.body.classList.add('sidebar-visible-tutorial')
        } else {
            document.body.classList.remove('sidebar-visible-tutorial')
        }
    }, [mostrarSidebar])

    useEffect(() => {
        cargarCurso();
    }, [slug]);

    useEffect(() => {
        if (curso && modulos.length > 0) {
            cargarLeccionYProgreso();
        }
    }, [moduloSlug, leccionSlug, curso, modulos]);

    async function cargarCurso() {
        if (!slug) return;
        setCargando(true); setError(null);
        try {
            const { data: cursoData, error: errC } = await supabase
                .from('cursos')
                .select('*')
                .or(`slug.eq."${slug}",titulo.ilike."${slug}"`)
                .maybeSingle();

            if (errC) throw errC;
            if (!cursoData) throw new Error('Curso no encontrado');

            const { data: mods, error: errM } = await supabase
                .from('modulos')
                .select(`
                    id, titulo, orden,
                    lecciones (
                        id, titulo, video_url, orden
                    )
                `)
                .eq('curso_id', cursoData.id)
                .order('orden', { ascending: true });

            if (errM) throw errM;

            const modulosProcesados = (mods || []).map((m: any) => ({
                ...m,
                slug: generarSlug(m.titulo),
                lecciones: (m.lecciones || []).map((l: any) => ({
                    ...l,
                    slug: generarSlug(l.titulo)
                })).sort((a: any, b: any) => a.orden - b.orden)
            }));

            cursoData.modulos = modulosProcesados;
            setCurso(cursoData);
            setModulos(modulosProcesados);
        } catch (e: any) {
            setError((e as Error).message || 'Error al cargar el curso');
            setCargando(false);
        }
    }

    async function cargarLeccionYProgreso() {
        if (!moduloSlug || !leccionSlug || !curso || modulos.length === 0) return;

        try {
            let user = usuarioActual;
            if (!user) {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                user = authUser;
                setUsuarioActual(user);
            }

            let leccionEncontrada: any = null;
            for (const m of modulos) {
                if (m.slug === moduloSlug) {
                    leccionEncontrada = m.lecciones.find((l: any) => l.slug === leccionSlug);
                    if (leccionEncontrada) break;
                }
            }

            if (!leccionEncontrada) throw new Error('Lección no encontrada');
            setLeccion(leccionEncontrada);

            if (user) {
                const idsLecciones = modulos.flatMap((m: any) => m.lecciones.map((l: any) => l.id));

                const { data: progs } = await supabase
                    .from('progreso_lecciones')
                    .select('leccion_id, estado, porcentaje_completado')
                    .eq('usuario_id', user.id)
                    .in('leccion_id', idsLecciones);

                const map: Record<string, number> = {};
                let completadasCount = 0;
                let estaLeccionCompletada = false;

                if (progs) {
                    progs.forEach((p: any) => {
                        const isCompleted = p.estado === 'completada' || p.porcentaje_completado === 100;
                        if (isCompleted) {
                            map[p.leccion_id] = 100;
                            completadasCount++;
                        }
                        if (p.leccion_id === leccionEncontrada.id) {
                            estaLeccionCompletada = isCompleted;
                        }
                    });
                }

                setProgresoMap(map);
                setCompletada(estaLeccionCompletada);
                setEstadisticasProgreso({
                    completadas: completadasCount,
                    total: idsLecciones.length,
                    porcentaje: idsLecciones.length ? Math.round((completadasCount / idsLecciones.length) * 100) : 0
                });
            }
        } catch (e: any) {
            setError((e as Error).message || 'Error al cargar lección');
        } finally {
            setCargando(false);
        }
    }

    // Navegación secuencial
    const leccionesPlanas = useMemo(() => {
        return modulos.flatMap((m: any) => m.lecciones.map((l: any) => ({ ...l, moduloSlug: m.slug })))
    }, [modulos])

    const indiceActual = useMemo(() =>
        leccionesPlanas.findIndex((l: any) => l.id === leccion?.id),
        [leccionesPlanas, leccion])

    const prevLeccion = indiceActual > 0 ? leccionesPlanas[indiceActual - 1] : null
    const nextLeccion = indiceActual >= 0 && indiceActual < leccionesPlanas.length - 1 ? leccionesPlanas[indiceActual + 1] : null

    async function marcarComoCompletada() {
        setCargandoCompletar(true); setErrorCompletar('')
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user || !curso || !leccion) return

            const { data: existente } = await supabase
                .from('progreso_lecciones')
                .select('id')
                .eq('usuario_id', user.id)
                .eq('leccion_id', leccion.id)
                .maybeSingle()

            const ahora = new Date().toISOString()
            const actualizarEstado = () => {
                setCompletada(true)
                setProgresoMap(prev => ({ ...prev, [leccion.id]: 100 }))
                setEstadisticasProgreso(prev => {
                    const nuevaCount = prev.completadas + 1
                    return { ...prev, completadas: nuevaCount, porcentaje: Math.round((nuevaCount / prev.total) * 100) }
                })
            }

            if (existente) {
                const { error: errUpd } = await supabase
                    .from('progreso_lecciones')
                    .update({ estado: 'completada', porcentaje_completado: 100, updated_at: ahora, ultima_actividad: ahora })
                    .eq('id', existente.id)
                if (errUpd) setErrorCompletar(errUpd.message)
                else actualizarEstado()
            } else {
                const { error: errIns } = await supabase
                    .from('progreso_lecciones')
                    .insert({
                        usuario_id: user.id, leccion_id: leccion.id,
                        estado: 'completada', porcentaje_completado: 100,
                        tiempo_total: 0, ultima_actividad: ahora,
                        created_at: ahora, updated_at: ahora
                    })
                if (errIns) setErrorCompletar(errIns.message)
                else actualizarEstado()
            }
        } finally {
            setCargandoCompletar(false)
        }
    }

    if (cargando) return <SkeletonClase />
    if (error || !curso || !leccion) return (
        <div className="estado-error">
            <div className="error-icono">⚠</div>
            <h2>¡Oops! Algo salió mal</h2>
            <p>{error || 'No se encontró contenido'}</p>
            <div className="botones-error">
                <a href={`/cursos/${slug}`} className="boton-volver">Volver al catálogo</a>
            </div>
        </div>
    )

    return (
        <div className="contenido-detalle-tutorial">
            <EncabezadoLeccion
                cursoTitulo={curso.titulo}
                leccionTitulo={leccion.titulo}
                cursoId={curso.id}
                leccionId={leccion.id}
                tipo="leccion"
                mostrarSidebar={mostrarSidebar}
                onToggleSidebar={() => setMostrarSidebar(v => !v)}
                curso={curso}
                moduloActivo={moduloSlug}
                progreso={progresoMap}
                estadisticasProgreso={estadisticasProgreso}
                usuarioActual={usuarioActual}
                leccionAnterior={prevLeccion}
                leccionSiguiente={nextLeccion}
            />
            <div className="contenedor-clase">
                <div className={`area-video ${!mostrarSidebar ? 'modo-enfoque' : ''}`}>
                    <ReproductorLecciones
                        leccionAnterior={prevLeccion}
                        leccionSiguiente={nextLeccion}
                        leccionId={leccion.id}
                        thumbnailUrl={''}
                        titulo={leccion.titulo}
                        tipo="leccion"
                        completada={completada}
                        cargandoCompletar={cargandoCompletar}
                        marcarComoCompletada={marcarComoCompletada}
                        errorCompletar={errorCompletar}
                        autoplay={false}
                    />
                    <div className="tutorial-scroll-container">
                        <PestañasLeccion
                            cursoId={curso.id}
                            leccionId={leccion.id}
                            tipo="leccion"
                            curso={curso}
                            clases={leccionesPlanas}
                            progreso={progresoMap}
                            mostrarSidebar={mostrarSidebar}
                            usuarioActual={usuarioActual}
                        />
                    </div>
                </div>
                <div className={`leccion-sidebar ${mostrarSidebar ? 'visible' : ''}`}>
                    <BarraLateralCurso
                        curso={curso}
                        moduloActivo={moduloSlug}
                        leccionActiva={leccion.id}
                        progreso={progresoMap}
                        tipo="curso"
                        mostrarSidebar={mostrarSidebar}
                        onCerrarSidebar={() => setMostrarSidebar(false)}
                    />
                </div>
            </div>
        </div>
    )
}
