/**
 * 📊 SERVICIO DE OBJETIVOS ADMINISTRATIVOS
 * ==========================================
 * Gestión de tareas y objetivos estilo Trello
 */

import { supabase } from './clienteSupabase';

export interface ObjetivoAdmin {
    id: string;
    categoria: string;
    titulo: string;
    descripcion: string | null;
    estado: 'pendiente' | 'en_progreso' | 'completado';
    prioridad: 'baja' | 'media' | 'alta';
    fecha_limite: string | null;
    fecha_creacion: string;
    creado_por: string | null;
}

export type NuevoObjetivo = Omit<ObjetivoAdmin, 'id' | 'fecha_creacion'>;

export const servicioObjetivos = {
    /**
     * 📋 Obtener todos los objetivos
     */
    async obtenerObjetivos(): Promise<ObjetivoAdmin[]> {
        const { data, error } = await supabase
            .from('objetivos_admin')
            .select('*')
            .order('fecha_creacion', { ascending: false });

        if (error) {
            throw error;
        }

        return data || [];
    },

    /**
     * ✨ Crear un nuevo objetivo
     */
    async crearObjetivo(objetivo: NuevoObjetivo): Promise<ObjetivoAdmin> {
        const { data, error } = await supabase
            .from('objetivos_admin')
            .insert([objetivo])
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    },

    /**
     * 📝 Actualizar un objetivo existente
     */
    async actualizarObjetivo(id: string, cambios: Partial<ObjetivoAdmin>): Promise<ObjetivoAdmin> {
        const { data, error } = await supabase
            .from('objetivos_admin')
            .update(cambios)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    },

    /**
     * 🗑️ Eliminar un objetivo
     */
    async eliminarObjetivo(id: string): Promise<void> {
        const { error } = await supabase
            .from('objetivos_admin')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }
    }
};

