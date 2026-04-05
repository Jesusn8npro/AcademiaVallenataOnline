import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Settings, LogOut } from 'lucide-react';
import type { ModoPractica, ModoAudioSynthesia } from '../TiposProMax';

interface MenuPausaProMaxProps {
    visible: boolean;
    onReanudar: () => void;
    onReiniciar: () => void;
    onSalir: () => void;
    // Opciones avanzadas
    maestroSuena: boolean;
    onToggleMaestroSuena: (v: boolean) => void;
    modoPractica: ModoPractica;
    modoAudioSynthesia: ModoAudioSynthesia;
    onCambiarModoAudioSynthesia: (modo: ModoAudioSynthesia) => void;
    bpm: number;
    onCambiarBpm: (b: number) => void;
    modoVista: string;
    onCambiarVista: (v: any) => void;
    volumenMusica: number;
    onCambiarVolumenMusica: (v: number) => void;
    volumenAcordeon: number;
    onCambiarVolumenAcordeon: (v: number) => void;
}

/**
 * ⏸️ MENÚ DE PAUSA PRO MAX
 * Réplica del "Pause Menu" estilo Rhythm-Plus, con Glassmorphism y navegación por teclado.
 */
const MenuPausaProMax: React.FC<MenuPausaProMaxProps> = ({
    visible,
    onReanudar,
    onReiniciar,
    onSalir,
    maestroSuena,
    onToggleMaestroSuena,
    modoPractica,
    modoAudioSynthesia,
    onCambiarModoAudioSynthesia,
    bpm,
    onCambiarBpm,
    modoVista,
    onCambiarVista,
    volumenMusica,
    onCambiarVolumenMusica,
    volumenAcordeon,
    onCambiarVolumenAcordeon
}) => {
    const [vista, setVista] = useState<'principal' | 'opciones'>('principal');
    const [seleccionado, setSeleccionado] = useState(0);

    const opciones = [
        { label: 'Reanudar', icon: <Play size={20} fill="currentColor" />, action: onReanudar },
        { label: 'Reiniciar', icon: <RotateCcw size={20} />, action: onReiniciar },
        { label: 'Opciones', icon: <Settings size={20} />, action: () => setVista('opciones') },
        { label: 'Salir del Juego', icon: <LogOut size={20} />, action: onSalir }
    ];

    useEffect(() => {
        if (!visible) {
            setVista('principal');
            return;
        }

        setSeleccionado(0); // Resetear selección al abrir

        const handleKeyDown = (e: KeyboardEvent) => {
            if (vista === 'opciones') {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    setVista('principal');
                }
                return; // Navegación de opciones se usa con mouse por simplicidad
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSeleccionado((prev) => (prev + 1) % opciones.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSeleccionado((prev) => (prev - 1 + opciones.length) % opciones.length);
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                opciones[seleccionado].action();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onReanudar();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [visible, seleccionado, opciones, onReanudar]);

    // 🛠️ EXORCISMO DE CURSOR Y BLOQUEOS
    useEffect(() => {
        if (visible) {
            // Asegurar que el mouse sea visible y no esté bloqueado (Pointer Lock)
            document.body.style.cursor = 'default';
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
        } else {
            // No resetear para no romper la lógica del juego al reanudar si él lo oculta
        }
    }, [visible]);

    if (!visible) return null;

    return createPortal(
        <div
            className="menu-pausa-global-container"
            id="menuPausaPortal"
            style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2147483647, // EL Z-INDEX MÁXIMO POSIBLE EN NAVEGADORES (VALOR DE INT 32-bit)
                pointerEvents: 'auto',
                cursor: 'default'
            }}
        >
            {/* FORCE ALL SURFACES TO HAVE CURSOR */}
            <style>{`
                #menuPausaPortal,
                #menuPausaPortal *,
                body, html {
                    cursor: default !important;
                }
                #menuPausaPortal button, 
                #menuPausaPortal input, 
                #menuPausaPortal select,
                #menuPausaPortal .pause-menu-btn {
                    cursor: pointer !important;
                }
            `}</style>

            {/* Background Overlay Full-Screen */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(5, 5, 25, 0.6)', // Más transparente aún 
                    pointerEvents: 'auto',
                    backdropFilter: 'blur(3px)',
                    cursor: 'default'
                }}
                onClick={(e) => { e.stopPropagation(); onReanudar(); }}
            />

            {/* Menu Card */}
            <div
                className="rhythm-pause-menu-card"
                style={{
                    background: 'rgba(20, 20, 30, 0.96)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 50px 100px rgba(0,0,0,0.8)',
                    position: 'relative',
                    zIndex: 10,
                    pointerEvents: 'auto',
                    minWidth: '450px',
                    borderRadius: '16px',
                    padding: '30px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="pause-menu-header" style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <h2 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 900, letterSpacing: '2px', textShadow: '0 0 20px rgba(255,255,255,0.2)' }}>
                        {vista === 'opciones' ? 'AJUSTES' : 'MENÚ DE PAUSA'}
                    </h2>
                </div>

                <div className="pause-menu-container">
                    {vista === 'principal' ? (
                        <div className="pause-menu-options" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {opciones.map((opc, idx) => (
                                <button
                                    key={opc.label}
                                    className={`pause-menu-btn ${seleccionado === idx ? 'seleccionado' : ''}`}
                                    onMouseEnter={() => setSeleccionado(idx)}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); opc.action(); }}
                                    style={{
                                        padding: '18px 30px',
                                        fontSize: '1.3rem',
                                        background: seleccionado === idx ? 'rgba(255,255,255,0.15)' : 'transparent',
                                        color: seleccionado === idx ? '#fff' : '#aaa',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '100%',
                                        textAlign: 'left',
                                        transition: 'all 0.1s ease',
                                        fontWeight: 600
                                    }}
                                >
                                    <span style={{ marginRight: '20px', display: 'flex' }}>{opc.icon}</span>
                                    {opc.label.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="pause-menu-advanced" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                            <div className="advanced-item" style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <label style={{ color: '#aaa', fontSize: '0.9rem', textTransform: 'uppercase' }}>Volumen de la Canción</label>
                                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{volumenMusica}%</span>
                                </div>
                                <div className="advanced-control-row">
                                    <input
                                        type="range" min={0} max={100}
                                        value={volumenMusica}
                                        onChange={(e) => onCambiarVolumenMusica(Number(e.target.value))}
                                        style={{ width: '100%', accentColor: '#3b82f6', height: '6px' }}
                                    />
                                </div>
                            </div>

                            <div className="advanced-item" style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <label style={{ color: '#aaa', fontSize: '0.9rem', textTransform: 'uppercase' }}>Volumen del Acordeón</label>
                                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{volumenAcordeon}%</span>
                                </div>
                                <div className="advanced-control-row">
                                    <input
                                        type="range" min={0} max={100}
                                        value={volumenAcordeon}
                                        onChange={(e) => onCambiarVolumenAcordeon(Number(e.target.value))}
                                        style={{ width: '100%', accentColor: '#3b82f6', height: '6px' }}
                                    />
                                </div>
                            </div>

                            <div className="advanced-item" style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <label style={{ color: '#aaa', fontSize: '0.9rem', textTransform: 'uppercase' }}>Ritmo de Juego (BPM)</label>
                                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{bpm}</span>
                                </div>
                                <div className="advanced-control-row">
                                    <input
                                        type="range" min={40} max={200}
                                        value={bpm}
                                        onChange={(e) => onCambiarBpm(Number(e.target.value))}
                                        style={{ width: '100%', accentColor: '#3b82f6', height: '6px' }}
                                    />
                                </div>
                            </div>

                            <div className="advanced-item" style={{ marginBottom: '20px' }}>
                                <label style={{ color: '#aaa', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Notación Visual</label>
                                <select
                                    value={modoVista}
                                    onChange={(e) => onCambiarVista(e.target.value)}
                                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '1rem' }}
                                >
                                    <option value="teclas" style={{ background: '#111' }}>Normal</option>
                                    <option value="numeros" style={{ background: '#111' }}>Números</option>
                                    <option value="notas" style={{ background: '#111' }}>Notas (DoReMi)</option>
                                    <option value="cifrado" style={{ background: '#111' }}>Cifrado (ABC)</option>
                                </select>
                            </div>

                            <div className="advanced-item" style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ color: '#aaa', fontSize: '0.95rem', textTransform: 'uppercase' }}>
                                    {modoPractica === 'synthesia' ? 'Activar guía de audio' : 'Oír al Maestro'}
                                </label>
                                <input
                                    type="checkbox"
                                    checked={maestroSuena}
                                    onChange={(e) => onToggleMaestroSuena(e.target.checked)}
                                    style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#3b82f6' }}
                                />
                            </div>

                            {modoPractica === 'synthesia' && (
                                <div className="advanced-item" style={{ marginBottom: '25px' }}>
                                    <label style={{ color: '#aaa', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>
                                        Modo de referencia
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                                        <button
                                            onClick={() => onCambiarModoAudioSynthesia('solo_notas')}
                                            style={{
                                                padding: '12px',
                                                borderRadius: '10px',
                                                border: modoAudioSynthesia === 'solo_notas' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.12)',
                                                background: modoAudioSynthesia === 'solo_notas' ? 'rgba(59,130,246,0.16)' : 'rgba(255,255,255,0.04)',
                                                color: '#fff',
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Solo notas correctas
                                        </button>
                                        <button
                                            onClick={() => onCambiarModoAudioSynthesia('maestro')}
                                            style={{
                                                padding: '12px',
                                                borderRadius: '10px',
                                                border: modoAudioSynthesia === 'maestro' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.12)',
                                                background: modoAudioSynthesia === 'maestro' ? 'rgba(59,130,246,0.16)' : 'rgba(255,255,255,0.04)',
                                                color: '#fff',
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Acordeón del maestro
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="advanced-actions" style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                                <button className="btn-act back" onClick={() => setVista('principal')} style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem' }}>VOLVER</button>
                                <button className="btn-act done" onClick={onReanudar} style={{ flex: 1, padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem' }}>LISTO</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );

};

export default MenuPausaProMax;
