import React from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { X, Save, Layers, Square, Play, Search, Filter, ChevronRight } from 'lucide-react';
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
}

const ModalListaAcordes: React.FC<ModalListaAcordesProps> = ({
    visible, onCerrar, onReproducirAcorde, onDetener, idSonando, onEditarAcorde, onNuevoAcordeEnCirculo, onReproducirCirculoCompleto,
    tonalidadActual = 'GCF'
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

    return (
        <AnimatePresence>
            {visible && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000000, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', backgroundColor: 'transparent', backdropFilter: 'none' }}>
                    <motion.div drag dragMomentum={false} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                        style={{ width: '800px', maxHeight: '85vh', backgroundColor: '#09090b', borderRadius: '40px', border: '1px solid #27272a', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 60px -12px rgba(0,0,0,1)', pointerEvents: 'auto' }}
                    >
                        {/* Cabecera */}
                        <div style={{ padding: '30px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab', background: '#0c0c0e' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', padding: '12px', borderRadius: '18px', boxShadow: '0 8px 20px -5px rgba(59, 130, 246, 0.5)' }}>
                                    <Layers size={24} color="white" />
                                </div>
                                <div>
                                    <h2 style={{ color: 'white', margin: 0, fontSize: '20px', fontWeight: '900', letterSpacing: '0.5px' }}>BIBLIOTECA MAESTRA DE ACORDES</h2>
                                    <p style={{ color: '#52525b', margin: 0, fontSize: '12px', fontWeight: 'bold' }}>EXPLORADOR DE GRADOS E INVERSIONES</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                {idSonando && (
                                    <button onClick={onDetener} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '15px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 20px -5px rgba(239, 68, 68, 0.4)' }}>
                                        <Square size={16} fill="white" /> DETENER PROBADO
                                    </button>
                                )}
                                <button onClick={guardarOrdenEnDB} disabled={guardandoOrden} style={{ background: '#10b981', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '15px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 15px -5px rgba(16, 185, 129, 0.4)' }}>
                                    <Save size={16} /> {guardandoOrden ? 'GUARDANDO...' : 'GUARDAR ORDEN'}
                                </button>
                                <button onClick={onCerrar} style={{ background: '#1a1a1a', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '12px', borderRadius: '50%' }}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Filtros */}
                        <div style={{ padding: '20px 30px', background: '#09090b', borderBottom: '1px solid #1a1a1a', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#71717a', fontSize: '10px', fontWeight: '900' }}><Filter size={12} /> HILERA:</div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {[null, 1, 2, 3].map(h => (
                                        <button key={h || 'all'} onClick={() => setHileraFiltro(h)} style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', border: 'none', backgroundColor: hileraFiltro === h ? '#3b82f6' : '#1a1a1a', color: hileraFiltro === h ? 'white' : '#71717a' }}>
                                            {h === null ? 'TODAS' : h}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ color: '#71717a', fontSize: '10px', fontWeight: '900' }}>CATEGORÍA:</div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {[null, 'Nativo', 'Transporte'].map(c => (
                                        <button key={c || 'all'} onClick={() => setCategoriaFiltro(c)} style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', border: 'none', backgroundColor: categoriaFiltro === c ? '#a855f7' : '#1a1a1a', color: categoriaFiltro === c ? 'white' : '#71717a' }}>
                                            {c === null ? 'TODAS' : c.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ color: '#a855f7', fontSize: '10px', fontWeight: '900' }}>MODALIDAD:</div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {[null, 'Mayor', 'Menor'].map(m => (
                                        <button key={m || 'all'} onClick={() => setModalidadFiltro(m as any)} style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', border: 'none', backgroundColor: modalidadFiltro === m ? (m === 'Mayor' ? '#3b82f6' : '#a855f7') : '#1a1a1a', color: modalidadFiltro === m ? 'white' : '#71717a' }}>
                                            {m === null ? 'AMBAS' : m.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ color: '#a855f7', fontSize: '10px', fontWeight: '900' }}>TONALIDAD LÍDER:</div>
                                <select value={tonalidadFiltro || ''} onChange={(e) => cambiarTonalidadFiltro(e.target.value || null)} style={{ background: '#1a1a1a', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', outline: 'none' }}>
                                    <option value="">TODAS</option>
                                    {tonalidadesDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderLeft: '1px solid #1a1a1a', paddingLeft: '20px' }}>
                                <div style={{ color: '#10b981', fontSize: '10px', fontWeight: '900' }}>VER GRADO:</div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {[null, 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'].map(g => (
                                        <button key={g || 'all'} onClick={() => setGradoFiltro(g)} style={{ width: '32px', height: '32px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', border: 'none', backgroundColor: gradoFiltro === g ? '#10b981' : '#1a1a1a', color: gradoFiltro === g ? 'white' : '#71717a' }}>
                                            {g || 'ALL'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button onClick={() => onNuevoAcordeEnCirculo && onNuevoAcordeEnCirculo(tonalidadFiltro, modalidadFiltro)} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', padding: '10px 18px', borderRadius: '15px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Layers size={14} fill="white" /> + NUEVO ACORDE AQUÍ
                            </button>

                            {filtrados.length > 0 && (
                                <button onClick={() => onReproducirCirculoCompleto && onReproducirCirculoCompleto(filtrados)} style={{ background: idSonando === 'ciclo' ? '#ef4444' : 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', color: 'white', padding: '10px 18px', borderRadius: '15px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Play size={14} fill="white" /> {idSonando === 'ciclo' ? 'DETENER CÍRCULO' : 'REPRODUCIR CÍRCULO COMPLETO'}
                                </button>
                            )}

                            <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                                <Search size={14} color="#3f3f46" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input type="text" placeholder="Buscar por nombre, grado o descripción..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ width: '100%', background: '#0c0c0e', border: '1px solid #1a1a1a', borderRadius: '15px', padding: '10px 10px 10px 36px', color: 'white', fontSize: '13px' }} />
                            </div>
                        </div>

                        {/* Mensaje pedagógico */}
                        {(hileraFiltro !== null || tonalidadFiltro !== null) && (
                            <div style={{ margin: '0 30px 10px 30px', padding: '12px 20px', borderRadius: '15px', background: 'linear-gradient(90deg, #3b82f615, transparent)', borderLeft: '4px solid #3b82f6', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Filter size={14} color="#60a5fa" />
                                <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px' }}>
                                    ESTÁS VIENDO LA <strong style={{ color: '#fff', margin: '0 6px', textTransform: 'uppercase' }}>
                                        {hileraFiltro === 1 ? 'Hilera de Afuera' : hileraFiltro === 2 ? 'Hilera del Medio' : hileraFiltro === 3 ? 'Hilera de Adentro' : 'Posición Libre'}
                                    </strong>
                                    {tonalidadFiltro && <span style={{ marginLeft: '4px' }}>EN ESCALA DE <strong style={{ color: '#3b82f6' }}>{tonalidadFiltro}</strong></span>}
                                </span>
                            </div>
                        )}

                        {/* Banners de confirmación y acción */}
                        <div style={{ padding: '0 30px' }}>
                            {mensajeAccion && (
                                <div style={{ padding: '10px 14px', borderRadius: '10px', marginBottom: '8px', background: mensajeAccion.exito ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${mensajeAccion.exito ? '#6ee7b7' : '#fca5a5'}`, color: mensajeAccion.exito ? '#6ee7b7' : '#fca5a5', fontSize: '12px', fontWeight: '700' }}>
                                    {mensajeAccion.texto}
                                </div>
                            )}
                            {confirmarEliminarId && (
                                <div style={{ background: '#1a0a0a', border: '1px solid #7f1d1d', padding: '10px 14px', borderRadius: '10px', marginBottom: '8px' }}>
                                    <p style={{ margin: '0 0 8px', color: '#fca5a5', fontSize: '12px', fontWeight: '700' }}>¿Seguro que quieres borrar este acorde del sistema maestro?</p>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={confirmarEliminar} style={{ padding: '4px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>Eliminar</button>
                                        <button onClick={cancelarEliminar} style={{ padding: '4px 12px', background: '#27272a', color: '#a1a1aa', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>Cancelar</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Lista */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '30px', background: '#050505' }}>
                            {cargando ? (
                                <p style={{ color: '#71717a', textAlign: 'center' }}>Sincronizando biblioteca...</p>
                            ) : filtrados.length === 0 ? (
                                <p style={{ color: '#3f3f46', textAlign: 'center', fontSize: '14px' }}>No hay acordes en este criterio. ¡Graba algunos primero!</p>
                            ) : (
                                <Reorder.Group axis="y" values={filtrados} onReorder={reordenar} style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ModalListaAcordes;
