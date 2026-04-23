import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { X, Trash2, Play, Search, Layers, Square, Filter, ChevronRight, Edit3, Save, Copy, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../../servicios/clienteSupabase';
import { obtenerNotasDelAcorde, CIRCULO_OFFSETS, TONALIDAD_OFFSETS, identificarNombreAcorde, HILERAS_NATIVAS } from '../acordeon/notasAcordeonDiatonico';

interface ModalListaAcordesProps {
    visible: boolean;
    onCerrar: () => void;
    onReproducirAcorde: (botones: string[], fuelle: string, id?: string) => void;
    onDetener: () => void;
    idSonando: string | null;
    onEditarAcorde: (acorde: any) => void;
    onNuevoAcordeEnCirculo?: (tonalidad: string | null, modalidad: 'Mayor' | 'Menor' | null) => void;
    onReproducirCirculoCompleto?: (acordes: any[]) => void;
    tonalidadActual?: string; // NUEVO: Acordeón activo en el simulador
}

  const ModalListaAcordes: React.FC<ModalListaAcordesProps> = ({
    visible, onCerrar, onReproducirAcorde, onDetener, idSonando, onEditarAcorde, onNuevoAcordeEnCirculo, onReproducirCirculoCompleto,
    tonalidadActual = 'GCF'
 }) => {
    const [acordes, setAcordes] = useState<any[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [hileraFiltro, setHileraFiltro] = useState<number | null>(null); // null = todas
    const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null); // null = todas
    const [modalidadFiltro, setModalidadFiltro] = useState<'Mayor' | 'Menor' | null>(null);
    const [tonalidadFiltro, setTonalidadFiltro] = useState<string | null>(null);
    const [gradoFiltro, setGradoFiltro] = useState<string | null>(null); // I, II, III etc
    const [cargando, setCargando] = useState(false);
    const [guardandoOrden, setGuardandoOrden] = useState(false);
    const [editandoNombreId, setEditandoNombreId] = useState<string | null>(null);
    const [nombreTemporal, setNombreTemporal] = useState('');

    const cargarAcordes = async () => {
        setCargando(true);
        const { data, error } = await supabase
            .from('acordes_hero')
            .select('*')
            .order('orden_circulo', { ascending: true }) // <--- Orden real
            .order('creado_en', { ascending: true });

        if (!error && data) setAcordes(data);
        setCargando(false);
    };

    useEffect(() => {
        if (visible) cargarAcordes();
    }, [visible]);

    const eliminarAcorde = async (id: string) => {
        if (!confirm("¿Seguro que quieres borrar este acorde del sistema maestro?")) return;
        const { error } = await supabase.from('acordes_hero').delete().eq('id', id);
        if (!error) cargarAcordes();
    };

    const iniciarEdicion = (acorde: any) => {
        onEditarAcorde(acorde);
    };

    const duplicarAcorde = async (acorde: any, alFinal: boolean = false) => {
        setCargando(true);
        try {
            const { id, creado_en, actualizado_en, ...datosCopia } = acorde;

            // 1. Insertar el nuevo acorde primero (con un orden provisional)
            const nuevoNombre = `${acorde.nombre} (Copia)`;
            const { data: insertedData, error: insertError } = await (supabase.from('acordes_hero') as any).insert([{
                ...datosCopia,
                nombre: nuevoNombre,
                orden_circulo: 999 // Temporal al final
            }]).select();

            if (insertError) throw insertError;
            const nuevoAcorde = insertedData[0];

            // 2. Determinar el orden final
            let listaOrdenadaParaGuardar: any[] = [];

            if (alFinal) {
                // Si es al final, simplemente re-indexamos todo el círculo filtrado
                listaOrdenadaParaGuardar = [...filtrados, nuevoAcorde];
            } else {
                // Si es "aquí mismo", lo insertamos después del original en la lista filtrada
                const indexEnFiltrados = filtrados.findIndex(a => a.id === acorde.id);
                listaOrdenadaParaGuardar = [...filtrados];
                listaOrdenadaParaGuardar.splice(indexEnFiltrados + 1, 0, nuevoAcorde);
            }

            // 3. Masivo update de orden_circulo para que quede perfecto
            const promesas = listaOrdenadaParaGuardar.map((ac, index) =>
                (supabase.from('acordes_hero') as any).update({ orden_circulo: index }).eq('id', ac.id)
            );
            await Promise.all(promesas);

            await cargarAcordes();
        } catch (err) {
            console.error("Error al duplicar:", err);
            alert("No se pudo duplicar el acorde correctamente.");
        } finally {
            setCargando(false);
        }
    };

    const reordenar = (nuevaListaFiltrada: any[]) => {
        // Para que Reorder funcione bien con filtros, actualizamos 'acordes'
        // reemplazando solo los elementos que están en la vista actual
        const filtradosIds = new Set(filtrados.map(f => f.id));
        const otrosAcordes = acordes.filter(a => !filtradosIds.has(a.id));

        // Unimos los que no estamos viendo con el nuevo orden de los que sí estamos viendo
        // Los ponemos al final o mantenemos una estructura, pero lo importante es que
        // al guardar el orden, se usará el índice de esta lista combinada o solo de la filtrada.
        setAcordes([...otrosAcordes, ...nuevaListaFiltrada]);
    };

    const moverArriba = (id: string) => {
        const indexEnFiltrados = filtrados.findIndex(a => a.id === id);
        if (indexEnFiltrados <= 0) return;

        const nueva = [...filtrados];
        [nueva[indexEnFiltrados - 1], nueva[indexEnFiltrados]] = [nueva[indexEnFiltrados], nueva[indexEnFiltrados - 1]];
        reordenar(nueva);
    };

    const moverAbajo = (id: string) => {
        const indexEnFiltrados = filtrados.findIndex(a => a.id === id);
        if (indexEnFiltrados === -1 || indexEnFiltrados === filtrados.length - 1) return;

        const nueva = [...filtrados];
        [nueva[indexEnFiltrados + 1], nueva[indexEnFiltrados]] = [nueva[indexEnFiltrados], nueva[indexEnFiltrados + 1]];
        reordenar(nueva);
    };

    const guardarOrdenEnDB = async () => {
        if (filtrados.length === 0) return;
        setGuardandoOrden(true);
        try {
            // 🚨 ESTRATEGIA: Guardamos el orden SOLO de lo que estamos viendo 🚨
            // Esto permite organizar círculos de forma independiente
            const promesas = filtrados.map((ac, index) =>
                (supabase.from('acordes_hero') as any).update({ orden_circulo: index }).eq('id', ac.id)
            );
            await Promise.all(promesas);

            // Refrescar para confirmar que bajó de la DB correctamente
            await cargarAcordes();
            alert(`✅ Orden de ${tonalidadFiltro || 'la lista'} guardado correctamente.`);
        } catch (err) {
            console.error(err);
            alert("Error al guardar orden.");
        } finally {
            setGuardandoOrden(false);
        }
    };

    const guardarNombreInline = async (id: string) => {
        if (!nombreTemporal.trim()) {
            setEditandoNombreId(null);
            return;
        }

        const { error } = await (supabase.from('acordes_hero') as any).update({ nombre: nombreTemporal }).eq('id', id);
        if (!error) {
            setAcordes(acordes.map(a => a.id === id ? { ...a, nombre: nombreTemporal } : a));
        }
        setEditandoNombreId(null);
    };

    const filtrados = acordes.filter(a => {
        const busq = busqueda.toLowerCase();
        const matchSearch = a.nombre.toLowerCase().includes(busq) ||
                            (a.grado && a.grado.toLowerCase().includes(busq)) ||
                            (a.modalidad_circulo && a.modalidad_circulo.toLowerCase().includes(busq)) ||
                            (a.descripcion && a.descripcion.toLowerCase().includes(busq));

        const matchHilera = hileraFiltro === null || a.hilera_lider === hileraFiltro;
        const matchModalidad = modalidadFiltro === null || a.modalidad_circulo === modalidadFiltro;

        // --- FILTRO DE TONALIDAD LÍDER INTELIGENTE ---
        let matchTonalidad = true;
        if (tonalidadFiltro !== null && hileraFiltro === null) {
            // Solo aplicar filtro estricto de tonalidad si NO hay una hilera física seleccionada
            const offsetBase = 2; // GCF
            const offsetActual = TONALIDAD_OFFSETS[tonalidadActual] ?? 2;
            const diff = offsetActual - offsetBase;

            const indexFiltro = CIRCULO_OFFSETS[tonalidadFiltro.toUpperCase()] ?? 0;
            const indexBuscadoEnDB = (indexFiltro - diff + 12) % 12;

            const gradosPosibles = Object.entries(CIRCULO_OFFSETS as Record<string, number>)
                .filter(([_, val]) => val === indexBuscadoEnDB)
                .map(([name, _]) => name);

            matchTonalidad = gradosPosibles.includes((a.grado || '').toUpperCase());
        }

        const matchGradoManual = gradoFiltro === null || a.grado === gradoFiltro;

        // Nueva lógica de categoría: Transporte = Hilera 0 (FH)
        let matchCategoria = true;
        if (categoriaFiltro === 'Transporte') {
            matchCategoria = a.hilera_lider === 0;
        } else if (categoriaFiltro === 'Nativo') {
            matchCategoria = a.hilera_lider > 0;
        }

        return matchSearch && matchHilera && matchCategoria && matchModalidad && matchTonalidad && matchGradoManual;
    });

    const tonalidadesDisponibles = Array.from(new Set(acordes.map(a => a.grado))).filter(Boolean).sort() as string[];

    const getInvLabel = (inv: number) => inv === 0 ? 'NAT' : `${inv}ª INV`;

    return (
        <AnimatePresence>
            {visible && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 3000000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none', backgroundColor: 'transparent', backdropFilter: 'none'
                }}>
                    <motion.div
                        drag dragMomentum={false}
                        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                        style={{
                            width: '800px', maxHeight: '85vh', backgroundColor: '#09090b',
                            borderRadius: '40px', border: '1px solid #27272a', display: 'flex',
                            flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 60px -12px rgba(0,0,0,1)',
                            pointerEvents: 'auto'
                        }}
                    >
                        {/* Cabecera Pro */}
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

                        {/* Controles Académicos (Filtros por Hilera y Categoría) */}
                        <div style={{ padding: '20px 30px', background: '#09090b', borderBottom: '1px solid #1a1a1a', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#71717a', fontSize: '10px', fontWeight: '900' }}>
                                    <Filter size={12} /> HILERA:
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {[null, 1, 2, 3].map(h => (
                                        <button
                                            key={h || 'all'} onClick={() => setHileraFiltro(h)}
                                            style={{
                                                padding: '6px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', border: 'none',
                                                backgroundColor: hileraFiltro === h ? '#3b82f6' : '#1a1a1a',
                                                color: hileraFiltro === h ? 'white' : '#71717a'
                                            }}
                                        >
                                            {h === null ? 'TODAS' : h}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#71717a', fontSize: '10px', fontWeight: '900' }}>
                                    CATEGORÍA:
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {[null, 'Nativo', 'Transporte'].map(c => (
                                        <button
                                            key={c || 'all'} onClick={() => setCategoriaFiltro(c)}
                                            style={{
                                                padding: '6px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', border: 'none',
                                                backgroundColor: categoriaFiltro === c ? '#a855f7' : '#1a1a1a',
                                                color: categoriaFiltro === c ? 'white' : '#71717a'
                                            }}
                                        >
                                            {c === null ? 'TODAS' : c.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 🚨 FILTROS DE CÍRCULO (MODALIDAD Y TONO) 🚨 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a855f7', fontSize: '10px', fontWeight: '900' }}>
                                    MODALIDAD:
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {[null, 'Mayor', 'Menor'].map(m => (
                                        <button
                                            key={m || 'all'} onClick={() => setModalidadFiltro(m as any)}
                                            style={{
                                                padding: '6px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', border: 'none',
                                                backgroundColor: modalidadFiltro === m ? (m === 'Mayor' ? '#3b82f6' : '#a855f7') : '#1a1a1a',
                                                color: modalidadFiltro === m ? 'white' : '#71717a'
                                            }}
                                        >
                                            {m === null ? 'AMBAS' : m.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a855f7', fontSize: '10px', fontWeight: '900' }}>
                                    TONALIDAD LÍDER:
                                </div>
                                <select
                                    value={tonalidadFiltro || ''}
                                    onChange={(e) => {
                                        const val = e.target.value || null;
                                        setTonalidadFiltro(val);
                                        // AUTO-DETECCIÓN DE HILERA SI ES NOTA NATIVA
                                        if (val && tonalidadActual && HILERAS_NATIVAS[tonalidadActual]) {
                                            const hileras = HILERAS_NATIVAS[tonalidadActual];
                                            const indexHilera = hileras.indexOf(val.toUpperCase());
                                            if (indexHilera !== -1) {
                                                setHileraFiltro(indexHilera + 1);
                                            }
                                        }
                                    }}
                                    style={{ background: '#1a1a1a', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', outline: 'none' }}
                                >
                                    <option value="">TODAS</option>
                                    {tonalidadesDisponibles.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 🚨 NUEVO: FILTRO RÁPIDO DE GRADOS VALLENATOS 🚨 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderLeft: '1px solid #1a1a1a', paddingLeft: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '10px', fontWeight: '900' }}>
                                    VER GRADO:
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {[null, 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'].map(g => (
                                        <button
                                            key={g || 'all'}
                                            onClick={() => setGradoFiltro(g)}
                                            style={{
                                                width: '32px', height: '32px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', border: 'none',
                                                backgroundColor: gradoFiltro === g ? '#10b981' : '#1a1a1a',
                                                color: gradoFiltro === g ? 'white' : '#71717a'
                                            }}
                                        >
                                            {g || 'ALL'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => onNuevoAcordeEnCirculo && onNuevoAcordeEnCirculo(tonalidadFiltro, modalidadFiltro)}
                                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', padding: '10px 18px', borderRadius: '15px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 10px -5px rgba(16, 185, 129, 0.4)' }}
                            >
                                <Layers size={14} fill="white" /> + NUEVO ACORDE AQUÍ
                            </button>

                            {filtrados.length > 0 && (
                                <button
                                    onClick={() => onReproducirCirculoCompleto && onReproducirCirculoCompleto(filtrados)}
                                    style={{
                                        background: idSonando === 'ciclo' ? '#ef4444' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                        border: 'none', color: 'white', padding: '10px 18px', borderRadius: '15px',
                                        fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', gap: '8px', boxShadow: '0 8px 10px -5px rgba(59, 130, 246, 0.4)'
                                    }}
                                >
                                    <Play size={14} fill="white" /> {idSonando === 'ciclo' ? 'DETENER CÍRCULO' : 'REPRODUCIR CÍRCULO COMPLETO'}
                                </button>
                            )}

                            <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                                <Search size={14} color="#3f3f46" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text" placeholder="Buscar por nombre, grado o descripción..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                                    style={{ width: '100%', background: '#0c0c0e', border: '1px solid #1a1a1a', borderRadius: '15px', padding: '10px 10px 10px 36px', color: 'white', fontSize: '13px' }}
                                />
                            </div>
                        </div>

                        {/* 🏷️ MENSAJE PEDAGÓGICO DE HILERA Y ESCALA 🏷️ */}
                        {(hileraFiltro !== null || tonalidadFiltro !== null) && (
                            <div style={{
                                margin: '0 30px 10px 30px', padding: '12px 20px', borderRadius: '15px',
                                background: 'linear-gradient(90deg, #3b82f615, transparent)',
                                borderLeft: '4px solid #3b82f6', display: 'flex', alignItems: 'center', gap: '12px'
                            }}>
                                <Filter size={14} color="#60a5fa" />
                                <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px' }}>
                                    ESTÁS VIENDO LA
                                    <strong style={{ color: '#fff', margin: '0 6px', textTransform: 'uppercase' }}>
                                        {hileraFiltro === 1 ? 'Hilera de Afuera' :
                                         hileraFiltro === 2 ? 'Hilera del Medio' :
                                         hileraFiltro === 3 ? 'Hilera de Adentro' : 'Posición Libre'}
                                    </strong>
                                    {tonalidadFiltro && (
                                        <span style={{ marginLeft: '4px' }}>
                                            EN ESCALA DE <strong style={{ color: '#3b82f6' }}>{tonalidadFiltro}</strong>
                                        </span>
                                    )}
                                </span>
                            </div>
                        )}

                        {/* Listado Grilla Pro con Drag & Drop */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '30px', background: '#050505' }}>
                            {cargando ? (
                                <p style={{ color: '#71717a', textAlign: 'center' }}>Sincronizando biblioteca...</p>
                            ) : filtrados.length === 0 ? (
                                <p style={{ color: '#3f3f46', textAlign: 'center', fontSize: '14px' }}>No hay acordes en este criterio. ¡Graba algunos primero!</p>
                            ) : (
                                <Reorder.Group axis="y" values={filtrados} onReorder={reordenar} style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {filtrados.map(acorde => {
                                        const estaSonando = idSonando === acorde.id;
                                        return (
                                            <Reorder.Item
                                                key={acorde.id}
                                                value={acorde}
                                                style={{
                                                    backgroundColor: estaSonando ? '#1e1b4b' : '#0c0c0e',
                                                    padding: '20px',
                                                    borderRadius: '24px',
                                                    border: estaSonando ? '1px solid #4f46e5' : '1px solid #1a1a1a',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    cursor: 'grab',
                                                    boxShadow: estaSonando ? '0 0 30px -5px rgba(79, 70, 229, 0.4)' : 'none',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                whileDrag={{ scale: 1.02, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)', zIndex: 10 }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    {/* Flechas de orden manual */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <button onClick={(e) => { e.stopPropagation(); moverArriba(acorde.id); }} style={{ background: '#1a1a1a', border: 'none', color: '#71717a', padding: '4px', borderRadius: '6px', cursor: 'pointer' }}>
                                                            <ChevronUp size={14} />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); moverAbajo(acorde.id); }} style={{ background: '#1a1a1a', border: 'none', color: '#71717a', padding: '4px', borderRadius: '6px', cursor: 'pointer' }}>
                                                            <ChevronDown size={14} />
                                                        </button>
                                                    </div>

                                                    <div style={{
                                                        width: '56px', height: '56px', borderRadius: '16px',
                                                        background: estaSonando ? '#4f46e5' : 'rgba(59, 130, 246, 0.1)',
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                        color: estaSonando ? 'white' : '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)'
                                                    }}>
                                                        <span style={{ fontSize: '14px', fontWeight: '900' }}>{acorde.grado}</span>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                            {editandoNombreId === acorde.id ? (
                                                                <input
                                                                    autoFocus
                                                                    value={nombreTemporal}
                                                                    onChange={(e) => setNombreTemporal(e.target.value)}
                                                                    onBlur={() => guardarNombreInline(acorde.id)}
                                                                    onKeyDown={(e) => e.key === 'Enter' && guardarNombreInline(acorde.id)}
                                                                    style={{ backgroundColor: '#09090b', border: '1px solid #3b82f6', borderRadius: '8px', padding: '4px 8px', color: 'white', fontSize: '15px', fontWeight: '900', outline: 'none' }}
                                                                />
                                                            ) : (
                                                                <>
                                                                    <h3
                                                                        onDoubleClick={() => { setEditandoNombreId(acorde.id); setNombreTemporal(acorde.nombre); }}
                                                                        title="Doble clic para editar nombre rápido"
                                                                        style={{ color: estaSonando ? 'white' : 'white', margin: 0, fontSize: '16px', fontWeight: '900', cursor: 'pointer' }}
                                                                    >
                                                                        {identificarNombreAcorde(acorde.botones, TONALIDAD_OFFSETS[tonalidadActual] ?? 2)}
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
                                                                <motion.span
                                                                    initial={{ scale: 0.8 }} animate={{ scale: [0.8, 1.1, 0.8] }} transition={{ repeat: Infinity, duration: 1.5 }}
                                                                    style={{ color: '#4ade80', fontSize: '9px', fontWeight: '900', marginLeft: '10px' }}
                                                                >
                                                                    ● REPRODUCIENDO...
                                                                </motion.span>
                                                            )}
                                                        </div>

                                                        {/* ✨ NOTAS DEL ACORDE (PRO) ✨ */}
                                                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '10px', color: '#52525b', fontWeight: '900', letterSpacing: '0.5px' }}>NOTAS:</span>
                                                            <span style={{
                                                                background: 'linear-gradient(90deg, #3b82f620, transparent)',
                                                                color: '#60a5fa', fontSize: '12px', fontWeight: '900',
                                                                padding: '4px 12px', borderRadius: '8px', borderLeft: '3px solid #3b82f6'
                                                            }}>
                                                                {obtenerNotasDelAcorde(acorde.botones, TONALIDAD_OFFSETS[tonalidadActual] ?? 2)}
                                                            </span>
                                                        </div>

                                                        {/* Nota del Maestro si existe */}
                                                        {acorde.descripcion && (
                                                            <p style={{ color: estaSonando ? '#94a3b8' : '#71717a', fontSize: '11px', margin: '5px 0', fontStyle: 'italic', maxWidth: '400px' }}>
                                                                " {acorde.descripcion} "
                                                            </p>
                                                        )}

                                                        {/* Detalle Directo de Dirección e Inversión */}
                                                        <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                                            {acorde.fuelle === 'abriendo' ? (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                    <span style={{ fontSize: '8px', color: '#ef4444', fontWeight: '900' }}>ABRIENDO</span>
                                                                    <span style={{ fontSize: '10px', color: 'white', fontWeight: 'bold', background: 'rgba(239, 68, 68, 0.14)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                                                        {getInvLabel(acorde.inv_abriendo)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                    <span style={{ fontSize: '8px', color: '#22c55e', fontWeight: '900' }}>CERRANDO</span>
                                                                    <span style={{ fontSize: '10px', color: 'white', fontWeight: 'bold', background: 'rgba(34, 197, 94, 0.14)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                                                                        {getInvLabel(acorde.inv_cerrando)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => onReproducirAcorde(acorde.botones, acorde.fuelle, acorde.id)}
                                                        style={{ background: estaSonando ? '#4f46e5' : 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 8px 15px -5px rgba(59, 130, 246, 0.4)' }}
                                                    >
                                                        <Play size={14} fill="white" /> PROBAR
                                                    </button>
                                                    <button
                                                        title="Duplicar Aquí Abajo"
                                                        onClick={() => duplicarAcorde(acorde, false)}
                                                        style={{ background: '#1a1a1a', border: 'none', color: '#10b981', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <Copy size={18} />
                                                    </button>
                                                    <button
                                                        title="Enviar Copia al Final"
                                                        onClick={() => duplicarAcorde(acorde, true)}
                                                        style={{ background: '#1a1a1a', border: 'none', color: '#a855f7', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <Layers size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => iniciarEdicion(acorde)}
                                                        style={{ background: '#1a1a1a', border: 'none', color: '#3b82f6', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => eliminarAcorde(acorde.id)}
                                                        style={{ background: '#1a1a1a', border: 'none', color: '#dc2626', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </Reorder.Item>
                                        );
                                    })}
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
