import type { Notificacion } from '../../tipos/notificaciones';
import { NotificacionesCRUDBase } from './_crudBase';

class NotificacionesService extends NotificacionesCRUDBase {
    private callbacks: ((notificacion: Notificacion) => void)[] = [];
    private contadorCallbacks: ((contador: number) => void)[] = [];
    private pollTimer: ReturnType<typeof setInterval> | null = null;
    private idsVistos: Set<string> | null = null; // null = aún no se sembró el primer sondeo

    // POLLING en vez de una conexión Realtime persistente por usuario. Una conexión Realtime por
    // cada logueado toparía el sitio en ~500 usuarios (tope de conexiones del plan Pro); el badge y
    // la lista de notificaciones no necesitan tiempo real estricto. Sondea cada 45s (pausa si la
    // pestaña está oculta) → el sitio escala a MILES de sesiones independientes sin tocar ese tope, y
    // deja las conexiones Realtime libres para el chat y el mundo, donde el tiempo real sí importa.
    private async sondear(): Promise<void> {
        try {
            if (this.contadorCallbacks.length) {
                const c = await this.obtenerContadorNoLeidas();
                this.contadorCallbacks.forEach(cb => cb(c));
            }
            if (this.callbacks.length) {
                const { notificaciones } = await this.obtenerNotificaciones({ limite: 20 });
                if (this.idsVistos === null) {
                    this.idsVistos = new Set(notificaciones.map(n => n.id)); // 1er sondeo: sembrar sin emitir
                } else {
                    for (const n of [...notificaciones].reverse()) { // de más vieja a más nueva
                        if (this.idsVistos.has(n.id)) continue;
                        this.idsVistos.add(n.id);
                        this.callbacks.forEach(cb => cb(n));
                        this.mostrarNotificacionNativa(n);
                    }
                }
            }
        } catch { /* silencioso: el siguiente sondeo reintenta */ }
    }

    private asegurarPolling(): void {
        if (this.pollTimer) return;
        this.sondear();
        this.pollTimer = setInterval(() => {
            if (typeof document !== 'undefined' && document.hidden) return; // no sondear en segundo plano
            this.sondear();
        }, 45000);
    }

    private detenerPollingSiVacio(): void {
        if (this.pollTimer && this.callbacks.length === 0 && this.contadorCallbacks.length === 0) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
            this.idsVistos = null;
        }
    }

    // Refresco inmediato del contador (tras marcar leída / archivar) → el badge no espera al sondeo.
    private async emitirContador(): Promise<void> {
        if (!this.contadorCallbacks.length) return;
        const c = await this.obtenerContadorNoLeidas();
        this.contadorCallbacks.forEach(cb => cb(c));
    }

    async suscribirseANotificaciones(callback: (notificacion: Notificacion) => void): Promise<() => void> {
        this.callbacks.push(callback);
        this.asegurarPolling();

        return () => {
            this.callbacks = this.callbacks.filter(cb => cb !== callback);
            this.detenerPollingSiVacio();
        };
    }

    suscribirseAContador(callback: (contador: number) => void): () => void {
        this.contadorCallbacks.push(callback);
        this.asegurarPolling();

        return () => {
            this.contadorCallbacks = this.contadorCallbacks.filter(cb => cb !== callback);
            this.detenerPollingSiVacio();
        };
    }

    desuscribirseDeNotificaciones(): void {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
        this.callbacks = [];
        this.contadorCallbacks = [];
        this.idsVistos = null;
    }

    // Sobrescribir las mutaciones para refrescar el badge AL INSTANTE (sin esperar el sondeo de 45s).
    async marcarComoLeida(ids: string[]) {
        const r = await super.marcarComoLeida(ids);
        if (r.exito) this.emitirContador();
        return r;
    }

    async marcarTodasComoLeidas() {
        const r = await super.marcarTodasComoLeidas();
        if (r.exito) this.emitirContador();
        return r;
    }

    async archivarNotificacion(id: string) {
        const r = await super.archivarNotificacion(id);
        if (r.exito) this.emitirContador();
        return r;
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
