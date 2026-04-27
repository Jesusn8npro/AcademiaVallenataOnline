import React from 'react';
import { Reorder, motion } from 'framer-motion';
import { Trash2, Play, Square, Edit3, Copy, Layers, ChevronUp, ChevronDown } from 'lucide-react';
import { obtenerNotasDelAcorde, TONALIDAD_OFFSETS, identificarNombreAcorde } from '../acordeon/notasAcordeonDiatonico';

interface Props {
    acorde: any;
    tonalidadActual: string;
    idSonando: string | null;
    editandoNombreId: string | null;
    nombreTemporal: string;
    setNombreTemporal: (v: string) => void;
    onIniciarEdicionNombre: (acorde: any) => void;
    onGuardarNombreInline: (id: string) => void;
    onMoverArriba: (id: string) => void;
    onMoverAbajo: (id: string) => void;
    onReproducir: () => void;
    onDetener: () => void;
    onDuplicar: (alFinal: boolean) => void;
    onEditarAcorde: () => void;
    onSolicitarEliminar: () => void;
}

const getInvLabel = (inv: number) => inv === 0 ? 'NAT' : `${inv}ª INV`;

const ItemListaAcorde: React.FC<Props> = ({
    acorde, tonalidadActual, idSonando, editandoNombreId, nombreTemporal, setNombreTemporal,
    onIniciarEdicionNombre, onGuardarNombreInline, onMoverArriba, onMoverAbajo,
    onReproducir, onDetener, onDuplicar, onEditarAcorde, onSolicitarEliminar
}) => {
    const estaSonando = idSonando === acorde.id;
    const offset = TONALIDAD_OFFSETS[tonalidadActual] ?? 2;

    return (
        <Reorder.Item
            value={acorde}
            style={{
                backgroundColor: estaSonando ? '#1e1b4b' : '#0c0c0e',
                padding: '20px', borderRadius: '24px',
                border: estaSonando ? '1px solid #4f46e5' : '1px solid #1a1a1a',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: 'grab',
                boxShadow: estaSonando ? '0 0 30px -5px rgba(79, 70, 229, 0.4)' : 'none',
                transition: 'all 0.3s ease'
            }}
            whileDrag={{ scale: 1.02, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)', zIndex: 10 }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button onClick={(e) => { e.stopPropagation(); onMoverArriba(acorde.id); }} style={{ background: '#1a1a1a', border: 'none', color: '#71717a', padding: '4px', borderRadius: '6px', cursor: 'pointer' }}>
                        <ChevronUp size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onMoverAbajo(acorde.id); }} style={{ background: '#1a1a1a', border: 'none', color: '#71717a', padding: '4px', borderRadius: '6px', cursor: 'pointer' }}>
                        <ChevronDown size={14} />
                    </button>
                </div>

                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: estaSonando ? '#4f46e5' : 'rgba(59, 130, 246, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: estaSonando ? 'white' : '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <span style={{ fontSize: '14px', fontWeight: '900' }}>{acorde.grado}</span>
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {editandoNombreId === acorde.id ? (
                            <input autoFocus value={nombreTemporal} onChange={(e) => setNombreTemporal(e.target.value)} onBlur={() => onGuardarNombreInline(acorde.id)} onKeyDown={(e) => e.key === 'Enter' && onGuardarNombreInline(acorde.id)} style={{ backgroundColor: '#09090b', border: '1px solid #3b82f6', borderRadius: '8px', padding: '4px 8px', color: 'white', fontSize: '15px', fontWeight: '900', outline: 'none' }} />
                        ) : (
                            <>
                                <h3 onDoubleClick={() => onIniciarEdicionNombre(acorde)} title="Doble clic para editar nombre rápido" style={{ color: 'white', margin: 0, fontSize: '16px', fontWeight: '900', cursor: 'pointer' }}>
                                    {identificarNombreAcorde(acorde.botones, offset)}
                                </h3>
                                <p style={{ color: '#52525b', fontSize: '10px', margin: 0, fontWeight: '900', opacity: 0.6 }}>
                                    Original: {acorde.nombre} {tonalidadActual !== 'GCF' && `(${tonalidadActual})`}
                                </p>
                            </>
                        )}
                        <span style={{ color: estaSonando ? '#94a3b8' : '#3f3f46', fontSize: '10px', fontWeight: '900' }}>
                            {acorde.hilera_lider === 0 ? 'F.H.' : `H${acorde.hilera_lider}`}
                        </span>
                        {acorde.hilera_lider === 0 && (
                            <span style={{ backgroundColor: '#a855f720', color: '#a855f7', fontSize: '8px', fontWeight: '900', padding: '2px 6px', borderRadius: '4px', border: '1px solid #a855f740' }}>TRANSPORTE</span>
                        )}
                        {acorde.modalidad_circulo === 'Menor' && (
                            <span style={{ backgroundColor: '#a855f7', color: 'white', fontSize: '8px', fontWeight: '900', padding: '2px 6px', borderRadius: '4px' }}>CÍRCULO MENOR</span>
                        )}
                        {estaSonando && (
                            <motion.span initial={{ scale: 0.8 }} animate={{ scale: [0.8, 1.1, 0.8] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ color: '#4ade80', fontSize: '9px', fontWeight: '900', marginLeft: '10px' }}>
                                ● REPRODUCIENDO...
                            </motion.span>
                        )}
                    </div>

                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', color: '#52525b', fontWeight: '900', letterSpacing: '0.5px' }}>NOTAS:</span>
                        <span style={{ background: 'linear-gradient(90deg, #3b82f620, transparent)', color: '#60a5fa', fontSize: '12px', fontWeight: '900', padding: '4px 12px', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                            {obtenerNotasDelAcorde(acorde.botones, offset)}
                        </span>
                    </div>

                    {acorde.descripcion && (
                        <p style={{ color: estaSonando ? '#94a3b8' : '#71717a', fontSize: '11px', margin: '5px 0', fontStyle: 'italic', maxWidth: '400px' }}>
                            " {acorde.descripcion} "
                        </p>
                    )}

                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                        {acorde.fuelle === 'abriendo' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '8px', color: '#ef4444', fontWeight: '900' }}>ABRIENDO</span>
                                <span style={{ fontSize: '10px', color: 'white', fontWeight: 'bold', background: 'rgba(239, 68, 68, 0.14)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{getInvLabel(acorde.inv_abriendo)}</span>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '8px', color: '#22c55e', fontWeight: '900' }}>CERRANDO</span>
                                <span style={{ fontSize: '10px', color: 'white', fontWeight: 'bold', background: 'rgba(34, 197, 94, 0.14)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>{getInvLabel(acorde.inv_cerrando)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={estaSonando ? onDetener : onReproducir} style={{ background: estaSonando ? '#4f46e5' : 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 8px 15px -5px rgba(59, 130, 246, 0.4)' }}>
                    {estaSonando ? <><Square size={14} fill="white" /> DETENER</> : <><Play size={14} fill="white" /> PROBAR</>}
                </button>
                <button title="Duplicar Aquí Abajo" onClick={() => onDuplicar(false)} style={{ background: '#1a1a1a', border: 'none', color: '#10b981', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Copy size={18} />
                </button>
                <button title="Enviar Copia al Final" onClick={() => onDuplicar(true)} style={{ background: '#1a1a1a', border: 'none', color: '#a855f7', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Layers size={18} />
                </button>
                <button onClick={onEditarAcorde} style={{ background: '#1a1a1a', border: 'none', color: '#3b82f6', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}>
                    <Edit3 size={18} />
                </button>
                <button onClick={onSolicitarEliminar} style={{ background: '#1a1a1a', border: 'none', color: '#dc2626', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                </button>
            </div>
        </Reorder.Item>
    );
};

export default ItemListaAcorde;
