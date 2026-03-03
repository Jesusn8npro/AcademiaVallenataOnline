import React from 'react';
import { Settings, RotateCcw, Type, Music, Columns, Usb } from 'lucide-react';
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
    conectarESP32: () => void;
}

const BotonesControl: React.FC<BotonesControlProps> = ({
    modoAjuste, setModoAjuste, setBotonSeleccionado,
    direccion, setDireccion, limpiarTodasLasNotas,
    modoVista, setModoVista, vistaDoble, setVistaDoble,
    esp32Conectado, conectarESP32
}) => {
    return (
        <div className="simulador-controles-capa" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1000 }}>
            <button
                onClick={() => {
                    setModoAjuste(!modoAjuste);
                    if (modoAjuste) setBotonSeleccionado(null);
                }}
                className={`boton-gestor-flotante`}
                style={{
                    position: 'absolute', top: '90px', right: '40px', pointerEvents: 'auto',
                    background: modoAjuste ? '#ef4444' : '#3b82f6'
                }}
            >
                <Settings size={30} />
                <span style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>GESTOR</span>
            </button>

            {/* Botón ESP32 Web Serial */}
            <button
                onClick={conectarESP32}
                className="boton-gestor-flotante"
                style={{
                    position: 'absolute', top: '155px', right: '40px', pointerEvents: 'auto',
                    background: esp32Conectado
                        ? 'linear-gradient(135deg, #16a34a, #15803d)'
                        : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                    boxShadow: esp32Conectado ? '0 0 15px rgba(34,197,94,0.6)' : 'none',
                    animation: esp32Conectado ? 'pulse-esp32 2s infinite' : 'none'
                }}
                title={esp32Conectado ? 'ESP32 Conectado ✅' : 'Conectar ESP32 por USB'}
            >
                <style>{`
                    @keyframes pulse-esp32 {
                        0%, 100% { box-shadow: 0 0 10px rgba(34,197,94,0.4); }
                        50% { box-shadow: 0 0 25px rgba(34,197,94,0.9); }
                    }
                `}</style>
                <Usb size={30} />
                <span style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>
                    {esp32Conectado ? 'ESP32 ✅' : 'ESP32'}
                </span>
            </button>

            <div className="controles-derecha-flotantes" style={{
                position: 'absolute', top: '180px', right: '40px',
                textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-end', width: '280px', pointerEvents: 'none'
            }}>
                <button
                    onClick={() => {
                        const nDir = direccion === 'halar' ? 'empujar' : 'halar';
                        setDireccion(nDir);
                        limpiarTodasLasNotas();
                    }}
                    className="boton-fuelle-control"
                    style={{
                        background: direccion === 'halar' ? 'linear-gradient(to right, #ef4444, #991b1b)' : 'linear-gradient(to right, #22c55e, #166534)',
                        width: '100%', pointerEvents: 'auto'
                    }}
                >
                    <RotateCcw size={20} />
                    <div style={{ fontSize: '12px', letterSpacing: '1px' }}>{direccion === 'halar' ? 'ABRIENDO (HALAR)' : 'CERRANDO (EMPUJAR)'}</div>
                </button>

                <div className="contenedor-vistas-control" style={{
                    background: 'rgba(0,0,0,0.7)', padding: '18px', borderRadius: '24px',
                    display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(15px)', width: '100%', pointerEvents: 'auto'
                }}>
                    <p className="etiqueta-vistas">MODO DE VISTA</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                        <button onClick={() => setModoVista('teclas')} className={`btn-vista ${modoVista === 'teclas' ? 'activo' : ''}`} title="Teclas"><Type size={16} /></button>
                        <button onClick={() => setModoVista('numeros')} className={`btn-vista ${modoVista === 'numeros' ? 'activo' : ''}`} title="Números">123</button>
                        <button onClick={() => setModoVista('notas')} className={`btn-vista ${modoVista === 'notas' ? 'activo' : ''}`} title="Notas"><Music size={16} /></button>
                        <button onClick={() => setModoVista('cifrado')} className={`btn-vista ${modoVista === 'cifrado' ? 'activo' : ''}`} title="Cifrado">ABC</button>
                        <button onClick={() => setVistaDoble(!vistaDoble)} className={`btn-vista ${vistaDoble ? 'activo' : ''}`} title="Vista Doble"><Columns size={16} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default BotonesControl;
