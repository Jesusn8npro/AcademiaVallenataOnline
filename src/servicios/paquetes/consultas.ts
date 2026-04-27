import { supabase, supabaseAdmin } from './_cliente';
import { generateSlug } from '$lib/utilidades/utilidadesSlug';
import type { ResultadoOperacion } from '../../tipos/paquetes';

export async function obtenerTodosPaquetes(): Promise<ResultadoOperacion> {
    try {
        const { data, error } = await supabaseAdmin
            .from('vista_paquetes_completos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function obtenerPaquetesPublicados(): Promise<ResultadoOperacion> {
    try {
        const { data, error } = await supabase
            .from('vista_paquetes_completos')
            .select('*')
            .eq('estado', 'publicado')
            .eq('visible', true)
            .order('destacado', { ascending: false })
            .order('orden_mostrar', { ascending: true });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function obtenerPaquetePorId(id: string): Promise<ResultadoOperacion> {
    try {
        const { data, error } = await supabaseAdmin
            .from('paquetes_tutoriales')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function obtenerPaquetePorSlug(slug: string): Promise<ResultadoOperacion> {
    try {
        let { data, error } = await supabase
            .from('paquetes_tutoriales')
            .select('*')
            .eq('slug', slug)
            .eq('estado', 'publicado')
            .single();

        if (error && error.code === 'PGRST116') {
            if (slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                const { data: paquetePorId, error: errorId } = await supabase
                    .from('paquetes_tutoriales')
                    .select('*')
                    .eq('id', slug)
                    .eq('estado', 'publicado')
                    .single();

                if (!errorId && paquetePorId) {
                    data = paquetePorId;
                    error = null;
                    return { success: true, data };
                }
            }

            const { data: paquetes, error: errorPaquetes } = await supabase
                .from('paquetes_tutoriales')
                .select('*')
                .eq('estado', 'publicado');

            if (!errorPaquetes && paquetes) {
                const paqueteEncontrado = paquetes.find((p: any) => {
                    const slugGenerado = generateSlug(p.titulo);
                    return slugGenerado === slug;
                });

                if (paqueteEncontrado) {
                    data = paqueteEncontrado;
                    error = null;

                    if (!paqueteEncontrado.slug) {
                        await supabaseAdmin
                            .from('paquetes_tutoriales')
                            .update({ slug: generateSlug(paqueteEncontrado.titulo) })
                            .eq('id', paqueteEncontrado.id);
                    }
                }
            }
        }

        if (error) {
            return { success: false, error: 'Paquete no encontrado' };
        }

        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function obtenerTutorialesPaquete(paqueteId: string): Promise<ResultadoOperacion> {
    try {
        const { data, error } = await supabase
            .from('paquetes_tutoriales_items')
            .select(`
                *,
                tutoriales:tutorial_id (
                    id,
                    titulo,
                    descripcion_corta,
                    imagen_url,
                    duracion_estimada,
                    precio_normal,
                    nivel,
                    categoria,
                    artista,
                    tonalidad
                )
            `)
            .eq('paquete_id', paqueteId)
            .eq('incluido', true)
            .order('orden', { ascending: true });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function calcularDescuentoPaquete(paqueteId: string): Promise<ResultadoOperacion> {
    try {
        const { data, error } = await supabase
            .rpc('calcular_descuento_paquete', {
                p_paquete_id: paqueteId
            });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data?.[0] || null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function buscarPaquetes(
    termino: string,
    filtros?: {
        categoria?: string;
        nivel?: string;
        precio_min?: number;
        precio_max?: number;
    }
): Promise<ResultadoOperacion> {
    try {
        let query = supabase
            .from('vista_paquetes_completos')
            .select('*')
            .eq('estado', 'publicado')
            .eq('visible', true);

        if (termino) {
            query = query.or(`titulo.ilike.%${termino}%,descripcion.ilike.%${termino}%,categoria.ilike.%${termino}%`);
        }

        if (filtros?.categoria) {
            query = query.eq('categoria', filtros.categoria);
        }
        if (filtros?.nivel) {
            query = query.eq('nivel', filtros.nivel);
        }
        if (filtros?.precio_min) {
            query = query.gte('precio_normal', filtros.precio_min);
        }
        if (filtros?.precio_max) {
            query = query.lte('precio_normal', filtros.precio_max);
        }

        const { data, error } = await query
            .order('destacado', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function obtenerCategoriasPaquetes(): Promise<ResultadoOperacion> {
    try {
        const { data, error } = await supabase
            .from('paquetes_tutoriales')
            .select('categoria')
            .eq('estado', 'publicado')
            .not('categoria', 'is', null);

        if (error) {
            return { success: false, error: error.message };
        }

        const categorias = [...new Set(data?.map((item: any) => item.categoria).filter(Boolean))];
        return { success: true, data: categorias };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
