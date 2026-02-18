import React, { useEffect, useState, useCallback, useRef } from 'react';
import { RotateCw } from 'lucide-react';
import { motion, useMotionValue } from 'framer-motion';
import { useLogicaAcordeon } from '../SimuladorDeAcordeon/Hooks/useLogicaAcordeon';
import BarraHerramientas from './Componentes/BarraHerramientas';
import './SimuladorApp.css';

const SimuladorApp: React.FC = () => {
    const logica = useLogicaAcordeon();
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
    const pointersMap = useRef<Map<number, string | null>>(new Map());
    const marcoRef = useRef<HTMLDivElement>(null);
    const [escala, setEscala] = useState(1.0); // 🎯 Escala base

    // Motion value para el desplazamiento X
    const x = useMotionValue(0);

    // Aplicar escala a nivel raiz para que el CSS la use
    useEffect(() => {
        document.documentElement.style.setProperty('--escala-acordeon', escala.toString());
    }, [escala]);

    // Detección de orientación
    useEffect(() => {
        const handleResize = () => setIsLandscape(window.innerWidth > window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 🎯 ACTUALIZACIÓN VISUAL ULTRA-RÁPIDA (Bypass React)
    const actualizarVisualBoton = (notaId: string, activo: boolean) => {
        const pitoElement = document.querySelector(`[data-nota-id="${notaId}"]`);
        if (pitoElement) {
            if (activo) pitoElement.classList.add('nota-activa');
            else pitoElement.classList.remove('nota-activa');
        }
    };

    // 🖐️ MOTOR DE GLISSANDO MEJORADO (Multi-touch)
    const handleGlobalPointerMove = useCallback((e: PointerEvent) => {
        const pointerId = e.pointerId;
        const element = document.elementFromPoint(e.clientX, e.clientY);
        const pitoBoton = element?.closest('.pito-boton') as HTMLElement | null;

        const currentNotaId = pitoBoton?.dataset.notaId || null;
        const previousNotaId = pointersMap.current.get(pointerId);

        if (currentNotaId !== previousNotaId) {
            if (previousNotaId) {
                logica.actualizarBotonActivo(previousNotaId, 'remove', null, true);
                actualizarVisualBoton(previousNotaId, false);
            }
            if (currentNotaId) {
                logica.actualizarBotonActivo(currentNotaId, 'add', null, true);
                actualizarVisualBoton(currentNotaId, true);
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


    // Filtrar hileras por dirección actual
    const pitosAfuera = logica.configTonalidad?.primeraFila?.filter((n: any) => n.id.includes(logica.direccion)) || [];
    const pitosMedio = logica.configTonalidad?.segundaFila?.filter((n: any) => n.id.includes(logica.direccion)) || [];
    const pitosAdentro = logica.configTonalidad?.terceraFila?.filter((n: any) => n.id.includes(logica.direccion)) || [];

    const trenRef = useRef<HTMLDivElement>(null);

    // 🚂 TREN DE BOTONES (Contenedor Móvil con Framer Motion)
    return (
        <div className={`simulador-app-root capa-blindaje-total modo-${logica.direccion}`}>

            {/* 🌬️ 1. INDICADOR DE FUELLE */}
            <div
                className={`indicador-fuelle ${logica.direccion === 'empujar' ? 'empujar' : 'halar'}`}
                onClick={() => logica.setDireccion(logica.direccion === 'halar' ? 'empujar' : 'halar')}
            >
                <span className="fuelle-status">
                    {logica.direccion === 'empujar' ? 'EMPUJAR (CERRANDO)' : 'HALAR (ABRIENDO)'}
                </span>
            </div>

            {/* 🪗 3. CONTENEDOR DEL ACORDEÓN (Pegado abajo) */}
            <div className="contenedor-acordeon-completo">
                <div className="simulador-canvas">
                    {/* Barra de Herramientas con control remoto */}
                    <BarraHerramientas
                        x={x}
                        marcoRef={marcoRef}
                        escala={escala}
                        setEscala={setEscala}
                    />

                    {/* Marco del Diapasón (La ventana fija) */}
                    <div className="diapason-marco" ref={marcoRef}>
                        <motion.div
                            ref={trenRef}
                            className="tren-botones-deslizable"
                            drag="x"
                            style={{ x }}
                            dragConstraints={marcoRef}
                            dragElastic={0.05}
                        >
                            {/* HILERA AFUERA */}
                            <div className="hilera-pitos hilera-afuera">
                                {pitosAfuera.map((nota: any) => (
                                    <div
                                        key={nota.id}
                                        className="pito-boton"
                                        data-nota-id={nota.id}
                                        onPointerDown={() => {
                                            logica.actualizarBotonActivo(nota.id, 'add', null, true);
                                            actualizarVisualBoton(nota.id, true);
                                        }}
                                    >
                                        <span className="nota-etiqueta">{nota.nombre}</span>
                                        {nota.tecla && <span className="tecla-computador">{nota.tecla}</span>}
                                    </div>
                                ))}
                            </div>

                            {/* HILERA MEDIO */}
                            <div className="hilera-pitos hilera-medio">
                                {pitosMedio.map((nota: any) => (
                                    <div
                                        key={nota.id}
                                        className="pito-boton"
                                        data-nota-id={nota.id}
                                        onPointerDown={() => {
                                            logica.actualizarBotonActivo(nota.id, 'add', null, true);
                                            actualizarVisualBoton(nota.id, true);
                                        }}
                                    >
                                        <span className="nota-etiqueta">{nota.nombre}</span>
                                        {nota.tecla && <span className="tecla-computador">{nota.tecla}</span>}
                                    </div>
                                ))}
                            </div>

                            {/* HILERA ADENTRO */}
                            <div className="hilera-pitos hilera-adentro">
                                {pitosAdentro.map((nota: any) => (
                                    <div
                                        key={nota.id}
                                        className="pito-boton"
                                        data-nota-id={nota.id}
                                        onPointerDown={() => {
                                            logica.actualizarBotonActivo(nota.id, 'add', null, true);
                                            actualizarVisualBoton(nota.id, true);
                                        }}
                                    >
                                        <span className="nota-etiqueta">{nota.nombre}</span>
                                        {nota.tecla && <span className="tecla-computador">{nota.tecla}</span>}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Overlay de Orientación */}
            {!isLandscape && (
                <div className="overlay-rotacion">
                    <div className="icono-rotar"><RotateCw size={80} /></div>
                    <h2>GIRA TU DISPOSITIVO</h2>
                    <p>Para una experiencia profesional, usa el acordeón en modo horizontal.</p>
                </div>
            )}
        </div>
    );
};

export default SimuladorApp;
