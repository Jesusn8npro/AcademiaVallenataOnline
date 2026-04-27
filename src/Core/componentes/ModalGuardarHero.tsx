import React from 'react';
import { X, Save, Music, Activity, BookOpen } from 'lucide-react';
import { useModalGuardarHero, type DatosGuardadoHero } from './useModalGuardarHero';

interface ModalGuardarHeroProps {
    visible: boolean;
    onCerrar: () => void;
    onGuardar: (datos: DatosGuardadoHero) => void;
    bpm: number;
    totalNotas: number;
    sugerenciaTipo: 'secuencia' | 'cancion' | 'ejercicio';
    tonalidadActual: string;
}

const ModalGuardarHero: React.FC<ModalGuardarHeroProps> = ({ visible, onCerrar, onGuardar, bpm, totalNotas, sugerenciaTipo, tonalidadActual }) => {
    const { titulo, setTitulo, autor, setAutor, descripcion, setDescripcion, youtubeInput, setYoutubeInput, tipo, setTipo, dificultad, setDificultad, errorFormulario, guardar } = useModalGuardarHero(visible, sugerenciaTipo, onGuardar);

    if (!visible) return null;

    return (
        <div style={overlayStyle} onClick={onCerrar}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <div style={headerStyle}>
                    <h3 style={{ margin: 0, color: '#00d2ff', fontSize: '18px' }}>Finalizar Grabacion 🎥</h3>
                    <button onClick={onCerrar} style={closeBtnStyle}><X size={20} /></button>
                </div>

                <div style={bodyStyle}>
                    <div style={infoRowStyle}>
                        <div style={statBox}><span style={labelStat}>BPM</span><span style={valStat}>{bpm}</span></div>
                        <div style={statBox}><span style={labelStat}>NOTAS</span><span style={valStat}>{totalNotas}</span></div>
                    </div>

                    <div style={fieldGroup}>
                        <label style={labelStyle}>TITULO DE LA GRABACION</label>
                        <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} style={inputStyle} placeholder="Ej: Escala de Do Mayor" />
                    </div>

                    <div style={fieldGroup}>
                        <label style={labelStyle}>AUTOR / INTERPRETE</label>
                        <input type="text" value={autor} onChange={e => setAutor(e.target.value)} style={inputStyle} placeholder="Ej: Jesus Gonzalez" />
                    </div>

                    <div style={fieldGroup}>
                        <label style={labelStyle}>ID O ENLACE DE YOUTUBE</label>
                        <input type="text" value={youtubeInput} onChange={e => setYoutubeInput(e.target.value)} style={inputStyle} placeholder="Ej: dQw4w9WgXcQ o https://youtu.be/..." />
                        <span style={helperStyle}>Este video quedara como fondo en la cancion guardada.</span>
                    </div>

                    <div style={fieldGroup}>
                        <label style={labelStyle}>DESCRIPCION</label>
                        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} style={textareaStyle} placeholder="Referencia, observaciones o descripcion del ejercicio" />
                    </div>

                    <div style={fieldGroup}>
                        <label style={labelStyle}>CATEGORIA</label>
                        <div style={optionGrid}>
                            <button onClick={() => setTipo('secuencia')} style={optionBtn(tipo === 'secuencia')}><Activity size={16} /> SECUENCIA</button>
                            <button onClick={() => setTipo('ejercicio')} style={optionBtn(tipo === 'ejercicio')}><BookOpen size={16} /> EJERCICIO</button>
                            <button onClick={() => setTipo('cancion')} style={optionBtn(tipo === 'cancion')}><Music size={16} /> CANCION</button>
                        </div>
                    </div>

                    <div style={fieldGroup}>
                        <label style={labelStyle}>DIFICULTAD</label>
                        <div style={optionGrid}>
                            <button onClick={() => setDificultad('basico')} style={diffBtn('basico', dificultad === 'basico')}>BASICO</button>
                            <button onClick={() => setDificultad('intermedio')} style={diffBtn('intermedio', dificultad === 'intermedio')}>INTERMEDIO</button>
                            <button onClick={() => setDificultad('profesional')} style={diffBtn('profesional', dificultad === 'profesional')}>PRO</button>
                        </div>
                    </div>

                    <div style={infoPillRow}>
                        <div style={metaPill}>TONALIDAD: {tonalidadActual}</div>
                        <div style={metaPill}>RESOLUCION: 192</div>
                    </div>

                    {errorFormulario && <div style={errorStyle}>{errorFormulario}</div>}
                </div>

                <div style={footerStyle}>
                    <button style={cancelBtn} onClick={onCerrar}>DESCARTAR</button>
                    <button style={saveBtn} onClick={guardar}><Save size={18} /> GUARDAR EN NUBE</button>
                </div>
            </div>
        </div>
    );
};

const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' };
const modalStyle: React.CSSProperties = { background: '#121212', width: '420px', maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px rgba(0, 210, 255, 0.1)', display: 'flex', flexDirection: 'column' };
const headerStyle: React.CSSProperties = { padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' };
const closeBtnStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#666', cursor: 'pointer' };
const bodyStyle: React.CSSProperties = { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', minHeight: 0, flex: 1 };
const fieldGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle: React.CSSProperties = { fontSize: '10px', fontWeight: '900', color: '#555', letterSpacing: '1px' };
const inputStyle: React.CSSProperties = { background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '12px 16px', color: 'white', fontSize: '15px' };
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: '120px', maxHeight: '180px', resize: 'vertical' };
const helperStyle: React.CSSProperties = { fontSize: '11px', color: '#6b7280', lineHeight: 1.4 };
const optionGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' };
const optionBtn = (activo: boolean): React.CSSProperties => ({ padding: '10px 5px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', background: activo ? 'rgba(0, 210, 255, 0.15)' : '#1a1a1a', border: activo ? '1px solid #00d2ff' : '1px solid #333', color: activo ? '#00d2ff' : '#666', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', transition: 'all 0.2s' });
const diffBtn = (tipo: string, activo: boolean): React.CSSProperties => { const colores: Record<string, string> = { basico: '#22c55e', intermedio: '#f59e0b', profesional: '#ef4444' }; return { padding: '8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold', background: activo ? colores[tipo] : '#1a1a1a', border: 'none', color: activo ? 'white' : '#444', cursor: 'pointer', transition: 'all 0.2s' }; };
const infoRowStyle: React.CSSProperties = { display: 'flex', gap: '12px' };
const infoPillRow: React.CSSProperties = { display: 'flex', gap: '10px', flexWrap: 'wrap' };
const statBox: React.CSSProperties = { flex: 1, background: '#1a1a1a', padding: '10px', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const labelStat: React.CSSProperties = { fontSize: '9px', color: '#444', fontWeight: 'bold' };
const valStat: React.CSSProperties = { fontSize: '18px', color: '#fff', fontWeight: '900' };
const metaPill: React.CSSProperties = { padding: '8px 12px', borderRadius: '999px', background: '#171717', border: '1px solid #2f2f2f', color: '#9ca3af', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em' };
const errorStyle: React.CSSProperties = { padding: '10px 12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5', fontSize: '12px', fontWeight: 700 };
const footerStyle: React.CSSProperties = { padding: '16px 24px 20px', display: 'flex', gap: '12px', background: '#0a0a0a', flexShrink: 0 };
const cancelBtn: React.CSSProperties = { flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#222', color: '#888', fontWeight: 'bold', cursor: 'pointer' };
const saveBtn: React.CSSProperties = { flex: 2, padding: '14px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', color: 'white', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };

export default ModalGuardarHero;
