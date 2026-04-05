import React from 'react';
import { Settings, RotateCcw, Type, Music, Columns, Usb, Circle, Timer, Layers, List } from 'lucide-react';
import type { ModoVista } from '../TiposAcordeon';

interface BotonesControlProps {
    modoAjuste: boolean;
    setModoAjuste: (val: boolean) => void;
    setBotonSeleccionado: (val: string | null) => void;
    direccion: 'halar' | 'empujar';
    setDireccion: (val: 'halar' | 'empujar') => void;
    limpiarTodasLasNotas: () => void;
    modoVista: ModoVista;
    setModoVista: (val: ModoVista) => void;
    vistaDoble: boolean;
    setVistaDoble: (val: boolean) => void;
    esp32Conectado: boolean;
    conectarESP32?: () => void;
    tipoFuelleActivo: 'US' | 'SL';
    setTipoFuelleActivo: (val: 'US' | 'SL') => void;
    
    // Grabación Hero
    grabando: boolean;
    setGrabando: (val: boolean) => void;
    metronomoVisible: boolean;
    setMetronomoVisible: (val: boolean) => void;
    bpm: number;
    onAbrirLista: () => void;
    onAbrirCreadorAcordes: () => void;
    onAbrirListaAcordes?: () => void; // Nueva: Ver lista de acordes guardados
    reproduciendo?: boolean;
}

const BotonesControl: React.FC<BotonesControlProps> = ({
    modoAjuste, setModoAjuste, setBotonSeleccionado,
    direccion, setDireccion, limpiarTodasLasNotas,
    modoVista, setModoVista, vistaDoble, setVistaDoble,
    esp32Conectado, conectarESP32,
    tipoFuelleActivo, setTipoFuelleActivo,
    grabando, setGrabando, metronomoVisible, setMetronomoVisible, bpm,
    onAbrirLista, onAbrirCreadorAcordes, onAbrirListaAcordes, reproduciendo
}) => {
    return (
        <div className="simulador-controles-capa" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1000 }}>
            
            {/* --- GRUPO INFERIOR DERECHA (HERO & TOOLS) --- */}
            <div style={{ position: 'absolute', bottom: '20px', right: '40px', display: 'flex', gap: '10px', pointerEvents: 'auto' }}>
                
                {/* GRABACIÓN HERO */}
                <button
                    onClick={() => setGrabando(!grabando)}
                    className={`boton-gestor-flotante ${grabando ? 'grabando-anim' : ''}`}
                    style={{ background: grabando ? '#ef4444' : 'rgba(0,0,0,0.6)', border: `2px solid ${grabando ? 'white' : '#ef4444'}`, color: grabando ? 'white' : '#ef4444', width: '60px', height: '60px' }}
                >
                    <Circle size={24} fill={grabando ? "white" : "none"} />
                    <span style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '4px' }}>REC</span>
                </button>

                {/* METRÓNOMO */}
                <button
                    onClick={() => setMetronomoVisible(!metronomoVisible)}
                    className="boton-gestor-flotante"
                    style={{ background: 'rgba(0,0,0,0.6)', border: '2px solid #3b82f6', color: '#3b82f6', width: '60px', height: '60px' }}
                >
                    <Timer size={24} />
                    <span style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '4px' }}>{bpm}</span>
                </button>

                {/* BIBLIOTECA DE CANCIONES */}
                <button
                    onClick={onAbrirLista}
                    className={`boton-gestor-flotante ${reproduciendo ? 'reproduciendo-anim' : ''}`}
                    style={{ background: 'rgba(0,0,0,0.6)', border: `2px solid ${reproduciendo ? '#00e5ff' : '#666'}`, color: reproduciendo ? '#00e5ff' : '#666', width: '60px', height: '60px' }}
                >
                    <Music size={24} />
                    <span style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '4px' }}>LIB</span>
                </button>

                {/* CREADOR DE ACORDES (NUEVO) */}
                <button
                    onClick={onAbrirCreadorAcordes}
                    className="boton-gestor-flotante"
                    style={{ background: 'rgba(59, 130, 246, 0.2)', border: '2px solid #3b82f6', color: '#3b82f6', width: '60px', height: '60px' }}
                >
                    <Layers size={24} />
                    <span style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '4px' }}>NUEVO AC</span>
                </button>

                {/* LISTA DE ACORDES (NUEVO) */}
                <button
                    onClick={onAbrirListaAcordes}
                    className="boton-gestor-flotante"
                    style={{ background: 'rgba(59, 130, 246, 0.2)', border: '2px solid #8b5cf6', color: '#8b5cf6', width: '60px', height: '60px' }}
                >
                    <List size={24} />
                    <span style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '4px' }}>LISTA AC</span>
                </button>
            </div>

            {/* --- GRUPO SUPERIOR DERECHA (GESTIÓN & ESP32) --- */}
            <div style={{ position: 'absolute', top: '100px', right: '40px', display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'auto' }}>
                
                {/* BOTÓN ESP32 - RESTAURADO */}
                <button
                    onClick={conectarESP32}
                    className="boton-gestor-flotante"
                    style={{
                        background: esp32Conectado ? '#16a34a' : 'rgba(124, 58, 237, 0.3)',
                        border: `2px solid ${esp32Conectado ? '#22c55e' : '#7c3aed'}`,
                        color: 'white', width: '60px', height: '60px',
                        boxShadow: esp32Conectado ? '0 0 15px rgba(34,197,94,0.6)' : 'none'
                    }}
                >
                    <Usb size={24} />
                    <span style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '4px' }}>{esp32Conectado ? 'USB ✅' : 'USB'}</span>
                </button>

                {/* BOTÓN GESTOR (AJUSTES) - RESTAURADO */}
                <button
                    onClick={() => {
                        setModoAjuste(!modoAjuste);
                        if (modoAjuste) setBotonSeleccionado(null);
                    }}
                    className="boton-gestor-flotante"
                    style={{
                        background: modoAjuste ? '#ef4444' : 'rgba(59, 130, 246, 0.3)',
                        border: `2px solid ${modoAjuste ? '#ef4444' : '#3b82f6'}`,
                        color: 'white', width: '60px', height: '60px'
                    }}
                >
                    <Settings size={24} />
                    <span style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '4px' }}>GESTOR</span>
                </button>
            </div>

            {/* --- SELECTOR DE VISTAS (CENTRO INFERIOR DERECHA) --- */}
            <div className="contenedor-vistas-control" style={{
                position: 'absolute', bottom: '100px', right: '40px',
                background: 'rgba(0,0,0,0.8)', padding: '12px', borderRadius: '18px',
                display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(15px)', pointerEvents: 'auto'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px' }}>
                    <button onClick={() => setModoVista('teclas')} className={`btn-vista ${modoVista === 'teclas' ? 'activo' : ''}`}><Type size={14} /></button>
                    <button onClick={() => setModoVista('numeros')} className={`btn-vista ${modoVista === 'numeros' ? 'activo' : ''}`}>123</button>
                    <button onClick={() => setModoVista('notas')} className={`btn-vista ${modoVista === 'notas' ? 'activo' : ''}`}><Music size={14} /></button>
                    <button onClick={() => setModoVista('cifrado')} className={`btn-vista ${modoVista === 'cifrado' ? 'activo' : ''}`}>ABC</button>
                    <button onClick={() => setVistaDoble(!vistaDoble)} className={`btn-vista ${vistaDoble ? 'activo' : ''}`}><Columns size={14} /></button>
                </div>
                <button
                    onClick={() => {
                        const nDir = direccion === 'halar' ? 'empujar' : 'halar';
                        setDireccion(nDir);
                        limpiarTodasLasNotas();
                    }}
                    className="boton-fuelle-control"
                    style={{
                        background: direccion === 'halar' ? '#ef4444' : '#22c55e',
                        fontSize: '9px', padding: '8px', border: 'none', borderRadius: '10px'
                    }}
                >
                    <div style={{ fontWeight: 'bold' }}>{direccion === 'halar' ? 'ABRIENDO' : 'CERRANDO'}</div>
                </button>
            </div>

            <style>{`
                @keyframes heartbeat {
                    0% { transform: scale(1); box-shadow: 0 0 5px rgba(239, 68, 68, 0.4); }
                    50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(239, 68, 68, 0.8); }
                    100% { transform: scale(1); box-shadow: 0 0 5px rgba(239, 68, 68, 0.4); }
                }
                @keyframes pulse-repro {
                    0% { box-shadow: 0 0 5px rgba(0, 229, 255, 0.4); transform: scale(1); }
                    50% { box-shadow: 0 0 20px rgba(0, 229, 255, 0.8); transform: scale(1.05); }
                    100% { box-shadow: 0 0 5px rgba(0, 229, 255, 0.4); transform: scale(1); }
                }
                .grabando-anim { animation: heartbeat 1.5s infinite ease-in-out; }
                .reproduciendo-anim { animation: pulse-repro 1s infinite ease-in-out; }
            `}</style>
        </div>
    );
};

export default BotonesControl;
