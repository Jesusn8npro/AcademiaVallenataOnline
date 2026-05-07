import React, { useEffect, useState } from 'react';
import { Heart, AudioLines, X, Loader } from 'lucide-react';
import { useUsuario } from '../../../contextos/UsuarioContext';
import { obtenerMisGrabaciones } from '../../../servicios/grabacionesHeroService';
import './PopupListaGrabaciones.css';

interface ItemGrabacion {
    id: string;
    titulo: string | null;
    duracion_ms: number | null;
    created_at: string;
    es_publica?: boolean;
}

interface Props {
    visible: boolean;
    onCerrar: () => void;
    onSeleccionar: (grabacionId: string) => void;
}

function formatearDuracion(ms: number | null): string {
    if (!ms) return '0:00';
    const seg = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatearFecha(iso: string): string {
    try {
        const d = new Date(iso);
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return iso; }
}

/**
 * Popup inline con la lista de grabaciones del usuario, mostrado sobre el
 * SimuladorApp. Click en una grabacion la pone a reproducir inline (el
 * caller maneja la reproduccion). Estilo: modal centrado oscuro con lista
 * scrolleable, similar al popup de Loops del ProMax mobile.
 */
const PopupListaGrabaciones: React.FC<Props> = ({ visible, onCerrar, onSeleccionar }) => {
    const { usuario } = useUsuario();
    const [grabaciones, setGrabaciones] = useState<ItemGrabacion[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible || !usuario?.id) return;
        let cancelado = false;
        setCargando(true);
        setError(null);
        obtenerMisGrabaciones(usuario.id)
            .then((datos: any[]) => {
                if (cancelado) return;
                setGrabaciones(datos as ItemGrabacion[]);
            })
            .catch(() => {
                if (cancelado) return;
                setError('No se pudieron cargar tus grabaciones.');
            })
            .finally(() => { if (!cancelado) setCargando(false); });
        return () => { cancelado = true; };
    }, [visible, usuario?.id]);

    if (!visible) return null;

    return (
        <div className="sim-grab-lista-overlay" onClick={onCerrar}>
            <div className="sim-grab-lista" onClick={(e) => e.stopPropagation()}>
                <div className="sim-grab-lista-head">
                    <h3>Mis Grabaciones</h3>
                    <button className="sim-grab-lista-cerrar" onClick={onCerrar} aria-label="Cerrar">
                        <X size={16} />
                    </button>
                </div>

                <div className="sim-grab-lista-cuerpo">
                    {cargando && (
                        <div className="sim-grab-lista-estado">
                            <Loader size={18} className="sim-grab-lista-spinner" />
                            <span>Cargando…</span>
                        </div>
                    )}
                    {!cargando && error && (
                        <div className="sim-grab-lista-estado error">{error}</div>
                    )}
                    {!cargando && !error && grabaciones.length === 0 && (
                        <div className="sim-grab-lista-estado">
                            Aun no tienes grabaciones. Toca el boton rojo para grabar.
                        </div>
                    )}
                    {!cargando && !error && grabaciones.map((g) => (
                        <button
                            key={g.id}
                            type="button"
                            className="sim-grab-lista-item"
                            onClick={() => onSeleccionar(g.id)}
                        >
                            <span className="sim-grab-lista-icono">
                                <AudioLines size={18} />
                            </span>
                            <span className="sim-grab-lista-textos">
                                <span className="sim-grab-lista-titulo">
                                    {g.titulo || formatearFecha(g.created_at)}
                                </span>
                                <span className="sim-grab-lista-duracion">
                                    {formatearDuracion(g.duracion_ms)}
                                </span>
                            </span>
                            {g.es_publica && (
                                <span className="sim-grab-lista-badge">
                                    <Heart size={12} fill="currentColor" />
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default React.memo(PopupListaGrabaciones);
