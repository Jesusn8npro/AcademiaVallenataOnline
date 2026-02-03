import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../../servicios/supabaseCliente';
import { useUsuario } from '../../contextos/UsuarioContext';

// Importar plantillas
import VistaPremium from '../../componentes/PlantillasLandingCursos/VistaPremium';
import SkeletonLanding from '../../componentes/Skeletons/SkeletonLanding';
// import VistaClasica from '../../componentes/PlantillasLandingCursos/VistaClasica';
// import VistaMinimal from '../../componentes/PlantillasLandingCursos/VistaMinimal';
// import VistaVideoHero from '../../componentes/PlantillasLandingCursos/VistaVideoHero';

// Interfaces
export interface Modulo {
    id: string;
    titulo: string;
    descripcion: string;
    orden: number;
    slug: string;
    lecciones?: Leccion[];
}

export interface Leccion {
    id: string;
    titulo: string;
    slug: string;
    orden: number;
}

export interface Contenido {
    id: string;
    titulo: string;
    slug: string;
    descripcion: string;
    descripcion_corta: string;
    imagen_url: string;
    categoria: string;
    nivel: string;
    precio_normal: number;
    precio_rebajado: number;
    fecha_expiracion: string;
    tipo_acceso: 'gratuito' | 'pago' | 'premium';
    plantilla_vista: 'premium' | 'clasica' | 'minimal' | 'video_hero';
    objetivos: string[] | string;
    estudiantes_inscritos: number;
    testimonio: string;
    autor_testimonio: string;
    instructor_id: string;
    modulos_preview: Modulo[];
    tipo: 'curso' | 'tutorial';
    modulos?: Modulo[];
    lecciones_sueltas?: Leccion[];
}

export interface DatosVista {
    contenido: Contenido;
    estaInscrito: boolean;
    instructor?: {
        full_name: string;
        avatar_url: string;
    };
}

const LandingCurso = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { usuario } = useUsuario();

    // Estados
    const [contenido, setContenido] = useState<Contenido | null>(null);
    const [estaInscrito, setEstaInscrito] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);
    const [instructorInfo, setInstructorInfo] = useState<{ full_name?: string; avatar_url?: string } | null>(null);

    // Registro de plantillas disponibles
    const plantillas = {
        'premium': VistaPremium,
        // 'clasica': VistaClasica,
        // 'minimal': VistaMinimal,
        // 'video_hero': VistaVideoHero,
    };

    // Función para generar slug
    const generarSlug = (texto: string): string => {
        return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    // Cargar contenido
    useEffect(() => {
        if (slug) {
            cargarContenido();
        }
    }, [slug]);

    // Verificar inscripción cuando cambie el usuario o el contenido
    useEffect(() => {
        if (usuario && contenido) {
            verificarInscripcion();
        }
    }, [usuario, contenido]);

    // Cargar información del instructor
    useEffect(() => {
        if (contenido?.instructor_id) {
            cargarInstructor();
        }
    }, [contenido]);

    const cargarContenido = async () => {
        try {
            setCargando(true);
            setError(false);

            // Detectar si es curso o tutorial por la URL
            const esCurso = window.location.pathname.includes('/cursos/');
            const esTutorial = window.location.pathname.includes('/tutoriales/');

            // Si es curso, solo buscar en cursos
            if (esCurso) {
                const { data: curso, error: errorCurso } = await supabase
                    .from('cursos')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (curso && !errorCurso) {
                    // Cargar módulos Y lecciones al mismo tiempo (Nested Query)
                    const { data: modulos } = await supabase
                        .from('modulos')
                        .select('id, titulo, descripcion, orden') // Removido 'slug' que no existe en DB
                        .eq('curso_id', curso.id)
                        .order('orden');

                    // Cargar lecciones por separado y generar slugs
                    const modulosConLecciones = await Promise.all((modulos || []).map(async (modulo) => {
                        const { data: lecciones } = await supabase
                            .from('lecciones')
                            .select('id, titulo, orden') // Removido 'slug'
                            .eq('modulo_id', modulo.id)
                            .order('orden');

                        return {
                            ...modulo,
                            slug: generarSlug(modulo.titulo),
                            lecciones: (lecciones || []).map(l => ({
                                ...l,
                                slug: generarSlug(l.titulo)
                            })).sort((a, b) => a.orden - b.orden)
                        };
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

            // Si es tutorial, solo buscar en tutoriales
            if (esTutorial) {
                const { data: tutoriales, error: errorTutoriales } = await supabase
                    .from('tutoriales')
                    .select('*');

                if (tutoriales && !errorTutoriales) {
                    // Buscar el tutorial que coincida con el slug
                    const tutorial = tutoriales.find((t: any) => generarSlug(t.titulo) === slug);

                    if (tutorial) {
                        // Cargar partes/clases del tutorial
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
            }

            // Si no se encontró el contenido
            setError(true);
            setCargando(false);

        } catch (err) {
            console.error('Error cargando contenido:', err);
            setError(true);
            setCargando(false);
        }
    };

    const verificarInscripcion = async () => {
        if (!usuario || !contenido) return;

        try {
            const tabla = contenido.tipo === 'curso' ? 'inscripciones' : 'inscripciones';
            const campo = contenido.tipo === 'curso' ? 'curso_id' : 'tutorial_id';

            const { data } = await supabase
                .from(tabla)
                .select('id')
                .eq('usuario_id', usuario.id)
                .eq(campo, contenido.id)
                .maybeSingle();

            setEstaInscrito(!!data);
        } catch (err) {
            console.error('Error verificando inscripción:', err);
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
                setInstructorInfo({
                    full_name: data.nombre,
                    avatar_url: data.url_foto_perfil
                });
            }
        } catch (err) {
            console.error('Error cargando instructor:', err);
        }
    };

    const manejarInscripcion = async () => {
        if (!usuario) {
            navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
            return;
        }

        if (!contenido) return;

        try {
            const tabla = contenido.tipo === 'curso' ? 'inscripciones' : 'inscripciones';
            const campo = contenido.tipo === 'curso' ? 'curso_id' : 'tutorial_id';

            const { error } = await supabase
                .from(tabla)
                .insert({
                    usuario_id: usuario.id,
                    [campo]: contenido.id,
                    fecha_inscripcion: new Date().toISOString()
                });

            if (error) throw error;

            setEstaInscrito(true);
            verContenido();

        } catch (err) {
            console.error('Error al inscribirse:', err);
            alert('Hubo un error al inscribirse. Por favor intenta nuevamente.');
        }
    };

    const verContenido = () => {
        console.log('Ejecutando verContenido', contenido);
        if (!contenido) return;

        if (contenido.tipo === 'curso') {
            // Buscar módulos y lecciones
            const modulos = contenido.modulos || contenido.modulos_preview || [];
            console.log('Módulos encontrados:', modulos);
            const primerModulo = modulos.find((m: Modulo) => m.lecciones && m.lecciones.length > 0);
            console.log('Primer módulo con lecciones:', primerModulo);
            const leccionesSueltas = contenido.lecciones_sueltas || [];

            if (primerModulo && primerModulo.lecciones && primerModulo.lecciones.length > 0) {
                const cursoSlug = contenido.slug || generarSlug(contenido.titulo);
                const moduloSlug = primerModulo.slug || generarSlug(primerModulo.titulo);
                const leccionSlug = primerModulo.lecciones[0].slug || generarSlug(primerModulo.lecciones[0].titulo);
                navigate(`/cursos/${cursoSlug}/${moduloSlug}/${leccionSlug}`);
                return;
            } else if (leccionesSueltas.length > 0) {
                const primeraLeccion = leccionesSueltas[0];
                const cursoSlug = contenido.slug || generarSlug(contenido.titulo);
                const leccionSlug = primeraLeccion.slug || generarSlug(primeraLeccion.titulo);
                navigate(`/cursos/${cursoSlug}/leccion/${leccionSlug}`);
                return;
            } else {
                alert('Este curso no tiene lecciones disponibles.');
                return;
            }
        }

        // Lógica para tutorial
        if (contenido.tipo === 'tutorial' && contenido.modulos_preview && contenido.modulos_preview.length > 0) {
            const tutorialSlug = generarSlug(contenido.titulo);
            const primeraClase = contenido.modulos_preview[0];
            const claseSlug = generarSlug(primeraClase.titulo);
            navigate(`/tutoriales/${tutorialSlug}/clase/${claseSlug}`);
            return;
        }

        alert('No se encontró la primera lección o clase.');
    };

    // Renderizado
    if (cargando) {
        return <SkeletonLanding />;
    }

    if (error || !contenido) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: '#000',
                color: '#fff',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <h2>Contenido no encontrado</h2>
                <p>El curso o tutorial que buscas no existe.</p>
                <button
                    onClick={() => navigate('/cursos')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: '#8b5cf6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer'
                    }}
                >
                    Volver a Cursos
                </button>
            </div>
        );
    }

    // Determinar qué plantilla usar
    const Vista = plantillas[contenido.plantilla_vista as keyof typeof plantillas] || VistaPremium;

    return (
        <Vista
            data={{
                contenido,
                estaInscrito,
                instructor: instructorInfo ? {
                    full_name: instructorInfo.full_name || '',
                    avatar_url: instructorInfo.avatar_url || ''
                } : undefined
            }}
            handleInscripcion={manejarInscripcion}
            verContenido={verContenido}
            irAPrimeraClase={verContenido}
        />
    );
};

export default LandingCurso;
