import React from 'react';
import { X } from 'lucide-react';
import type { useMetronomo } from '../../Hooks/useMetronomo';
import PanelMetronomoInline from './PanelMetronomoInline';
import './ModalMetronomo.css';

interface ModalMetronomoProps {
    visible: boolean;
    onCerrar: () => void;
    bpm: number;
    setBpm: React.Dispatch<React.SetStateAction<number>>;
    met: ReturnType<typeof useMetronomo>;
}

const ModalMetronomo: React.FC<ModalMetronomoProps> = ({ visible, onCerrar, bpm, setBpm, met }) => {
    if (!visible) return null;

    return (
        <>
            <div className="modal-metronomo-overlay" onClick={onCerrar} />
            <div className="modal-metronomo-contenedor">
                <div className="modal-metronomo-cabecera">
                    <h3 className="modal-metronomo-titulo">Metrónomo</h3>
                    <button className="btn-cerrar-metronomo" onClick={onCerrar}>
                        <X size={18} />
                    </button>
                </div>

                <PanelMetronomoInline met={met} bpm={bpm} setBpm={setBpm} />

                <div className="modal-metronomo-footer">
                    <p>Precisión rítmica profesional</p>
                </div>
            </div>
        </>
    );
};

export default ModalMetronomo;
