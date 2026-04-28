import React from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { X, Save, Layers, Square, Play, Search, Filter } from 'lucide-react';
import { useModalListaAcordes } from './useModalListaAcordes';
import ItemListaAcorde from './ItemListaAcorde';

interface ModalListaAcordesProps {
    visible: boolean;
    onCerrar: () => void;
    onReproducirAcorde: (botones: string[], fuelle: string, id?: string) => void;
    onDetener: () => void;
    idSonando: string | null;
    onEditarAcorde: (acorde: any) => void;
    onNuevoAcordeEnCirculo?: (tonalidad: string | null, modalidad: 'Mayor' | 'Menor' | null) => void;
    onReproducirCirculoCompleto?: (acordes: any[]) => void;
    tonalidadActual?: string;
    inline?: boolean;
}

const ModalListaAcordes: React.FC<ModalListaAcordesProps> = ({
    visible, onCerrar, onReproducirAcorde, onDetener, idSonando, onEditarAcorde, onNuevoAcordeEnCirculo, onReproducirCirculoCompleto,
    tonalidadActual = 'GCF', inline = false
}) => {
    const {
        busqueda, setBusqueda, hileraFiltro, setHileraFiltro, categoriaFiltro, setCategoriaFiltro,
        modalidadFiltro, setModalidadFiltro, tonalidadFiltro, cambiarTonalidadFiltro,
        gradoFiltro, setGradoFiltro, cargando, guardandoOrden,
        editandoNombreId, nombreTemporal, setNombreTemporal,
        confirmarEliminarId, mensajeAccion,
        filtrados, tonalidadesDisponibles,
        solicitarEliminar, cancelarEliminar, confirmarEliminar,
        duplicarAcorde, reordenar, moverArriba, moverAbajo,
        guardarOrdenEnDB, guardarNombreInline, iniciarEdicionNombre
    } = useModalListaAcordes(visible, tonalidadActual);

    const cabecera = (
        <div style={{ padding: inline ? '16px' : '30px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: inline ? 'default' : 'grab', background: '#0c0c0e' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', padding: inline ? '8px' : '12px', borderRadius: '14px' }}>
                    <Layers size={inline ? 16 : 24} color="white" />
                </div>
                <div>
                    <h2 style={{ color: 'white', margin: 0, fontSize: inline ? '13px' : '20px', fontWeight: '900' }}>BIBLIOTECA MAESTRA</h2>
                    <p style={{ color: '#52525b', margin: 0, fontSize: '10px', fontWeight: 'bold' }}>EXPLORADOR DE GRADOS E INVERSIONES</p>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                {idSonando && (
                    <button onClick={onDetener} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '8px 14px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Square size={13} fill="white" /> DETENER
                    </button>
                )}
                <button onClick={guardarOrdenEnDB} disabled={guardandoOrden} style={{ background: '#10b981', border: 'none', color: 'white', padding: '8px 14px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Save size={13} /> {guardandoOrden ? '...' : 'GUARDAR ORDEN'}
                </button>
                {!inline && (
                    <button onClick={onCerrar} style={{ background: '#1a1a1a', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '10px', borderRadius: '50%' }}>
                        <X size={18} />
                    </button>
                )}
            </div>
        </div>
    );

    const filtros = (
        <div style={{ padding: inline ? '12px 16px' : '20px 30px', background: '#09090b', borderBottom: '1px solid #1a1a1a', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={10} color="#71717a" />
                {[null, 1, 2, 3].map(h => (
                    <button key={h || 'all'} onClick={() => setHileraFiltro(h)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', border: 'none', backgroundColor: hileraFiltro === h ? '#3b82f6' : '#1a1a1a', color: hileraFiltro === h ? 'white' : '#71717a' }}>
                        {h === null ? 'TODAS' : h}
                    </button>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
                {[null, 'Nativo', 'Transporte'].map(c => (
                    <button key={c || 'all'} onClick={() => setCategoriaFiltro(c)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', border: 'none', backgroundColor: categoriaFiltro === c ? '#a855f7' : '#1a1a1a', color: categoriaFiltro === c ? 'white' : '#71717a' }}>
                        {c === null ? 'TODAS' : c.toUpperCase()}
                    </button>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
                {[null, 'Mayor', 'Menor'].map(m => (
                    <button key={m || 'all'} onClick={() => setModalidadFiltro(m as any)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', border: 'none', backgroundColor: modalidadFiltro === m ? (m === 'Mayor' ? '#3b82f6' : '#a855f7') : '#1a1a1a', color: modalidadFiltro === m ? 'white' : '#71717a' }}>
                        {m === null ? 'AMBAS' : m.toUpperCase()}
                    </button>
                ))}
            </div>
            <select value={tonalidadFiltro || ''} onChange={(e) => cambiarTonalidadFiltro(e.target.value || null)} style={{ background: '#1a1a1a', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', outline: 'none' }}>
                <option value="">TODAS</option>
                {tonalidadesDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '3px' }}>
                {[null, 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'].map(g => (
                    <button key={g || 'all'} onClick={() => setGradoFiltro(g)} style={{ width: '28px', height: '28px', borderRadius: '6px', fontSize: '9px', fontWeight: '900', cursor: 'pointer', border: 'none', backgroundColor: gradoFiltro === g ? '#10b981' : '#1a1a1a', color: gradoFiltro === g ? 'white' : '#71717a' }}>
                        {g || 'ALL'}
                    </button>
                ))}
            </div>
            <button onClick={() => onNuevoAcordeEnCirculo && onNuevoAcordeEnCirculo(tonalidadFiltro, modalidadFiltro)} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', padding: '7px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={12} fill="white" /> + NUEVO ACORDE
            </button>
            {filtrados.length > 0 && (
                <button onClick={() => onReproducirCirculoCompleto && onReproducirCirculoCompleto(filtrados)} style={{ background: idSonando === 'ciclo' ? '#ef4444' : 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', color: 'white', padding: '7px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Play size={12} fill="white" /> {idSonando === 'ciclo' ? 'DETENER' : 'CÍRCULO COMPLETO'}
                </button>
            )}
            <div style={{ flex: 1, position: 'relative', minWidth: '140px' }}>
                <Search size={12} color="#3f3f46" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ width: '100%', background: '#0c0c0e', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '8px 8px 8px 30px', color: 'white', fontSize: '12px', outline: 'none' }} />
            </div>
        </div>
    );

    const banners = (
        <div style={{ padding: inline ? '0 16px' : '0 30px' }}>
            {(hileraFiltro !== null || tonalidadFiltro !== null) && (
                <div style={{ margin: '8px 0', padding: '10px 16px', borderRadius: '12px', background: 'linear-gradient(90deg, #3b82f615, transparent)', borderLeft: '3px solid #3b82f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Filter size={12} color="#60a5fa" />
                    <span style={{ color: '#94a3b8', fontSize: '10px', fontWeight: '900' }}>
                        {hileraFiltro === 1 ? 'HILERA DE AFUERA' : hileraFiltro === 2 ? 'HILERA DEL MEDIO' : hileraFiltro === 3 ? 'HILERA DE ADENTRO' : 'POSICIÓN LIBRE'}
                        {tonalidadFiltro && <strong style={{ color: '#3b82f6', marginLeft: '6px' }}>· ESCALA {tonalidadFiltro}</strong>}
                    </span>
                </div>
            )}
            {mensajeAccion && (
                <div style={{ padding: '8px 12px', borderRadius: '8px', marginBottom: '6px', background: mensajeAccion.exito ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${mensajeAccion.exito ? '#6ee7b7' : '#fca5a5'}`, color: mensajeAccion.exito ? '#6ee7b7' : '#fca5a5', fontSize: '11px', fontWeight: '700' }}>
                    {mensajeAccion.texto}
                </div>
            )}
            {confirmarEliminarId && (
                <div style={{ background: '#1a0a0a', border: '1px solid #7f1d1d', padding: '10px 12px', borderRadius: '8px', marginBottom: '6px' }}>
                    <p style={{ margin: '0 0 8px', color: '#fca5a5', fontSize: '11px', fontWeight: '700' }}>¿Seguro que quieres borrar este acorde?</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={confirmarEliminar} style={{ padding: '4px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>Eliminar</button>
                        <button onClick={cancelarEliminar} style={{ padding: '4px 12px', background: '#27272a', color: '#a1a1aa', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );

    const lista = (
        <div style={{ flex: 1, overflowY: 'auto', padding: inline ? '12px 16px' : '30px', background: '#050505' }}>
            {cargando ? (
                <p style={{ color: '#71717a', textAlign: 'center' }}>Sincronizando biblioteca...</p>
            ) : filtrados.length === 0 ? (
                <p style={{ color: '#3f3f46', textAlign: 'center', fontSize: '13px' }}>No hay acordes en este criterio.</p>
            ) : (
                <Reorder.Group axis="y" values={filtrados} onReorder={reordenar} style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filtrados.map(acorde => (
                        <ItemListaAcorde
                            key={acorde.id}
                            acorde={acorde}
                            tonalidadActual={tonalidadActual}
                            idSonando={idSonando}
                            editandoNombreId={editandoNombreId}
                            nombreTemporal={nombreTemporal}
                            setNombreTemporal={setNombreTemporal}
                            onIniciarEdicionNombre={iniciarEdicionNombre}
                            onGuardarNombreInline={guardarNombreInline}
                            onMoverArriba={moverArriba}
                            onMoverAbajo={moverAbajo}
                            onReproducir={() => onReproducirAcorde(acorde.botones, acorde.fuelle, acorde.id)}
                            onDetener={onDetener}
                            onDuplicar={(alFinal) => duplicarAcorde(acorde, alFinal)}
                            onEditarAcorde={() => onEditarAcorde(acorde)}
                            onSolicitarEliminar={() => solicitarEliminar(acorde.id)}
                        />
                    ))}
                </Reorder.Group>
            )}
        </div>
    );

    if (inline) {
        if (!visible) return null;
        return (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {cabecera}{filtros}{banners}{lista}
            </div>
        );
    }

    return (
        <AnimatePresence>
            {visible && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000000, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', backgroundColor: 'transparent', backdropFilter: 'none' }}>
                    <motion.div drag dragMomentum={false} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                        style={{ width: '800px', maxHeight: '85vh', backgroundColor: '#09090b', borderRadius: '40px', border: '1px solid #27272a', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 60px -12px rgba(0,0,0,1)', pointerEvents: 'auto' }}
                    >
                        {cabecera}{filtros}{banners}{lista}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ModalListaAcordes;
