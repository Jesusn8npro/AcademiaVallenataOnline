import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProximamentePage.css';

interface TiempoRestante {
    dias: number;
    horas: number;
    minutos: number;
    segundos: number;
}

const ProximamentePage: React.FC = () => {
    const navigate = useNavigate();
    const [tiempoRestante, setTiempoRestante] = useState<TiempoRestante>({
        dias: 0,
        horas: 0,
        minutos: 0,
        segundos: 0
    });

    // Fecha de lanzamiento: 7 días desde ahora
    const FECHA_LANZAMIENTO = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    useEffect(() => {
        const actualizarContador = () => {
            const ahora = new Date();
            const diff = FECHA_LANZAMIENTO.getTime() - ahora.getTime();

            if (diff <= 0) {
                setTiempoRestante({
                    dias: 0,
                    horas: 0,
                    minutos: 0,
                    segundos: 0
                });
                return;
            }

            setTiempoRestante({
                dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
                horas: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutos: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                segundos: Math.floor((diff % (1000 * 60)) / 1000)
            });
        };

        // Actualizar inmediatamente
        actualizarContador();

        // Actualizar cada segundo
        const intervalo = setInterval(actualizarContador, 1000);

        return () => clearInterval(intervalo);
    }, []);

    const formatoNumero = (num: number): string => {
        return String(num).padStart(2, '0');
    };

    return (
        <div className="proximamente-container">
            <div className="proximamente-contenido">
                {/* Logo */}
                <div className="proximamente-logo">
                    <img src="/logo.png" alt="Academia Vallenata Online" style={{ maxWidth: '200px', marginBottom: '2rem' }} />
                </div>

                {/* Ícono musical */}
                <div className="proximamente-icono">
                    🪗
                </div>

                {/* Título */}
                <h1 className="proximamente-titulo">
                    Acordeón Pro Max
                </h1>

                {/* Subtítulo */}
                <h2 className="proximamente-subtitulo">
                    Estamos finalizando y actualizando esta funcionalidad
                </h2>

                {/* Mensaje */}
                <p className="proximamente-mensaje">
                    Muy pronto tendrás acceso a una experiencia completamente renovada para aprender acordeón como nunca antes. ¡Prepárate para lo increíble!
                </p>

                {/* Contador regresivo */}
                <div className="contador-regresivo">
                    <div className="caja-tiempo">
                        <div className="numero-tiempo">
                            {formatoNumero(tiempoRestante.dias)}
                        </div>
                        <div className="label-tiempo">DÍAS</div>
                    </div>

                    <div className="caja-tiempo">
                        <div className="numero-tiempo">
                            {formatoNumero(tiempoRestante.horas)}
                        </div>
                        <div className="label-tiempo">HORAS</div>
                    </div>

                    <div className="caja-tiempo">
                        <div className="numero-tiempo">
                            {formatoNumero(tiempoRestante.minutos)}
                        </div>
                        <div className="label-tiempo">MIN</div>
                    </div>

                    <div className="caja-tiempo">
                        <div className="numero-tiempo">
                            {formatoNumero(tiempoRestante.segundos)}
                        </div>
                        <div className="label-tiempo">SEG</div>
                    </div>
                </div>

                {/* Botón volver */}
                <button className="boton-volver" onClick={() => navigate('/mis-cursos')}>
                    ← Ir a Mis Cursos
                </button>

                {/* Mensaje adicional */}
                <p className="proximamente-footer">
                    ✉️ Déjanos saber si tienes sugerencias en <strong>contacto@academiavallenataonline.com</strong>
                </p>
            </div>
        </div>
    );
};

export default ProximamentePage;
