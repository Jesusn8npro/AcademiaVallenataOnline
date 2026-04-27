import { supabase } from '../clienteSupabase';
import type { ResultadoBusqueda } from '../../tipos/busqueda';

export async function buscarCursos(termino: string): Promise<ResultadoBusqueda[]> {
    try {
        const { data, error } = await supabase
            .from('cursos')
            .select('id, titulo, descripcion, imagen_url, nivel, precio_normal, slug')
            .or(`titulo.ilike.%${termino}%, descripcion.ilike.%${termino}%, nivel.ilike.%${termino}%`)
            .order('created_at', { ascending: false })
            .limit(6);

        if (error || !data) return [];

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
    } catch {
        return [];
    }
}

export async function buscarTutoriales(termino: string): Promise<ResultadoBusqueda[]> {
    try {
        const { data, error } = await supabase
            .from('tutoriales')
            .select('id, titulo, descripcion, imagen_url, artista, nivel')
            .or(`titulo.ilike.%${termino}%, descripcion.ilike.%${termino}%, artista.ilike.%${termino}%`)
            .order('created_at', { ascending: false })
            .limit(8);

        if (error || !data) return [];

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
    } catch {
        return [];
    }
}

export async function buscarBlog(termino: string): Promise<ResultadoBusqueda[]> {
    try {
        const { data, error } = await supabase
            .from('blog_articulos')
            .select('id, titulo, resumen, imagen_url, slug, creado_en')
            .or(`titulo.ilike.%${termino}%, resumen.ilike.%${termino}%, contenido.ilike.%${termino}%`)
            .eq('estado', 'publicado')
            .order('creado_en', { ascending: false })
            .limit(4);

        if (error || !data) return [];

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
    } catch {
        return [];
    }
}

export async function buscarEventos(termino: string): Promise<ResultadoBusqueda[]> {
    try {
        const { data, error } = await supabase
            .from('eventos')
            .select('id, titulo, descripcion, descripcion_corta, imagen_portada, slug, tipo_evento, fecha_inicio, precio, instructor_nombre, categoria, nivel_dificultad')
            .or(`titulo.ilike.%${termino}%, descripcion.ilike.%${termino}%, tipo_evento.ilike.%${termino}%, instructor_nombre.ilike.%${termino}%`)
            .eq('estado', 'publicado')
            .gte('fecha_inicio', new Date().toISOString())
            .order('fecha_inicio', { ascending: true })
            .limit(6);

        if (error || !data) return [];

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
    } catch {
        return [];
    }
}
