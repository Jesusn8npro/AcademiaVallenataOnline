import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificacionesService } from '../../servicios/notificacionesService';
import type { Notificacion } from '../../servicios/notificacionesService';
import './NotificacionesDropdown.css';

interface NotificacionesDropdownProps {
    onCerrar: () => void;
    onNotificacionLeida?: () => void;
}

const NotificacionesDropdown: React.FC<NotificacionesDropdownProps> = ({ onCerrar, onNotificacionLeida }) => {
    const navigate = useNavigate();
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [conteoNoLeidas, setConteoNoLeidas] = useState(0);

    // Cargar notificaciones al montar y suscribirse
    useEffect(() => {
        cargarNotificaciones();

        // Suscribirse a nuevas notificaciones en tiempo real
        const unsubscribePromise = notificacionesService.suscribirseANotificaciones((nueva) => {
            setNotificaciones(prev => [nueva, ...prev]);
            // El contador global se actualiza solo en el servicio, aquí actualizamos el local si es necesario
            setConteoNoLeidas(c => c + 1);
        });

        return () => {
            unsubscribePromise.then(unsub => unsub());
        };
    }, []);

    const cargarNotificaciones = async () => {
        setCargando(true);
        // Pedimos las últimas 10, mezclando leídas y no leídas para tener contexto
        const { notificaciones: data, error } = await notificacionesService.obtenerNotificaciones({
            limite: 10
        });

        if (!error) {
            setNotificaciones(data);
            const noLeidas = data.filter(n => !n.leida).length;
            setConteoNoLeidas(noLeidas);
        } else {
            console.error('Error cargando notificaciones:', error);
        }
        setCargando(false);
    };

    const manejarClickNotificacion = async (notificacion: Notificacion) => {
        // 1. Marcar como leída si no lo está
        if (!notificacion.leida) {
            await notificacionesService.marcarComoLeida([notificacion.id]);
            // Actualizar estado local
            setNotificaciones(prev =>
                prev.map(n => n.id === notificacion.id ? { ...n, leida: true } : n)
            );
            if (onNotificacionLeida) onNotificacionLeida();
        }

        // 2. Navegar a la acción
        if (notificacion.url_accion) {
            navigate(notificacion.url_accion);
        }

        // 3. Cerrar dropdown
        onCerrar();
    };

    const marcarTodasLeidas = async () => {
        const idsNoLeidas = notificaciones.filter(n => !n.leida).map(n => n.id);
        if (idsNoLeidas.length > 0) {
            await notificacionesService.marcarComoLeida(idsNoLeidas);
            setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
            if (onNotificacionLeida) onNotificacionLeida();
        }
    };

    const verTodas = () => {
        navigate('/notificaciones'); // Asumimos que existirá esta página
        onCerrar();
    };

    if (cargando) {
        return (
            <div className="notif-dd-container">
                <div className="notif-dd-header">
                    <span className="notif-dd-titulo">Notificaciones</span>
                </div>
                <div className="notif-vacio">
                    <div className="spinner-simple" style={{ width: 24, height: 24, border: '2px solid #ccc', borderTopColor: '#667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <p style={{ marginTop: 10 }}>Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="notif-dd-container">
            {/* HEADER */}
            <div className="notif-dd-header">
                <div className="notif-dd-titulo">
                    Notificaciones
                    {conteoNoLeidas > 0 && (
                        <span className="notif-dd-contador">{conteoNoLeidas}</span>
                    )}
                </div>
                <div className="notif-dd-acciones">
                    <button
                        className="notif-dd-btn-accion notif-dd-btn-leido"
                        onClick={marcarTodasLeidas}
                        title="Marcar todas como leídas"
                        disabled={conteoNoLeidas === 0}
                    >
                        ✓ Marcar leídas
                    </button>
                </div>
            </div>

            {/* LISTA */}
            <div className="notif-dd-lista">
                {notificaciones.length === 0 ? (
                    <div className="notif-vacio">
                        <div className="notif-vacio-icono">🔕</div>
                        <p>No tienes notificaciones recientes</p>
                    </div>
                ) : (
                    notificaciones.map((notif) => (
                        <div
                            key={notif.id}
                            className={`notif-item ${!notif.leida ? 'no-leida' : ''} ${notif.prioridad === 'alta' ? 'notif-prioridad-alta' : ''}`}
                            onClick={() => manejarClickNotificacion(notif)}
                        >
                            <div className="notif-item-icono">
                                {notif.icono || '🔔'}
                            </div>
                            <div className="notif-item-contenido">
                                <div className="notif-item-header">
                                    <span className="notif-item-titulo">{notif.titulo}</span>
                                    <span className="notif-item-tiempo">
                                        {notificacionesService.formatearTiempoTranscurrido(notif.fecha_creacion)}
                                    </span>
                                </div>
                                <p className="notif-item-mensaje">{notif.mensaje}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* FOOTER */}
            <div className="notif-dd-footer">
                <button className="notif-btn-ver-todas" onClick={verTodas}>
                    Ver todas las notificaciones
                </button>
            </div>
        </div>
    );
};

export default NotificacionesDropdown;
