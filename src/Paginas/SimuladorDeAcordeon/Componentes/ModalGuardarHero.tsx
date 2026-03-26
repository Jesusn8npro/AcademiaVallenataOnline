import React, { useState } from 'react';
import { X, Save, Music, Activity, BookOpen } from 'lucide-react';

interface ModalGuardarHeroProps {
    visible: boolean;
    onCerrar: () => void;
    onGuardar: (datos: { titulo: string; tipo: 'secuencia' | 'tutorial' | 'ejercicio'; dificultad: 'basico' | 'intermedio' | 'profesional' }) => void;
    bpm: number;
    totalNotas: number;
    sugerenciaTipo: 'secuencia' | 'tutorial' | 'ejercicio';
}

const ModalGuardarHero: React.FC<ModalGuardarHeroProps> = ({ visible, onCerrar, onGuardar, bpm, totalNotas, sugerenciaTipo }) => {
    const [titulo, setTitulo] = useState('Pase Nuevo');
    const [tipo, setTipo] = useState<'secuencia' | 'tutorial' | 'ejercicio'>(sugerenciaTipo);
    const [dificultad, setDificultad] = useState<'basico' | 'intermedio' | 'profesional'>('basico');

    // Sincronizar el tipo cuando cambia la sugerencia (al abrir el modal)
    React.useEffect(() => {
        if (visible) setTipo(sugerenciaTipo);
    }, [visible, sugerenciaTipo]);

    if (!visible) return null;

    return (
        <div style={overlayStyle} onClick={onCerrar}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <div style={headerStyle}>
                    <h3 style={{ margin: 0, color: '#00d2ff', fontSize: '18px' }}>Finalizar Grabación 🎥</h3>
                    <button onClick={onCerrar} style={closeBtnStyle}><X size={20} /></button>
                </div>

                <div style={bodyStyle}>
                    <div style={infoRowStyle}>
                        <div style={statBox}>
                            <span style={labelStat}>BPM</span>
                            <span style={valStat}>{bpm}</span>
                        </div>
                        <div style={statBox}>
                            <span style={labelStat}>NOTAS</span>
                            <span style={valStat}>{totalNotas}</span>
                        </div>
                    </div>

                    <div style={fieldGroup}>
                        <label style={labelStyle}>TÍTULO DE LA GRABACIÓN</label>
                        <input 
                            type="text" 
                            value={titulo} 
                            onChange={e => setTitulo(e.target.value)}
                            style={inputStyle}
                            placeholder="Ej: Escala de Do Mayor"
                        />
                    </div>

                    <div style={fieldGroup}>
                        <label style={labelStyle}>CATEGORÍA</label>
                        <div style={optionGrid}>
                            <button onClick={() => setTipo('secuencia')} style={optionBtn(tipo === 'secuencia')}>
                                <Activity size={16} /> SECUENCIA
                            </button>
                            <button onClick={() => setTipo('ejercicio')} style={optionBtn(tipo === 'ejercicio')}>
                                <BookOpen size={16} /> EJERCICIO
                            </button>
                            <button onClick={() => setTipo('tutorial')} style={optionBtn(tipo === 'tutorial')}>
                                <Music size={16} /> TUTORIAL
                            </button>
                        </div>
                    </div>

                    <div style={fieldGroup}>
                        <label style={labelStyle}>DIFICULTAD</label>
                        <div style={optionGrid}>
                            <button onClick={() => setDificultad('basico')} style={diffBtn('basico', dificultad === 'basico')}>BÁSICO</button>
                            <button onClick={() => setDificultad('intermedio')} style={diffBtn('intermedio', dificultad === 'intermedio')}>INTERMEDIO</button>
                            <button onClick={() => setDificultad('profesional')} style={diffBtn('profesional', dificultad === 'profesional')}>PRO</button>
                        </div>
                    </div>
                </div>

                <div style={footerStyle}>
                    <button style={cancelBtn} onClick={onCerrar}>DESCARTAR</button>
                    <button style={saveBtn} onClick={() => onGuardar({ titulo, tipo, dificultad })}>
                        <Save size={18} /> GUARDAR EN NUBE
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- ESTILOS ---
const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(10px)', zIndex: 99999,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
};

const modalStyle: React.CSSProperties = {
    background: '#121212', width: '380px', borderRadius: '24px',
    border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px rgba(0, 210, 255, 0.1)'
};

const headerStyle: React.CSSProperties = {
    padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
};

const closeBtnStyle: React.CSSProperties = {
    background: 'none', border: 'none', color: '#666', cursor: 'pointer'
};

const bodyStyle: React.CSSProperties = { padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' };

const fieldGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };

const labelStyle: React.CSSProperties = {
    fontSize: '10px', fontWeight: '900', color: '#555', letterSpacing: '1px'
};

const inputStyle: React.CSSProperties = {
    background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px',
    padding: '12px 16px', color: 'white', fontSize: '15px'
};

const optionGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' };

const optionBtn = (activo: boolean): React.CSSProperties => ({
    padding: '10px 5px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold',
    background: activo ? 'rgba(0, 210, 255, 0.15)' : '#1a1a1a',
    border: activo ? '1px solid #00d2ff' : '1px solid #333',
    color: activo ? '#00d2ff' : '#666', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', transition: 'all 0.2s'
});

const diffBtn = (tipo: string, activo: boolean): React.CSSProperties => {
    const colores = { basico: '#22c55e', intermedio: '#f59e0b', profesional: '#ef4444' };
    const color = colores[tipo as keyof typeof colores];
    return {
        padding: '8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold',
        background: activo ? color : '#1a1a1a',
        border: 'none', color: activo ? 'white' : '#444', cursor: 'pointer',
        transition: 'all 0.2s'
    };
};

const infoRowStyle: React.CSSProperties = { display: 'flex', gap: '12px' };

const statBox: React.CSSProperties = {
    flex: 1, background: '#1a1a1a', padding: '10px', borderRadius: '14px',
    display: 'flex', flexDirection: 'column', alignItems: 'center'
};

const labelStat: React.CSSProperties = { fontSize: '9px', color: '#444', fontWeight: 'bold' };
const valStat: React.CSSProperties = { fontSize: '18px', color: '#fff', fontWeight: '900' };

const footerStyle: React.CSSProperties = {
    padding: '20px 24px 24px', display: 'flex', gap: '12px', background: '#0a0a0a'
};

const cancelBtn: React.CSSProperties = {
    flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#222',
    color: '#888', fontWeight: 'bold', cursor: 'pointer'
};

const saveBtn: React.CSSProperties = {
    flex: 2, padding: '14px', borderRadius: '14px', border: 'none', 
    background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)',
    color: 'white', fontWeight: '900', cursor: 'pointer', display: 'flex', 
    alignItems: 'center', justifyContent: 'center', gap: '10px'
};

export default ModalGuardarHero;
