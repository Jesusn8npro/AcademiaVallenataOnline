import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Layers, ArrowRightLeft } from 'lucide-react';
import { supabase } from '../../../servicios/clienteSupabase';

interface ModalCreadorAcordesProps {
    visible: boolean;
    onCerrar: () => void;
    botonesSeleccionados: string[];
    fuelleActual: 'abriendo' | 'cerrando';
    tonalidadActual: string;
    acordeAEditar?: any;
    onExitoUpdate?: () => void;
}

const modalitiesColor: Record<string, string> = {
    'Mayor': '#3b82f6',
    'Menor': '#a855f7'
};

 const ModalCreadorAcordes: React.FC<ModalCreadorAcordesProps> = ({ 
    visible, onCerrar, botonesSeleccionados, fuelleActual, tonalidadActual, acordeAEditar, onExitoUpdate
 }) => {
    const [nombre, setNombre] = useState('');
    const [grado, setGrado] = useState('I');
    const [tipo, setTipo] = useState<'Mayor' | 'Menor' | 'Septima'>('Mayor');
    
    // Inversiones independientes (Cerrando y Abriendo)
    const [invAbriendo, setInvAbriendo] = useState(0); 
    const [invCerrando, setInvCerrando] = useState(0);

    const [hilera, setHilera] = useState<number>(2);
    const [botonesCapturados, setBotonesCapturados] = useState<string[]>([]);
    const [fuelleGrabado, setFuelleGrabado] = useState<'abriendo' | 'cerrando'>('abriendo');
    const [guardando, setGuardando] = useState(false);
    const [descripcion, setDescripcion] = useState('');
    const [nombreCirculo, setNombreCirculo] = useState(''); // Ej: Mi Bemol
    const [referenciaMaestro, setReferenciaMaestro] = useState(''); // Ej: +1/2 Hillera 2
    const [modalidadCirculo, setModalidadCirculo] = useState<'Mayor' | 'Menor'>('Mayor');

    useEffect(() => {
        if (visible && buttonsEnabledRef.current && botonesSeleccionados.length > 0) {
            if (botonesCapturados.length === 0) setFuelleGrabado(fuelleActual);
            setBotonesCapturados(prev => [...new Set([...prev, ...botonesSeleccionados])]);
        }
    }, [botonesSeleccionados, visible, fuelleActual]);

    // Ref para evitar captura accidental durante la carga de edición
    const buttonsEnabledRef = React.useRef(true);

    useEffect(() => {
        if (visible && acordeAEditar) {
            buttonsEnabledRef.current = false;
            setNombre(acordeAEditar.nombre);
            setGrado(acordeAEditar.grado || 'I');
            setNombreCirculo(acordeAEditar.tonalidad_referencia || ''); 
            setTipo(acordeAEditar.tipo || 'Mayor');
            setInvAbriendo(acordeAEditar.inv_abriendo ?? 0);
            setInvCerrando(acordeAEditar.inv_cerrando ?? 0);
            setHilera(acordeAEditar.hilera_lider ?? 2);
            setBotonesCapturados(acordeAEditar.botones || []);
            setFuelleGrabado(acordeAEditar.fuelle || 'abriendo');
            setDescripcion(acordeAEditar.descripcion?.split(' | ')[1] || acordeAEditar.descripcion || '');
            setReferenciaMaestro(acordeAEditar.descripcion?.split(' | ')[0] || '');
            setModalidadCirculo(acordeAEditar.modalidad_circulo || 'Mayor');
            
            setTimeout(() => { buttonsEnabledRef.current = true; }, 500);
        } else if (visible && !acordeAEditar) {
            // Limpieza básica si abrimos uno nuevo
            setBotonesCapturados([]);
            setNombre('');
        }
    }, [visible, acordeAEditar]);

    const handleGuardar = async () => {
        if (!nombre || botonesCapturados.length === 0) {
            alert("Bro, por favor pon un nombre y presiona al menos un botón.");
            return;
        }

        setGuardando(true);
        try {
            const payload = {
                nombre,
                hilera_lider: hilera,
                tipo,
                fuelle: fuelleGrabado,
                botones: botonesCapturados,
                inv_abriendo: invAbriendo,
                inv_cerrando: invCerrando,
                tonalidad_referencia: nombreCirculo || tonalidadActual,
                descripcion: `${referenciaMaestro} | ${descripcion}`,
                grado: grado || nombreCirculo, // Grado funcional (I, IV, V) toma prioridad
                modalidad_circulo: modalidadCirculo
            };

            let error;
            if (acordeAEditar?.id) {
                const res = await (supabase.from('acordes_hero') as any).update(payload).eq('id', acordeAEditar.id);
                error = res.error;
            } else {
                const res = await (supabase.from('acordes_hero') as any).insert([payload]);
                error = res.error;
            }

            if (error) throw error;
            
            alert(acordeAEditar ? "✅ ¡Acorde actualizado!" : "✅ ¡Acorde Maestro guardado!");
            
            if (acordeAEditar) {
                if (onExitoUpdate) onExitoUpdate();
                onCerrar();
            } else {
                setBotonesCapturados([]);
                setNombre('');
            }
        } catch (err) {
            console.error("ERROR SUPABASE:", err);
            alert("Error al guardar: " + (err as any).message);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <AnimatePresence>
            {visible && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 2000000,
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
                    paddingLeft: '40px', pointerEvents: 'none', backgroundColor: 'transparent'
                }}>
                    <motion.div
                        drag dragMomentum={false}
                        initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }}
                        style={{
                            width: '450px', backgroundColor: '#18181b', borderRadius: '32px',
                            border: '1px solid #3f3f46', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,1)',
                            pointerEvents: 'auto'
                        }}
                    >
                        {/* Cabecera */}
                        <div style={{ padding: '24px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab', background: '#09090b' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ background: '#3b82f620', padding: '8px', borderRadius: '12px' }}>
                                    <Layers size={20} color="#3b82f6" />
                                </div>
                                <h2 style={{ color: 'white', margin: 0, fontSize: '17px', fontWeight: '900' }}>CREADOR DE ACORDES (PRO)</h2>
                            </div>
                            <button onClick={onCerrar} style={{ background: '#27272a', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Nombre y Grado */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ color: '#3b82f6', fontSize: '9px', fontWeight: '900' }}>NOMBRE DEL ACORDE</label>
                                    <input 
                                        type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Sol Mayor"
                                        style={{ backgroundColor: '#09090b', border: '1px solid #3f3f46', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ color: '#a1a1aa', fontSize: '9px', fontWeight: '900' }}>GRADO</label>
                                    <select value={grado} onChange={(e) => setGrado(e.target.value)} style={{ backgroundColor: '#09090b', border: '1px solid #3f3f46', borderRadius: '12px', padding: '12px', color: 'white', fontWeight: 'bold' }}>
                                        <option value="">- Por definir -</option>
                                        <option>I</option><option>IV</option><option>V</option><option>II</option><option>III</option><option>VI</option><option>VII</option>
                                    </select>
                                </div>
                            </div>

                            {/* 🚨 SELECTORES DE INVERSIÓN INDEPENDIENTES 🚨 */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                {/* ABRIENDO */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ color: '#ef4444', fontSize: '9px', fontWeight: '900' }}>INV. ABRIENDO</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                                        {[0, 1, 2, 3, 4].map(inv => (
                                            <button 
                                                key={`ab-${inv}`} onClick={() => setInvAbriendo(inv)}
                                                style={{ 
                                                    padding: '8px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', cursor: 'pointer',
                                                    backgroundColor: invAbriendo === inv ? '#ef4444' : '#09090b',
                                                    color: invAbriendo === inv ? 'white' : '#71717a',
                                                    border: invAbriendo === inv ? 'none' : '1px solid #27272a'
                                                }}
                                            >
                                                {inv === 0 ? 'NAT.' : `${inv}ª INV`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* CERRANDO */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ color: '#22c55e', fontSize: '9px', fontWeight: '900' }}>INV. CERRANDO</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                                        {[0, 1, 2, 3, 4].map(inv => (
                                            <button 
                                                key={`ce-${inv}`} onClick={() => setInvCerrando(inv)}
                                                style={{ 
                                                    padding: '8px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', cursor: 'pointer',
                                                    backgroundColor: invCerrando === inv ? '#22c55e' : '#09090b',
                                                    color: invCerrando === inv ? 'white' : '#71717a',
                                                    border: invCerrando === inv ? 'none' : '1px solid #27272a'
                                                }}
                                            >
                                                {inv === 0 ? 'NAT.' : `${inv}ª INV`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Hilera y Estructura */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ color: '#a1a1aa', fontSize: '9px', fontWeight: '900' }}>HILERA LÍDER / ANCLA</label>
                                    <select value={hilera} onChange={(e) => setHilera(parseInt(e.target.value) as any)} style={{ backgroundColor: '#09090b', border: '1px solid #3f3f46', borderRadius: '12px', padding: '10px', color: 'white' }}>
                                        <option value={1}>1. Afuera</option><option value={2}>2. Medio</option><option value={3}>3. Adentro</option><option value={0}>F.H. (Fuera de Hilera)</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ color: '#a1a1aa', fontSize: '9px', fontWeight: '900' }}>ESTRUCTURA</label>
                                    <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} style={{ backgroundColor: '#09090b', border: '1px solid #3f3f46', borderRadius: '12px', padding: '10px', color: 'white' }}>
                                        <option>Mayor</option><option>Menor</option><option>Septima</option>
                                    </select>
                                </div>
                            </div>

                            {/* Categoría y Tonalidad (EL CÍRCULO) */}
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ color: '#a855f7', fontSize: '9px', fontWeight: '900' }}>CÍRCULO / TONALIDAD</label>
                                    <select 
                                        value={nombreCirculo} 
                                        onChange={(e) => {
                                            setNombreCirculo(e.target.value);
                                        }}
                                        style={{ backgroundColor: '#09090b', border: '1px solid #3f3f46', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '13px', outline: 'none', fontWeight: 'bold' }}
                                    >
                                        <option value="">- Seleccionar Tono -</option>
                                        {['DO', 'DO#', 'RE', 'RE#', 'MIB', 'MI', 'FA', 'FA#', 'SOL', 'SOL#', 'LA', 'SIB', 'SI'].map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ color: '#3b82f6', fontSize: '9px', fontWeight: '900' }}>REFERENCIA MAESTRO</label>
                                    <input 
                                        type="text" value={referenciaMaestro} onChange={(e) => setReferenciaMaestro(e.target.value)} 
                                        placeholder="Ej: +1/2 Tono Medio (2)"
                                        style={{ backgroundColor: '#09090b', border: '1px solid #3f3f46', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            {/* 🚨 MODALIDAD DEL CÍRCULO 🚨 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ color: modalitiesColor[modalidadCirculo], fontSize: '9px', fontWeight: '900' }}>MODALIDAD DEL CÍRCULO</label>
                                <div style={{ display: 'flex', background: '#09090b', borderRadius: '12px', padding: '4px', border: '1px solid #3f3f46' }}>
                                    {['Mayor', 'Menor'].map((m: any) => (
                                        <button 
                                            key={m} onClick={() => setModalidadCirculo(m)}
                                            style={{ 
                                                flex: 1, padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', border: 'none',
                                                backgroundColor: modalidadCirculo === m ? modalitiesColor[m] : 'transparent',
                                                color: modalidadCirculo === m ? 'white' : '#71717a'
                                            }}
                                        >
                                            {m.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ color: '#a1a1aa', fontSize: '9px', fontWeight: '900' }}>INDICACIÓN DE TRANSPORTE (Breve)</label>
                                 <textarea 
                                     value={descripcion} onChange={(e) => setDescripcion(e.target.value)} 
                                     placeholder="Nota pedagógica..."
                                     style={{ backgroundColor: '#09090b', border: '1px solid #3f3f46', borderRadius: '12px', padding: '10px 12px', color: 'white', fontSize: '12px', outline: 'none', height: '60px', minHeight: '60px', maxHeight: '60px', resize: 'none' }}
                                 />
                            </div>

                            {/* Monitor de Notas */}
                            <div style={{ backgroundColor: '#09090b', borderRadius: '20px', padding: '16px', border: '1px solid #27272a' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '9px', fontWeight: '900', color: '#71717a' }}>NOTAS CAPTURADAS ({fuelleGrabado.toUpperCase()})</span>
                                    <button onClick={() => { setBotonesCapturados([]); setFuelleGrabado(fuelleActual); }} style={{ color: '#ef4444', background: 'none', border: 'none', fontSize: '9px', cursor: 'pointer', fontWeight: '900' }}>REINICIAR</button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {botonesCapturados.length === 0 ? (
                                        <span style={{ color: '#3f3f46', fontSize: '11px' }}>Toca las notas para grabar...</span>
                                    ) : (
                                        botonesCapturados.map(b => (
                                            <span key={b} style={{ fontSize: '9px', backgroundColor: '#3b82f615', color: '#3b82f6', border: '1px solid #3b82f630', padding: '4px 8px', borderRadius: '6px' }}>{b}</span>
                                        ))
                                    )}
                                </div>
                            </div>

                            <button
                                disabled={guardando} onClick={handleGuardar}
                                style={{
                                    width: '100%', padding: '18px', borderRadius: '18px', border: 'none', fontWeight: '900', color: 'white', cursor: 'pointer',
                                    background: acordeAEditar ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                                    opacity: guardando ? 0.7 : 1
                                }}
                            >
                                <Save size={20} /> {guardando ? 'GUARDANDO...' : (acordeAEditar ? 'ACTUALIZAR ACORDE' : 'GUARDAR ACORDE MAESTRO')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ModalCreadorAcordes;
