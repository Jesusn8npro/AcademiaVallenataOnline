import React, { useState, useRef, useEffect } from 'react';
import type { ModoVisual } from './useModoVisualPersistido';
import './SelectorModoVisual.css';

interface OpcionModo {
    id: ModoVisual;
    titulo: string;
    icono: string;
    descripcion: string;
}

const OPCIONES: OpcionModo[] = [
    { id: 'cayendo', titulo: 'Libre',     icono: '↓',  descripcion: 'Notas cayendo sobre los pitos' },
    { id: 'boxed',   titulo: 'Synth',     icono: '☐',  descripcion: 'Cajita Synthesia, espera nota' },
    { id: 'guia',    titulo: 'Guía',      icono: '✎',  descripcion: 'Texto ABRIENDO o CERRANDO' },
    { id: 'foco',    titulo: 'Foco',      icono: '◉',  descripcion: 'Solo la nota actual, minimal' },
    { id: 'carril',  titulo: 'Carril',    icono: '⇅',  descripcion: 'Fondo cambia con el fuelle' },
];

interface Props {
    modoActual: ModoVisual;
    onCambiar: (m: ModoVisual) => void;
}

const SelectorModoVisual: React.FC<Props> = ({ modoActual, onCambiar }) => {
    const [abierto, setAbierto] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Cierra al click fuera
    useEffect(() => {
        if (!abierto) return;
        const onClick = (e: MouseEvent | TouchEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
        };
        document.addEventListener('click', onClick);
        document.addEventListener('touchstart', onClick);
        return () => {
            document.removeEventListener('click', onClick);
            document.removeEventListener('touchstart', onClick);
        };
    }, [abierto]);

    const opcionActual = OPCIONES.find(o => o.id === modoActual) || OPCIONES[0];

    return (
        <div className="selector-modo" ref={ref} data-touch-allow>
            <button
                type="button"
                className="selector-modo-trigger"
                onClick={() => setAbierto(v => !v)}
                aria-haspopup="listbox"
                aria-expanded={abierto}
                title={opcionActual.descripcion}
            >
                <span className="selector-modo-icono">{opcionActual.icono}</span>
                <span className="selector-modo-titulo">{opcionActual.titulo}</span>
                <span className="selector-modo-flecha">{abierto ? '▴' : '▾'}</span>
            </button>

            {abierto && (
                <div className="selector-modo-popup" role="listbox">
                    {OPCIONES.map((o) => (
                        <button
                            key={o.id}
                            type="button"
                            className={`selector-modo-item ${o.id === modoActual ? 'activo' : ''}`}
                            onClick={() => { onCambiar(o.id); setAbierto(false); }}
                            role="option"
                            aria-selected={o.id === modoActual}
                        >
                            <span className="selector-modo-item-icono">{o.icono}</span>
                            <div className="selector-modo-item-textos">
                                <span className="selector-modo-item-titulo">{o.titulo}</span>
                                <span className="selector-modo-item-desc">{o.descripcion}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SelectorModoVisual;
