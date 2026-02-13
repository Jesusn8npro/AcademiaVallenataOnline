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
    setAjustes: (a: AjustesAcordeon) => void;
    setSonidosVirtuales: (sv: SonidoVirtual[]) => void;
    playPreview: (ruta: string, pitch: number, loop?: boolean) => void;
    stopPreview: () => void;
    reproduceTono: (id: string) => { instances: any[] };
    samplesBrillante: string[];
    samplesBajos: string[];
    muestrasDB?: any[];
    soundsPerKey: Record<string, string[]>;
    obtenerRutasAudio: (id: string, ajustes?: AjustesAcordeon) => string[];
    guardarNuevoSonidoVirtual: (nombre: string, rutaBase: string, pitch: number, tipo: 'Bajos' | 'Brillante') => void;
}

const PestanaSonido: React.FC<PestanaSonidoProps> = ({
    tonalidadSeleccionada, setTonalidadSeleccionada, listaTonalidades, eliminarTonalidad,
    botonSeleccionado, mapaBotonesActual, sonidosVirtuales, ajustes, setAjustes,
    setSonidosVirtuales, playPreview, stopPreview, reproduceTono, samplesBrillante, samplesBajos,
    muestrasDB = [],
    soundsPerKey,
    obtenerRutasAudio,
    guardarNuevoSonidoVirtual
}) => {
    const listRef = React.useRef<HTMLDivElement>(null);
    const activeItemRef = React.useRef<HTMLDivElement>(null);
    const [nickname, setNickname] = React.useState('');

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

    const [playingUrl, setPlayingUrl] = React.useState<string | null>(null);

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
            <h3 style={{ marginBottom: '10px', color: '#3b82f6', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Gestor de Sonido Pro</h3>

            <div style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px' }}>
                <label style={{ display: 'block', fontSize: '10px', marginBottom: '8px', color: '#888', fontWeight: 'bold' }}>TONALIDAD ACTIVA</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                        value={tonalidadSeleccionada}
                        onChange={(e) => setTonalidadSeleccionada(e.target.value)}
                        style={{ flex: 1, background: '#111', color: 'white', border: '1px solid #333', padding: '8px', borderRadius: '8px', fontSize: '12px', outline: 'none' }}
                    >
                        {listaTonalidades.map(t => (
                            <option key={t} value={t}>
                                {t === 'FBE' ? 'Fa - Sib - Mib (Original)' :
                                    t === 'GCF' ? 'Sol - Do - Fa (ADGCF)' :
                                        t === 'ADG' ? 'La - Re - Sol' :
                                            t === 'BES' ? 'Sib - Mib - Lab (Cinco Letras)' :
                                                t === 'BEA' ? 'Si - Mi - La' :
                                                    t === 'CFB' ? 'Do - Fa - Sib' :
                                                        t === 'DGC' ? 'Re - Sol - Do' : t}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => eliminarTonalidad(tonalidadSeleccionada)}
                        style={{ background: '#ef444422', color: '#ef4444', border: '1px solid #ef444433', borderRadius: '8px', padding: '0 10px', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div style={{ margin: '15px 0', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                {botonSeleccionado ? (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '5px' }}>
                            <span style={{
                                padding: '3px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase',
                                background: botonSeleccionado.includes('halar') ? 'rgba(59, 130, 246, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                                color: botonSeleccionado.includes('halar') ? '#3b82f6' : '#f97316',
                                border: `1px solid ${botonSeleccionado.includes('halar') ? '#3b82f644' : '#f9731644'}`
                            }}>
                                {botonSeleccionado.includes('halar') ? 'Halar' : 'Empujar'}
                                {botonSeleccionado.includes('bajo') ? ' • Bajo' : ''}
                            </span>
                        </div>
                        <h2 style={{ margin: 0, fontSize: '28px', color: 'white', fontWeight: '900', textShadow: '0 0 20px rgba(59,130,246,0.3)' }}>
                            {formatearNota(mapaBotonesActual[botonSeleccionado]?.nombre || '')}
                            <span style={{ fontSize: '16px', color: '#555', marginLeft: '5px' }}>
                                {mapaBotonesActual[botonSeleccionado]?.octava || ''}
                            </span>
                        </h2>
                        <p style={{ margin: '5px 0 0', fontSize: '10px', color: '#444', fontWeight: 'bold' }}>EDITANDO ESTE BOTÓN</p>
                    </>
                ) : (
                    <p style={{ margin: 0, fontSize: '11px', color: '#555', fontStyle: 'italic' }}>
                        Selecciona un botón para cambiar su sonido
                    </p>
                )}
            </div>

            {botonSeleccionado && (
                <div style={{ maxHeight: '350px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', padding: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '15px' }}>

                    {/* SONIDOS PERSONALIZADOS / VIRTUALES (ORDENADOS POR PITCH) */}
                    <p style={{ fontSize: '9px', fontWeight: '900', color: '#444', marginBottom: '8px', letterSpacing: '1px', textAlign: 'center' }}>VIRTUALES / PERSONALIZADOS</p>
                    {sonidosVirtuales
                        .filter(sv => sv.tipo === (esBajo ? 'Bajos' : 'Brillante'))
                        .sort((a, b) => a.pitch - b.pitch) // 🎵 Ordenar por octavas (Grave arriba, Agudo abajo)
                        .map(sv => {
                            const rutaVirtual = `pitch:${sv.pitch}|${sv.rutaBase}`;
                            const estaSeleccionado = rutasActivasActuales.includes(rutaVirtual);
                            const mapeoActual = ajustes.mapeoPersonalizado[botonSeleccionado!] || [];

                            return (
                                <div key={sv.id}
                                    ref={estaSeleccionado ? activeItemRef : null}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const newMapeo = { ...ajustes.mapeoPersonalizado, [botonSeleccionado!]: [rutaVirtual] };
                                        const newPitch = { ...(ajustes.pitchPersonalizado || {}), [botonSeleccionado!]: 0 };
                                        setAjustes({ ...ajustes, mapeoPersonalizado: newMapeo, pitchPersonalizado: newPitch });
                                        togglePreview(sv.rutaBase, sv.pitch);
                                    }}
                                    style={{
                                        padding: '10px 14px', fontSize: '11px', cursor: 'pointer',
                                        background: estaSeleccionado ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.02)',
                                        color: estaSeleccionado ? 'white' : '#bbb',
                                        borderRadius: '10px', marginBottom: '6px',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        border: estaSeleccionado ? '2px solid #3b82f6' : '1px solid transparent',
                                        transition: 'all 0.2s',
                                        boxShadow: estaSeleccionado ? '0 0 20px rgba(59, 130, 246, 0.2)' : 'none'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
                                            {playingUrl === sv.rutaBase ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                                        </div>
                                        <span style={{ fontWeight: estaSeleccionado ? 'bold' : 'normal' }}>
                                            {sv.nombre} <span style={{ fontSize: '9px', opacity: 0.5 }}>({sv.pitch > 0 ? '+' : ''}{sv.pitch})</span>
                                        </span>
                                    </div>
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm('¿Eliminar sonido personalizado?')) {
                                            const nueva = sonidosVirtuales.filter(s => s.id !== sv.id);
                                            setSonidosVirtuales(nueva);
                                        }
                                    }} style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '16px', cursor: 'pointer', opacity: 0.5, padding: '0 4px' }}>×</button>
                                </div>
                            );
                        })}

                    {/* MUESTRAS DE LA NUBE (SUPABASE) */}
                    {muestrasFiltradasDB.length > 0 && (
                        <>
                            <p style={{ fontSize: '9px', fontWeight: '900', color: '#444', margin: '20px 0 8px', letterSpacing: '1px', textAlign: 'center' }}>SAMPLES DE LA NUBE</p>
                            {muestrasFiltradasDB.map(m => {
                                const ruta = `pitch:0|${m.url_audio}`;
                                const estaSeleccionado = rutasActivasActuales.includes(ruta);

                                return (
                                    <div key={m.id}
                                        ref={estaSeleccionado ? activeItemRef : null}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newMapeo = { ...ajustes.mapeoPersonalizado, [botonSeleccionado!]: [ruta] };
                                            setAjustes({ ...ajustes, mapeoPersonalizado: newMapeo });
                                            togglePreview(m.url_audio, 0);
                                        }}
                                        style={{
                                            padding: '8px 14px', fontSize: '10px', cursor: 'pointer',
                                            background: estaSeleccionado ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                                            color: estaSeleccionado ? 'white' : '#888',
                                            borderRadius: '8px', marginBottom: '2px',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            border: estaSeleccionado ? '2px solid #10b981' : '1px solid transparent'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
                                                {playingUrl === m.url_audio ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
                                            </div>
                                            <span style={{ fontWeight: estaSeleccionado ? 'bold' : 'normal' }}>{m.nota}{m.octava} <span style={{ fontSize: '8px', opacity: 0.5 }}>- High Fidelity</span></span>
                                        </div>
                                        {estaSeleccionado && <Music size={12} />}
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {/* SAMPLES ORIGINALES (FALLBACK) */}
                    <p style={{ fontSize: '9px', fontWeight: '900', color: '#444', margin: '20px 0 8px', letterSpacing: '1px', textAlign: 'center' }}>SAMPLES LOCALES</p>
                    {(esBajo ? samplesBajos : samplesBrillante).map(file => {
                        const folder = esBajo ? 'Bajos' : 'Brillante';
                        const ruta = `/audio/Muestras_Cromaticas/${folder}/${file}`;
                        const estaSeleccionado = rutasActivasActuales.includes(ruta);

                        return (
                            <div key={file}
                                ref={estaSeleccionado ? activeItemRef : null}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newMapeo = { ...ajustes.mapeoPersonalizado, [botonSeleccionado!]: [ruta] };
                                    setAjustes({ ...ajustes, mapeoPersonalizado: newMapeo });
                                    togglePreview(ruta, ajustes.pitchPersonalizado?.[botonSeleccionado!] || 0);
                                }}
                                style={{
                                    padding: '8px 14px', fontSize: '10px', cursor: 'pointer',
                                    background: estaSeleccionado ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                    color: estaSeleccionado ? 'white' : '#777',
                                    borderRadius: '8px', marginBottom: '2px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    border: estaSeleccionado ? '2px solid #3b82f6' : '1px solid transparent'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                    <div style={{ minWidth: '20px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
                                        {playingUrl === ruta ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
                                    </div>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file}</span>
                                </div>
                                {estaSeleccionado && <Music size={12} />}
                            </div>
                        );
                    })}
                </div>
            )}


            {botonSeleccionado && ajustes.mapeoPersonalizado[botonSeleccionado] && (
                <button
                    onClick={() => {
                        const m = { ...ajustes.mapeoPersonalizado }; delete m[botonSeleccionado!];
                        const p = { ...(ajustes.pitchPersonalizado || {}) }; delete p[botonSeleccionado!];
                        setAjustes({ ...ajustes, mapeoPersonalizado: m, pitchPersonalizado: p });
                    }}
                    style={{ marginTop: '8px', width: '100%', padding: '10px', borderRadius: '10px', background: '#222', color: '#aaa', border: '1px solid #333', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    Restablecer sonido original
                </button>
            )}

            {botonSeleccionado && (
                <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="grupo-ajuste">
                        <label style={{ fontSize: '10px', color: '#888', display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontWeight: 'bold' }}>
                            AJUSTE DE PITCH <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{ajustes.pitchPersonalizado?.[botonSeleccionado] || 0} st</span>
                        </label>

                        {/* 🎹 BOTONES DE OCTAVA RÁPIDA */}
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                            {[-24, -12, 0, 12, 24].map(st => {
                                const currentPitch = ajustes.pitchPersonalizado?.[botonSeleccionado!] || 0;
                                const activo = st === 0 ? currentPitch === 0 : currentPitch === st;
                                return (
                                    <button
                                        key={st}
                                        onClick={() => {
                                            const newP = { ...(ajustes.pitchPersonalizado || {}), [botonSeleccionado!]: st };
                                            setAjustes({ ...ajustes, pitchPersonalizado: newP });
                                            const { instances } = reproduceTono(botonSeleccionado!);
                                            setTimeout(() => instances.forEach((i: any) => { i.gain.gain.setValueAtTime(i.gain.gain.value, i.gain.context.currentTime); i.gain.gain.exponentialRampToValueAtTime(0.001, i.gain.context.currentTime + 0.5); i.source.stop(i.gain.context.currentTime + 0.6); }), 1000);
                                        }}
                                        style={{
                                            flex: 1, padding: '6px 0', fontSize: '10px', fontWeight: 'bold',
                                            background: activo ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                                            color: activo ? 'white' : '#666',
                                            border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        {st === 0 ? 'BASE' : `${st > 0 ? '+' : ''}${st / 12}oct`}
                                    </button>
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                                onClick={() => {
                                    const val = (ajustes.pitchPersonalizado?.[botonSeleccionado!] || 0) - 1;
                                    const newP = { ...(ajustes.pitchPersonalizado || {}), [botonSeleccionado!]: val };
                                    setAjustes({ ...ajustes, pitchPersonalizado: newP });
                                }}
                                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer' }}
                            >-</button>

                            <input
                                type="range" min="-24" max="24" step="1"
                                value={ajustes.pitchPersonalizado?.[botonSeleccionado] || 0}
                                style={{ flex: 1, accentColor: '#3b82f6' }}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    const newP = { ...(ajustes.pitchPersonalizado || {}), [botonSeleccionado!]: val };
                                    setAjustes({ ...ajustes, pitchPersonalizado: newP });
                                }}
                                onMouseUp={() => {
                                    const { instances } = reproduceTono(botonSeleccionado!);
                                    setTimeout(() => {
                                        instances.forEach((inst: any) => {
                                            try {
                                                const now = inst.gain.context.currentTime;
                                                inst.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                                                inst.source.stop(now + 0.6);
                                            } catch (e) { }
                                        });
                                    }, 1000);
                                }}
                            />

                            <button
                                onClick={() => {
                                    const val = (ajustes.pitchPersonalizado?.[botonSeleccionado!] || 0) + 1;
                                    const newP = { ...(ajustes.pitchPersonalizado || {}), [botonSeleccionado!]: val };
                                    setAjustes({ ...ajustes, pitchPersonalizado: newP });
                                }}
                                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer' }}
                            >+</button>
                        </div>
                    </div>

                    {(ajustes.pitchPersonalizado?.[botonSeleccionado] !== undefined && ajustes.pitchPersonalizado[botonSeleccionado] !== 0) && (
                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <input
                                type="text"
                                placeholder="Apodo para este tono..."
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                style={{ width: '100%', padding: '12px', fontSize: '12px', borderRadius: '12px', marginBottom: '10px', background: '#111', color: 'white', border: '1px solid #333', outline: 'none' }}
                            />
                            <button
                                onClick={() => {
                                    if (!nickname.trim()) return alert('Dale un nombre a tu creación.');
                                    const mapeo = ajustes.mapeoPersonalizado[botonSeleccionado!];
                                    const rutaBase = (mapeo && mapeo.length > 0) ? (mapeo[0].startsWith('pitch:') ? mapeo[0].split('|')[1] : mapeo[0]) : '';
                                    if (!rutaBase) return alert('Selecciona un sonido base primero.');

                                    stopPreview();
                                    guardarNuevoSonidoVirtual(nickname, rutaBase, ajustes.pitchPersonalizado[botonSeleccionado!], esBajo ? 'Bajos' : 'Brillante');
                                    setNickname('');
                                    // alert('✅ Sonido guardado en tu biblioteca.');
                                }}
                                style={{
                                    width: '100%', padding: '14px',
                                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                    color: 'white', fontWeight: 'bold', borderRadius: '12px',
                                    fontSize: '11px', border: 'none', cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                                    textTransform: 'uppercase', letterSpacing: '1px'
                                }}
                            >
                                Guardar como nuevo sonido
                            </button>
                        </div>
                    )}
                </div>
            )}

        </>
    );
};

export default PestanaSonido;
