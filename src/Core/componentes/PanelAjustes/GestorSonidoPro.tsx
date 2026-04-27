import React, { useState, useCallback } from 'react';
import { X, Edit2, GripVertical } from 'lucide-react';
import { Reorder } from 'framer-motion';
import type { AjustesAcordeon } from '../../acordeon/TiposAcordeon';

interface Props {
    tonalidadSeleccionada: string;
    setTonalidadSeleccionada: (val: string) => void;
    listaTonalidades: string[];
    setListaTonalidades: (val: string[]) => void;
    nombresTonalidades: Record<string, string>;
    actualizarNombreTonalidad: (id: string, nombre: string) => void;
    eliminarTonalidad: (t: string) => void;
    ajustes: AjustesAcordeon;
    setAjustes: React.Dispatch<React.SetStateAction<AjustesAcordeon>>;
    instrumentoId: string;
    setInstrumentoId: (id: string) => void;
    listaInstrumentos: any[];
}

const etiquetaTonalidad = (t: string, nombres: Record<string, string>) => nombres[t] || (
    t === 'FBE' ? 'Fa - Sib - Mib (Original)' :
    t === 'GCF' ? 'Sol - Do - Fa' :
    t === 'ADG' ? 'La - Re - Sol' :
    t === 'BES' ? 'Sib - Mib - Lab (Cinco Letras)' :
    t === 'BEA' ? 'Si - Mi - La' :
    t === 'CFB' ? 'Do - Fa - Sib' :
    t === 'DGC' ? 'Re - Sol - Do' :
    t === 'ELR' ? 'Mi - La - Re (Bemol)' :
    t === 'EAD' ? 'Mi - La - Re (Alto/Natural)' : t
);

const GestorSonidoPro: React.FC<Props> = ({
    tonalidadSeleccionada, setTonalidadSeleccionada, listaTonalidades, setListaTonalidades,
    nombresTonalidades, actualizarNombreTonalidad, eliminarTonalidad,
    ajustes, setAjustes, instrumentoId, setInstrumentoId, listaInstrumentos
}) => {
    const [mostrarInputNueva, setMostrarInputNueva] = useState(false);
    const [nuevaTonalidad, setNuevaTonalidad] = useState('');
    const [editandoTonal, setEditandoTonal] = useState<string | null>(null);
    const [nombreEditandoTonal, setNombreEditandoTonal] = useState('');
    const [confirmarEliminarId, setConfirmarEliminarId] = useState<string | null>(null);
    const [mensajeError, setMensajeError] = useState<string | null>(null);

    const solicitarEliminar = useCallback((t: string) => {
        if (listaTonalidades.length <= 1) {
            setMensajeError('Debe conservar al menos una tonalidad.');
            return;
        }
        setMensajeError(null);
        setConfirmarEliminarId(t);
    }, [listaTonalidades.length]);

    const confirmarEliminar = useCallback(() => {
        if (confirmarEliminarId) eliminarTonalidad(confirmarEliminarId);
        setConfirmarEliminarId(null);
    }, [confirmarEliminarId, eliminarTonalidad]);

    const confirmarNuevaTonalidad = () => {
        if (nuevaTonalidad.trim() && !listaTonalidades.includes(nuevaTonalidad.trim())) {
            setListaTonalidades([...listaTonalidades, nuevaTonalidad.trim()]);
            setTonalidadSeleccionada(nuevaTonalidad.trim());
        }
        setNuevaTonalidad('');
        setMostrarInputNueva(false);
    };

    const confirmarRenombrar = (t: string) => {
        if (nombreEditandoTonal.trim()) actualizarNombreTonalidad(t, nombreEditandoTonal.trim());
        setEditandoTonal(null);
    };

    return (
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px' }}>
            <label style={{ display: 'block', fontSize: '10px', marginBottom: '8px', color: '#888', fontWeight: 'bold' }}>TONALIDAD ACTIVA</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <select value={tonalidadSeleccionada} onChange={(e) => setTonalidadSeleccionada(e.target.value)} style={{ flex: 1, background: '#111', color: 'white', border: '1px solid #333', padding: '8px', borderRadius: '8px', fontSize: '12px', outline: 'none' }}>
                    {listaTonalidades.map(t => (
                        <option key={t} value={t}>{etiquetaTonalidad(t, nombresTonalidades)}</option>
                    ))}
                </select>
                <button onClick={() => setMostrarInputNueva(v => !v)} style={{ background: '#3b82f622', color: '#3b82f6', border: '1px solid #3b82f633', borderRadius: '8px', padding: '0 10px', cursor: 'pointer' }}>+</button>
                <button onClick={() => solicitarEliminar(tonalidadSeleccionada)} style={{ background: '#ef444422', color: '#ef4444', border: '1px solid #ef444433', borderRadius: '8px', padding: '0 10px', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            {mensajeError && (
                <div style={{ padding: '8px 12px', borderRadius: '8px', marginBottom: '8px', background: 'rgba(239,68,68,0.12)', border: '1px solid #fca5a5', color: '#fca5a5', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {mensajeError}
                    <button onClick={() => setMensajeError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: '0 4px' }}><X size={12} /></button>
                </div>
            )}
            {confirmarEliminarId && (
                <div style={{ padding: '10px 12px', borderRadius: '8px', marginBottom: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid #ef444444' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#fca5a5' }}>¿Eliminar tonalidad? Esta acción no se puede deshacer.</p>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={confirmarEliminar} style={{ flex: 1, padding: '6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Eliminar</button>
                        <button onClick={() => setConfirmarEliminarId(null)} style={{ flex: 1, padding: '6px', background: '#27272a', color: '#a1a1aa', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Cancelar</button>
                    </div>
                </div>
            )}
            {mostrarInputNueva && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                    <input autoFocus value={nuevaTonalidad} onChange={e => setNuevaTonalidad(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirmarNuevaTonalidad()} placeholder="Ej: CEG" style={{ flex: 1, background: '#111', color: 'white', border: '1px solid #3b82f6', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', outline: 'none' }} />
                    <button onClick={confirmarNuevaTonalidad} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>OK</button>
                    <button onClick={() => setMostrarInputNueva(false)} style={{ background: '#27272a', color: '#a1a1aa', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}><X size={14} /></button>
                </div>
            )}

            <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#888', fontWeight: 'bold' }}>TRANSPOSICIÓN GLOBAL</span>
                    <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 'bold' }}>{ajustes.pitchGlobal || 0} st</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="range" min="-12" max="12" step="1" value={ajustes.pitchGlobal || 0} style={{ flex: 1, accentColor: '#3b82f6' }} onChange={(e) => setAjustes(prev => ({ ...prev, pitchGlobal: parseInt(e.target.value) }))} />
                    <button onClick={() => setAjustes(prev => ({ ...prev, pitchGlobal: 0 }))} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#666', padding: '4px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}>RESET</button>
                </div>
            </div>

            <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', fontSize: '10px', marginBottom: '8px', color: '#888', fontWeight: 'bold' }}>ORGANIZAR TONALIDADES (ARRASTRAR)</label>
                <div style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '5px' }}>
                    <Reorder.Group axis="y" values={listaTonalidades} onReorder={setListaTonalidades} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {listaTonalidades.map(t => {
                            const label = etiquetaTonalidad(t, nombresTonalidades);
                            const activo = t === tonalidadSeleccionada;
                            return (
                                <Reorder.Item key={t} value={t} style={{ background: activo ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)', border: activo ? '1px solid #3b82f6aa' : '1px solid #333', padding: '8px 10px', borderRadius: '8px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'grab' }}>
                                    <GripVertical size={14} style={{ color: '#444' }} />
                                    {editandoTonal === t ? (
                                        <input autoFocus value={nombreEditandoTonal} onChange={e => setNombreEditandoTonal(e.target.value)} onBlur={() => confirmarRenombrar(t)} onKeyDown={e => e.key === 'Enter' && confirmarRenombrar(t)} style={{ flex: 1, background: '#111', color: 'white', border: '1px solid #3b82f6', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', outline: 'none' }} />
                                    ) : (
                                        <span onClick={() => setTonalidadSeleccionada(t)} style={{ flex: 1, fontSize: '11px', color: activo ? 'white' : '#aaa', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                                    )}
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button onClick={(e) => { e.stopPropagation(); setEditandoTonal(t); setNombreEditandoTonal(label); }} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', padding: '4px' }}><Edit2 size={12} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); solicitarEliminar(t); }} style={{ background: 'transparent', border: 'none', color: '#ef444466', cursor: 'pointer', padding: '4px' }}><X size={12} /></button>
                                    </div>
                                </Reorder.Item>
                            );
                        })}
                    </Reorder.Group>
                </div>
            </div>

            <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ display: 'block', fontSize: '10px', marginBottom: '8px', color: '#888', fontWeight: 'bold' }}>INSTRUMENTO MAESTRO</label>
                <select value={instrumentoId} onChange={(e) => setInstrumentoId(e.target.value)} style={{ width: '100%', background: '#111', color: '#3b82f6', border: '1px solid #3b82f644', padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                    {listaInstrumentos && listaInstrumentos.map(inst => <option key={inst.id} value={inst.id}>{inst.nombre.toUpperCase()}</option>)}
                    {(!listaInstrumentos || listaInstrumentos.length === 0) && <option value="default">Cargando instrumentos...</option>}
                </select>
                <p style={{ fontSize: '9px', color: '#555', marginTop: '5px', fontStyle: 'italic' }}>Esto cambiará el timbre de todo el acordeón.</p>

                <div style={{ marginTop: '14px' }}>
                    <label style={{ display: 'block', fontSize: '10px', marginBottom: '8px', color: '#888', fontWeight: 'bold' }}>TIMBRE DE PITOS</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {(['Brillante', 'Armonizado'] as const).map(t => {
                            const activo = (ajustes.timbre || 'Brillante') === t;
                            return (
                                <button key={t} onClick={() => setAjustes(prev => ({ ...prev, timbre: t }))} style={{ flex: 1, padding: '9px 4px', borderRadius: '8px', border: activo ? '1px solid #3b82f6' : '1px solid #333', background: activo ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.03)', color: activo ? '#60a5fa' : '#555', fontWeight: activo ? 'bold' : 'normal', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    {t === 'Brillante' ? '✨ Brillante' : '🎵 Armonizado'}
                                </button>
                            );
                        })}
                    </div>
                    <p style={{ fontSize: '9px', color: '#555', marginTop: '5px', fontStyle: 'italic' }}>
                        {(ajustes.timbre || 'Brillante') === 'Armonizado' ? 'Los pitos usan el banco armonizado. Los bajos no cambian.' : 'Los pitos usan el banco brillante estándar.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GestorSonidoPro;
