import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../servicios/supabaseCliente';
import { useUsuario } from '../../../contextos/UsuarioContext';
// import { generarSlug } from '../../../utilidades/slug'; // Usamos versión local copiada de LandingCurso
import Avatar from './Avatar';
import './ContinuarAprendiendo.css';

// 🎯 DATOS POR DEFECTO PARA MOSTRAR INMEDIATAMENTE
// const datosPorDefecto = {
//   curso: {
//     titulo: 'Fundamentos del Acordeón Vallenato',
//     descripcion: 'Aprende desde cero con el método probado del Maestro Jesús González',
//     imagen_url: '/images/Home/academia-vallenata-1.jpg',
//     progreso: 0,
//     clases_totales: 4,
//     ultima_actividad: 'Hoy'
//   }
// };

// 🚀 MENSAJES MOTIVACIONALES PERSUASIVOS
const mensajesMotivacionales = [
    "¡Tu pasión por el acordeón te llevará lejos! 🎵",
    "Cada nota que aprendes es un paso hacia tu sueño musical ✨",
    "El talento se desarrolla con práctica constante 🎯",
    "Tu dedicación hoy construye tu mañana musical 🌟",
    "El acordeón es tu voz, ¡hazla cantar! 🎼",
    "Cada clase te acerca más a ser el músico que quieres ser 🚀",
    "La música está en tu corazón, ¡déjala salir! 💫",
    "Tu progreso musical inspira a otros a seguir sus sueños 🌈",
    "El ritmo vallenato corre por tus venas 🎭",
    "Cada acorde que dominas es una victoria personal 🏆",
    "Tu amor por la música te hace único y especial 💝",
    "El acordeón es tu compañero de vida musical 🎪",
    "Cada día de práctica te hace más fuerte musicalmente 💪",
    "Tu determinación es la clave de tu éxito musical 🔑",
    "La música no tiene límites, ¡tú tampoco! 🌌"
];

const ContinuarAprendiendo: React.FC = () => {
    const navigate = useNavigate();
    const { usuario } = useUsuario();

    // 📊 Estados
    const [cargando, setCargando] = useState(true);
    const [ultimaActividad, setUltimaActividad] = useState<any>(null);
    const [error, setError] = useState('');

    // 🎠 Estados del slider
    const [todasLasActividades, setTodasLasActividades] = useState<any[]>([]);
    const [actividadActual, setActividadActual] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isChanging, setIsChanging] = useState(false);

    // Refs
    const autoPlayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const mensajeMotivacionalRef = useRef<string>('');

    // 🎲 Mensaje motivacional aleatorio para esta sesión
    useEffect(() => {
        const indiceAleatorio = Math.floor(Math.random() * mensajesMotivacionales.length);
        mensajeMotivacionalRef.current = mensajesMotivacionales[indiceAleatorio];
    }, []);

    const mensajeMotivacional = mensajeMotivacionalRef.current;

    // 🎨 Formatear fecha de última actividad
    const formatearUltimaActividad = (fecha: Date): string => {
        const ahora = new Date();
        const diferencia = ahora.getTime() - fecha.getTime();
        const horas = Math.floor(diferencia / (1000 * 60 * 60));
        const dias = Math.floor(horas / 24);

        if (horas < 1) return 'Hace menos de una hora';
        if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
        if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
        return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    };

    // 🔄 CONTROL ESTRICTO DE AUTO-PLAY (SIN DUPLICACIONES)
    const iniciarAutoPlay = useCallback(() => {
        if (autoPlayIntervalRef.current) {
            clearInterval(autoPlayIntervalRef.current);
            autoPlayIntervalRef.current = null;
        }

        if (todasLasActividades.length > 1 && !isPaused) {
            console.log('🔄 [AUTO-PLAY] Iniciando nuevo interval');
            autoPlayIntervalRef.current = setInterval(() => {
                siguienteActividadAuto();
            }, 15000);
        }
    }, [todasLasActividades.length, isPaused]);

    const siguienteActividadAuto = useCallback(() => {
        if (isPaused || !autoPlayIntervalRef.current) {
            return;
        }

        setIsChanging(true);
        setTimeout(() => {
            setActividadActual(prev => {
                if (prev < todasLasActividades.length - 1) {
                    return prev + 1;
                } else {
                    return 0;
                }
            });
            setTimeout(() => {
                setIsChanging(false);
            }, 300);
        }, 150);
    }, [isPaused, todasLasActividades.length]);

    // Efecto para actualizar ultimaActividad cuando cambia actividadActual
    useEffect(() => {
        if (todasLasActividades.length > 0) {
            setUltimaActividad(todasLasActividades[actividadActual]);
        }
    }, [actividadActual, todasLasActividades]);


    const pausarAutoPlay = () => {
        console.log('⏸️ [AUTO-PLAY] Pausando...');
        setIsPaused(true);
        if (autoPlayIntervalRef.current) {
            clearInterval(autoPlayIntervalRef.current);
            autoPlayIntervalRef.current = null;
        }
    };

    const reanudarAutoPlay = () => {
        console.log('▶️ [AUTO-PLAY] Reanudando...');
        setIsPaused(false);
        // El effect de isPaused se encargará de iniciar
    };

    const reanudarAutoPlayDespuesDe = (ms: number) => {
        console.log(`⏰ [AUTO-PLAY] Programado para reanudar en ${ms}ms`);
        setTimeout(() => {
            reanudarAutoPlay();
        }, ms);
    };

    // Efecto para manejar el auto-play basado en dependencias
    useEffect(() => {
        if (todasLasActividades.length > 1 && !isPaused) {
            iniciarAutoPlay();
        }
        return () => {
            if (autoPlayIntervalRef.current) {
                clearInterval(autoPlayIntervalRef.current);
            }
        };
    }, [todasLasActividades.length, isPaused, iniciarAutoPlay]);


    // Función para generar slug (Copiada de LandingCurso.tsx para consistencia exacta)
    const generarSlug = (texto: string): string => {
        return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    // 🎯 LÓGICA EXACTA DE "MIS CURSOS" - COPIADA COMPLETA
    const cargarUltimaActividad = async () => {
        if (!usuario?.id) {
            setCargando(false);
            return;
        }

        try {
            setCargando(true);
            console.log('🎯 [DASHBOARD] Iniciando carga con lógica de Mis Cursos');

            // PASO 1: Obtener TODAS las inscripciones (IGUAL que en Mis Cursos)
            const { data: inscripcionesData, error: inscripcionError } = await supabase
                .from('inscripciones')
                .select('*')
                .eq('usuario_id', usuario.id)
                .order('fecha_inscripcion', { ascending: false });

            if (inscripcionError) throw inscripcionError;

            if (!inscripcionesData || inscripcionesData.length === 0) {
                setUltimaActividad(null);
                setTodasLasActividades([]);
                return;
            }

            // PASO 2: Separar por tipo
            const inscripcionesCursos = inscripcionesData.filter((i: any) => i.curso_id);
            const inscripcionesTutoriales = inscripcionesData.filter((i: any) => i.tutorial_id);

            // 🚀 PASO 3-4: CONSULTAS EN PARALELO
            const [cursosResult, tutorialesResult] = await Promise.all([
                inscripcionesCursos.length > 0 ?
                    supabase
                        .from('cursos')
                        .select('id, titulo, descripcion, imagen_url, nivel, duracion_estimada, precio_normal, slug, instructor_id, categoria')
                        .in('id', inscripcionesCursos.map((i: any) => i.curso_id)) :
                    Promise.resolve({ data: [], error: null }),

                inscripcionesTutoriales.length > 0 ?
                    supabase
                        .from('tutoriales')
                        .select('id, titulo, descripcion, imagen_url, nivel, duracion_estimada, precio_normal, artista, acordeonista, tonalidad, instructor_id')
                        .in('id', inscripcionesTutoriales.map((i: any) => i.tutorial_id)) :
                    Promise.resolve({ data: [], error: null })
            ]);

            const cursosData = cursosResult.data || [];
            const tutorialesData = tutorialesResult.data || [];

            // PASO 5: Combinar inscripciones con contenido
            const inscripcionesCombinadas = [
                ...inscripcionesCursos.map((inscripcion: any) => ({
                    ...inscripcion,
                    cursos: cursosData.find((curso: any) => curso.id === inscripcion.curso_id)
                })),
                ...inscripcionesTutoriales.map((inscripcion: any) => ({
                    ...inscripcion,
                    tutoriales: tutorialesData.find((tutorial: any) => tutorial.id === inscripcion.tutorial_id)
                }))
            ];

            // PASO 6: Calcular progreso REAL
            const cursosConProgreso: any[] = [];

            for (const inscripcionCompleta of inscripcionesCombinadas.slice(0, 5)) {
                const esCurso = !!inscripcionCompleta.cursos;
                const contenido = esCurso ? inscripcionCompleta.cursos : inscripcionCompleta.tutoriales;
                const contenidoId = esCurso ? inscripcionCompleta.curso_id : inscripcionCompleta.tutorial_id;

                if (!contenido || !contenidoId) continue;

                let progresoData = { porcentaje: 0, completadas: 0, total: 0 };
                let ultimaLeccionTitulo = null;

                try {
                    if (esCurso) {
                        // 1. Obtener módulos del curso
                        const { data: modulosData } = await supabase
                            .from('modulos')
                            .select('id, titulo, orden, curso_id') // REMOVIDO: slug
                            .eq('curso_id', contenidoId)
                            .order('orden', { ascending: true });

                        if (modulosData && modulosData.length > 0) {
                            const moduloIds = modulosData.map((m: any) => m.id);

                            // 2. Obtener lecciones de esos módulos (separado para evitar error 400 en relación)
                            const { data: leccionesData } = await supabase
                                .from('lecciones')
                                .select('id, titulo, orden, modulo_id') // REMOVIDO: slug
                                .in('modulo_id', moduloIds)
                                .order('orden', { ascending: true });

                            // 3. Unificar estructura
                            const modulos = modulosData.map((m: any) => ({
                                ...m,
                                lecciones: leccionesData?.filter((l: any) => l.modulo_id === m.id) || []
                            }));

                            const leccionIds = leccionesData?.map((l: any) => l.id) || [];

                            if (leccionIds.length > 0) {
                                const { data: progreso } = await supabase
                                    .from('progreso_lecciones')
                                    .select('leccion_id, estado')
                                    .eq('usuario_id', usuario.id)
                                    .in('leccion_id', leccionIds);

                                const completadas = progreso?.filter((p: any) => p.estado === 'completada').length || 0;
                                const total = leccionIds.length;
                                const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
                                progresoData = { porcentaje, completadas, total };

                                const leccionesCompletadas = new Set(progreso?.filter((p: any) => p.estado === 'completada').map((p: any) => p.leccion_id) || []);
                                const todasLasLecciones = leccionesData || []; // Usar lecciones obtenidas
                                const siguienteLeccion = todasLasLecciones.find((l: any) => !leccionesCompletadas.has(l.id));
                                ultimaLeccionTitulo = siguienteLeccion?.titulo || null;
                            }
                        }
                    } else {
                        const { data: partes } = await supabase
                            .from('partes_tutorial')
                            .select('id, titulo, slug, orden')
                            .eq('tutorial_id', contenidoId);

                        if (partes && partes.length > 0) {
                            const { data: progreso } = await supabase
                                .from('progreso_tutorial')
                                .select('parte_tutorial_id, completado')
                                .eq('usuario_id', usuario.id)
                                .eq('tutorial_id', contenidoId);

                            const completadas = progreso?.filter((p: any) => p.completado).length || 0;
                            const total = partes.length;
                            const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
                            progresoData = { porcentaje, completadas, total };

                            const partesCompletadas = new Set(progreso?.filter((p: any) => p.completado).map((p: any) => p.parte_tutorial_id) || []);
                            const siguienteParte = partes.find((p: any) => !partesCompletadas.has(p.id));
                            ultimaLeccionTitulo = siguienteParte?.titulo || null;
                        }
                    }

                    const slugFinal = contenido.slug || generarSlug(contenido.titulo);

                    cursosConProgreso.push({
                        id: contenido.id,
                        titulo: contenido.titulo,
                        imagen_url: contenido.imagen_url,
                        slug: slugFinal,
                        porcentaje_completado: progresoData.porcentaje,
                        ultima_leccion_titulo: ultimaLeccionTitulo || (progresoData.porcentaje === 100 ? '¡Completado!' : 'Sin iniciar'),
                        instructor_id: contenido.instructor_id,
                        categoria: contenido.categoria || null,
                        tipo: esCurso ? 'curso' : 'tutorial',
                        artista: contenido.artista,
                        acordeonista: contenido.acordeonista,
                        completadas: progresoData.completadas,
                        total: progresoData.total
                    });

                } catch (error) {
                    console.error('[DASHBOARD] Error calculating progress:', error);
                }
            }

            // PASO 7: Generar TODAS las actividades
            if (cursosConProgreso.length > 0) {
                const nuevasActividades = [];

                for (const curso of cursosConProgreso) {
                    let rutaEspecifica = null;
                    let leccionTexto = curso.ultima_leccion_titulo || 'Continuar';
                    let moduloTexto = curso.tipo === 'curso' ? 'Módulo actual' : null;

                    try {
                        if (curso.tipo === 'curso') {
                            // 1. Obtener módulos
                            const { data: modulosData } = await supabase
                                .from('modulos')
                                .select('id, titulo, orden') // REMOVIDO: slug
                                .eq('curso_id', curso.id)
                                .order('orden');

                            if (modulosData && modulosData.length > 0) {
                                const moduloIds = modulosData.map((m: any) => m.id);

                                // 2. Obtener lecciones
                                const { data: leccionesData } = await supabase
                                    .from('lecciones')
                                    .select('id, titulo, orden, modulo_id') // REMOVIDO: slug
                                    .in('modulo_id', moduloIds)
                                    .order('orden');

                                // 3. Reconstruir estructura "modulos" con lecciones dentro
                                const modulos = modulosData.map((m: any) => ({
                                    ...m,
                                    lecciones: leccionesData?.filter((l: any) => l.modulo_id === m.id) || []
                                }));

                                const todasLasLecciones = leccionesData || [];
                                const { data: progresoLeccionData } = await supabase
                                    .from('progreso_lecciones')
                                    .select('leccion_id, estado, ultima_actividad')
                                    .eq('usuario_id', usuario.id)
                                    .in('leccion_id', todasLasLecciones.map((l: any) => l.id))
                                    .not('ultima_actividad', 'is', null)
                                    .order('ultima_actividad', { ascending: false })
                                    .limit(1);

                                let leccionFinal: any = null;
                                let moduloFinal: any = null;

                                if (progresoLeccionData && progresoLeccionData.length > 0) {
                                    const ultimoProgreso = progresoLeccionData[0];
                                    leccionFinal = todasLasLecciones.find((l: any) => l.id === ultimoProgreso.leccion_id);
                                    if (leccionFinal) {
                                        moduloFinal = modulos.find((m: any) => m.lecciones?.some((l: any) => l.id === leccionFinal.id));
                                    }
                                }

                                if (!leccionFinal) {
                                    for (const modulo of modulos) {
                                        const leccionPendiente = modulo.lecciones?.find((l: any) => {
                                            const progreso = progresoLeccionData?.find((p: any) => p.leccion_id === l.id);
                                            return !progreso || progreso.estado !== 'completada';
                                        });
                                        if (leccionPendiente) {
                                            leccionFinal = leccionPendiente;
                                            moduloFinal = modulo;
                                            break;
                                        }
                                    }
                                }

                                if (leccionFinal && moduloFinal) {
                                    const cursoSlug = curso.slug || generarSlug(curso.titulo);
                                    // ⚠️ IMPORTANTE: ClaseCurso.tsx fuerza la generación del slug desde el título.
                                    // Debemos hacer lo mismo aquí para que coincidan los URLs.
                                    const moduloSlug = generarSlug(moduloFinal.titulo);
                                    const leccionSlug = generarSlug(leccionFinal.titulo);

                                    rutaEspecifica = `/cursos/${cursoSlug}/${moduloSlug}/${leccionSlug}`;
                                    leccionTexto = leccionFinal.titulo;
                                    moduloTexto = moduloFinal.titulo;
                                }
                            }
                            if (!rutaEspecifica) rutaEspecifica = `/cursos/${curso.slug || generarSlug(curso.titulo)}`;

                        } else if (curso.tipo === 'tutorial') {
                            const { data: partes } = await supabase
                                .from('partes_tutorial')
                                .select('id, titulo, slug, orden')
                                .eq('tutorial_id', curso.id)
                                .order('orden');

                            if (partes && partes.length > 0) {
                                const { data: progresoTutorialData } = await supabase
                                    .from('progreso_tutorial')
                                    .select('parte_tutorial_id, completado, ultimo_acceso')
                                    .eq('usuario_id', usuario.id)
                                    .eq('tutorial_id', curso.id)
                                    .not('ultimo_acceso', 'is', null)
                                    .order('ultimo_acceso', { ascending: false })
                                    .limit(1);

                                let claseFinal: any = null;
                                if (progresoTutorialData && progresoTutorialData.length > 0) {
                                    const ultimoProgreso = progresoTutorialData[0];
                                    claseFinal = partes.find((p: any) => p.id === ultimoProgreso.parte_tutorial_id);
                                }

                                if (!claseFinal) {
                                    claseFinal = partes.find((p: any) => {
                                        const progreso = progresoTutorialData?.find((pr: any) => pr.parte_tutorial_id === p.id);
                                        return !progreso || !progreso.completado;
                                    });
                                }

                                if (claseFinal) {
                                    const tutorialSlug = curso.slug || generarSlug(curso.titulo);
                                    const claseSlug = generarSlug(claseFinal.titulo); // Force generation
                                    rutaEspecifica = `/tutoriales/${tutorialSlug}/clase/${claseSlug}`;
                                    leccionTexto = claseFinal.titulo;
                                }
                            }
                            if (!rutaEspecifica) rutaEspecifica = `/tutoriales/${curso.slug || generarSlug(curso.titulo)}`;
                        }

                        nuevasActividades.push({
                            id: curso.id,
                            tipo: curso.tipo,
                            titulo: curso.titulo,
                            leccion: leccionTexto,
                            modulo: moduloTexto,
                            artista: curso.artista,
                            acordeonista: curso.acordeonista,
                            imagen: curso.imagen_url,
                            progreso: curso.porcentaje_completado,
                            totalLecciones: curso.total,
                            leccionesCompletadas: curso.completadas,
                            totalClases: curso.total,
                            clasesCompletadas: curso.completadas,
                            ruta: rutaEspecifica,
                            ultimaActividad: new Date(inscripcionesData[0].created_at)
                        });

                    } catch (err) {
                        // Fallback
                        console.error('Error processing item for slider:', err);
                        const rutaBase = curso.tipo === 'tutorial' ? '/tutoriales' : '/cursos';
                        nuevasActividades.push({
                            id: curso.id,
                            tipo: curso.tipo,
                            titulo: curso.titulo,
                            leccion: curso.ultima_leccion_titulo || 'Continuar',
                            modulo: curso.tipo === 'curso' ? 'Módulo actual' : null,
                            artista: curso.artista,
                            acordeonista: curso.acordeonista,
                            imagen: curso.imagen_url,
                            progreso: curso.porcentaje_completado,
                            totalLecciones: curso.total,
                            leccionesCompletadas: curso.completadas,
                            totalClases: curso.total,
                            clasesCompletadas: curso.completadas,
                            ruta: `${rutaBase}/${curso.slug}`,
                            ultimaActividad: new Date(inscripcionesData[0].created_at)
                        });
                    }
                }

                setTodasLasActividades(nuevasActividades);
                setActividadActual(0);
                // ultimaActividad se setea via effect
            } else {
                setTodasLasActividades([]);
                setUltimaActividad(null);
            }

        } catch (error) {
            console.error('Error loading last activity:', error);
            setError('Error al cargar la información');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarUltimaActividad();
    }, [usuario]);


    // Funciones de control
    const anteriorActividad = () => {
        pausarAutoPlay();
        setIsChanging(true);
        setTimeout(() => {
            setActividadActual(prev => {
                if (prev > 0) return prev - 1;
                return prev; // Svelte logic: does not loop backwards on manual click effectively? "if (actividadActual > 0)"
            });
            setTimeout(() => setIsChanging(false), 300);
        }, 100);
        reanudarAutoPlayDespuesDe(10000);
    };

    const siguienteActividad = () => {
        pausarAutoPlay();
        setIsChanging(true);
        setTimeout(() => {
            setActividadActual(prev => {
                if (prev < todasLasActividades.length - 1) return prev + 1;
                return 0; // Loops
            });
            setTimeout(() => setIsChanging(false), 300);
        }, 100);
        reanudarAutoPlayDespuesDe(10000);
    };

    const irAActividad = (index: number) => {
        pausarAutoPlay();
        setIsChanging(true);
        setTimeout(() => {
            setActividadActual(index);
            setTimeout(() => setIsChanging(false), 300);
        }, 100);
        reanudarAutoPlayDespuesDe(10000);
    };

    const continuarAprendizaje = () => {
        if (ultimaActividad?.ruta) {
            navigate(ultimaActividad.ruta);
        }
    };

    return (
        <section className="academia-continuar-aprendiendo">
            {cargando ? (
                <div className="academia-hero-motivacional">
                    <div className="academia-motivacion-container">
                        <div className="academia-icono-acordeon">
                            <span className="academia-acordeon-animado">🎹</span>
                            <div className="academia-notas-musicales">
                                <span className="academia-nota">♪</span>
                                <span className="academia-nota">♫</span>
                                <span className="academia-nota">♬</span>
                            </div>
                        </div>
                        <div className="academia-mensaje-principal">
                            <h2 className="academia-titulo-bienvenida">¡Bienvenido a tu Panel de Estudiante!</h2>
                            <p className="academia-subtitulo-motivacional">Aquí podrás ver todas tus clases, retos completados y mucho más</p>
                        </div>
                        <div className="academia-caracteristicas-destacadas">
                            <div className="academia-caracteristica">
                                <span className="academia-icono-caracteristica">📚</span>
                                <span className="academia-texto-caracteristica">Tus cursos en progreso</span>
                            </div>
                            <div className="academia-caracteristica">
                                <span className="academia-icono-caracteristica">🏆</span>
                                <span className="academia-texto-caracteristica">Logros y retos</span>
                            </div>
                            <div className="academia-caracteristica">
                                <span className="academia-icono-caracteristica">🎵</span>
                                <span className="academia-texto-caracteristica">Próxima clase</span>
                            </div>
                        </div>
                        <div className="academia-indicador-carga">
                            <div className="academia-puntos-carga">
                                <span className="academia-punto"></span>
                                <span className="academia-punto"></span>
                                <span className="academia-punto"></span>
                            </div>
                            <p className="academia-texto-carga">Preparando tu experiencia de aprendizaje...</p>
                        </div>
                    </div>
                </div>
            ) : ultimaActividad && todasLasActividades.length > 0 ? (
                <div
                    className="academia-slider-container"
                    onMouseEnter={pausarAutoPlay}
                    onMouseLeave={reanudarAutoPlay}
                >
                    <div className="academia-slider-header">
                        <div className="academia-usuario-info">
                            <Avatar
                                src={usuario?.url_foto_perfil}
                                alt="Foto de perfil"
                                nombreCompleto={usuario?.nombre || 'Usuario'}
                                size="large"
                                onClick={() => navigate('/perfil')}
                            />
                            <div className="academia-saludo-usuario">
                                <span className="academia-saludo">¡Hola {usuario?.nombre || 'Estudiante'}!</span>
                                <span className="academia-submensaje">{mensajeMotivacional}</span>
                            </div>
                        </div>

                        {todasLasActividades.length > 1 && (
                            <div className="academia-navegacion-externa">
                                <button
                                    className="academia-nav-btn-external academia-nav-prev"
                                    onClick={anteriorActividad}
                                    disabled={actividadActual === 0}
                                    aria-label="Actividad anterior"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 18l-6-6 6-6" />
                                    </svg>
                                </button>

                                <span className="academia-contador-externo">
                                    {actividadActual + 1} / {todasLasActividades.length}
                                    {!isPaused && todasLasActividades.length > 1 ? (
                                        <span className="academia-auto-indicator academia-active">●</span>
                                    ) : isPaused && todasLasActividades.length > 1 ? (
                                        <span className="academia-auto-indicator academia-paused">⏸</span>
                                    ) : null}
                                </span>

                                <button
                                    className="academia-nav-btn-external academia-nav-next"
                                    onClick={siguienteActividad}
                                    disabled={actividadActual === todasLasActividades.length - 1} // Svelte logic loop is handled in function but disabled prop might prevent click? In Svelte it was "disabled={actividadActual === todasLasActividades.length - 1}". Wait, Next button shouldn't be disabled if it loops? Svelte code: "disabled={actividadActual === todasLasActividades.length - 1}". The Svelte code logic handles loop in `siguienteActividad` IF the button is clickable. If disabled, it won't click. So manual nav doesn't loop? But auto does.
                                    aria-label="Siguiente actividad"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className={`academia-hero-actividad academia-slide-content ${isChanging ? 'academia-changing' : ''}`}>
                        <div className="academia-contenido-izquierdo">
                            <div className="academia-etiqueta-continuar">
                                <span className="academia-icono">{ultimaActividad.tipo === 'curso' ? '📚' : '🎵'}</span>
                                <span>Continuar Aprendiendo</span>
                            </div>

                            <h2 className="academia-titulo-principal">{ultimaActividad.titulo}</h2>

                            <div className="academia-info-actividad">
                                {ultimaActividad.tipo === 'curso' ? (
                                    <p className="academia-descripcion">
                                        <span className="academia-modulo">📖 {ultimaActividad.modulo}</span>
                                        <span className="academia-separador">•</span>
                                        <span className="academia-leccion">🎯 {ultimaActividad.leccion}</span>
                                    </p>
                                ) : (
                                    <p className="academia-descripcion">
                                        <span className="academia-artista">🎵 {ultimaActividad.artista}</span>
                                        <span className="academia-separador">•</span>
                                        <span className="academia-leccion">🎯 {ultimaActividad.leccion}</span>
                                    </p>
                                )}

                                <div className="academia-estadisticas">
                                    <div className="academia-stat">
                                        <span className="academia-valor">{ultimaActividad.progreso}%</span>
                                        <span className="academia-label">completado</span>
                                    </div>
                                    <div className="academia-stat">
                                        <span className="academia-valor">{ultimaActividad.tipo === 'curso' ? ultimaActividad.leccionesCompletadas : ultimaActividad.clasesCompletadas}</span>
                                        <span className="academia-label">de {ultimaActividad.tipo === 'curso' ? ultimaActividad.totalLecciones : ultimaActividad.totalClases} {ultimaActividad.tipo === 'curso' ? 'lecciones' : 'clases'}</span>
                                    </div>
                                </div>

                                <div className="academia-progreso-visual">
                                    <div className="academia-barra-progreso">
                                        <div className="academia-progreso-fill" style={{ width: `${ultimaActividad.progreso}%` }}></div>
                                    </div>
                                    <span className="academia-progreso-texto">{ultimaActividad.progreso}% completado</span>
                                </div>

                                <p className="academia-ultima-sesion">
                                    Última actividad: {formatearUltimaActividad(new Date(ultimaActividad.ultimaActividad))}
                                </p>
                            </div>

                            <div className="academia-botones-container">
                                <button className="academia-boton-continuar" onClick={continuarAprendizaje}>
                                    <span className="academia-icono-play">▶️</span>
                                    <span>Continuar {ultimaActividad.tipo === 'curso' ? 'Lección' : 'Clase'}</span>
                                    <svg className="academia-icono-flecha" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </button>

                                <button className="academia-boton-mis-cursos" onClick={() => navigate('/mis-cursos')}>
                                    <span className="academia-icono-libros">📚</span>
                                    <span>Ver Todos Mis Cursos</span>
                                    <svg className="academia-icono-flecha" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="academia-contenido-derecho">
                            <div className="academia-imagen-contenedor">
                                <img
                                    src={ultimaActividad.imagen || '/images/Home/academia-vallenata-1.jpg'}
                                    alt={ultimaActividad.titulo}
                                    className="academia-imagen-curso"
                                />
                                <div className="academia-overlay-progreso">
                                    <div className="academia-progreso-circular">
                                        <div className="academia-circular-chart">
                                            <svg viewBox="0 0 36 36" className="academia-circular-chart-svg">
                                                <path className="academia-circle-bg"
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                                <path className="academia-circle"
                                                    strokeDasharray={`${ultimaActividad.progreso}, 100`}
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                            </svg>
                                            <div className="academia-percentage">{ultimaActividad.progreso}%</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {todasLasActividades.length > 1 && (
                        <div className="academia-slider-indicators">
                            {todasLasActividades.map((actividad, index) => (
                                <button
                                    key={index}
                                    className={`academia-indicator ${index === actividadActual ? 'academia-active' : ''}`}
                                    onClick={() => irAActividad(index)}
                                    aria-label={`Ir a ${actividad.titulo}`}
                                >
                                    <span className="academia-tipo-indicator">{actividad.tipo === 'curso' ? '📚' : '🎵'}</span>
                                </button>
                            ))}
                        </div>
                    )}

                </div>
            ) : (
                <div className="academia-hero-sin-actividad">
                    <div className="academia-contenido-vacio">
                        <div className="academia-icono-vacio">🎵</div>
                        <h2>¡Comienza tu viaje musical!</h2>
                        <p>Inscríbete en un curso o tutorial para empezar a aprender acordeón</p>
                        <div className="academia-botones-accion">
                            <button className="academia-boton-principal" onClick={() => navigate('/cursos')}>
                                📚 Explorar Cursos
                            </button>
                            <button className="academia-boton-secundario" onClick={() => navigate('/tutoriales')}>
                                🎵 Ver Tutoriales
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default ContinuarAprendiendo;
