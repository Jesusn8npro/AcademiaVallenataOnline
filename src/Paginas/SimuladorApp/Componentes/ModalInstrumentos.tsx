import React, { useEffect, useRef, useState } from 'react';
import { X, Music, Check, Loader2 } from 'lucide-react';
import './ModalInstrumentos.css';

interface ModalInstrumentosProps {
    visible: boolean;
    onCerrar: () => void;
    botonRef: React.RefObject<HTMLDivElement>;
    listaInstrumentos: any[];
    instrumentoId: string;
    onSeleccionarInstrumento: (id: string) => void;
    cargando?: boolean;
}

const ModalInstrumentos: React.FC<ModalInstrumentosProps> = ({
    visible,
    onCerrar,
    botonRef,
    listaInstrumentos,
    instrumentoId,
    onSeleccionarInstrumento,
    cargando
}) => {
    const [estilo, setEstilo] = useState<React.CSSProperties>({ opacity: 0, visibility: 'hidden' });

    useEffect(() => {
        if (visible && botonRef.current) {
            // El modal se posicionará de forma absoluta pero centrada para móvil
            setEstilo({
                opacity: 1,
                visibility: 'visible',
            } as React.CSSProperties);
        }
    }, [visible, botonRef]);

    if (!visible) return null;

    // Filtramos para asegurar que tenemos una lista válida
    const instrumentos = listaInstrumentos || [];

    // El "Acordeón Original" suele tener un ID fijo si no viene en la lista
    const idOriginal = '4e9f2a94-21c0-4029-872e-7cb1c314af69';

    return (
        <>
            <div className="modal-instrumentos-overlay" onClick={onCerrar} />
            <div className="modal-instrumentos-contenedor" style={estilo}>
                <div className="modal-instrumentos-cabecera">
                    <div className="titulo-con-icono">
                        <Music className="icono-titulo" size={18} />
                        <h3 className="modal-instrumentos-titulo">Timbre del Acordeón</h3>
                    </div>
                    <button className="btn-cerrar-inst" onClick={onCerrar}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-instrumentos-cuerpo">
                    <div className="grid-instrumentos">
                        {instrumentos.map((inst) => (
                            <div
                                key={inst.id}
                                className={`card-instrumento ${instrumentoId === inst.id ? 'seleccionado' : ''}`}
                                onClick={() => {
                                    onSeleccionarInstrumento(inst.id);
                                    // No cerramos inmediatamente si queremos ver el feedback de carga
                                }}
                            >
                                <div className="instrumento-imagen-container">
                                    {inst.imagen_url ? (
                                        <img src={inst.imagen_url} alt={inst.nombre} className="instrumento-img" />
                                    ) : (
                                        <div className="instrumento-placeholder">
                                            <span>🪗</span>
                                        </div>
                                    )}
                                    {instrumentoId === inst.id && (
                                        <div className="check-badge">
                                            <Check size={14} strokeWidth={4} />
                                        </div>
                                    )}
                                    {cargando && instrumentoId === inst.id && (
                                        <div className="spinner-overlay">
                                            <Loader2 size={24} className="spinning" />
                                        </div>
                                    )}
                                </div>
                                <div className="instrumento-info">
                                    <span className="inst-nombre-premium">{inst.nombre?.toUpperCase() || 'ACORDEÓN'}</span>
                                    <span className="inst-calidad">{inst.id === idOriginal ? 'Sonido Local' : 'Calidad Ultra HQ'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="contenedor-acciones-inst">
                    <button className="btn-confirmar-instrumento" onClick={onCerrar}>
                        CONFIRMAR INSTRUMENTO
                    </button>
                </div>

                <div className="modal-instrumentos-footer">
                    <p>Sonidos reales grabados en estudio</p>
                </div>
            </div>
        </>
    );
};

export default ModalInstrumentos;
