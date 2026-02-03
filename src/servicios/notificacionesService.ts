import { supabase } from './supabaseCliente';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Tipos de notificaciones
export interface Notificacion {
    id: string;
    usuario_id: string;
    tipo: string;
    titulo: string;
    mensaje: string;
    icono: string;
    categoria: 'contenido' | 'pago' | 'comunidad' | 'progreso' | 'sistema' | 'promocion';
    prioridad: 'alta' | 'normal' | 'baja';
    leida: boolean;
    archivada: boolean;
    url_accion?: string;
    entidad_id?: string;
    entidad_tipo?: string;
    datos_adicionales: any;
    fecha_creacion: string;
    fecha_lectura?: string;
    fecha_expiracion?: string;
    tiempo_transcurrido?: string;
}

export interface PreferenciaNotificacion {
    id: string;
    usuario_id: string;
    tipo_notificacion: string;
    habilitado: boolean;
    via_plataforma: boolean;
    via_email: boolean;
    via_push: boolean;
    frecuencia: 'inmediata' | 'diaria' | 'semanal' | 'nunca';
}

export interface EstadisticasNotificaciones {
    total: number;
    no_leidas: number;
    por_categoria: { [key: string]: number };
    por_prioridad: { [key: string]: number };
}

class NotificacionesService {
    private channel: RealtimeChannel | null = null;
    private callbacks: ((notificacion: Notificacion) => void)[] = [];
    private contadorCallbacks: ((contador: number) => void)[] = [];
    private usuarioActual: string | null = null;

    /**
     * 🔔 Obtener todas las notificaciones del usuario actual
     */
    async obtenerNotificaciones(filtros?: {
        categoria?: string;
        leida?: boolean;
        limite?: number;
        offset?: number;
    }): Promise<{ notificaciones: Notificacion[]; error: string | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { notificaciones: [], error: 'Usuario no autenticado' };
            }

            let query = supabase
                .from('notificaciones')
                .select('*')
                .eq('usuario_id', user.id)
                .order('fecha_creacion', { ascending: false });

            // Aplicar filtros
            if (filtros?.categoria) {
                query = query.eq('categoria', filtros.categoria);
            }
            if (filtros?.leida !== undefined) {
                query = query.eq('leida', filtros.leida);
            }
            if (filtros?.limite) {
                query = query.limit(filtros.limite);
            }
            if (filtros?.offset) {
                query = query.range(filtros.offset, filtros.offset + (filtros.limite || 20) - 1);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error al obtener notificaciones:', error);
                return { notificaciones: [], error: error.message };
            }

            return { notificaciones: data || [], error: null };
        } catch (err) {
            console.error('Error inesperado:', err);
            return { notificaciones: [], error: 'Error inesperado al obtener notificaciones' };
        }
    }

    /**
     * 📊 Obtener estadísticas de notificaciones
     */
    async obtenerEstadisticas(): Promise<{ estadisticas: EstadisticasNotificaciones | null; error: string | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { estadisticas: null, error: 'Usuario no autenticado' };
            }

            const { data, error } = await supabase
                .from('notificaciones')
                .select('categoria, prioridad, leida')
                .eq('usuario_id', user.id);

            if (error) {
                return { estadisticas: null, error: error.message };
            }

            const estadisticas: EstadisticasNotificaciones = {
                total: data.length,
                no_leidas: data.filter((n: any) => !n.leida).length,
                por_categoria: {},
                por_prioridad: {}
            };

            // Agrupar por categoría
            data.forEach((notif: any) => {
                estadisticas.por_categoria[notif.categoria] =
                    (estadisticas.por_categoria[notif.categoria] || 0) + 1;
                estadisticas.por_prioridad[notif.prioridad] =
                    (estadisticas.por_prioridad[notif.prioridad] || 0) + 1;
            });

            return { estadisticas, error: null };
        } catch (err) {
            console.error('Error al obtener estadísticas:', err);
            return { estadisticas: null, error: 'Error inesperado' };
        }
    }

    /**
     * 🔢 Obtener contador de notificaciones no leídas
     */
    async obtenerContadorNoLeidas(): Promise<number> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return 0;

            const { count, error } = await supabase
                .from('notificaciones')
                .select('*', { count: 'exact', head: true })
                .eq('usuario_id', user.id)
                .eq('leida', false)
                .eq('archivada', false);

            if (error) {
                console.error('Error en contador de notificaciones:', error);
                return 0;
            }

            console.log('📊 Contador de notificaciones no leídas:', count);
            return count || 0;
        } catch (error) {
            console.error('Error al obtener contador de notificaciones:', error);
            return 0;
        }
    }

    /**
     * ✅ Marcar notificación(es) como leída(s)
     */
    async marcarComoLeida(notificacionIds: string[]): Promise<{ exito: boolean; error: string | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { exito: false, error: 'Usuario no autenticado' };
            }

            // Using direct update instead of RPC for simplicity if RPC doesn't exist
            // Or adapt if you have the RPC
            const { error } = await supabase
                .from('notificaciones')
                .update({ leida: true, fecha_lectura: new Date().toISOString() })
                .in('id', notificacionIds)
                .eq('usuario_id', user.id);

            if (error) {
                console.error('Error al marcar como leída:', error);
                return { exito: false, error: error.message };
            }

            return { exito: true, error: null };
        } catch (err) {
            console.error('Error inesperado:', err);
            return { exito: false, error: 'Error inesperado' };
        }
    }

    /**
     * ✅ Marcar TODAS las notificaciones como leídas
     */
    async marcarTodasComoLeidas(): Promise<{ exito: boolean; error: string | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { exito: false, error: 'Usuario no autenticado' };
            }

            const { error } = await supabase
                .from('notificaciones')
                .update({ leida: true, fecha_lectura: new Date().toISOString() })
                .eq('usuario_id', user.id)
                .eq('leida', false);

            if (error) {
                console.error('Error al marcar todas como leídas:', error);
                return { exito: false, error: error.message };
            }

            return { exito: true, error: null };
        } catch (err) {
            console.error('Error inesperado:', err);
            return { exito: false, error: 'Error inesperado' };
        }
    }

    /**
     * 🗑️ Archivar notificación
     */
    async archivarNotificacion(notificacionId: string): Promise<{ exito: boolean; error: string | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { exito: false, error: 'Usuario no autenticado' };
            }

            const { error } = await supabase
                .from('notificaciones')
                .update({ archivada: true })
                .eq('id', notificacionId)
                .eq('usuario_id', user.id);

            if (error) {
                console.error('Error al archivar notificación:', error);
                return { exito: false, error: error.message };
            }

            return { exito: true, error: null };
        } catch (err) {
            console.error('Error inesperado:', err);
            return { exito: false, error: 'Error inesperado' };
        }
    }

    /**
     * 🔔 Crear notificación manual (para admins)
     */
    async crearNotificacion(datos: {
        tipo: string;
        titulo: string;
        mensaje: string;
        categoria?: string;
        prioridad?: string;
        url_accion?: string;
        icono?: string;
    }): Promise<{ exito: boolean; error: string | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { exito: false, error: 'Usuario no autenticado' };
            }

            // Fallback to direct insert if RPC doesn't exist
            // but we really should use the generator service or direct API
            // For now, implementing direct insert logic for safety
            // but ideally this calls the RPC 'crear_notificacion' if valid

            // Using logic similar to GeneradorNotificaciones for consistency
            // but primarily for Admin manual triggers

            const { error } = await supabase.rpc('crear_notificacion', {
                p_usuario_id: user.id,
                p_tipo: datos.tipo,
                p_titulo: datos.titulo,
                p_mensaje: datos.mensaje,
                p_categoria: datos.categoria || 'sistema',
                p_prioridad: datos.prioridad || 'normal',
                p_url_accion: datos.url_accion,
                p_icono: datos.icono || '🔔'
            });

            if (error) {
                console.warn('RPC crear_notificacion failed, falling back to direct insert if permissions allow');
                // You might want to handle fallback here or just return error
                console.error('Error al crear notificación:', error);
                return { exito: false, error: error.message };
            }

            return { exito: true, error: null };
        } catch (err) {
            console.error('Error inesperado:', err);
            return { exito: false, error: 'Error inesperado' };
        }
    }

    /**
     * ⚙️ Obtener preferencias de notificaciones
     */
    async obtenerPreferencias(): Promise<{ preferencias: PreferenciaNotificacion[]; error: string | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { preferencias: [], error: 'Usuario no autenticado' };
            }

            const { data, error } = await supabase
                .from('notificaciones_preferencias')
                .select('*')
                .eq('usuario_id', user.id);

            if (error) {
                console.error('Error al obtener preferencias:', error);
                return { preferencias: [], error: error.message };
            }

            return { preferencias: data || [], error: null };
        } catch (err) {
            console.error('Error inesperado:', err);
            return { preferencias: [], error: 'Error inesperado' };
        }
    }

    /**
     * ⚙️ Actualizar preferencias de notificaciones
     */
    async actualizarPreferencias(preferencias: Partial<PreferenciaNotificacion>[]): Promise<{ exito: boolean; error: string | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { exito: false, error: 'Usuario no autenticado' };
            }

            // Actualizar cada preferencia
            for (const pref of preferencias) {
                const { error } = await supabase
                    .from('notificaciones_preferencias')
                    .upsert({
                        ...pref,
                        usuario_id: user.id,
                        updated_at: new Date().toISOString()
                    });

                if (error) {
                    console.error('Error al actualizar preferencia:', error);
                    return { exito: false, error: error.message };
                }
            }

            return { exito: true, error: null };
        } catch (err) {
            console.error('Error inesperado:', err);
            return { exito: false, error: 'Error inesperado' };
        }
    }

    /**
     * 🔔 Suscribirse a notificaciones en tiempo real
     */
    /**
     * 🔔 Suscribirse a notificaciones en tiempo real
     */
    /**
     * 🚀 Iniciar canal de tiempo real (Compartido)
     */
    private async iniciarCanalRealtime() {
        if (this.channel) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            this.usuarioActual = user.id;

            this.channel = supabase
                .channel(`notificaciones_${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notificaciones'
                    },
                    (payload: any) => {
                        if (payload.new.usuario_id !== user.id) return;

                        // Transformar payload
                        const nuevaNotificacion: Notificacion = {
                            id: payload.new.id,
                            usuario_id: payload.new.usuario_id,
                            tipo: payload.new.tipo,
                            titulo: payload.new.titulo,
                            mensaje: payload.new.mensaje,
                            icono: payload.new.icono,
                            categoria: payload.new.categoria,
                            prioridad: payload.new.prioridad,
                            leida: payload.new.leida,
                            archivada: payload.new.archivada,
                            url_accion: payload.new.url_accion,
                            entidad_id: payload.new.entidad_id,
                            entidad_tipo: payload.new.entidad_tipo,
                            datos_adicionales: payload.new.datos_adicionales,
                            fecha_creacion: payload.new.fecha_creacion,
                            fecha_lectura: payload.new.fecha_lectura,
                            fecha_expiracion: payload.new.fecha_expiracion
                        };

                        // Notificar a suscriptores de notificaciones
                        this.callbacks.forEach(cb => cb(nuevaNotificacion));

                        // Actualizar contadores
                        this.actualizarContador();

                        // Mostrar nativa
                        this.mostrarNotificacionNativa(nuevaNotificacion);
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'notificaciones',
                        filter: `usuario_id=eq.${user.id}`
                    },
                    () => {
                        this.actualizarContador();
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') console.log('✅ Suscrito a notificaciones');
                });

        } catch (error) {
            console.error('Error iniciando realtime:', error);
        }
    }

    /**
     * 🔔 Suscribirse a notificaciones en tiempo real
     */
    async suscribirseANotificaciones(callback: (notificacion: Notificacion) => void): Promise<() => void> {
        this.callbacks.push(callback);
        await this.iniciarCanalRealtime();

        return () => {
            this.callbacks = this.callbacks.filter(cb => cb !== callback);
        };
    }

    /**
     * 🔢 Suscribirse a cambios en el contador de notificaciones
     */
    suscribirseAContador(callback: (contador: number) => void): () => void {
        this.contadorCallbacks.push(callback);
        this.actualizarContador();
        this.iniciarCanalRealtime(); // Asegurar que el canal existe

        return () => {
            this.contadorCallbacks = this.contadorCallbacks.filter(cb => cb !== callback);
        };
    }

    /**
     * 🔄 Actualizar contador y notificar a los callbacks
     */
    private async actualizarContador(): Promise<void> {
        const contador = await this.obtenerContadorNoLeidas();
        this.contadorCallbacks.forEach(callback => callback(contador));
    }

    /**
     * 🔕 Desuscribirse de notificaciones en tiempo real
     */
    desuscribirseDeNotificaciones(): void {
        if (this.channel) {
            console.log('🔕 Desuscribiéndose de notificaciones en tiempo real');
            this.channel.unsubscribe();
            this.channel = null;
        }
        this.callbacks = [];
        this.contadorCallbacks = [];
        this.usuarioActual = null;
    }

    /**
     * 🔔 Mostrar notificación nativa del navegador
     */
    private async mostrarNotificacionNativa(notificacion: Notificacion): Promise<void> {
        // Verificar si las notificaciones están permitidas
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return;
        }

        // Solicitar permiso si no se ha concedido
        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }

        // Mostrar notificación si está permitido
        if (Notification.permission === 'granted') {
            const notification = new Notification(notificacion.titulo, {
                body: notificacion.mensaje,
                icon: '/favicon.png', // Usar el favicon de la app
                badge: '/favicon.png',
                tag: notificacion.id, // Evitar duplicados
                requireInteraction: notificacion.prioridad === 'alta',
                silent: notificacion.prioridad === 'baja'
            });

            // Auto-cerrar después de 5 segundos (excepto alta prioridad)
            if (notificacion.prioridad !== 'alta') {
                setTimeout(() => notification.close(), 5000);
            }

            // Manejar clic en la notificación
            notification.onclick = () => {
                window.focus();
                if (notificacion.url_accion) {
                    window.location.href = notificacion.url_accion;
                }
                notification.close();
            };
        }
    }

    /**
     * 🔔 Solicitar permisos de notificación
     */
    async solicitarPermisosNotificacion(): Promise<boolean> {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    /**
     * 🎨 Obtener ícono por tipo de notificación
     */
    obtenerIconoPorTipo(tipo: string): string {
        const iconos: { [key: string]: string } = {
            'curso_nuevo': '🎓',
            'tutorial_nuevo': '🎬',
            'pago_aprobado': '✅',
            'pago_rechazado': '❌',
            'comentario_nuevo': '💬',
            'me_gusta_nuevo': '❤️',
            'articulo_nuevo': '📰',
            'progreso_completado': '🏆',
            'evento_nuevo': '📅',
            'actualizacion_sistema': '🔔',
            'publicacion_nueva': '📝',
            'sistema': '⚙️'
        };

        return iconos[tipo] || '🔔';
    }

    /**
     * 🎨 Obtener color por categoría
     */
    obtenerColorPorCategoria(categoria: string): string {
        const colores: { [key: string]: string } = {
            'contenido': '#3b82f6',
            'pago': '#10b981',
            'comunidad': '#8b5cf6',
            'progreso': '#f59e0b',
            'sistema': '#6b7280',
            'promocion': '#ef4444'
        };

        return colores[categoria] || '#6b7280';
    }

    /**
     * ⏰ Formatear tiempo transcurrido
     */
    formatearTiempoTranscurrido(fecha: string): string {
        const ahora = new Date();
        const fechaNotificacion = new Date(fecha);
        const diferencia = ahora.getTime() - fechaNotificacion.getTime();

        const minutos = Math.floor(diferencia / 60000);
        const horas = Math.floor(diferencia / 3600000);
        const dias = Math.floor(diferencia / 86400000);

        if (minutos < 1) return 'Hace unos momentos';
        if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
        if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
        if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;

        return fechaNotificacion.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}

// Exportar instancia singleton
export const notificacionesService = new NotificacionesService();
export default notificacionesService;

// --- FUNCIONES LEGACY (Migradas de services/notificacionesService.ts) ---

export async function obtenerEstadisticasNotificaciones(): Promise<{ success: boolean; data: EstadisticasNotificacionesLegacy; error?: string }> {
    try {
        const [todas, pendientes, leidas, vencidas] = await Promise.all([
            supabase.from('notificaciones').select('id', { count: 'exact' }),
            supabase.from('notificaciones').select('id', { count: 'exact' }).eq('leida', false), // Pendientes/No leídas
            supabase.from('notificaciones').select('id', { count: 'exact' }).eq('leida', true),
            // 'vencidas' no tiene equivalente directo simple sin query de fecha, usamos placeholder
            supabase.from('notificaciones').select('id', { count: 'exact' }).eq('archivada', true), // Aprox
        ])

        const data: EstadisticasNotificacionesLegacy = {
            total: Number(todas.count || 0),
            pendientes: Number(pendientes.count || 0),
            leidas: Number(leidas.count || 0),
            vencidas: Number(vencidas.count || 0)
        }
        return { success: true, data }
    } catch (e: any) {
        return { success: false, data: { total: 0, pendientes: 0, leidas: 0, vencidas: 0 }, error: e.message }
    }
}

export interface EstadisticasNotificacionesLegacy {
    total: number
    pendientes: number
    leidas: number
    vencidas: number
}

export async function notificarNuevoCurso(titulo: string, descripcion?: string) {
    await supabase.from('notificaciones').insert({ tipo: 'nuevo_curso', mensaje: descripcion || `Nuevo curso: ${titulo}`, prioridad: 'normal' })
    return { success: true }
}

export async function notificarNuevoTutorial(titulo: string, descripcion?: string) {
    await supabase.from('notificaciones').insert({ tipo: 'nuevo_tutorial', mensaje: descripcion || `Nuevo tutorial: ${titulo}`, prioridad: 'normal' })
    return { success: true }
}

export async function notificarPagoAprobado(usuario_id: string, monto: number, curso_titulo?: string) {
    await supabase.from('notificaciones').insert({ tipo: 'pago_aprobado', mensaje: curso_titulo ? `Pago aprobado de ${monto} para ${curso_titulo}` : `Pago aprobado de ${monto}`, usuario_id, prioridad: 'alta' })
    return { success: true }
}

export async function notificarPromocionEspecial(titulo: string, descripcion: string, codigo: string, fecha_limite: string) {
    await supabase.from('notificaciones').insert({ tipo: 'promocion', mensaje: `${titulo}: ${descripcion}`, codigo, fecha_limite, prioridad: 'alta' })
    return { success: true }
}

export async function limpiarNotificacionesExpiradas() {
    // Adaptado para usar archivo
    await supabase.from('notificaciones').update({ archivada: true }).lt('fecha_expiracion', new Date().toISOString())
    return { success: true }
}

export async function notificarNuevoArticuloBlog(payload: { articulo_id: string; titulo_articulo: string; resumen: string; autor_id: string }): Promise<{ exito: boolean; notificaciones_creadas?: number; error?: string }> {
    try {
        const { error } = await supabase.from('notificaciones').insert({
            tipo: 'nuevo_articulo_blog',
            mensaje: payload.resumen || `Nuevo artículo: ${payload.titulo_articulo}`,
            entidad_id: payload.articulo_id, // Adaptado
            usuario_id: payload.autor_id,
            prioridad: 'normal'
        })
        if (error) throw error
        return { exito: true, notificaciones_creadas: 1 }
    } catch (e: any) {
        return { exito: false, error: e.message }
    }
}

export async function notificarNuevoMensaje(destinatarioId: string, remitenteNombre: string, mensajePreview: string, chatId: string) {
    try {
        console.log(`🔔 Intentando enviar notificación de mensaje a ${destinatarioId} via RPC...`);

        // 1. Intentar usando RPC (Bypassea RLS si está configurado como SECURITY DEFINER)
        const { error: errorRpc } = await supabase.rpc('crear_notificacion', {
            p_usuario_id: destinatarioId, // Destinatario
            p_tipo: 'mensaje_nuevo',
            p_titulo: `Mensaje de ${remitenteNombre}`,
            p_mensaje: mensajePreview,
            p_categoria: 'comunidad',
            p_prioridad: 'alta',
            p_url_accion: `/mensajes/${chatId}`,
            p_icono: '💬'
        });

        if (!errorRpc) {
            console.log('✅ Notificación enviada exitosamente vía RPC');
            return { success: true };
        }

        console.warn('⚠️ Falló RPC crear_notificacion, intentando insert directo (puede fallar por RLS):', errorRpc);

        // 2. Fallback: Insert directo (Fallará si RLS no permite insertar a otros usuarios)
        const { error: errorInsert } = await supabase.from('notificaciones').insert({
            tipo: 'mensaje_nuevo',
            usuario_id: destinatarioId,
            titulo: `Mensaje de ${remitenteNombre}`,
            mensaje: mensajePreview,
            prioridad: 'alta',
            categoria: 'comunidad',
            icono: '💬',
            url_accion: `/mensajes/${chatId}`
        });

        if (errorInsert) {
            console.error('❌ Error enviando notificación (Insert Directo):', errorInsert);
            return { success: false, error: errorInsert };
        }

        console.log('✅ Notificación enviada exitosamente vía Insert Directo');
        return { success: true };
    } catch (error) {
        console.error('❌ Error inesperado enviando notificación de mensaje:', error);
        return { success: false, error };
    }
}
