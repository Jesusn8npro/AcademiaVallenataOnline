import React, { useEffect, useState } from 'react';

/**
 * Barra de progreso que muestra cuánto ha leído el usuario del artículo.
 * Se fija en la parte superior de la ventana.
 */
const BarraProgresoLectura = () => {
    const [progreso, setProgreso] = useState(0);

    useEffect(() => {
        const calcularProgreso = () => {
            // Altura total del documento
            const alturaTotal = document.documentElement.scrollHeight - document.documentElement.clientHeight;

            // Posición actual del scroll
            const scrollActual = window.scrollY;

            if (alturaTotal === 0) {
                setProgreso(0);
                return;
            }

            // Calcular porcentaje
            const porcentaje = (scrollActual / alturaTotal) * 100;

            // Asegurar que esté entre 0 y 100
            setProgreso(Math.min(100, Math.max(0, porcentaje)));
        };

        // Calcular inicialmente
        calcularProgreso();

        // Escuchar evento de scroll
        window.addEventListener('scroll', calcularProgreso, { passive: true });

        return () => {
            window.removeEventListener('scroll', calcularProgreso);
        };
    }, []);

    if (progreso === 0) return null; // Opcional: no mostrar si está al inicio

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: `${progreso}%`,
                height: '4px',
                backgroundColor: '#8b5cf6', // Violeta-500 (ajustar al tono exacto de Svelte si es necesario)
                zIndex: 9999, // Por encima de casi todo, pero quizás debajo de modales críticos
                boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)', // Brillo suave
                transition: 'width 0.1s ease-out'
            }}
            aria-hidden="true"
        />
    );
};

export default BarraProgresoLectura;
