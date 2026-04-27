import { supabase, supabaseAdmin } from './_cliente';
import type { PaqueteTutorial, ResultadoOperacion, TutorialResumen } from '../../tipos/paquetes';

export function validarPaquete(paquete: Partial<PaqueteTutorial>): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!paquete.titulo?.trim()) {
        errores.push('El título es requerido');
    }

    if (!paquete.precio_normal || paquete.precio_normal <= 0) {
        errores.push('El precio normal debe ser mayor a 0');
    }

    if (paquete.precio_rebajado && paquete.precio_rebajado >= paquete.precio_normal!) {
        errores.push('El precio rebajado debe ser menor al precio normal');
    }

    if (!paquete.nivel) {
        errores.push('El nivel es requerido');
    }

    if (!paquete.tipo_acceso) {
        errores.push('El tipo de acceso es requerido');
    }

    return {
        valido: errores.length === 0,
        errores
    };
}

export function formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(precio);
}

export function calcularPorcentajeDescuento(precioNormal: number, precioRebajado: number): number {
    if (precioNormal <= 0 || precioRebajado >= precioNormal) return 0;
    return Math.round(((precioNormal - precioRebajado) / precioNormal) * 100);
}

export async function obtenerTutorialesDisponibles(): Promise<ResultadoOperacion<TutorialResumen[]>> {
    try {
        const { data, error } = await supabase
            .from('tutoriales')
            .select('id, titulo, imagen_url, categoria, nivel, precio_normal, precio_rebajado')
            .order('titulo', { ascending: true });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function obtenerItemsPaquete(paqueteId: string): Promise<ResultadoOperacion<string[]>> {
    try {
        const { data, error } = await supabase
            .from('paquetes_tutoriales_items')
            .select('tutorial_id')
            .eq('paquete_id', paqueteId)
            .eq('incluido', true);

        if (error) throw error;
        return { success: true, data: data?.map(d => d.tutorial_id) || [] };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function guardarItemsPaquete(paqueteId: string, tutorialIds: string[]): Promise<ResultadoOperacion> {
    try {
        await supabaseAdmin
            .from('paquetes_tutoriales_items')
            .update({ incluido: false })
            .eq('paquete_id', paqueteId);

        if (tutorialIds.length > 0) {
            for (let i = 0; i < tutorialIds.length; i++) {
                const tutorialId = tutorialIds[i];
                const { data: existe } = await supabaseAdmin
                    .from('paquetes_tutoriales_items')
                    .select('id')
                    .eq('paquete_id', paqueteId)
                    .eq('tutorial_id', tutorialId)
                    .maybeSingle();

                if (existe) {
                    await supabaseAdmin
                        .from('paquetes_tutoriales_items')
                        .update({ incluido: true, orden: i + 1 })
                        .eq('id', (existe as any).id);
                } else {
                    await supabaseAdmin
                        .from('paquetes_tutoriales_items')
                        .insert({
                            paquete_id: paqueteId,
                            tutorial_id: tutorialId,
                            incluido: true,
                            orden: i + 1
                        });
                }
            }
        }

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
