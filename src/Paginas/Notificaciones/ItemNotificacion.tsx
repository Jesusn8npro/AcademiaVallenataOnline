import React from 'react';
import { notificacionesService, type Notificacion } from '../../servicios/notificacionesService';
import { obtenerDescripcionCategoria } from './useNotificaciones';

interface Props {
    notificacion: Notificacion;
    onClic: (n: Notificacion) => void;
    onMarcarLeida: (n: Notificacion) => void;
    onArchivar: (n: Notificacion) => void;
}

export default function ItemNotificacion({ notificacion, onClic, onMarcarLeida, onArchivar }: Props) {
    return (
        <div
            className={`academia-tarjeta-notificacion
                ${!notificacion.leida ? 'academia-no-leida' : ''}
                ${notificacion.prioridad === 'alta' ? 'academia-prioridad-alta' : ''}
                ${notificacion.url_accion ? 'academia-clickeable' : ''}`
            }
            onClick={() => onClic(notificacion)}
        >
            <div
                className="academia-icono-categoria"
                style={{ backgroundColor: notificacionesService.obtenerColorPorCategoria(notificacion.categoria) }}
            >
                {notificacion.icono || notificacionesService.obtenerIconoPorTipo(notificacion.tipo)}
            </div>

            <div className="academia-contenido-notificacion">
                <div className="academia-header-notificacion">
                    <h4 className="academia-titulo-notificacion">{notificacion.titulo}</h4>
                    <div className="academia-metadatos">
                        <span className="academia-categoria">{obtenerDescripcionCategoria(notificacion.categoria)}</span>
                        <span className="academia-tiempo">{notificacionesService.formatearTiempoTranscurrido(notificacion.fecha_creacion as string)}</span>
                    </div>
                </div>
                <p className="academia-mensaje-notificacion">{notificacion.mensaje}</p>
                {notificacion.url_accion && (
                    <span className="academia-enlace-accion">👉 Hacer clic para ver más</span>
                )}
            </div>

            <div className="academia-acciones-notificacion">
                {!notificacion.leida && (
                    <button
                        className="academia-boton-accion academia-marcar-leida"
                        onClick={(e) => { e.stopPropagation(); onMarcarLeida(notificacion); }}
                        title="Marcar como leída"
                    >
                        ✅
                    </button>
                )}
                <button
                    className="academia-boton-accion academia-archivar"
                    onClick={(e) => { e.stopPropagation(); onArchivar(notificacion); }}
                    title="Archivar notificación"
                >
                    🗑️
                </button>
            </div>

            {!notificacion.leida && <div className="academia-indicador-no-leida" />}
        </div>
    );
}
