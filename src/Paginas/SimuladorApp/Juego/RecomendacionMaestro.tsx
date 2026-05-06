import React from 'react';
import { GraduationCap, ArrowRight } from 'lucide-react';
import './RecomendacionMaestro.css';

interface Props {
    precision: number;
    onPracticarMaestro: () => void;
    umbral?: number; // por defecto 60%
}

// Banner que aparece en la pantalla de fin de juego cuando el alumno tuvo
// puntaje bajo. Lo invita a practicar la cancion en modo Maestro (donde
// puede bajar BPM, hacer loop A/B y pasar la seccion en su tiempo) antes
// de volver a competir.
const RecomendacionMaestro: React.FC<Props> = ({ precision, onPracticarMaestro, umbral = 60 }) => {
    if (precision >= umbral) return null;

    const mensaje = precision < 30
        ? 'Esta canción está difícil. Practica primero en modo Maestro para dominarla.'
        : precision < 50
            ? 'Aún te falta. Practica la sección en modo Maestro y vuelve a intentarlo.'
            : 'Estuviste cerca. Refina la sección en modo Maestro a tu propio ritmo.';

    return (
        <div className="recom-maestro" role="status">
            <div className="recom-maestro-icono">
                <GraduationCap size={20} />
            </div>
            <div className="recom-maestro-textos">
                <strong>Recomendación</strong>
                <span>{mensaje}</span>
            </div>
            <button
                type="button"
                className="recom-maestro-btn"
                onClick={onPracticarMaestro}
            >
                Practicar <ArrowRight size={14} />
            </button>
        </div>
    );
};

export default RecomendacionMaestro;
