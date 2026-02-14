import React from 'react';
import { X, Music, Play, Pause } from 'lucide-react';
import type { AjustesAcordeon, SonidoVirtual } from '../../TiposAcordeon';

interface PestanaSonidoProps {
    tonalidadSeleccionada: string;
    setTonalidadSeleccionada: (val: string) => void;
    listaTonalidades: string[];
    eliminarTonalidad: (t: string) => void;
    botonSeleccionado: string | null;
    mapaBotonesActual: any;
    sonidosVirtuales: SonidoVirtual[];
    ajustes: AjustesAcordeon;
    setAjustes: React.Dispatch<React.SetStateAction<AjustesAcordeon>>;
    setSonidosVirtuales: (sv: SonidoVirtual[]) => void;
    playPreview: (ruta: string, pitch: number, loop?: boolean) => void;
    stopPreview: () => void;
    reproduceTono: (id: string) => { instances: any[] };
    samplesBrillante: string[];
    samplesBajos: string[];
    muestrasDB?: any[];
    soundsPerKey: Record<string, string[]>;
    obtenerRutasAudio: (id: string, ajustes?: AjustesAcordeon) => string[];
    setListaTonalidades: (val: string[]) => void;
    guardarNuevoSonidoVirtual: (nombre: string, rutaBase: string, pitch: number, tipo: 'Bajos' | 'Brillante') => void;
    modoVista?: 'controles' | 'seleccion';
}

const PestanaSonido: React.FC<PestanaSonidoProps> = ({
    tonalidadSeleccionada, setTonalidadSeleccionada, listaTonalidades, eliminarTonalidad,
    botonSeleccionado, mapaBotonesActual, sonidosVirtuales, ajustes, setAjustes,
    setSonidosVirtuales, playPreview, stopPreview, reproduceTono, samplesBrillante, samplesBajos,
    muestrasDB = [],
    obtenerRutasAudio,
    guardarNuevoSonidoVirtual,
    setListaTonalidades,
    modoVista = 'controles'
}) => {
    const activeItemRef = React.useRef<HTMLDivElement>(null);
    const [nickname, setNickname] = React.useState('');
    const [playingUrl, setPlayingUrl] = React.useState<string | null>(null);

    const formatearNota = (nombre: string) => {
        if (!nombre) return '';
        let base = nombre.trim().split(' ')[0].replace(/([a-z])([A-Z])/g, '$1 $2').split(' ')[0];
        return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
    };

    const esBajo = botonSeleccionado?.includes('bajo');
    const muestrasFiltradasDB = muestrasDB.filter(m => esBajo ? m.tipo === 'bajos' : m.tipo === 'pitos');

    const rutasActivasActuales = React.useMemo(() => {
        return obtenerRutasAudio(botonSeleccionado || '', ajustes);
    }, [botonSeleccionado, obtenerRutasAudio, ajustes, muestrasDB]);

    // Auto-scroll al elemento seleccionado
    React.useEffect(() => {
        if (activeItemRef.current) {
            activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [botonSeleccionado, rutasActivasActuales]);

    const togglePreview = (rutaBase: string, pitch: number) => {
        if (playingUrl === rutaBase) {
            stopPreview();
            setPlayingUrl(null);
        } else {
            playPreview(rutaBase, pitch, true);
            setPlayingUrl(rutaBase);
        }
    };

    return (
        <>
            {/* --- LADO IZQUIERDO: CONTROLES --- */}
            {modoVista === 'controles' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ marginBottom: '10px', color: '#3b82f6', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Gestor de Sonido Pro</h3>

                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px' }}>
                        <label style={{ display: 'block', fontSize: '10px', marginBottom: '8px', color: '#888', fontWeight: 'bold' }}>TONALIDAD ACTIVA</label>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                            <select
                                value={tonalidadSeleccionada}
                                onChange={(e) => setTonalidadSeleccionada(e.target.value)}
                                style={{ flex: 1, background: '#111', color: 'white', border: '1px solid #333', padding: '8px', borderRadius: '8px', fontSize: '12px', outline: 'none' }}
                            >
                                {listaTonalidades.map(t => (
                                    <option key={t} value={t}>
                                        {t === 'FBE' ? 'Fa - Sib - Mib (Original)' :
                                            t === 'GCF' ? 'Sol - Do - Fa' :
                                                t === 'ADG' ? 'La - Re - Sol' :
                                                    t === 'BES' ? 'Sib - Mib - Lab (Cinco Letras)' :
                                                        t === 'BEA' ? 'Si - Mi - La' :
                                                            t === 'CFB' ? 'Do - Fa - Sib' :
                                                                t === 'DGC' ? 'Re - Sol - Do' : t}
                                    </option>
                                ))}
                            </select>
                            <button onClick={() => {
                                const nombre = prompt('Nueva tonalidad:');
                                if (nombre && !listaTonalidades.includes(nombre)) {
                                    setListaTonalidades([...listaTonalidades, nombre]);
                                    setTonalidadSeleccionada(nombre);
                                }
                            }} style={{ background: '#3b82f622', color: '#3b82f6', border: '1px solid #3b82f633', borderRadius: '8px', padding: '0 10px', cursor: 'pointer' }}>+</button>
                            <button onClick={() => eliminarTonalidad(tonalidadSeleccionada)} style={{ background: '#ef444422', color: '#ef4444', border: '1px solid #ef444433', borderRadius: '8px', padding: '0 10px', cursor: 'pointer' }}><X size={16} /></button>
                        </div>

                        <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontSize: '10px', color: '#888', fontWeight: 'bold' }}>TRANSPOSICIÓN GLOBAL</span>
                                <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 'bold' }}>{ajustes.pitchGlobal || 0} st</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input type="range" min="-12" max="12" step="1" value={ajustes.pitchGlobal || 0} style={{ flex: 1, accentColor: '#3b82f6' }} onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setAjustes(prev => ({ ...prev, pitchGlobal: val }));
                                }} />
                                <button onClick={() => setAjustes(prev => ({ ...prev, pitchGlobal: 0 }))} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#666', padding: '4px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}>RESET</button>
                            </div>
                        </div>

                        <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <label style={{ display: 'block', fontSize: '10px', marginBottom: '8px', color: '#888', fontWeight: 'bold' }}>BANCO DE SONIDOS</label>
                            <select value={ajustes.bancoId || 'acordeon'} onChange={(e) => {
                                const val = e.target.value;
                                setAjustes(prev => ({ ...prev, bancoId: val }));
                            }} style={{ width: '100%', background: '#111', color: '#3b82f6', border: '1px solid #3b82f644', padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                                <option value="acordeon">🪗 ACORDEÓN REY</option>
                                <option value="caja">🥁 CAJA VALLENATA</option>
                                <option value="bajo">🎸 BAJO ELÉCTRICO</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ padding: '15px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)', textAlign: 'center' }}>
                        {botonSeleccionado ? (
                            <>
                                <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 'bold', background: '#3b82f622', color: '#3b82f6', textTransform: 'uppercase' }}>
                                    {botonSeleccionado.includes('halar') ? 'Halar' : 'Empujar'} {esBajo ? '• Bajo' : ''}
                                </span>
                                <h2 style={{ margin: '10px 0 0', fontSize: '24px', color: 'white', fontWeight: '900' }}>
                                    {formatearNota(mapaBotonesActual[botonSeleccionado]?.nombre || '')}
                                    <span style={{ fontSize: '14px', color: '#555', marginLeft: '5px' }}>{mapaBotonesActual[botonSeleccionado]?.octava || ''}</span>
                                </h2>
                            </>
                        ) : (
                            <p style={{ margin: 0, fontSize: '11px', color: '#555', fontStyle: 'italic' }}>Toca un botón para editarlo</p>
                        )}
                    </div>

                    {botonSeleccionado && (
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ fontSize: '10px', color: '#888', fontWeight: 'bold' }}>AJUSTE DE PITCH TOTAL</span>
                                <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 'bold' }}>{ajustes.pitchPersonalizado?.[botonSeleccionado] || 0} st</span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                                {[-12, 0, 12].map(st => (
                                    <button key={st} onClick={() => setAjustes(prev => ({
                                        ...prev,
                                        pitchPersonalizado: { ...(prev.pitchPersonalizado || {}), [botonSeleccionado]: st }
                                    }))} style={{ flex: 1, padding: '8px', fontSize: '10px', background: (ajustes.pitchPersonalizado?.[botonSeleccionado] || 0) === st ? '#3b82f6' : '#222', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                        {st === 0 ? 'BASE' : `${st > 0 ? '+' : ''}${st / 12}oct`}
                                    </button>
                                ))}
                            </div>
                            <input type="range" min="-24" max="24" value={ajustes.pitchPersonalizado?.[botonSeleccionado] || 0} style={{ width: '100%', accentColor: '#3b82f6' }} onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setAjustes(prev => ({
                                    ...prev,
                                    pitchPersonalizado: { ...(prev.pitchPersonalizado || {}), [botonSeleccionado]: val }
                                }));
                            }} />

                            {(ajustes.pitchPersonalizado?.[botonSeleccionado] !== 0) && (
                                <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
                                    <input type="text" placeholder="Apodo del tono..." value={nickname} onChange={e => setNickname(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#111', color: 'white', border: '1px solid #333', marginBottom: '8px' }} />
                                    <button onClick={() => {
                                        const mapeo = ajustes.mapeoPersonalizado[botonSeleccionado];
                                        const ruta = mapeo?.[0]?.includes('|') ? mapeo[0].split('|')[1] : mapeo?.[0];
                                        if (!ruta) return alert('Elige un sonido primero');
                                        guardarNuevoSonidoVirtual(nickname || 'Nuevo Tono', ruta, ajustes.pitchPersonalizado?.[botonSeleccionado] || 0, esBajo ? 'Bajos' : 'Brillante');
                                        setNickname('');
                                    }} style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>GUARDAR COMO NUEVO SONIDO</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* --- LADO DERECHO: SELECCIÓN --- */}
            {modoVista === 'seleccion' && (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '900', textAlign: 'center', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>Librería de Samplers Reales</h4>

                    {botonSeleccionado ? (
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', maxHeight: '580px' }}>
                            {/* 1. Virtuales */}
                            <p style={{ fontSize: '9px', fontWeight: '900', color: '#555', marginBottom: '8px' }}>MIS SONIDOS</p>
                            {sonidosVirtuales.filter(s => s.tipo === (esBajo ? 'Bajos' : 'Brillante')).map(sv => {
                                const rutaVirtual = `pitch:${sv.pitch}|${sv.rutaBase}`;
                                const activo = rutasActivasActuales.includes(rutaVirtual);
                                return (
                                    <div key={sv.id} onClick={() => {
                                        setAjustes(prev => ({
                                            ...prev,
                                            mapeoPersonalizado: { ...(prev.mapeoPersonalizado || {}), [botonSeleccionado]: [rutaVirtual] },
                                            pitchPersonalizado: { ...(prev.pitchPersonalizado || {}), [botonSeleccionado]: 0 }
                                        }));
                                        togglePreview(sv.rutaBase, sv.pitch);
                                    }} style={{ padding: '10px', borderRadius: '10px', background: activo ? '#3b82f622' : 'transparent', border: activo ? '1px solid #3b82f6' : '1px solid #333', color: activo ? 'white' : '#888', marginBottom: '5px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{sv.nombre} <small style={{ opacity: 0.5 }}>({sv.pitch > 0 ? '+' : ''}{sv.pitch}st)</small></span>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {playingUrl === sv.rutaBase ? <Pause size={14} /> : <Play size={14} />}
                                            <X size={14} style={{ color: '#ef4444' }} onClick={(e) => { e.stopPropagation(); setSonidosVirtuales(sonidosVirtuales.filter(s => s.id !== sv.id)); }} />
                                        </div>
                                    </div>
                                );
                            })}

                            {/* 2. Nube */}
                            <p style={{ fontSize: '9px', fontWeight: '900', color: '#555', margin: '20px 0 8px' }}>NUBE (HIFI)</p>
                            {muestrasFiltradasDB.map(m => {
                                const ruta = `pitch:0|${m.url_audio}`;
                                const activo = rutasActivasActuales.includes(ruta);
                                return (
                                    <div key={m.id} onClick={() => {
                                        setAjustes(prev => ({
                                            ...prev,
                                            mapeoPersonalizado: { ...(prev.mapeoPersonalizado || {}), [botonSeleccionado]: [ruta] }
                                        }));
                                        togglePreview(m.url_audio, 0);
                                    }} style={{ padding: '8px 12px', fontSize: '11px', borderRadius: '8px', border: activo ? '1px solid #10b981' : '1px solid transparent', background: activo ? '#10b98122' : 'rgba(255,255,255,0.02)', color: activo ? 'white' : '#666', marginBottom: '3px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{m.nota}{m.octava}</span>
                                        {playingUrl === m.url_audio ? <Pause size={12} /> : <Play size={12} />}
                                    </div>
                                );
                            })}

                            {/* 3. Locales */}
                            <p style={{ fontSize: '9px', fontWeight: '900', color: '#555', margin: '20px 0 8px' }}>LOCAL FILES</p>
                            {(esBajo ? samplesBajos : samplesBrillante).map(file => {
                                const ruta = `/audio/Muestras_Cromaticas/${esBajo ? 'Bajos' : 'Brillante'}/${file}`;
                                const activo = rutasActivasActuales.includes(ruta);
                                return (
                                    <div key={file} onClick={() => {
                                        setAjustes(prev => ({
                                            ...prev,
                                            mapeoPersonalizado: { ...(prev.mapeoPersonalizado || {}), [botonSeleccionado]: [ruta] }
                                        }));
                                        togglePreview(ruta, ajustes.pitchPersonalizado?.[botonSeleccionado] || 0);
                                    }} style={{ padding: '6px 10px', fontSize: '10px', color: activo ? '#3b82f6' : '#444', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <Music size={10} style={{ marginRight: '5px' }} /> {file}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontStyle: 'italic', fontSize: '12px' }}>Toca un botón para ver sus sonidos</div>
                    )}
                </div>
            )}
        </>
    );
};

export default PestanaSonido;
