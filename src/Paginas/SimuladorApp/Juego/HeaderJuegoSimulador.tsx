import React from 'react';
import { Pause, X, Heart } from 'lucide-react';
import './HeaderJuegoSimulador.css';

interface HeaderJuegoSimuladorProps {
    titulo: string;
    autor?: string;
    puntos: number;
    vida: number;
    racha: number;
    multiplicador: number;
    mostrarVida: boolean;
    onPausa: () => void;
    onSalir: () => void;
}

const HeaderJuegoSimulador: React.FC<HeaderJuegoSimuladorProps> = ({
    titulo, autor, puntos, vida, racha, multiplicador, mostrarVida, onPausa, onSalir
}) => {
    return (
        <header className="header-juego-sim">
            <div className="hjs-izq">
                <button className="hjs-btn" onClick={onPausa} aria-label="Pausa">
                    <Pause size={18} fill="currentColor" />
                </button>
                <button className="hjs-btn" onClick={onSalir} aria-label="Salir">
                    <X size={18} />
                </button>
            </div>

            <div className="hjs-centro">
                <div className="hjs-titulo">{titulo}</div>
                {autor && <div className="hjs-autor">{autor}</div>}
            </div>

            <div className="hjs-der">
                {mostrarVida && (
                    <div className="hjs-vida" title={`Vida: ${vida}%`}>
                        <Heart size={14} fill={vida > 30 ? '#ef4444' : '#f59e0b'} color={vida > 30 ? '#ef4444' : '#f59e0b'} />
                        <span>{Math.max(0, Math.round(vida))}</span>
                    </div>
                )}

                {racha > 1 && (
                    <div className="hjs-racha">
                        x{multiplicador}
                        <span className="hjs-racha-combo">{racha} combo</span>
                    </div>
                )}

                <div className="hjs-puntos">
                    <span className="hjs-puntos-valor">{puntos.toLocaleString()}</span>
                    <span className="hjs-puntos-label">PTS</span>
                </div>
            </div>
        </header>
    );
};

export default HeaderJuegoSimulador;
