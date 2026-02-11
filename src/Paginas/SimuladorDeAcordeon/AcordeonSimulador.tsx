import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { mapaTeclas } from './mapaTecladoYFrecuencias';
import { motion } from 'framer-motion';
import { Settings, RotateCcw, Type, Music, GripHorizontal, Columns, Save } from 'lucide-react';
import {
    mapaTeclasBajos,
    disposicion,
    disposicionBajos,
    mapaBotonesPorId,
    filas,
    filasBajos,
    cambiarFuelle
} from './notasAcordeonDiatonico';
import './AcordeonSimulador.css';
import bgAcordeonDefault from './Acordeon PRO MAX.png';

export interface AcordeonSimuladorProps {
    direccion?: 'halar' | 'empujar';
    deshabilitarInteraccion?: boolean;
    imagenFondo?: string;
    onNotaPresionada?: (data: { idBoton: string; nombre: string }) => void;
    onNotaLiberada?: (data: { idBoton: string; nombre: string }) => void;
}

export interface AcordeonSimuladorHandle {
    limpiarTodasLasNotas: () => void;
    cambiarDireccion: (nuevaDireccion: 'halar' | 'empujar') => void;
}

const AcordeonSimulador = forwardRef<AcordeonSimuladorHandle, AcordeonSimuladorProps>(({
    direccion: direccionProp = 'halar',
    deshabilitarInteraccion = false,
    imagenFondo = bgAcordeonDefault,
    onNotaPresionada,
    onNotaLiberada
}, ref) => {

    const [botonesActivos, setBotonesActivos] = useState<Record<string, any>>({});
    const [direccion, setDireccion] = useState<'halar' | 'empujar'>(direccionProp);
    const [modoAjuste, setModoAjuste] = useState(false);
    const [modoVista, setModoVista] = useState<'teclas' | 'numeros' | 'notas' | 'cifrado'>('notas');
    const [vistaDoble, setVistaDoble] = useState(false);

    const audioRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const botonesActivosRef = useRef<Record<string, any>>({});

    // --- 🛠️ AJUSTES EXACTOS DE ACORDEON_ANTERIOR.TSX ---
    const [ajustes, setAjustes] = useState({
        tamano: '82vh',
        x: '53.5%',
        y: '50%',
        pitosBotonTamano: '4.4vh',
        pitosFuenteTamano: '1.6vh',
        bajosBotonTamano: '4.2vh',
        bajosFuenteTamano: '1.3vh',
        teclasLeft: '5.05%',
        teclasTop: '13%',
        bajosLeft: '82.5%',
        bajosTop: '28%'
    });

    useEffect(() => {
        if (modoAjuste) {
            document.body.classList.add('diseno-activo');
        } else {
            document.body.classList.remove('diseno-activo');
        }
        return () => { document.body.classList.remove('diseno-activo'); };
    }, [modoAjuste]);

    useEffect(() => {
        const guardados = localStorage.getItem('ajustes_acordeon_vPRO');
        if (guardados) { try { setAjustes(JSON.parse(guardados)); } catch (e) { } }
    }, []);

    const guardarAjustes = () => {
        localStorage.setItem('ajustes_acordeon_vPRO', JSON.stringify(ajustes));
        setModoAjuste(false);
        alert('✅ ¡Diseño Pro Guardado!');
    };

    const resetearAjustes = () => {
        const defaults = {
            tamano: '82vh', x: '53.5%', y: '50%',
            pitosBotonTamano: '4.4vh', pitosFuenteTamano: '1.6vh',
            bajosBotonTamano: '4.2vh', bajosFuenteTamano: '1.3vh',
            teclasLeft: '5.05%', teclasTop: '13%', bajosLeft: '82.5%', bajosTop: '28%'
        };
        setAjustes(defaults);
        localStorage.removeItem('ajustes_acordeon_vPRO');
    };

    const direccionRef = useRef(direccion);
    const deshabilitarRef = useRef(deshabilitarInteraccion);

    useEffect(() => { direccionRef.current = direccion; }, [direccion]);
    useEffect(() => { deshabilitarRef.current = deshabilitarInteraccion; }, [deshabilitarInteraccion]);
    useEffect(() => { if (direccionProp !== direccion) setDireccion(direccionProp); }, [direccionProp]);
    useEffect(() => { botonesActivosRef.current = botonesActivos; }, [botonesActivos]);

    useEffect(() => {
        const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtor) {
            audioRef.current = new AudioCtor({ latencyHint: 'interactive' });
            gainNodeRef.current = audioRef.current.createGain();
            gainNodeRef.current.gain.value = 0.8;
            gainNodeRef.current.connect(audioRef.current.destination);
        }
        const hKD = (e: KeyboardEvent) => manejarEventoTeclado(e, true);
        const hKU = (e: KeyboardEvent) => manejarEventoTeclado(e, false);
        window.addEventListener('keydown', hKD);
        window.addEventListener('keyup', hKU);
        return () => {
            window.removeEventListener('keydown', hKD);
            window.removeEventListener('keyup', hKU);
            if (audioRef.current) audioRef.current.close();
        };
    }, []);

    const reproducirTono = (id: string) => {
        if (!audioRef.current || !gainNodeRef.current) return { oscillator: null };
        if (audioRef.current.state === 'suspended') audioRef.current.resume();
        const btn = mapaBotonesPorId[id];
        if (!btn) return { oscillator: null };
        const { frecuencia } = btn;
        let oscillator: OscillatorNode | OscillatorNode[];
        if (Array.isArray(frecuencia)) {
            oscillator = frecuencia.map(hz => {
                const osc = audioRef.current!.createOscillator();
                osc.type = 'sawtooth';
                osc.connect(gainNodeRef.current!);
                osc.frequency.value = hz;
                osc.start();
                return osc;
            });
        } else {
            oscillator = audioRef.current.createOscillator();
            oscillator.type = 'sawtooth';
            oscillator.connect(gainNodeRef.current);
            oscillator.frequency.value = frecuencia as number;
            oscillator.start();
        }
        return { oscillator };
    };

    const detenerTono = (id: string) => {
        const b = botonesActivosRef.current[id];
        if (!b?.oscillator) return;
        try {
            if (Array.isArray(b.oscillator)) b.oscillator.forEach((o: any) => o?.stop());
            else b.oscillator.stop();
        } catch (e) { }
    };

    const actualizarBotonActivo = useCallback((id: string, accion: 'add' | 'remove' = 'add') => {
        if (deshabilitarRef.current || modoAjuste) return;
        if (accion === 'add') {
            if (botonesActivosRef.current[id]) return;
            const { oscillator } = reproducirTono(id);
            if (!oscillator) return;
            const newState = { ...botonesActivosRef.current, [id]: { oscillator, ...mapaBotonesPorId[id] } };
            botonesActivosRef.current = newState;
            setBotonesActivos(newState);
            onNotaPresionada?.({ idBoton: id, nombre: id });
        } else {
            detenerTono(id);
            const newState = { ...botonesActivosRef.current };
            delete newState[id];
            botonesActivosRef.current = newState;
            setBotonesActivos(newState);
            onNotaLiberada?.({ idBoton: id, nombre: id });
        }
    }, [modoAjuste, onNotaPresionada, onNotaLiberada]);

    const limpiarTodasLasNotas = () => {
        Object.keys(botonesActivosRef.current).forEach(id => detenerTono(id));
        botonesActivosRef.current = {};
        setBotonesActivos({});
    };

    const manejarEventoTeclado = (e: KeyboardEvent | React.KeyboardEvent, esPresionada: boolean) => {
        if (deshabilitarRef.current) return;
        const tecla = e.key.toLowerCase();
        if (tecla === cambiarFuelle) {
            const nuevaDireccion = esPresionada ? 'empujar' : 'halar';
            if (nuevaDireccion !== direccionRef.current) {
                const prev = { ...botonesActivosRef.current };
                setDireccion(nuevaDireccion);
                direccionRef.current = nuevaDireccion;
                const next: Record<string, any> = {};
                Object.keys(prev).forEach(oldId => {
                    const parts = oldId.split('-');
                    const newId = `${parts[0]}-${parts[1]}-${nuevaDireccion}${oldId.includes('bajo') ? '-bajo' : ''}`;
                    const { oscillator } = reproducirTono(newId);
                    if (oscillator) next[newId] = { oscillator, ...mapaBotonesPorId[newId] };
                    detenerTono(oldId);
                });
                botonesActivosRef.current = next;
                setBotonesActivos(next);
            }
            return;
        }
        const d = mapaTeclas[tecla] || mapaTeclasBajos[tecla];
        if (!d) return;
        const id = `${d.fila}-${d.columna}-${direccionRef.current}${mapaTeclasBajos[tecla] ? '-bajo' : ''}`;
        if (esPresionada) actualizarBotonActivo(id, 'add');
        else actualizarBotonActivo(id, 'remove');
    };

    const cifradoAmericano: Record<string, string> = {
        'Do': 'C', 'Do#': 'C#', 'Reb': 'Db', 'Re': 'D', 'Re#': 'D#', 'Mib': 'Eb', 'Mi': 'E',
        'Fa': 'F', 'Fa#': 'F#', 'Solb': 'Gb', 'Sol': 'G', 'Sol#': 'G#', 'Lab': 'Ab', 'La': 'A', 'La#': 'A#', 'Sib': 'Bb', 'Si': 'B'
    };

    const formatearNota = (nombre: string) => {
        if (!nombre) return '';
        let base = nombre.trim().split(' ')[0].replace(/([a-z])([A-Z])/g, '$1 $2').split(' ')[0];
        base = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
        if (modoVista === 'cifrado') return cifradoAmericano[base] || base;
        return base;
    };

    const getFilaDisplay = (f: string) => {
        if (f === 'primeraFila') return 'Afuera (1)';
        if (f === 'segundaFila') return 'Medio (2)';
        if (f === 'terceraFila') return 'Adentro (3)';
        return f;
    };

    useImperativeHandle(ref, () => ({ limpiarTodasLasNotas, cambiarDireccion: setDireccion }));

    return (
        <div style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>

            <button
                onClick={() => setModoAjuste(!modoAjuste)}
                style={{
                    position: 'fixed', top: '90px', right: '40px', zIndex: 9999999,
                    background: modoAjuste ? '#ef4444' : '#3b82f6', color: 'white',
                    border: '3px solid white', borderRadius: '50%', width: '80px', height: '80px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', transition: 'all 0.2s'
                }}
            >
                <Settings size={30} />
                <span style={{ fontSize: '10px', fontWeight: 'bold' }}>GESTOR</span>
            </button>

            <div style={{
                position: 'fixed', top: '180px', right: '40px', zIndex: 999999,
                textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end', width: '200px'
            }}>
                <button
                    onClick={() => {
                        const nDir = direccion === 'halar' ? 'empujar' : 'halar';
                        setDireccion(nDir);
                        direccionRef.current = nDir;
                        limpiarTodasLasNotas();
                    }}
                    style={{
                        background: direccion === 'halar' ? 'linear-gradient(to right, #ef4444, #991b1b)' : 'linear-gradient(to right, #22c55e, #166534)',
                        color: 'white', border: '2px solid white', borderRadius: '15px', padding: '12px', fontWeight: '900', cursor: 'pointer',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.4)', transition: 'all 0.3s', width: '100%'
                    }}
                >
                    <RotateCcw size={20} />
                    <div style={{ fontSize: '12px' }}>{direccion === 'halar' ? 'ABRIENDO (HALAR)' : 'CERRANDO (EMPUJAR)'}</div>
                </button>

                <div style={{
                    background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '18px',
                    display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', width: '100%'
                }}>
                    <p style={{ margin: 0, fontSize: '9px', color: '#888', fontWeight: '900', textAlign: 'center', letterSpacing: '1px', textTransform: 'uppercase' }}>VISTA</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                        <button onClick={() => setModoVista('teclas')} style={{ width: '32px', height: '32px', borderRadius: '8px', background: modoVista === 'teclas' ? '#3b82f6' : '#222', border: 'none', cursor: 'pointer', color: 'white' }}><Type size={14} /></button>
                        <button onClick={() => setModoVista('numeros')} style={{ width: '32px', height: '32px', borderRadius: '8px', background: modoVista === 'numeros' ? '#3b82f6' : '#222', border: 'none', cursor: 'pointer', color: 'white', fontWeight: 'bold', fontSize: '10px' }}>123</button>
                        <button onClick={() => setModoVista('notas')} style={{ width: '32px', height: '32px', borderRadius: '8px', background: modoVista === 'notas' ? '#3b82f6' : '#222', border: 'none', cursor: 'pointer', color: 'white' }}><Music size={14} /></button>
                        <button onClick={() => setModoVista('cifrado')} style={{ width: '32px', height: '32px', borderRadius: '8px', background: modoVista === 'cifrado' ? '#3b82f6' : '#222', border: 'none', cursor: 'pointer', color: 'white', fontWeight: 'bold', fontSize: '10px' }}>ABC</button>
                        <button onClick={() => setVistaDoble(!vistaDoble)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: vistaDoble ? '#3b82f6' : '#222', border: 'none', cursor: 'pointer', color: 'white' }}><Columns size={14} /></button>
                    </div>
                </div>
            </div>

            {/* --- 🛠️ PANEL DE AJUSTES (RESTAURADO EXACTO DE ACORDEON_ANTERIOR.TSX) --- */}
            {modoAjuste && (
                <motion.div drag dragMomentum={false} className="panel-ajustes visible" style={{
                    position: 'fixed', top: '140px', right: '140px', zIndex: 9999999,
                    background: '#0a0a0ae6', padding: '25px', borderRadius: '24px',
                    color: 'white', width: '360px', border: '1px solid #3b82f6', backdropFilter: 'blur(20px)',
                    boxShadow: '0 0 80px rgba(0,0,0,1)'
                } as any}>
                    <div style={{ width: '100%', height: '24px', cursor: 'move', display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                        <GripHorizontal color="#3b82f6" />
                    </div>
                    <h3 style={{ marginBottom: '20px', color: '#3b82f6', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>HERRAMIENTAS DE ESTILO</h3>

                    <div className="grupo-ajuste" style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '11px', color: '#aaa', display: 'block' }}>ESCALA ACORDEÓN: {ajustes.tamano}</label>
                        <input type="range" min="40" max="110" value={parseFloat(ajustes.tamano)} onChange={(e) => setAjustes({ ...ajustes, tamano: `${e.target.value}vh` })} style={{ width: '100%' }} />

                        <div style={{ display: 'flex', gap: '15px', marginTop: '12px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '10px' }}>HORIZONTAL (X)</label>
                                <input type="range" min="0" max="100" step="0.1" value={parseFloat(ajustes.x)} onChange={(e) => setAjustes({ ...ajustes, x: `${e.target.value}%` })} style={{ width: '100%' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '10px' }}>VERTICAL (Y)</label>
                                <input type="range" min="0" max="100" step="0.1" value={parseFloat(ajustes.y)} onChange={(e) => setAjustes({ ...ajustes, y: `${e.target.value}%` })} style={{ width: '100%' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(34, 197, 94, 0.08)', padding: '15px', borderRadius: '18px', marginBottom: '15px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                        <p style={{ color: '#22c55e', fontSize: '11px', fontWeight: 'bold' }}>🎹 PITOS (DERECHA)</p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '9px' }}>BOTÓN</label>
                                <input type="range" min="1" max="10" step="0.1" value={parseFloat(ajustes.pitosBotonTamano)} onChange={(e) => setAjustes({ ...ajustes, pitosBotonTamano: `${e.target.value}vh` })} style={{ width: '100%' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '9px' }}>LETRA</label>
                                <input type="range" min="0.5" max="5" step="0.1" value={parseFloat(ajustes.pitosFuenteTamano)} onChange={(e) => setAjustes({ ...ajustes, pitosFuenteTamano: `${e.target.value}vh` })} style={{ width: '100%' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '9px' }}>POS. H</label>
                                <input type="range" min="-100" max="200" step="0.1" value={parseFloat(ajustes.teclasLeft)} onChange={(e) => setAjustes({ ...ajustes, teclasLeft: `${e.target.value}%` })} style={{ width: '100%' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '9px' }}>POS. V</label>
                                <input type="range" min="-100" max="200" step="0.1" value={parseFloat(ajustes.teclasTop)} onChange={(e) => setAjustes({ ...ajustes, teclasTop: `${e.target.value}%` })} style={{ width: '100%' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(234, 179, 8, 0.08)', padding: '15px', borderRadius: '18px', marginBottom: '20px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                        <p style={{ color: '#eab308', fontSize: '11px', fontWeight: 'bold' }}>🎸 BAJOS (IZQUIERDA)</p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '9px' }}>BOTÓN</label>
                                <input type="range" min="1" max="10" step="0.1" value={parseFloat(ajustes.bajosBotonTamano)} onChange={(e) => setAjustes({ ...ajustes, bajosBotonTamano: `${e.target.value}vh` })} style={{ width: '100%' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '9px' }}>LETRA</label>
                                <input type="range" min="0.5" max="5" step="0.1" value={parseFloat(ajustes.bajosFuenteTamano)} onChange={(e) => setAjustes({ ...ajustes, bajosFuenteTamano: `${e.target.value}vh` })} style={{ width: '100%' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '9px' }}>POS. H</label>
                                <input type="range" min="-100" max="200" step="0.1" value={parseFloat(ajustes.bajosLeft)} onChange={(e) => setAjustes({ ...ajustes, bajosLeft: `${e.target.value}%` })} style={{ width: '100%' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '9px' }}>POS. V</label>
                                <input type="range" min="-100" max="200" step="0.1" value={parseFloat(ajustes.bajosTop)} onChange={(e) => setAjustes({ ...ajustes, bajosTop: `${e.target.value}%` })} style={{ width: '100%' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={guardarAjustes} className="boton-accion-panel" style={{ background: '#22c55e', color: 'white', flex: 1, padding: '10px', borderRadius: '10px', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <Save size={14} /> GUARDAR
                        </button>
                        <button onClick={resetearAjustes} className="boton-accion-panel" style={{ background: '#444', color: 'white', flex: 1, padding: '10px', borderRadius: '10px', border: 'none', fontWeight: 'bold' }}>REINICIAR</button>
                    </div>
                </motion.div>
            )}

            <motion.div className="disposicion-acordeon" style={{
                '--imagen-fondo-acordeon': `url('${imagenFondo}')`,
                '--sim-tamano': ajustes.tamano, '--sim-x': ajustes.x, '--sim-y': ajustes.y,
                '--sim-pitos-boton-tamano': ajustes.pitosBotonTamano, '--sim-pitos-fuente-tamano': ajustes.pitosFuenteTamano,
                '--sim-bajos-boton-tamano': ajustes.bajosBotonTamano, '--sim-bajos-fuente-tamano': ajustes.bajosFuenteTamano,
                '--sim-teclas-left': ajustes.teclasLeft, '--sim-teclas-top': ajustes.teclasTop,
                '--sim-bajos-left': ajustes.bajosLeft, '--sim-bajos-top': ajustes.bajosTop
            } as any}>
                <div className="lado-teclas">
                    {filas.map(f => (
                        <div key={f} className={`fila ${f === 'primeraFila' ? 'tres' : f === 'segundaFila' ? 'dos' : 'uno'}`}>
                            {disposicion[f].filter(b => b.id.includes(direccion)).map(b => {
                                const baseId = b.id.replace('-halar', '').replace('-empujar', '');
                                const idHalar = `${baseId}-halar`;
                                const idEmpujar = `${baseId}-empujar`;

                                return (
                                    <div key={b.id} className={`boton ${botonesActivos[b.id] ? 'activo' : ''} ${direccion}`} onMouseDown={() => actualizarBotonActivo(b.id, 'add')} onMouseUp={() => actualizarBotonActivo(b.id, 'remove')} onMouseLeave={() => actualizarBotonActivo(b.id, 'remove')}>
                                        {!vistaDoble ? (
                                            <span style={{ color: direccion === 'halar' ? '#3b82f6' : '#f97316', fontWeight: '900' }}>
                                                {modoVista === 'teclas' ? (Object.keys(mapaTeclas).find(k => mapaTeclas[k].fila === parseInt(b.id.split('-')[0]) && mapaTeclas[k].columna === parseInt(b.id.split('-')[1])) || '').toUpperCase() :
                                                    modoVista === 'numeros' ? b.id.split('-')[1] : formatearNota(mapaBotonesPorId[b.id]?.nombre || '')}
                                            </span>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1', fontSize: '0.8em', gap: '2px' }}>
                                                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{formatearNota(mapaBotonesPorId[idHalar]?.nombre || '')}</span>
                                                <span style={{ color: '#f97316', fontWeight: 'bold' }}>{formatearNota(mapaBotonesPorId[idEmpujar]?.nombre || '')}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <h4 style={{ margin: '5px 0', fontSize: '9px', fontWeight: 'bold', color: 'white', textShadow: '1px 1px 2px black' }}>{getFilaDisplay(f)}</h4>
                        </div>
                    ))}
                </div>
                <div className="lado-bajos">
                    {filasBajos.map(f => (
                        <div key={f} className={`fila ${f}`}>
                            {disposicionBajos[f].filter(b => b.id.includes(direccion)).map(b => {
                                const baseId = b.id.replace('-halar-bajo', '').replace('-empujar-bajo', '');
                                const idHalar = `${baseId}-halar-bajo`;
                                const idEmpujar = `${baseId}-empujar-bajo`;

                                return (
                                    <div key={b.id} className={`boton ${botonesActivos[b.id] ? 'activo' : ''} ${direccion}`} onMouseDown={() => actualizarBotonActivo(b.id, 'add')} onMouseUp={() => actualizarBotonActivo(b.id, 'remove')} onMouseLeave={() => actualizarBotonActivo(b.id, 'remove')}>
                                        {!vistaDoble ? (
                                            <span style={{ color: direccion === 'halar' ? '#3b82f6' : '#f97316', fontWeight: '900' }}>
                                                {formatearNota(mapaBotonesPorId[b.id]?.nombre || '')}
                                            </span>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1', fontSize: '0.7em', gap: '2px', textAlign: 'center' }}>
                                                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{formatearNota(mapaBotonesPorId[idHalar]?.nombre || '')}</span>
                                                <span style={{ color: '#f97316', fontWeight: 'bold' }}>{formatearNota(mapaBotonesPorId[idEmpujar]?.nombre || '')}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
});

export default AcordeonSimulador;