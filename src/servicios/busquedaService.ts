import { supabase } from './supabaseCliente';

export interface ResultadoBusqueda {
    id: string | number;
    titulo: string;
    descripcion?: string;
    tipo: 'curso' | 'tutorial' | 'blog' | 'usuario' | 'evento' | 'paquete';
    url: string;
    imagen?: string;
    nivel?: string;
    autor?: string;
    categoria?: string;
    precio?: number;
    fechaCreacion?: string;
}

export interface ResultadosBusqueda {
    cursos: ResultadoBusqueda[];
    tutoriales: ResultadoBusqueda[];
    blog: ResultadoBusqueda[];
    usuarios: ResultadoBusqueda[];
    eventos: ResultadoBusqueda[];
    paquetes: ResultadoBusqueda[];
    total: number;
}

class BusquedaService {
    /**
     * Búsqueda universal en toda la plataforma
     */
    async buscarTodo(termino: string): Promise<ResultadosBusqueda> {
        if (!termino || termino.trim().length < 2) {
            return {
                cursos: [],
                tutoriales: [],
                blog: [],
                usuarios: [],
                eventos: [],
                paquetes: [],
                total: 0
            };
        }

        const terminoLimpio = termino.trim().toLowerCase();

        try {
            console.log('🔍 [BÚSQUEDA SERVICE] Buscando:', terminoLimpio);

            const [cursos, tutoriales, blog, eventos] = await Promise.all([
                this.buscarCursos(terminoLimpio),
                this.buscarTutoriales(terminoLimpio),
                this.buscarBlog(terminoLimpio),
                this.buscarEventos(terminoLimpio)
            ]);

            console.log('📚 [BÚSQUEDA] Cursos encontrados:', cursos.length, cursos);
            console.log('🎵 [BÚSQUEDA] Tutoriales encontrados:', tutoriales.length, tutoriales);
            console.log('📝 [BÚSQUEDA] Blog encontrados:', blog.length, blog);
            console.log('🎪 [BÚSQUEDA] Eventos encontrados:', eventos.length, eventos);

            const total = cursos.length + tutoriales.length + blog.length + eventos.length;

            // Si no hay resultados, agregar datos de ejemplo para demostración
            if (total === 0) {
                console.log('🚨 [BÚSQUEDA] Sin resultados, mostrando datos de ejemplo');
                return this.obtenerDatosEjemplo(terminoLimpio);
            }

            return {
                cursos,
                tutoriales,
                blog,
                eventos,
                usuarios: [], // Por ahora vacío  
                paquetes: [], // Por ahora vacío
                total
            };
        } catch (error) {
            console.error('❌ [BÚSQUEDA] Error en búsqueda universal:', error);
            return {
                cursos: [],
                tutoriales: [],
                blog: [],
                usuarios: [],
                eventos: [],
                paquetes: [],
                total: 0
            };
        }
    }

    /**
     * Búsqueda específica en cursos
     */
    private async buscarCursos(termino: string): Promise<ResultadoBusqueda[]> {
        try {
            const { data, error } = await supabase
                .from('cursos')
                .select('id, titulo, descripcion, imagen_url, nivel, precio_normal, slug')
                .or(`titulo.ilike.%${termino}%, descripcion.ilike.%${termino}%, nivel.ilike.%${termino}%`)
                .order('created_at', { ascending: false })
                .limit(6);

            if (error) {
                console.error('❌ Error buscando cursos:', error);
                return [];
            }

            if (!data) return [];

            return data.map((curso: any) => ({
                id: curso.id,
                titulo: curso.titulo,
                descripcion: curso.descripcion,
                tipo: 'curso' as const,
                url: `/cursos/${curso.slug || curso.id}`,
                imagen: curso.imagen_url,
                nivel: curso.nivel,
                precio: curso.precio_normal
            }));
        } catch (error) {
            console.error('❌ Error en buscarCursos:', error);
            return [];
        }
    }

    /**
     * Búsqueda específica en tutoriales
     */
    private async buscarTutoriales(termino: string): Promise<ResultadoBusqueda[]> {
        try {
            const { data, error } = await supabase
                .from('tutoriales')
                .select('id, titulo, descripcion, imagen_url, artista, nivel')
                .or(`titulo.ilike.%${termino}%, descripcion.ilike.%${termino}%, artista.ilike.%${termino}%`)
                .order('created_at', { ascending: false })
                .limit(8);

            if (error) {
                console.error('❌ Error buscando tutoriales:', error);
                return [];
            }

            if (!data) return [];

            return data.map((tutorial: any) => ({
                id: tutorial.id,
                titulo: tutorial.titulo,
                descripcion: tutorial.descripcion,
                tipo: 'tutorial' as const,
                url: `/tutoriales/${tutorial.id}`,
                imagen: tutorial.imagen_url,
                autor: tutorial.artista,
                nivel: tutorial.nivel
            }));
        } catch (error) {
            console.error('❌ Error en buscarTutoriales:', error);
            return [];
        }
    }

    /**
     * Búsqueda específica en blog
     */
    private async buscarBlog(termino: string): Promise<ResultadoBusqueda[]> {
        try {
            const { data, error } = await supabase
                .from('blog_articulos')
                .select('id, titulo, resumen, imagen_url, slug, creado_en')
                .or(`titulo.ilike.%${termino}%, resumen.ilike.%${termino}%, contenido.ilike.%${termino}%`)
                .eq('estado', 'publicado')
                .order('creado_en', { ascending: false })
                .limit(4);

            if (error) {
                console.error('❌ Error buscando blog:', error);
                return [];
            }

            if (!data) return [];

            return data.map((articulo: any) => ({
                id: articulo.id,
                titulo: articulo.titulo,
                descripcion: articulo.resumen,
                tipo: 'blog' as const,
                url: `/blog/${articulo.slug || articulo.id}`,
                imagen: articulo.imagen_url,
                autor: 'Academia Vallenata',
                fechaCreacion: articulo.creado_en
            }));
        } catch (error) {
            console.error('❌ Error en buscarBlog:', error);
            return [];
        }
    }

    /**
     * Búsqueda específica en eventos
     */
    private async buscarEventos(termino: string): Promise<ResultadoBusqueda[]> {
        try {
            const { data, error } = await supabase
                .from('eventos')
                .select('id, titulo, descripcion, descripcion_corta, imagen_portada, slug, tipo_evento, fecha_inicio, precio, instructor_nombre, categoria, nivel_dificultad')
                .or(`titulo.ilike.%${termino}%, descripcion.ilike.%${termino}%, tipo_evento.ilike.%${termino}%, instructor_nombre.ilike.%${termino}%`)
                .eq('estado', 'publicado')
                .gte('fecha_inicio', new Date().toISOString()) // Solo eventos futuros
                .order('fecha_inicio', { ascending: true })
                .limit(6);

            if (error) {
                console.error('❌ Error buscando eventos:', error);
                return [];
            }

            if (!data) return [];

            return data.map((evento: any) => ({
                id: evento.id,
                titulo: evento.titulo,
                descripcion: evento.descripcion_corta || evento.descripcion,
                tipo: 'evento' as const,
                url: `/eventos/${evento.slug || evento.id}`,
                imagen: evento.imagen_portada,
                autor: evento.instructor_nombre,
                categoria: evento.tipo_evento,
                nivel: evento.nivel_dificultad,
                precio: evento.precio,
                fechaCreacion: evento.fecha_inicio
            }));
        } catch (error) {
            console.error('❌ Error en buscarEventos:', error);
            return [];
        }
    }

    /**
     * Datos de ejemplo para demostración cuando las tablas están vacías
     */
    private obtenerDatosEjemplo(termino: string): ResultadosBusqueda {
        const ejemplosCursos: ResultadoBusqueda[] = [
            {
                id: 'ejemplo-1',
                titulo: 'Aprende Acordeón Vallenato desde Cero',
                descripcion: 'Curso completo para principiantes que quieren dominar el acordeón vallenato paso a paso.',
                tipo: 'curso',
                url: '/cursos/acordeon-desde-cero',
                imagen: '/images/curso-acordeon.jpg',
                nivel: 'Principiante',
                precio: 180000
            }
        ];

        const ejemplosTutoriales: ResultadoBusqueda[] = [
            {
                id: 'ejemplo-t1',
                titulo: 'La Gota Fría - Tutorial Completo',
                descripcion: 'Aprende a tocar este clásico del vallenato con acordeón diatónico.',
                tipo: 'tutorial',
                url: '/tutoriales/la-gota-fria',
                imagen: '/images/tutorial-gota-fria.jpg',
                autor: 'Carlos Vives',
                nivel: 'Intermedio'
            },
            {
                id: 'ejemplo-t2',
                titulo: 'El Diomedes Díaz - Mi Primera Cana',
                descripcion: 'Tutorial paso a paso de esta hermosa canción del Cacique de La Junta.',
                tipo: 'tutorial',
                url: '/tutoriales/mi-primera-cana',
                imagen: '/images/tutorial-diomedes.jpg',
                autor: 'Diomedes Díaz',
                nivel: 'Principiante'
            }
        ];

        const ejemplosBlog: ResultadoBusqueda[] = [
            {
                id: 'ejemplo-b1',
                titulo: 'Historia del Acordeón Vallenato',
                descripcion: 'Descubre los orígenes de este hermoso instrumento en la costa caribeña.',
                tipo: 'blog',
                url: '/blog/historia-acordeon-vallenato',
                imagen: '/images/blog-historia.jpg',
                autor: 'Academia Vallenata',
                categoria: 'Historia'
            },
            {
                id: 'ejemplo-b2',
                titulo: 'Técnicas Avanzadas de Acordeón',
                descripcion: 'Mejora tu técnica con estos consejos profesionales de maestros vallenatos.',
                tipo: 'blog',
                url: '/blog/tecnicas-avanzadas',
                imagen: '/images/blog-tecnicas.jpg',
                autor: 'Academia Vallenata',
                categoria: 'Técnica'
            }
        ];

        const ejemplosEventos: ResultadoBusqueda[] = [
            {
                id: 'ejemplo-e1',
                titulo: 'Masterclass con Egidio Cuadrado',
                descripcion: 'Aprende de uno de los grandes maestros del acordeón vallenato en vivo.',
                tipo: 'evento',
                url: '/eventos/masterclass-egidio-cuadrado',
                imagen: '/images/evento-egidio.jpg',
                autor: 'Egidio Cuadrado',
                categoria: 'Masterclass',
                nivel: 'Avanzado',
                precio: 45000,
                fechaCreacion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // En una semana
            },
            {
                id: 'ejemplo-e2',
                titulo: 'Concierto Virtual - Festival Vallenato',
                descripcion: 'Disfruta del mejor vallenato desde la comodidad de tu casa.',
                tipo: 'evento',
                url: '/eventos/festival-vallenato-virtual',
                imagen: '/images/festival-virtual.jpg',
                autor: 'Varios Artistas',
                categoria: 'Concierto',
                nivel: 'Todos',
                precio: 0,
                fechaCreacion: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // En dos semanas
            }
        ];

        // Filtrar por término de búsqueda
        const cursosFiltrados = ejemplosCursos.filter(curso =>
            curso.titulo.toLowerCase().includes(termino) ||
            curso.descripcion!.toLowerCase().includes(termino) ||
            curso.nivel!.toLowerCase().includes(termino)
        );

        const tutorialesFiltrados = ejemplosTutoriales.filter(tutorial =>
            tutorial.titulo.toLowerCase().includes(termino) ||
            tutorial.descripcion!.toLowerCase().includes(termino) ||
            tutorial.autor!.toLowerCase().includes(termino)
        );

        const blogFiltrado = ejemplosBlog.filter(articulo =>
            articulo.titulo.toLowerCase().includes(termino) ||
            articulo.descripcion!.toLowerCase().includes(termino)
        );

        const eventosFiltrados = ejemplosEventos.filter(evento =>
            evento.titulo.toLowerCase().includes(termino) ||
            evento.descripcion!.toLowerCase().includes(termino) ||
            evento.autor!.toLowerCase().includes(termino) ||
            evento.categoria!.toLowerCase().includes(termino)
        );

        const totalEjemplos = cursosFiltrados.length + tutorialesFiltrados.length + blogFiltrado.length + eventosFiltrados.length;

        console.log('📋 [DATOS EJEMPLO] Mostrando resultados de ejemplo:', totalEjemplos);

        return {
            cursos: cursosFiltrados,
            tutoriales: tutorialesFiltrados,
            blog: blogFiltrado,
            eventos: eventosFiltrados,
            usuarios: [],
            paquetes: [],
            total: totalEjemplos
        };
    }
}

export const busquedaService = new BusquedaService();
export default busquedaService;
