import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Repeat, Rewind, FastForward, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReproductorSecuenciaProps {
    reproducionActive: boolean;
    pausado: boolean;
    cancionActual: any;
    tickActual: number;
    totalTicks: number;
    bpm: number;
    setBpm: (val: number) => void;
    onAlternarPausa: () => void;
    onDetener: () => void;
    onBuscarTick: (tick: number) => void;
    onSetLoop: (start: number, end: number, activo: boolean) => void;
}

/**
 * 🎵 REPRODUCTOR V-PRO SECUENCIAS
 * Un panel flotante premium impulsado por ticks musicales.
 */
const ReproductorSecuencia: React.FC<ReproductorSecuenciaProps> = ({
    reproducionActive,
    pausado,
    cancionActual,
    tickActual,
    totalTicks,
    bpm,
    setBpm,
    onAlternarPausa,
    onDetener,
    onBuscarTick,
    onSetLoop
}) => {
    const [loopActivo, setLoopActivo] = useState(false);
    const [loopRange, setLoopRange] = useState({ start: 0, end: 1000 }); // en ticks

    // El porcentaje real basado en ticks
    const porcentaje = totalTicks > 0 ? (tickActual / totalTicks) * 100 : 0;

    useEffect(() => {
        // Al final de la canción, si el bucle está activo, el hook lo maneja internamente.
        // Pero aquí lo sincronizamos con el estado del UI.
        onSetLoop(loopRange.start, loopRange.end === 0 ? totalTicks : loopRange.end, loopActivo);
    }, [loopActivo, loopRange, totalTicks, onSetLoop]);

    if (!reproducionActive) return null;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '90%',
                maxWidth: '600px',
                background: 'rgba(15, 15, 15, 0.85)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                color: 'white'
            }}
        >
            {/* Encabezado e Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#3b82f6' }}>
                        {cancionActual?.titulo || 'Secuencia en curso'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        MODO REPRODUCCIÓN V-PRO
                    </p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.1)', padding: '5px 12px', borderRadius: '12px' }}>
                    <Clock size={14} color="#3b82f6" />
                    <span style={{ fontSize: '12px', fontWeight: '900', color: '#3b82f6' }}>{bpm} BPM</span>
                </div>
            </div>

            {/* Barra de Progreso Interactiva */}
            <div style={{ position: 'relative', width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', cursor: 'pointer' }}
                 onClick={(e) => {
                     const rect = e.currentTarget.getBoundingClientRect();
                     const x = e.clientX - rect.left;
                     const targetTick = (x / rect.width) * totalTicks;
                     onBuscarTick(targetTick);
                 }}>
                <div style={{ 
                    position: 'absolute', left: 0, top: 0, height: '100%', 
                    width: `${porcentaje}%`, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                    borderRadius: '10px', transition: 'width 0.1s linear',
                    boxShadow: '0 0 10px rgba(59,130,246,0.5)'
                }} />
                {/* Puntero */}
                <div style={{
                    position: 'absolute', left: `${porcentaje}%`, top: '50%', transform: 'translate(-50%, -50%)',
                    width: '14px', height: '14px', background: 'white', borderRadius: '50%',
                    boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                }} />
            </div>

            {/* Controles Principales */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                
                {/* Lado Izquierdo: Velocidad y Loop UI */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button 
                            onClick={() => setBpm(Math.max(40, bpm - 5))}
                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer' }}
                        >-</button>
                        <span style={{ fontSize: '11px', minWidth: '50px', textAlign: 'center' }}>{bpm} BPM</span>
                        <button 
                            onClick={() => setBpm(Math.min(240, bpm + 5))}
                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer' }}
                        >+</button>
                    </div>
                </div>

                {/* Centro: Play/Pause/Stop */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button 
                        onClick={() => onBuscarTick(Math.max(0, tickActual - 192 * 4))} // Retrocede 1 compás aprox
                        className="btn-reproductor"
                        title="Retroceder"
                    >
                        <Rewind size={20} />
                    </button>

                    <button 
                        onClick={onAlternarPausa}
                        style={{ 
                            background: '#3b82f6', color: 'white', border: 'none', 
                            width: '50px', height: '50px', borderRadius: '50%', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', boxShadow: '0 10px 20px rgba(59,130,246,0.3)'
                        }}
                    >
                        {pausado ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
                    </button>

                    <button 
                        onClick={onDetener}
                        style={{ background: 'rgba(255,0,0,0.2)', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                    >
                        <Square size={20} fill="currentColor" />
                    </button>

                    <button 
                        onClick={() => onBuscarTick(Math.min(totalTicks, tickActual + 192 * 4))}
                        className="btn-reproductor"
                        title="Adelantar"
                    >
                        <FastForward size={20} />
                    </button>
                </div>

                {/* Derecha: Bucle Inteligente */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '4px' }}>
                        <button 
                            onClick={() => setLoopRange(prev => ({ ...prev, start: Math.floor(tickActual) }))}
                            style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '10px', padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold' }}
                        >MARCA A</button>
                        <button 
                            onClick={() => setLoopRange(prev => ({ ...prev, end: Math.floor(tickActual) }))}
                            style={{ background: 'transparent', border: 'none', color: '#f59e0b', fontSize: '10px', padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold' }}
                        >MARCA B</button>
                    </div>
                    
                    <button 
                        onClick={() => setLoopActivo(!loopActivo)}
                        style={{ 
                            background: loopActivo ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', 
                            color: loopActivo ? '#3b82f6' : '#666', 
                            border: 'none', padding: '10px 15px', borderRadius: '12px', 
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            fontWeight: 'bold', fontSize: '12px', minWidth: '100px', justifyContent: 'center'
                        }}
                    >
                        <Repeat size={18} />
                        {loopActivo ? 'BUCLE ON' : 'BUCLE OFF'}
                    </button>
                </div>
            </div>

            <style>{`
                .btn-reproductor {
                    background: transparent;
                    border: none;
                    color: #aaa;
                    cursor: pointer;
                    transition: all 0.2s;
                    padding: 5px;
                }
                .btn-reproductor:hover {
                    color: white;
                    transform: scale(1.1);
                }
                input[type=range] {
                    cursor: pointer;
                }
            `}</style>
        </motion.div>
    );
};

export default ReproductorSecuencia;
