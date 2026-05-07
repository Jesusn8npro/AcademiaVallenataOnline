import React, { useEffect, useState } from 'react';
import type { EfectoGolpe } from '../../../AcordeonProMax/TiposProMax';

/**
 * Overlay de feedback durante el juego.
 *
 * Muestra texto flotante "¡PERFECTO!" / "¡BIEN!" / "¡TARDE!" sobre el pito al
 * impactar una nota. Reusa los `efectosVisuales` que ya emite el motor —
 * sin logica nueva. El combo / multiplicador vive en el HeaderJuegoSimulador
 * (no duplicar — antes habia un combo gigante aqui que tapaba el titulo).
 */
interface Props {
    efectosVisuales: EfectoGolpe[];
}

const TEXTOS: Record<EfectoGolpe['resultado'], string> = {
    perfecto: '¡PERFECTO!',
    bien:     '¡BIEN!',
    fallada:  '¡TARDE!',
    perdida:  '',
};

const COLORES: Record<EfectoGolpe['resultado'], string> = {
    perfecto: '#22c55e',
    bien:     '#facc15',
    fallada:  '#fb923c',
    perdida:  '#9ca3af',
};

const ESTILOS = `
.juicio-juego-hit {
    position: fixed;
    z-index: 65;
    pointer-events: none;
    user-select: none;
    font-family: 'Raleway', system-ui, sans-serif;
    font-weight: 900;
    font-size: clamp(1.1rem, 3.5vw, 1.8rem);
    letter-spacing: 1px;
    text-shadow:
        0 0 12px currentColor,
        0 2px 6px rgba(0, 0, 0, 0.9);
    animation: juicio-hit-flotar 0.7s ease-out forwards;
    transform: translate(-50%, -50%);
    white-space: nowrap;
}
@keyframes juicio-hit-flotar {
    0%   { opacity: 0; transform: translate(-50%, -10%)  scale(0.7);  }
    25%  { opacity: 1; transform: translate(-50%, -60%)  scale(1.15); }
    100% { opacity: 0; transform: translate(-50%, -160%) scale(1.05); }
}
`;

const JuicioJuego: React.FC<Props> = ({ efectosVisuales }) => {
    const ultimo = efectosVisuales.length > 0 ? efectosVisuales[efectosVisuales.length - 1] : null;
    const [hitVisible, setHitVisible] = useState<EfectoGolpe | null>(null);

    useEffect(() => {
        if (!ultimo || ultimo.resultado === 'perdida' || !TEXTOS[ultimo.resultado]) {
            return;
        }
        setHitVisible(ultimo);
        const t = setTimeout(() => {
            setHitVisible(prev => (prev?.id === ultimo.id ? null : prev));
        }, 700);
        return () => clearTimeout(t);
    }, [ultimo]);

    if (!hitVisible) return null;

    return (
        <>
            <style>{ESTILOS}</style>
            <div
                key={hitVisible.id}
                className="juicio-juego-hit"
                style={{
                    left: `${hitVisible.x}px`,
                    top: `${hitVisible.y}px`,
                    color: COLORES[hitVisible.resultado],
                }}
            >
                {TEXTOS[hitVisible.resultado]}
            </div>
        </>
    );
};

export default React.memo(JuicioJuego);
