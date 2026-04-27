import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../servicios/clienteSupabase';
import { useUsuario } from '../../../contextos/UsuarioContext';

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

// Generates slug identical to LandingCurso.tsx — must stay in sync
const generarSlug = (texto: string): string =>
    texto.toLowerCase().normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export function formatearUltimaActividad(fecha: Date): string {
    const diff = Date.now() - fecha.getTime();
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const dias = Math.floor(horas / 24);
    if (horas < 1) return 'Hace menos de una hora';
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
}

export function useContinuarAprendiendo() {
    const navigate = useNavigate();
    const { usuario } = useUsuario();

    const [cargando, setCargando] = useState(true);
    const [ultimaActividad, setUltimaActividad] = useState<any>(null);
    const [todasLasActividades, setTodasLasActividades] = useState<any[]>([]);
    const [actividadActual, setActividadActual] = useState(0);
    const [isChanging, setIsChanging] = useState(false);
    const mensajeRef = useRef('');

    useEffect(() => {
        mensajeRef.current = mensajesMotivacionales[Math.floor(Math.random() * mensajesMotivacionales.length)];
    }, []);

    useEffect(() => {
        if (todasLasActividades.length > 0) {
            setUltimaActividad(todasLasActividades[actividadActual]);
        }
    }, [actividadActual, todasLasActividades]);

    const cargarUltimaActividad = async () => {
        if (!usuario?.id) { setCargando(false); return; }
        try {
            setCargando(true);
            const { data: inscripcionesData, error: inscripcionError } = await supabase
                .from('inscripciones').select('*').eq('usuario_id', usuario.id)
                .order('fecha_inscripcion', { ascending: false });
            if (inscripcionError) throw inscripcionError;
            if (!inscripcionesData || inscripcionesData.length === 0) {
                setUltimaActividad(null); setTodasLasActividades([]); return;
            }

            const inscripcionesCursos = inscripcionesData.filter((i: any) => i.curso_id);
            const inscripcionesTutoriales = inscripcionesData.filter((i: any) => i.tutorial_id);

            const [cursosResult, tutorialesResult] = await Promise.all([
                inscripcionesCursos.length > 0
                    ? supabase.from('cursos').select('id, titulo, imagen_url, slug, instructor_id, categoria, artista, acordeonista').in('id', inscripcionesCursos.map((i: any) => i.curso_id))
                    : Promise.resolve({ data: [], error: null }),
                inscripcionesTutoriales.length > 0
                    ? supabase.from('tutoriales').select('id, titulo, imagen_url, instructor_id, artista, acordeonista').in('id', inscripcionesTutoriales.map((i: any) => i.tutorial_id))
                    : Promise.resolve({ data: [], error: null })
            ]);

            const cursosData = cursosResult.data || [];
            const tutorialesData = tutorialesResult.data || [];

            const inscripcionesCombinadas = [
                ...inscripcionesCursos.map((i: any) => ({ ...i, cursos: cursosData.find((c: any) => c.id === i.curso_id) })),
                ...inscripcionesTutoriales.map((i: any) => ({ ...i, tutoriales: tutorialesData.find((t: any) => t.id === i.tutorial_id) }))
            ];

            const cursosConProgreso: any[] = [];
            for (const inscripcion of inscripcionesCombinadas.slice(0, 5)) {
                const esCurso = !!inscripcion.cursos;
                const contenido = esCurso ? inscripcion.cursos : inscripcion.tutoriales;
                const contenidoId = esCurso ? inscripcion.curso_id : inscripcion.tutorial_id;
                if (!contenido || !contenidoId) continue;

                let progresoData = { porcentaje: 0, completadas: 0, total: 0 };
                let ultimaLeccionTitulo = null;

                try {
                    if (esCurso) {
                        const { data: modulosData } = await supabase.from('modulos').select('id, titulo, orden, curso_id').eq('curso_id', contenidoId).order('orden', { ascending: true });
                        if (modulosData && modulosData.length > 0) {
                            const moduloIds = modulosData.map((m: any) => m.id);
                            const { data: leccionesData } = await supabase.from('lecciones').select('id, titulo, orden, modulo_id').in('modulo_id', moduloIds).order('orden', { ascending: true });
                            const leccionIds = leccionesData?.map((l: any) => l.id) || [];
                            if (leccionIds.length > 0) {
                                const { data: progreso } = await supabase.from('progreso_lecciones').select('leccion_id, estado').eq('usuario_id', usuario.id).in('leccion_id', leccionIds);
                                const completadas = progreso?.filter((p: any) => p.estado === 'completada').length || 0;
                                const total = leccionIds.length;
                                progresoData = { porcentaje: total > 0 ? Math.round((completadas / total) * 100) : 0, completadas, total };
                                const completadasSet = new Set(progreso?.filter((p: any) => p.estado === 'completada').map((p: any) => p.leccion_id) || []);
                                ultimaLeccionTitulo = leccionesData?.find((l: any) => !completadasSet.has(l.id))?.titulo || null;
                            }
                        }
                    } else {
                        const { data: partes } = await supabase.from('partes_tutorial').select('id, titulo, slug, orden').eq('tutorial_id', contenidoId);
                        if (partes && partes.length > 0) {
                            const { data: progreso } = await supabase.from('progreso_tutorial').select('parte_tutorial_id, completado').eq('usuario_id', usuario.id).eq('tutorial_id', contenidoId);
                            const completadas = progreso?.filter((p: any) => p.completado).length || 0;
                            const total = partes.length;
                            progresoData = { porcentaje: total > 0 ? Math.round((completadas / total) * 100) : 0, completadas, total };
                            const completadasSet = new Set(progreso?.filter((p: any) => p.completado).map((p: any) => p.parte_tutorial_id) || []);
                            ultimaLeccionTitulo = partes.find((p: any) => !completadasSet.has(p.id))?.titulo || null;
                        }
                    }
                    cursosConProgreso.push({
                        id: contenido.id, titulo: contenido.titulo, imagen_url: contenido.imagen_url,
                        slug: contenido.slug || generarSlug(contenido.titulo),
                        porcentaje_completado: progresoData.porcentaje,
                        ultima_leccion_titulo: ultimaLeccionTitulo || (progresoData.porcentaje === 100 ? '¡Completado!' : 'Sin iniciar'),
                        instructor_id: contenido.instructor_id, categoria: contenido.categoria || null,
                        tipo: esCurso ? 'curso' : 'tutorial',
                        artista: contenido.artista, acordeonista: contenido.acordeonista,
                        completadas: progresoData.completadas, total: progresoData.total
                    });
                } catch { /* skip item on error */ }
            }

            if (cursosConProgreso.length > 0) {
                const nuevasActividades: any[] = [];
                for (const curso of cursosConProgreso) {
                    let rutaEspecifica: string | null = null;
                    let leccionTexto = curso.ultima_leccion_titulo || 'Continuar';
                    let moduloTexto = curso.tipo === 'curso' ? 'Módulo actual' : null;

                    try {
                        if (curso.tipo === 'curso') {
                            const { data: modulosData } = await supabase.from('modulos').select('id, titulo, orden').eq('curso_id', curso.id).order('orden');
                            if (modulosData && modulosData.length > 0) {
                                const moduloIds = modulosData.map((m: any) => m.id);
                                const { data: leccionesData } = await supabase.from('lecciones').select('id, titulo, orden, modulo_id').in('modulo_id', moduloIds).order('orden');
                                const modulos = modulosData.map((m: any) => ({ ...m, lecciones: leccionesData?.filter((l: any) => l.modulo_id === m.id) || [] }));
                                const todasLasLecciones = leccionesData || [];
                                const { data: progresoLeccionData } = await supabase.from('progreso_lecciones').select('leccion_id, estado, ultima_actividad').eq('usuario_id', usuario.id).in('leccion_id', todasLasLecciones.map((l: any) => l.id)).not('ultima_actividad', 'is', null).order('ultima_actividad', { ascending: false }).limit(1);
                                let leccionFinal: any = null;
                                let moduloFinal: any = null;
                                if (progresoLeccionData && progresoLeccionData.length > 0) {
                                    leccionFinal = todasLasLecciones.find((l: any) => l.id === progresoLeccionData[0].leccion_id);
                                    if (leccionFinal) moduloFinal = modulos.find((m: any) => m.lecciones?.some((l: any) => l.id === leccionFinal.id));
                                }
                                if (!leccionFinal) {
                                    for (const modulo of modulos) {
                                        const pendiente = modulo.lecciones?.find((l: any) => {
                                            const p = progresoLeccionData?.find((x: any) => x.leccion_id === l.id);
                                            return !p || p.estado !== 'completada';
                                        });
                                        if (pendiente) { leccionFinal = pendiente; moduloFinal = modulo; break; }
                                    }
                                }
                                if (leccionFinal && moduloFinal) {
                                    rutaEspecifica = `/cursos/${generarSlug(curso.titulo)}/${generarSlug(moduloFinal.titulo)}/${generarSlug(leccionFinal.titulo)}`;
                                    leccionTexto = leccionFinal.titulo;
                                    moduloTexto = moduloFinal.titulo;
                                }
                            }
                            if (!rutaEspecifica) rutaEspecifica = `/cursos/${curso.slug || generarSlug(curso.titulo)}`;
                        } else {
                            const { data: partes } = await supabase.from('partes_tutorial').select('id, titulo, slug, orden').eq('tutorial_id', curso.id).order('orden');
                            if (partes && partes.length > 0) {
                                const { data: progresoTutorialData } = await supabase.from('progreso_tutorial').select('parte_tutorial_id, completado, ultimo_acceso').eq('usuario_id', usuario.id).eq('tutorial_id', curso.id).not('ultimo_acceso', 'is', null).order('ultimo_acceso', { ascending: false }).limit(1);
                                let claseFinal: any = progresoTutorialData?.length > 0 ? partes.find((p: any) => p.id === progresoTutorialData[0].parte_tutorial_id) : null;
                                if (!claseFinal) claseFinal = partes.find((p: any) => { const pr = progresoTutorialData?.find((x: any) => x.parte_tutorial_id === p.id); return !pr || !pr.completado; });
                                if (claseFinal) {
                                    rutaEspecifica = `/tutoriales/${curso.slug || generarSlug(curso.titulo)}/clase/${generarSlug(claseFinal.titulo)}`;
                                    leccionTexto = claseFinal.titulo;
                                }
                            }
                            if (!rutaEspecifica) rutaEspecifica = `/tutoriales/${curso.slug || generarSlug(curso.titulo)}`;
                        }
                        nuevasActividades.push({
                            id: curso.id, tipo: curso.tipo, titulo: curso.titulo,
                            leccion: leccionTexto, modulo: moduloTexto,
                            artista: curso.artista, acordeonista: curso.acordeonista,
                            imagen: curso.imagen_url, progreso: curso.porcentaje_completado,
                            totalLecciones: curso.total, leccionesCompletadas: curso.completadas,
                            totalClases: curso.total, clasesCompletadas: curso.completadas,
                            ruta: rutaEspecifica, ultimaActividad: new Date(inscripcionesData[0].created_at)
                        });
                    } catch {
                        const rutaBase = curso.tipo === 'tutorial' ? '/tutoriales' : '/cursos';
                        nuevasActividades.push({
                            id: curso.id, tipo: curso.tipo, titulo: curso.titulo,
                            leccion: curso.ultima_leccion_titulo || 'Continuar',
                            modulo: curso.tipo === 'curso' ? 'Módulo actual' : null,
                            artista: curso.artista, acordeonista: curso.acordeonista,
                            imagen: curso.imagen_url, progreso: curso.porcentaje_completado,
                            totalLecciones: curso.total, leccionesCompletadas: curso.completadas,
                            totalClases: curso.total, clasesCompletadas: curso.completadas,
                            ruta: `${rutaBase}/${curso.slug}`,
                            ultimaActividad: new Date(inscripcionesData[0].created_at)
                        });
                    }
                }
                setTodasLasActividades(nuevasActividades);
                setActividadActual(0);
            } else {
                setTodasLasActividades([]);
                setUltimaActividad(null);
            }
        } catch {
            // data stays empty — no error UI needed
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarUltimaActividad(); }, [usuario]);

    const anteriorActividad = () => {
        setIsChanging(true);
        setTimeout(() => {
            setActividadActual(prev => prev > 0 ? prev - 1 : prev);
            setTimeout(() => setIsChanging(false), 300);
        }, 100);
    };

    const siguienteActividad = () => {
        setIsChanging(true);
        setTimeout(() => {
            setActividadActual(prev => prev < todasLasActividades.length - 1 ? prev + 1 : 0);
            setTimeout(() => setIsChanging(false), 300);
        }, 100);
    };

    const irAActividad = (index: number) => {
        setIsChanging(true);
        setTimeout(() => {
            setActividadActual(index);
            setTimeout(() => setIsChanging(false), 300);
        }, 100);
    };

    const continuarAprendizaje = () => {
        if (ultimaActividad?.ruta) navigate(ultimaActividad.ruta);
    };

    return {
        cargando, ultimaActividad, todasLasActividades, actividadActual, isChanging,
        mensajeMotivacional: mensajeRef.current,
        anteriorActividad, siguienteActividad, irAActividad, continuarAprendizaje
    };
}
