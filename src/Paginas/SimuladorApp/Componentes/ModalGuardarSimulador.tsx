import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { vibracionMedia } from '../../../utilidades/plataforma';
import './ModalGuardarSimulador.css';

interface Resumen {
    duracionMs: number;
    bpm: number;
    tonalidad: string | null;
    notas: number;
}

interface Props {
    visible: boolean;
    guardando: boolean;
    error: string | null;
    tituloSugerido: string;
    resumen: Resumen | null;
    onCancelar: () => void;
    onGuardar: (titulo: string, descripcion: string) => Promise<boolean> | boolean;
}

function formatearDuracion(ms: number) {
    const totalSegundos = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(totalSegundos / 60);
    const s = totalSegundos % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Modal compacto especifico para el SimuladorApp (landscape mobile).
 * El modal del ProMax es full-screen y tapa todo el acordeon — aca lo
 * mostramos centrado, mas chico, con campos minimos.
 */
const ModalGuardarSimulador: React.FC<Props> = ({
    visible, guardando, error, tituloSugerido, resumen, onCancelar, onGuardar,
}) => {
    const [titulo, setTitulo] = useState(tituloSugerido || 'Practica libre');
    const [descripcion, setDescripcion] = useState('');
    const [errorLocal, setErrorLocal] = useState('');

    useEffect(() => {
        if (!visible) return;
        setTitulo(tituloSugerido || 'Practica libre');
        setDescripcion('');
        setErrorLocal('');
    }, [tituloSugerido, visible]);

    if (!visible) return null;

    const guardar = async () => {
        if (!titulo.trim()) {
            setErrorLocal('Escribe un titulo para guardar.');
            return;
        }
        setErrorLocal('');
        vibracionMedia();
        await onGuardar(titulo, descripcion);
    };

    return (
        <div className="sim-modal-grab-overlay" onClick={onCancelar}>
            <div className="sim-modal-grab" onClick={(e) => e.stopPropagation()}>
                <button className="sim-modal-grab-cerrar" onClick={onCancelar} aria-label="Cerrar">
                    <X size={16} />
                </button>

                <div className="sim-modal-grab-head">
                    <span className="sim-modal-grab-kicker">Guardar grabacion</span>
                    {resumen && (
                        <div className="sim-modal-grab-resumen">
                            <span>{formatearDuracion(resumen.duracionMs)}</span>
                            <span>·</span>
                            <span>{resumen.bpm} BPM</span>
                            <span>·</span>
                            <span>{resumen.notas} notas</span>
                            {resumen.tonalidad && (<><span>·</span><span>{resumen.tonalidad}</span></>)}
                        </div>
                    )}
                </div>

                <label className="sim-modal-grab-campo">
                    <span>Titulo</span>
                    <input
                        type="text"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        maxLength={120}
                        placeholder="Ej: Paseo en la"
                        autoFocus
                    />
                </label>

                <label className="sim-modal-grab-campo">
                    <span>Descripcion <em>(opcional)</em></span>
                    <input
                        type="text"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        maxLength={200}
                        placeholder="Notas, ideas..."
                    />
                </label>

                {(errorLocal || error) && (
                    <p className="sim-modal-grab-error">{errorLocal || error}</p>
                )}

                <div className="sim-modal-grab-acciones">
                    <button
                        className="sim-modal-grab-btn secundaria"
                        onClick={onCancelar}
                        disabled={guardando}
                    >
                        Descartar
                    </button>
                    <button
                        className="sim-modal-grab-btn primaria"
                        onClick={guardar}
                        disabled={guardando}
                    >
                        {guardando ? 'Guardando…' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ModalGuardarSimulador);
