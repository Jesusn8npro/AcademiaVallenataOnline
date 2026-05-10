import { supabase } from '../clienteSupabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Notificacion } from '../../tipos/notificaciones';
import { NotificacionesCRUDBase } from './_crudBase';

class NotificacionesService extends NotificacionesCRUDBase {
    private channel: RealtimeChannel | null = null;
    private callbacks: ((notificacion: Notificacion) => void)[] = [];
    private contadorCallbacks: ((contador: number) => void)[] = [];
    private usuarioActual: string | null = null;

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
                        table: 'notificaciones',
                        filter: `usuario_id=eq.${user.id}`
                    },
                    (payload: any) => {
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

                        this.callbacks.forEach(cb => cb(nuevaNotificacion));
                        this.actualizarContador();
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
                .subscribe(() => {});

        } catch (error) {
        }
    }

    async suscribirseANotificaciones(callback: (notificacion: Notificacion) => void): Promise<() => void> {
        this.callbacks.push(callback);
        await this.iniciarCanalRealtime();

        return () => {
            this.callbacks = this.callbacks.filter(cb => cb !== callback);
        };
    }

    suscribirseAContador(callback: (contador: number) => void): () => void {
        this.contadorCallbacks.push(callback);
        this.actualizarContador();
        this.iniciarCanalRealtime();

        return () => {
            this.contadorCallbacks = this.contadorCallbacks.filter(cb => cb !== callback);
        };
    }

    private async actualizarContador(): Promise<void> {
        const contador = await this.obtenerContadorNoLeidas();
        this.contadorCallbacks.forEach(callback => callback(contador));
    }

    desuscribirseDeNotificaciones(): void {
        if (this.channel) {
            this.channel.unsubscribe();
            this.channel = null;
        }
        this.callbacks = [];
        this.contadorCallbacks = [];
        this.usuarioActual = null;
    }

    private async mostrarNotificacionNativa(notificacion: Notificacion): Promise<void> {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return;
        }

        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }

        if (Notification.permission === 'granted') {
            const notification = new Notification(notificacion.titulo, {
                body: notificacion.mensaje,
                icon: '/favicon.png',
                badge: '/favicon.png',
                tag: notificacion.id,
                requireInteraction: notificacion.prioridad === 'alta',
                silent: notificacion.prioridad === 'baja'
            });

            if (notificacion.prioridad !== 'alta') {
                setTimeout(() => notification.close(), 5000);
            }

            notification.onclick = () => {
                window.focus();
                if (notificacion.url_accion) {
                    window.location.href = notificacion.url_accion;
                }
                notification.close();
            };
        }
    }

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

export const notificacionesService = new NotificacionesService();
export default notificacionesService;
