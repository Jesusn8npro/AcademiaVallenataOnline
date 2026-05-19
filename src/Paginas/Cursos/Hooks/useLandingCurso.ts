'use client';

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@/compat/router';
import { supabase } from '../../../servicios/clienteSupabase';
import { generarSlug } from '../../../utilidades/slug';
import { useUsuario } from '../../../contextos/UsuarioContext';
import VistaPremium from '../../../componentes/PlantillasLandingCursos/VistaPremium';
import type { Contenido, Modulo } from '../tipos';

const plantillas = {
    'premium': VistaPremium,
};

export function useLandingCurso() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { usuario } = useUsuario();

    const [contenido, setContenido] = useState<Contenido | null>(null);
    const [estaInscrito, setEstaInscrito] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);
    const [errorAccion, setErrorAccion] = useState('');
    const [instructorInfo, setInstructorInfo] = useState<{ full_name?: string; avatar_url?: string } | null>(null);

    useEffect(() => {
        if (slug) cargarContenido();
    }, [slug]);

    useEffect(() => {
        if (usuario && contenido) verificarInscripcion();
    }, [usuario, contenido]);

    useEffect(() => {
        if (contenido?.instructor_id) cargarInstructor();
    }, [contenido]);

    const cargarContenido = async () => {
        try {
            setCargando(true);
            setError(false);

            const esCurso = window.location.pathname.includes('/cursos/');
            const esTutorial = window.location.pathname.includes('/tutoriales/');

            // UUID detection: las notificaciones llegan con id en lugar de slug.
            const esUUID = !!slug && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

            if (esCurso) {
                let { data: curso, error: errorCurso } = await supabase
                    .from('cursos')
                    .select('*')
                    .eq(esUUID ? 'id' : 'slug', slug)
                    .single();

                if (curso && !errorCurso) {
                    const { data: modulos } = await supabase
                        .from('modulos')
                        .select('id, titulo, descripcion, orden')
                        .eq('curso_id', curso.id)
                        .order('orden');

                    // Batch: una sola query para todas las lecciones (evita N+1)
                    const moduloIds = (modulos || []).map((m: any) => m.id);
                    const { data: todasLecciones } = moduloIds.length > 0
                        ? await supabase.from('lecciones').select('id, titulo, orden, modulo_id').in('modulo_id', moduloIds).order('orden')
                        : { data: [] as any[] };

                    const leccPorModulo = ((todasLecciones || []) as any[]).reduce((acc: Record<string, any[]>, l: any) => {
                        if (!acc[l.modulo_id]) acc[l.modulo_id] = [];
                        acc[l.modulo_id].push(l);
                        return acc;
                    }, {});

                    const modulosConLecciones = (modulos || []).map((modulo: any) => ({
                        ...modulo,
                        slug: generarSlug(modulo.titulo),
                        lecciones: (leccPorModulo[modulo.id] || []).map((l: any) => ({
                            ...l,
                            slug: generarSlug(l.titulo)
                        })).sort((a: any, b: any) => a.orden - b.orden)
                    }));

                    setContenido({
                        ...curso,
                        tipo: 'curso',
                        modulos: modulosConLecciones,
                        modulos_preview: modulosConLecciones
                    });
                    setCargando(false);
                    return;
                }
            }

            if (esTutorial) {
                // Si la URL trae UUID (notificaciones), buscar directo por id (rapido).
                if (esUUID) {
                    const { data: tutorial } = await supabase
                        .from('tutoriales').select('*').eq('id', slug).maybeSingle();
                    if (tutorial) {
                        const { data: partes } = await supabase
                            .from('partes_tutorial')
                            .select('id, titulo, descripcion, orden, slug')
                            .eq('tutorial_id', tutorial.id)
                            .order('orden');
                        setContenido({ ...tutorial, tipo: 'tutorial', modulos_preview: partes || [] });
                        setCargando(false);
                        return;
                    }
                }

                // Buscar por slug directo (evita cargar toda la tabla)
                const { data: tutorial, error: errorTutoriales } = await supabase
                    .from('tutoriales')
                    .select('*')
                    .eq('slug', slug)
                    .maybeSingle();

                if (tutorial && !errorTutoriales) {
                    const { data: partes } = await supabase
                        .from('partes_tutorial')
                        .select('id, titulo, descripcion, orden, slug')
                        .eq('tutorial_id', tutorial.id)
                        .order('orden');

                    setContenido({
                        ...tutorial,
                        tipo: 'tutorial',
                        modulos_preview: partes || []
                    });
                    setCargando(false);
                    return;
                }
            }

            setError(true);
            setCargando(false);
        } catch {
            setError(true);
            setCargando(false);
        }
    };

    const verificarInscripcion = async () => {
        if (!usuario || !contenido) return;
        try {
            const campo = contenido.tipo === 'curso' ? 'curso_id' : 'tutorial_id';
            const { data } = await supabase
                .from('inscripciones')
                .select('id')
                .eq('usuario_id', usuario.id)
                .eq(campo, contenido.id)
                .maybeSingle();
            setEstaInscrito(!!data);
        } catch {
            setEstaInscrito(false);
        }
    };

    const cargarInstructor = async () => {
        if (!contenido?.instructor_id) return;
        try {
            const { data } = await supabase
                .from('perfiles')
                .select('nombre, url_foto_perfil')
                .eq('id', contenido.instructor_id)
                .single();
            if (data) {
                setInstructorInfo({ full_name: data.nombre, avatar_url: data.url_foto_perfil });
            }
        } catch {
            // error no fatal
        }
    };

    const manejarInscripcion = async () => {
        if (!usuario) {
            navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
            return;
        }
        if (!contenido) return;
        try {
            const campo = contenido.tipo === 'curso' ? 'curso_id' : 'tutorial_id';
            const { error } = await supabase
                .from('inscripciones')
                .insert({ usuario_id: usuario.id, [campo]: contenido.id, fecha_inscripcion: new Date().toISOString() });
            if (error) throw error;
            setEstaInscrito(true);
            verContenido();
        } catch {
            setErrorAccion('Hubo un error al inscribirse. Por favor intenta nuevamente.');
        }
    };

    const verContenido = () => {
        if (!contenido) return;

        if (contenido.tipo === 'curso') {
            const modulos = contenido.modulos || contenido.modulos_preview || [];
            const primerModulo = modulos.find((m: Modulo) => m.lecciones && m.lecciones.length > 0);
            const leccionesSueltas = contenido.lecciones_sueltas || [];

            if (primerModulo && primerModulo.lecciones && primerModulo.lecciones.length > 0) {
                const cursoSlug = contenido.slug || generarSlug(contenido.titulo);
                const moduloSlug = primerModulo.slug || generarSlug(primerModulo.titulo);
                const leccionSlug = primerModulo.lecciones[0].slug || generarSlug(primerModulo.lecciones[0].titulo);
                navigate(`/cursos/${cursoSlug}/${moduloSlug}/${leccionSlug}`);
            } else if (leccionesSueltas.length > 0) {
                const cursoSlug = contenido.slug || generarSlug(contenido.titulo);
                const leccionSlug = leccionesSueltas[0].slug || generarSlug(leccionesSueltas[0].titulo);
                navigate(`/cursos/${cursoSlug}/leccion/${leccionSlug}`);
            } else {
                setErrorAccion('Este curso no tiene lecciones disponibles.');
            }
            return;
        }

        if (contenido.tipo === 'tutorial' && contenido.modulos_preview?.length > 0) {
            const tutorialSlug = generarSlug(contenido.titulo);
            const claseSlug = generarSlug(contenido.modulos_preview[0].titulo);
            navigate(`/tutoriales/${tutorialSlug}/clase/${claseSlug}`);
            return;
        }

        setErrorAccion('No se encontró la primera lección o clase.');
    };

    const irACursos = () => navigate('/cursos');

    const Vista = plantillas[contenido?.plantilla_vista as keyof typeof plantillas] || VistaPremium;

    return {
        cargando,
        error,
        errorAccion,
        contenido,
        estaInscrito,
        instructorInfo,
        manejarInscripcion,
        verContenido,
        irACursos,
        Vista,
    };
}
