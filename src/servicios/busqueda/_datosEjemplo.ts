import type { ResultadoBusqueda, ResultadosBusqueda } from '../../tipos/busqueda';

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
        fechaCreacion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
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
        fechaCreacion: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    }
];

export function obtenerDatosEjemplo(termino: string): ResultadosBusqueda {
    const cursos = ejemplosCursos.filter(c =>
        c.titulo.toLowerCase().includes(termino) ||
        c.descripcion!.toLowerCase().includes(termino) ||
        c.nivel!.toLowerCase().includes(termino)
    );
    const tutoriales = ejemplosTutoriales.filter(t =>
        t.titulo.toLowerCase().includes(termino) ||
        t.descripcion!.toLowerCase().includes(termino) ||
        t.autor!.toLowerCase().includes(termino)
    );
    const blog = ejemplosBlog.filter(a =>
        a.titulo.toLowerCase().includes(termino) ||
        a.descripcion!.toLowerCase().includes(termino)
    );
    const eventos = ejemplosEventos.filter(e =>
        e.titulo.toLowerCase().includes(termino) ||
        e.descripcion!.toLowerCase().includes(termino) ||
        e.autor!.toLowerCase().includes(termino) ||
        e.categoria!.toLowerCase().includes(termino)
    );

    return { cursos, tutoriales, blog, eventos, usuarios: [], paquetes: [], total: cursos.length + tutoriales.length + blog.length + eventos.length };
}
