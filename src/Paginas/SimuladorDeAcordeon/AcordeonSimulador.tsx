import React, { forwardRef, useImperativeHandle } from 'react';
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
import bgAcordeonDefault from './Acordeon PRO MAX.png';

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
            />

            {/* 2. Panel de Ajustes (Gestor de Diseño y Sonido) */}
            <PanelAjustes {...logica} mapaBotonesActual={logica.mapaBotonesActual} />

            {/* 3. El Acordeón (Cuerpo, Pitos y Bajos) */}
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
            />

            {/* 4. Loader Premium (Supabase / Universal Sampler) */}
            {logica.cargando && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000000,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: '20px'
                }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '50%',
                        border: '3px solid rgba(59, 130, 246, 0.1)',
                        borderTop: '3px solid #3b82f6',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '16px', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>Sincronizando</p>
                        <p style={{ color: '#555', fontSize: '11px', marginTop: '5px' }}>Conectando con Supabase Cloud</p>
                    </div>
                    <style>{`
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    `}</style>
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