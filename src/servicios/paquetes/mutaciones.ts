import { supabaseAdmin } from './_cliente';
import { generateSlug } from '$lib/utilidades/utilidadesSlug';
import type { PaqueteTutorial, PaqueteItem, ResultadoOperacion } from '../../tipos/paquetes';

export async function crearPaquete(paquete: PaqueteTutorial): Promise<ResultadoOperacion> {
    try {
        const paqueteConSlug = {
            ...paquete,
            slug: paquete.slug || generateSlug(paquete.titulo),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin
            .from('paquetes_tutoriales')
            .insert([paqueteConSlug])
            .select('*')
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            data,
            message: 'Paquete creado exitosamente'
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function actualizarPaquete(id: string, paquete: Partial<PaqueteTutorial>): Promise<ResultadoOperacion> {
    try {
        const paqueteConSlug = {
            ...paquete,
            updated_at: new Date().toISOString()
        };

        if (paquete.titulo && !paquete.slug) {
            paqueteConSlug.slug = generateSlug(paquete.titulo);
        }

        const { data, error } = await supabaseAdmin
            .from('paquetes_tutoriales')
            .update(paqueteConSlug)
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            data,
            message: 'Paquete actualizado exitosamente'
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function eliminarPaquete(id: string): Promise<ResultadoOperacion> {
    try {
        const { error } = await supabaseAdmin
            .from('paquetes_tutoriales')
            .delete()
            .eq('id', id);

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            message: 'Paquete eliminado exitosamente'
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function agregarTutorialAPaquete(item: PaqueteItem): Promise<ResultadoOperacion> {
    try {
        const { data, error } = await supabaseAdmin
            .from('paquetes_tutoriales_items')
            .insert([item])
            .select('*')
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            data,
            message: 'Tutorial agregado al paquete exitosamente'
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function removerTutorialDePaquete(paqueteId: string, tutorialId: string): Promise<ResultadoOperacion> {
    try {
        const { error } = await supabaseAdmin
            .from('paquetes_tutoriales_items')
            .delete()
            .eq('paquete_id', paqueteId)
            .eq('tutorial_id', tutorialId);

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            message: 'Tutorial removido del paquete exitosamente'
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function actualizarOrdenTutoriales(items: { id: string; orden: number }[]): Promise<ResultadoOperacion> {
    try {
        const updates = items.map(item =>
            supabaseAdmin
                .from('paquetes_tutoriales_items')
                .update({ orden: item.orden })
                .eq('id', item.id)
        );

        const results = await Promise.all(updates);

        const errores = results.filter(result => result.error);
        if (errores.length > 0) {
            return { success: false, error: 'Error actualizando orden de tutoriales' };
        }

        return {
            success: true,
            message: 'Orden actualizado exitosamente'
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
