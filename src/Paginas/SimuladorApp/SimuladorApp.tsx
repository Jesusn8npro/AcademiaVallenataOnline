import React, { useEffect, useState, useRef, useCallback } from 'react';
import './SimuladorApp.css';
import { useLogicaAcordeon } from '../SimuladorDeAcordeon/Hooks/useLogicaAcordeon';
import { mapaTeclas } from '../SimuladorDeAcordeon/mapaTecladoYFrecuencias';
import { RotateCw } from 'lucide-react';

const SimuladorApp: React.FC = () => {
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
    const pointersMap = useRef<Map<number, string>>(new Map()); // CID (PointerId) -> NotaId actual

    // Lógica maestra del acordeón
    const logica = useLogicaAcordeon({
        direccion: 'halar'
    });

    const ACORDEON_ORIGINAL_ID = '4e9f2a94-21c0-4029-872e-7cb1c314af69';
    const TONALIDAD_5_LETRAS = 'GCF';

    // 🛡️ EFECTOS DE LIMPIEZA Y CONFIGURACIÓN INICIAL
    useEffect(() => {
        const handleResize = () => setIsLandscape(window.innerWidth > window.innerHeight);
        window.addEventListener('resize', handleResize);

        const prevenirMenu = (e: MouseEvent) => e.preventDefault();
        const prevenirGestos = (e: TouchEvent) => {
            if (e.touches.length > 1) e.preventDefault();
        };

        window.addEventListener('contextmenu', prevenirMenu);
        window.addEventListener('touchstart', prevenirGestos, { passive: false });
        document.body.classList.add('vista-premium-activa');

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('contextmenu', prevenirMenu);
            window.removeEventListener('touchstart', prevenirGestos);
            document.body.classList.remove('vista-premium-activa');
            logica.limpiarTodasLasNotas(); // ⚡ LIMPIEZA TOTAL AL SALIR
        };
    }, []);

    // Sincronizar instrumento y tonalidad por defecto para la App
    useEffect(() => {
        if (logica.instrumentoId !== ACORDEON_ORIGINAL_ID) logica.setInstrumentoId(ACORDEON_ORIGINAL_ID);
        if (logica.tonalidadSeleccionada !== TONALIDAD_5_LETRAS) logica.setTonalidadSeleccionada(TONALIDAD_5_LETRAS);
    }, [logica.instrumentoId, logica.tonalidadSeleccionada]);

    // ⚡ MOTOR DE GLISSANDO MULTI-TOUCH ULTRA FLUIDO
    const handleGlobalPointerMove = useCallback((e: PointerEvent) => {
        const pointerId = e.pointerId;
        const element = document.elementFromPoint(e.clientX, e.clientY);
        const pitoBoton = element?.closest('.pito-boton') as HTMLElement | null;

        const currentNotaId = pitoBoton?.dataset.notaId || null;
        const previousNotaId = pointersMap.current.get(pointerId);

        if (currentNotaId !== previousNotaId) {
            // Si el dedo se movió a una nueva nota o salió de una
            if (previousNotaId) {
                logica.actualizarBotonActivo(previousNotaId, 'remove');
            }
            if (currentNotaId) {
                logica.actualizarBotonActivo(currentNotaId, 'add');
            }

            if (currentNotaId) {
                pointersMap.current.set(pointerId, currentNotaId);
            } else {
                pointersMap.current.delete(pointerId);
            }
        }
    }, [logica]);

    const handlePointerUp = useCallback((e: PointerEvent) => {
        const pointerId = e.pointerId;
        const lastNotaId = pointersMap.current.get(pointerId);
        if (lastNotaId) {
            logica.actualizarBotonActivo(lastNotaId, 'remove');
        }
        pointersMap.current.delete(pointerId);
    }, [logica]);

    // Registrar eventos globales para capturar movimientos fuera de los pitos
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
        <div className="simulador-app-root capa-blindaje-total">
            {/* 📱 PORTRAIT BLOCKER */}
            {!isLandscape && (
                <div className="overlay-rotacion">
                    <div className="icono-rotar"><RotateCw size={80} /></div>
                    <h2>GIRA TU DISPOSITIVO</h2>
                    <p>Para una experiencia profesional, usa el acordeón en modo horizontal.</p>
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
                                            className={`pito-boton ${logica.botonesActivos[nota.id] ? 'activo' : ''}`}
                                            onPointerDown={(e) => {
                                                e.preventDefault();
                                                // El motor de glissando global se encarga de esto via movement
                                                // pero el Down inicial ayuda a la latencia
                                                if (!pointersMap.current.has(e.pointerId)) {
                                                    logica.actualizarBotonActivo(nota.id, 'add');
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
        </div>
    );
};

export default SimuladorApp;
