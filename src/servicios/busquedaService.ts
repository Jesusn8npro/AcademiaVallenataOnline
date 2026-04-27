export type { ResultadoBusqueda, ResultadosBusqueda } from '../tipos/busqueda';
import type { ResultadosBusqueda } from '../tipos/busqueda';
import { buscarCursos, buscarTutoriales, buscarBlog, buscarEventos } from './busqueda/consultas';
import { obtenerDatosEjemplo } from './busqueda/_datosEjemplo';

async function buscarTodo(termino: string): Promise<ResultadosBusqueda> {
    if (!termino || termino.trim().length < 2) {
        return { cursos: [], tutoriales: [], blog: [], usuarios: [], eventos: [], paquetes: [], total: 0 };
    }

    const terminoLimpio = termino.trim().toLowerCase();

    try {
        const [cursos, tutoriales, blog, eventos] = await Promise.all([
            buscarCursos(terminoLimpio),
            buscarTutoriales(terminoLimpio),
            buscarBlog(terminoLimpio),
            buscarEventos(terminoLimpio)
        ]);

        const total = cursos.length + tutoriales.length + blog.length + eventos.length;

        if (total === 0) return obtenerDatosEjemplo(terminoLimpio);

        return { cursos, tutoriales, blog, eventos, usuarios: [], paquetes: [], total };
    } catch {
        return { cursos: [], tutoriales: [], blog: [], usuarios: [], eventos: [], paquetes: [], total: 0 };
    }
}

export const busquedaService = { buscarTodo };
export default busquedaService;
