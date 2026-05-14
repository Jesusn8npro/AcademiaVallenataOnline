import React, { useState, useRef, useEffect } from 'react';
import type { ModoVisual } from '../Hooks/useModoVisualPersistido';

interface OpcionModo {
    id: ModoVisual;
    titulo: string;
    icono: string;
    descripcion: string;
}

// 'highway' y 'carril' OCULTOS del dropdown — los componentes siguen
// funcionales en el codigo (PistaNotasHighway.tsx, PistaNotasCarril.tsx) y
// pueden re-habilitarse agregando la entrada aqui. Por ahora el usuario
// solo quiere ver: Synth, Libre Pro, Foco, Guia.
const OPCIONES: OpcionModo[] = [
    { id: 'boxed-libre', titulo: 'Libre Pro', icono: '⇣',  descripcion: 'Cajita arriba, canción no pausa' },
    { id: 'boxed',       titulo: 'Synth',     icono: '☐',  descripcion: 'Cajita Synthesia, espera nota' },
    { id: 'guia',        titulo: 'Guía',      icono: '✎',  descripcion: 'Notas + banner ABRE/CIERRA' },
    { id: 'foco',        titulo: 'Foco',      icono: '◉',  descripcion: 'Solo la nota actual, minimal' },
];

interface Props {
    modoActual: ModoVisual;
    onCambiar: (m: ModoVisual) => void;
}

const ESTILOS = `
.selector-modo {
    position: relative;
    font-family: 'Raleway', system-ui, sans-serif;
}
.selector-modo-trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px 5px 9px;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 999px;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.4px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.45);
}
.selector-modo-trigger:hover {
    background: rgba(0, 0, 0, 0.78);
    border-color: rgba(251, 191, 36, 0.55);
}
.selector-modo-icono {
    color: #fbbf24;
    font-weight: 900;
    font-size: 13px;
    line-height: 1;
}
.selector-modo-flecha {
    color: rgba(255, 255, 255, 0.6);
    font-size: 9px;
    margin-left: 2px;
}
.selector-modo-popup {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    min-width: 240px;
    background: linear-gradient(180deg, #1a1d2e 0%, #0e0f1c 100%);
    border: 2px solid rgba(255, 255, 255, 0.18);
    border-radius: 12px;
    padding: 5px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    z-index: 1000;
    box-shadow:
        0 16px 40px rgba(0, 0, 0, 0.6),
        0 0 0 1px rgba(255, 255, 255, 0.04) inset;
    animation: selector-modo-aparecer 0.16s ease-out;
}
@keyframes selector-modo-aparecer {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
}
.selector-modo-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.85);
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.12s ease;
}
.selector-modo-item:hover { background: rgba(255, 255, 255, 0.06); }
.selector-modo-item.activo {
    background: rgba(251, 191, 36, 0.16);
    border-color: rgba(251, 191, 36, 0.55);
}
.selector-modo-item-icono {
    color: #fbbf24;
    font-size: 18px;
    font-weight: 900;
    flex-shrink: 0;
    width: 22px;
    text-align: center;
}
.selector-modo-item-textos {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
}
.selector-modo-item-titulo {
    font-size: 0.84rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: 0.3px;
}
.selector-modo-item.activo .selector-modo-item-titulo { color: #fbbf24; }
.selector-modo-item-desc {
    font-size: 0.68rem;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 500;
    line-height: 1.2;
}
@media (max-width: 720px) {
    .selector-modo-popup { min-width: 220px; }
    .selector-modo-item { padding: 7px 8px; gap: 8px; }
    .selector-modo-item-titulo { font-size: 0.78rem; }
    .selector-modo-item-desc { font-size: 0.62rem; }
}
`;

const SelectorModoVisual: React.FC<Props> = ({ modoActual, onCambiar }) => {
    const [abierto, setAbierto] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

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
            <style>{ESTILOS}</style>
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

export default React.memo(SelectorModoVisual);
