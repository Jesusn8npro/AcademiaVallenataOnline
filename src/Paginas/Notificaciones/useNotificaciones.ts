import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificacionesService, type Notificacion, type EstadisticasNotificaciones } from '../../servicios/notificacionesService';

export const categorias = [
    { valor: 'todas', nombre: 'Todas las categorías', icono: '📋' },
    { valor: 'contenido', nombre: 'Contenido Educativo', icono: '🎓' },
    { valor: 'pago', nombre: 'Pagos y Transacciones', icono: '💳' },
    { valor: 'comunidad', nombre: 'Comunidad', icono: '👥' },
    { valor: 'progreso', nombre: 'Progreso', icono: '📈' },
    { valor: 'sistema', nombre: 'Sistema', icono: '⚙️' },
    { valor: 'promocion', nombre: 'Promociones', icono: '🎁' }
];

export function obtenerDescripcionCategoria(categoria: string): string {
    const cat = categorias.find(c => c.valor === categoria);
    return cat ? cat.nombre : categoria;
}

export interface ConfirmacionPendiente {
    texto: string;
    onConfirmar: () => Promise<void>;
}

export function useNotificaciones() {
    const navigate = useNavigate();
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [notificacionesFiltradas, setNotificacionesFiltradas] = useState<Notificacion[]>([]);
    const [estadisticas, setEstadisticas] = useState<EstadisticasNotificaciones | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('todas');
    const [filtroLeida, setFiltroLeida] = useState('todas');
    const [busqueda, setBusqueda] = useState('');
    const [vistaActual, setVistaActual] = useState<'lista' | 'estadisticas'>('lista');
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [confirmacion, setConfirmacion] = useState<ConfirmacionPendiente | null>(null);

    const cargarEstadisticas = useCallback(async () => {
        const { estadisticas: data, error: errorEst } = await notificacionesService.obtenerEstadisticas();
        if (!errorEst) setEstadisticas(data);
    }, []);

    const cargarNotificaciones = useCallback(async () => {
        setCargando(true);
        setError('');
        const { notificaciones: data, error: errorNotif } = await notificacionesService.obtenerNotificaciones({ limite: 100 });
        if (errorNotif) setError(`Error al cargar notificaciones: ${errorNotif}`);
        else setNotificaciones(data);
        setCargando(false);
    }, []);

    useEffect(() => {
        cargarNotificaciones();
        cargarEstadisticas();
        notificacionesService.suscribirseANotificaciones((nuevaNotificacion: Notificacion) => {
            setNotificaciones(prev => [nuevaNotificacion, ...prev]);
            cargarEstadisticas();
        });
        notificacionesService.suscribirseAContador(() => { cargarEstadisticas(); });
        return () => { notificacionesService.desuscribirseDeNotificaciones(); };
    }, [cargarNotificaciones, cargarEstadisticas]);

    useEffect(() => {
        const filtradas = notificaciones.filter(notif => {
            if (filtroCategoria !== 'todas' && notif.categoria !== filtroCategoria) return false;
            if (filtroLeida === 'leidas' && !notif.leida) return false;
            if (filtroLeida === 'no_leidas' && notif.leida) return false;
            if (busqueda) {
                const termino = busqueda.toLowerCase();
                return notif.titulo.toLowerCase().includes(termino) || notif.mensaje.toLowerCase().includes(termino);
            }
            return true;
        });
        setNotificacionesFiltradas(filtradas);
    }, [notificaciones, filtroCategoria, filtroLeida, busqueda]);

    const marcarComoLeida = async (notificacion: Notificacion) => {
        if (notificacion.leida) return;
        const { exito } = await notificacionesService.marcarComoLeida([notificacion.id]);
        if (exito) {
            setNotificaciones(prev => prev.map(n =>
                n.id === notificacion.id ? { ...n, leida: true, fecha_lectura: new Date().toISOString() } : n
            ));
            cargarEstadisticas();
        }
    };

    const marcarTodasComoLeidas = () => {
        setConfirmacion({
            texto: '¿Estás seguro de marcar todas las notificaciones como leídas?',
            onConfirmar: async () => {
                const { exito } = await notificacionesService.marcarTodasComoLeidas();
                if (exito) {
                    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true, fecha_lectura: new Date().toISOString() })));
                    cargarEstadisticas();
                }
            }
        });
    };

    const archivarNotificacion = (notificacion: Notificacion) => {
        setConfirmacion({
            texto: '¿Estás seguro de archivar esta notificación?',
            onConfirmar: async () => {
                const { exito } = await notificacionesService.archivarNotificacion(notificacion.id);
                if (exito) {
                    setNotificaciones(prev => prev.filter(n => n.id !== notificacion.id));
                    cargarEstadisticas();
                }
            }
        });
    };

    const manejarClicNotificacion = (notificacion: Notificacion) => {
        // Navega INMEDIATO; marcar leída en background (no bloquear navegación).
        if (notificacion.url_accion) navigate(notificacion.url_accion);
        if (!notificacion.leida) marcarComoLeida(notificacion);
    };

    const ejecutarConfirmacion = async () => {
        if (confirmacion) { await confirmacion.onConfirmar(); setConfirmacion(null); }
    };

    const cancelarConfirmacion = () => setConfirmacion(null);

    return {
        notificacionesFiltradas, estadisticas, cargando, error,
        filtroCategoria, setFiltroCategoria, filtroLeida, setFiltroLeida,
        busqueda, setBusqueda, vistaActual, setVistaActual,
        mostrarFiltros, setMostrarFiltros, confirmacion,
        cargarNotificaciones, marcarComoLeida, marcarTodasComoLeidas,
        archivarNotificacion, manejarClicNotificacion,
        ejecutarConfirmacion, cancelarConfirmacion
    };
}
