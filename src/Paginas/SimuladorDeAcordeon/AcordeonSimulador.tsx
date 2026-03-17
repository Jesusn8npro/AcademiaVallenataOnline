import React, { forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Music } from 'lucide-react';
import './AcordeonSimulador.css';

// Hooks
import { useLogicaAcordeon } from './Hooks/useLogicaAcordeon';

// Componentes
import BotonesControl from './Componentes/BotonesControl';
import CuerpoAcordeon from './Componentes/CuerpoAcordeon';
import PanelAjustes from './Componentes/PanelAjustes/PanelAjustes';

// Tipos
import type { AcordeonSimuladorProps, AcordeonSimuladorHandle } from './TiposAcordeon';

// Assets
const bgAcordeonDefault = '/AcordeonJugador.png';

/**
 * 🪗 ACORDEÓN SIMULADOR V-PRO
 * El componente principal rediseñado y refactorizado para máxima legibilidad y rendimiento.
 */
const AcordeonSimulador = forwardRef<AcordeonSimuladorHandle, AcordeonSimuladorProps>((props, ref) => {
    const {
        imagenFondo = bgAcordeonDefault,
    } = props;

    // Extraemos toda la lógica pesada al hook personalizado
    const logica = useLogicaAcordeon(props);

    // Efecto para manejar la visibilidad del cursor en modo ajuste
    React.useEffect(() => {
        if (logica.modoAjuste) {
            document.body.classList.add('diseno-activo');
        } else {
            document.body.classList.remove('diseno-activo');
        }
        return () => document.body.classList.remove('diseno-activo');
    }, [logica.modoAjuste]);

    // Exponemos métodos al exterior usando el ref
    useImperativeHandle(ref, () => ({
        limpiarTodasLasNotas: logica.limpiarTodasLasNotas,
        cambiarDireccion: (nuevaDireccion: 'halar' | 'empujar') => {
            logica.setDireccion(nuevaDireccion);
            logica.limpiarTodasLasNotas();
        }
    }));

    return (
        <div className="simulador-acordeon-root" style={{
            width: '100%',
            height: '100vh',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#000',
            userSelect: 'none'
        }}>
            {/* ✨ CARGADOR PREMIUM (Carga Inicial) */}
            <AnimatePresence>
                {!logica.disenoCargado && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 10000000,
                            background: '#0a0a0af2', backdropFilter: 'blur(30px)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: '20px', color: 'white'
                        }}
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Music size={60} color="#3b82f6" style={{ filter: 'drop-shadow(0 0 20px #3b82f6)' }} />
                            <Loader2 size={100} className="animate-spin" style={{ position: 'absolute', opacity: 0.2, color: '#3b82f6' }} />
                        </motion.div>

                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '5px', letterSpacing: '2px', color: '#3b82f6' }}>SIMULADOR V-PRO</h2>
                            <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Sincronizando con la nube...
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 1. Botones de Control Flotantes (Lado Derecho) */}
            <BotonesControl
                modoAjuste={logica.modoAjuste}
                setModoAjuste={logica.setModoAjuste}
                setBotonSeleccionado={logica.setBotonSeleccionado}
                direccion={logica.direccion}
                setDireccion={logica.setDireccion}
                limpiarTodasLasNotas={logica.limpiarTodasLasNotas}
                modoVista={logica.modoVista}
                setModoVista={logica.setModoVista}
                vistaDoble={logica.vistaDoble}
                setVistaDoble={logica.setVistaDoble}
                esp32Conectado={logica.esp32Conectado}
                conectarESP32={logica.conectarESP32}
                tipoFuelleActivo={logica.tipoFuelleActivo}
                setTipoFuelleActivo={logica.setTipoFuelleActivo}
            />

            {/* 2. Panel de Ajustes (Gestor de Diseño y Sonido) */}
            <PanelAjustes {...logica} mapaBotonesActual={logica.mapaBotonesActual} />

            {/* 3. El Acordeón (Cuerpo, Pitos y Bajos) */}
            {logica.ajustes && logica.configTonalidad ? (
                <CuerpoAcordeon
                    imagenFondo={imagenFondo}
                    ajustes={logica.ajustes}
                    direccion={logica.direccion}
                    configTonalidad={logica.configTonalidad}
                    botonesActivos={logica.botonesActivos}
                    modoAjuste={logica.modoAjuste}
                    botonSeleccionado={logica.botonSeleccionado}
                    modoVista={logica.modoVista}
                    vistaDoble={logica.vistaDoble}
                    setBotonSeleccionado={logica.setBotonSeleccionado}
                    actualizarBotonActivo={logica.actualizarBotonActivo}
                    listo={logica.disenoCargado}
                />
            ) : (
                <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>
                    Error al cargar configuración. Refresca la página (F5).
                </div>
            )}


            {/* Overlay para modo ajuste (Feedback visual global) */}
            {logica.modoAjuste && (
                <div style={{
                    position: 'fixed', inset: 0, pointerEvents: 'none',
                    border: '4px solid #3b82f6', zIndex: 999999,
                    boxShadow: 'inset 0 0 100px rgba(59,130,246,0.1)',
                    animation: 'pulse-border 2s infinite'
                }}>
                    <style>{`
                        @keyframes pulse-border {
                            0% { border-color: rgba(59, 130, 246, 0.5); }
                            50% { border-color: rgba(59, 130, 246, 1); }
                            100% { border-color: rgba(59, 130, 246, 0.5); }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
});

// Le damos un nombre para que las herramietas de dev lo reconozcan
AcordeonSimulador.displayName = 'AcordeonSimulador';

export default AcordeonSimulador;
