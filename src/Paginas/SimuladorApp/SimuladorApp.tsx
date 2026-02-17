import React, { useEffect, useState, useRef, useCallback } from 'react';
import './SimuladorApp.css';
import { useLogicaAcordeon } from '../SimuladorDeAcordeon/Hooks/useLogicaAcordeon';
import { mapaTeclas } from '../SimuladorDeAcordeon/mapaTecladoYFrecuencias';
import { RotateCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const SimuladorApp: React.FC = () => {
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
    const pointersMap = useRef<Map<number, string>>(new Map());
    const rootRef = useRef<HTMLDivElement>(null);

    // Lógica maestra del acordeón
    const logica = useLogicaAcordeon({
        direccion: 'halar'
    });

    const ACORDEON_ORIGINAL_ID = '4e9f2a94-21c0-4029-872e-7cb1c314af69';
    const TONALIDAD_5_LETRAS = 'GCF';

    // 🛡️ CONFIGURACIÓN DE RENDIMIENTO
    useEffect(() => {
        const handleResize = () => setIsLandscape(window.innerWidth > window.innerHeight);
        window.addEventListener('resize', handleResize);

        const prevenirMenu = (e: MouseEvent) => e.preventDefault();
        const prevenirGestos = (e: TouchEvent) => {
            if (e.touches.length > 1) e.preventDefault();
        };

        window.addEventListener('contextmenu', prevenirMenu);
        window.addEventListener('touchstart', prevenirGestos, { passive: false });

        // NOTA: NO añadimos 'vista-premium-activa' al body para conservar los menús del sitio.
        // Pero forzamos que el fondo de la página sea negro mientras estemos aquí.
        const originalBg = document.body.style.backgroundColor;
        document.body.style.backgroundColor = '#000';

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('contextmenu', prevenirMenu);
            window.removeEventListener('touchstart', prevenirGestos);
            document.body.style.backgroundColor = originalBg;
            logica.limpiarTodasLasNotas();
        };
    }, []);

    useEffect(() => {
        if (logica.instrumentoId !== ACORDEON_ORIGINAL_ID) logica.setInstrumentoId(ACORDEON_ORIGINAL_ID);
        if (logica.tonalidadSeleccionada !== TONALIDAD_5_LETRAS) logica.setTonalidadSeleccionada(TONALIDAD_5_LETRAS);
    }, [logica.instrumentoId, logica.tonalidadSeleccionada]);

    // ⚡ MOTOR DE INTERACCIÓN DIRECTA (BYPASS REACT RENDERING)
    // Actualizamos el DOM directamente para que los trinos sean instantáneos
    const actualizarVisualBoton = (notaId: string, activo: boolean) => {
        const el = rootRef.current?.querySelector(`[data-nota-id="${notaId}"]`);
        if (el) {
            if (activo) el.classList.add('nota-activa');
            else el.classList.remove('nota-activa');
        }
    };

    const handleGlobalPointerMove = useCallback((e: PointerEvent) => {
        const pointerId = e.pointerId;
        const element = document.elementFromPoint(e.clientX, e.clientY);
        const pitoBoton = element?.closest('.pito-boton') as HTMLElement | null;

        const currentNotaId = pitoBoton?.dataset.notaId || null;
        const previousNotaId = pointersMap.current.get(pointerId);

        if (currentNotaId !== previousNotaId) {
            if (previousNotaId) {
                // LLAMADA SILENCIOSA: No dispara re-render, máxima velocidad
                logica.actualizarBotonActivo(previousNotaId, 'remove', null, true);
                actualizarVisualBoton(previousNotaId, false);
            }
            if (currentNotaId) {
                logica.actualizarBotonActivo(currentNotaId, 'add', null, true);
                actualizarVisualBoton(currentNotaId, true);
            }

            if (currentNotaId) pointersMap.current.set(pointerId, currentNotaId);
            else pointersMap.current.delete(pointerId);
        }
    }, [logica]);

    const handlePointerUp = useCallback((e: PointerEvent) => {
        const pointerId = e.pointerId;
        const lastNotaId = pointersMap.current.get(pointerId);
        if (lastNotaId) {
            logica.actualizarBotonActivo(lastNotaId, 'remove', null, true);
            actualizarVisualBoton(lastNotaId, false);
        }
        pointersMap.current.delete(pointerId);
    }, [logica]);

    useEffect(() => {
        window.addEventListener('pointermove', handleGlobalPointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handleGlobalPointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [handleGlobalPointerMove, handlePointerUp]);

    const hileras = [
        { id: '1', nombre: 'Afuera (1)', clase: 'hilera-afuera', notas: logica.configTonalidad.primeraFila },
        { id: '2', nombre: 'Medio (2)', clase: 'hilera-medio', notas: logica.configTonalidad.segundaFila },
        { id: '3', nombre: 'Adentro (3)', clase: 'hilera-adentro', notas: logica.configTonalidad.terceraFila }
    ];

    return (
        <div ref={rootRef} className="simulador-app-root capa-blindaje-total">
            {/* 📱 PORTRAIT BLOCKER */}
            {!isLandscape && (
                <div className="overlay-rotacion">
                    <div className="icono-rotar"><RotateCw size={80} /></div>
                    <h2>GIRA TU DISPOSITIVO</h2>
                    <p>Para una ejecución profesional, usa el acordeón en modo horizontal.</p>
                </div>
            )}

            {/* 🌬️ INDICADOR DE FUELLE (BARRA SUPERIOR) */}
            <div
                className={`indicador-fuelle ${logica.direccion}`}
                onPointerDown={(e) => { e.preventDefault(); logica.setDireccion('empujar'); }}
                onPointerUp={(e) => { e.preventDefault(); logica.setDireccion('halar'); }}
                onPointerLeave={(e) => { e.preventDefault(); logica.setDireccion('halar'); }}
                style={{ touchAction: 'none' }}
            >
                <div className="fuelle-status">
                    {logica.direccion === 'halar' ? 'HALAR (ABRIENDO)' : 'EMPUJAR (CERRANDO)'}
                </div>
            </div>

            <div className="simulador-canvas">
                <div className="contenedor-pitos-horizontal">
                    {hileras.slice().reverse().map((hilera) => (
                        <div key={hilera.id} className={`hilera-pitos ${hilera.clase}`}>
                            {hilera.notas
                                .filter((n: any) => n.id.includes(logica.direccion))
                                .map((nota: any) => {
                                    const [fila, col] = nota.id.split('-');
                                    const letraTeclado = (Object.keys(mapaTeclas).find(
                                        k => mapaTeclas[k].fila === parseInt(fila) && mapaTeclas[k].columna === parseInt(col)
                                    ) || '').toUpperCase();

                                    return (
                                        <div
                                            key={nota.id}
                                            data-nota-id={nota.id}
                                            className="pito-boton"
                                            onPointerDown={(e) => {
                                                e.preventDefault();
                                                if (!pointersMap.current.has(e.pointerId)) {
                                                    logica.actualizarBotonActivo(nota.id, 'add', null, true);
                                                    actualizarVisualBoton(nota.id, true);
                                                    pointersMap.current.set(e.pointerId, nota.id);
                                                }
                                            }}
                                        >
                                            <div className="info-nota">
                                                <span className="nota-etiqueta">{nota.nombre}</span>
                                                <span className="tecla-computador">{letraTeclado}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    ))}
                </div>
            </div>

            {/* BOTÓN HOME DISCRETO */}
            <Link to="/" style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                zIndex: 10000,
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                padding: '10px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.2)'
            }}>
                <Home size={24} />
            </Link>
        </div>
    );
};

export default SimuladorApp;
