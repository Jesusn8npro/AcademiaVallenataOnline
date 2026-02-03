import React, { useEffect, useState } from 'react';
import type { EstadoJuego, TipoPuntuacion } from '../../hooks/useMotorDeJuego';

interface TableroPuntosProps {
    estado: EstadoJuego;
}

const TableroPuntos: React.FC<TableroPuntosProps> = ({ estado }) => {
    const [animacionFeedback, setAnimacionFeedback] = useState('');

    useEffect(() => {
        if (estado.ultimoFeedback) {
            setAnimacionFeedback('animar-entrada');
            const timer = setTimeout(() => setAnimacionFeedback(''), 500);
            return () => clearTimeout(timer);
        }
    }, [estado.ultimoFeedback]);

    const getColorFeedback = (tipo: TipoPuntuacion | undefined) => {
        switch (tipo) {
            case 'Perfect': return '#22c55e'; // Green
            case 'Good': return '#f59e0b'; // Amber
            case 'Offbeat': return '#f97316'; // Orange
            case 'Miss': return '#ef4444'; // Red
            default: return 'white';
        }
    };

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            zIndex: 100,
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            pointerEvents: 'none'
        }}>
            {/* Puntuación Principal */}
            <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: 'white',
                fontFamily: 'monospace'
            }}>
                {estado.puntuacion.toLocaleString()}
            </div>

            {/* Barra de Combo w/ Multiplicador */}
            {estado.combo > 0 && (
                <div style={{
                    fontSize: '1.5rem',
                    color: '#fbbf24',
                    fontWeight: 'bold',
                    animation: 'pulse 0.5s infinite alternate'
                }}>
                    COMBO x{estado.combo}
                </div>
            )}

            {/* Feedback Visual (Perfect/Miss) */}
            {estado.ultimoFeedback && (
                <div
                    className={animacionFeedback}
                    style={{
                        fontSize: '4rem',
                        fontWeight: '900',
                        color: getColorFeedback(estado.ultimoFeedback.tipo),
                        transform: animacionFeedback ? 'scale(1.2)' : 'scale(1)',
                        transition: 'transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        marginTop: '20px'
                    }}
                >
                    {estado.ultimoFeedback.tipo.toUpperCase()}!
                </div>
            )}

            {/* Barra de Salud (Simple) */}
            <div style={{
                width: '300px',
                height: '10px',
                background: '#333',
                borderRadius: '5px',
                overflow: 'hidden',
                marginTop: '10px',
                border: '1px solid #555'
            }}>
                <div style={{
                    width: `${estado.salud}%`,
                    height: '100%',
                    background: estado.salud > 50 ? '#22c55e' : estado.salud > 20 ? '#f59e0b' : '#ef4444',
                    transition: 'width 0.2s ease-out, background 0.2s'
                }} />
            </div>

            <style>{`
                @keyframes pulse {
                    from { transform: scale(1); opacity: 0.9; }
                    to { transform: scale(1.1); opacity: 1; }
                }
                .animar-entrada {
                    animation: popup 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                @keyframes popup {
                    0% { transform: scale(0.5); opacity: 0; }
                    50% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default TableroPuntos;
