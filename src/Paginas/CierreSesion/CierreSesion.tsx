import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CierreSesion.css';

const CierreSesion: React.FC = () => {
    const navigate = useNavigate();
    const DURACION_SEGUNDOS = 5;
    const [segundosRestantes, setSegundosRestantes] = useState(DURACION_SEGUNDOS);

    // Cálculo círculo progreso
    const radio = 28;
    const circunferencia = 2 * Math.PI * radio;
    const offset = circunferencia - (segundosRestantes / DURACION_SEGUNDOS) * circunferencia;

    useEffect(() => {
        const intervalo = setInterval(() => {
            setSegundosRestantes((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalo);
                    navigate('/');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalo);
    }, [navigate]);

    return (
        <div className="cierre-sesion-container">
            <div className="tarjeta-despedida">
                <div className="icono-wrapper">
                    <div className="icono-circulo">
                        <span className="icono-check">✓</span>
                    </div>
                </div>

                <h1 className="titulo-despedida">¡Sesión Cerrada!</h1>
                <p className="mensaje-despedida">
                    Gracias por practicar hoy. Tu progreso ha sido guardado correctamente.
                    <br />¡Te esperamos pronto! 🎹
                </p>

                <div className="contador-container">
                    <svg width="80" height="80" className="contador-svg">
                        <circle
                            className="circulo-fondo"
                            strokeWidth="4"
                            fill="transparent"
                            r={radio}
                            cx="40"
                            cy="40"
                        />
                        <circle
                            className="circulo-progreso"
                            strokeWidth="4"
                            strokeLinecap="round"
                            fill="transparent"
                            r={radio}
                            cx="40"
                            cy="40"
                            style={{ strokeDasharray: circunferencia, strokeDashoffset: offset }}
                        />
                    </svg>
                    <span className="contador-numero">{segundosRestantes}</span>
                </div>
                <span className="texto-redireccion">Redirigiendo al inicio...</span>

                <div style={{ marginTop: '2rem' }}></div>

                <div className="acciones-container">
                    <button onClick={() => navigate('/')} className="btn btn-secundario">
                        Volver al Inicio
                    </button>
                    <button onClick={() => navigate('/login')} className="btn btn-primario">
                        Iniciar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CierreSesion;
