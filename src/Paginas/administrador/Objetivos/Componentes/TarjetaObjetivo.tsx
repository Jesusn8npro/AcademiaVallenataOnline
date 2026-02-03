import React from 'react';
import { Calendar, Tag, MoreVertical, Clock } from 'lucide-react';
import type { ObjetivoAdmin } from '../../../../lib/services/servicioObjetivos';

interface Props {
    objetivo: ObjetivoAdmin;
    alHacerClic: (objetivo: ObjetivoAdmin) => void;
}

const TarjetaObjetivo: React.FC<Props> = ({ objetivo, alHacerClic }) => {
    const formatearFecha = (fecha: string | null) => {
        if (!fecha) return 'Sin fecha';
        const d = new Date(fecha);
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    };

    const manejarDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('objetivoId', objetivo.id);
    };

    // Determinar si la fecha limite ya paso o esta cerca
    const obtenerEstadoFecha = () => {
        if (!objetivo.fecha_limite) return null;
        const hoy = new Date();
        const limite = new Date(objetivo.fecha_limite);
        const dif = limite.getTime() - hoy.getTime();
        const dias = Math.ceil(dif / (1000 * 3600 * 24));

        if (dias < 0) return { color: '#ef4444', texto: 'Vencido' };
        if (dias <= 3) return { color: '#f59e0b', texto: `Faltan ${dias}d` };
        return null;
    };

    const estadoFecha = obtenerEstadoFecha();

    return (
        <div
            className="tarjeta-objetivo"
            draggable
            onDragStart={manejarDragStart}
            onClick={() => alHacerClic(objetivo)}
        >
            <div className={`prioridad-indicator prioridad-${objetivo.prioridad}`} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 className="tarjeta-titulo">{objetivo.titulo}</h3>
                <div style={{ color: '#64748b', flexShrink: 0 }}>
                    <MoreVertical size={18} />
                </div>
            </div>

            <p className="tarjeta-descripcion">{objetivo.descripcion || 'Sin descripción detallada.'}</p>

            <div className="tarjeta-footer">
                <div className="tag-item">
                    <Tag size={12} />
                    <span>{objetivo.categoria}</span>
                </div>

                <div className="tag-item" style={estadoFecha ? { borderColor: estadoFecha.color, color: estadoFecha.color } : {}}>
                    {estadoFecha ? <Clock size={12} /> : <Calendar size={12} />}
                    <span>{estadoFecha ? estadoFecha.texto : formatearFecha(objetivo.fecha_limite)}</span>
                </div>
            </div>
        </div>
    );
};

export default TarjetaObjetivo;
