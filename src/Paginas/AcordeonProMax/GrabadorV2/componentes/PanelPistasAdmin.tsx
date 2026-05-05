import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Music2, Plus, RotateCw, Trash2, Upload, Save, X, Loader2, Play, Pause } from 'lucide-react';
import {
    listarPistasAdmin, crearPistaAdmin, actualizarPistaAdmin,
    eliminarPistaAdmin, subirAudioPistaAdmin,
    type PistaAdmin,
} from '../servicioPistasAdmin';

type EstadoEdicion =
    | { tipo: 'cerrado' }
    | { tipo: 'nueva' }
    | { tipo: 'editando'; pista: PistaAdmin };

const PanelPistasAdmin: React.FC = () => {
    const [pistas, setPistas] = useState<PistaAdmin[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [edicion, setEdicion] = useState<EstadoEdicion>({ tipo: 'cerrado' });

    // Form state.
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [bpm, setBpm] = useState<string>('');
    const [audioUrl, setAudioUrl] = useState('');
    const [archivo, setArchivo] = useState<File | null>(null);
    const [subiendo, setSubiendo] = useState(false);
    const [guardando, setGuardando] = useState(false);

    // Preview de audio en la lista (un solo player a la vez).
    const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
    const [reproduciendoId, setReproduciendoId] = useState<string | null>(null);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            const lista = await listarPistasAdmin();
            setPistas(lista);
        } catch (e: any) {
            setError(e?.message || 'Error cargando pistas');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => { void cargar(); }, [cargar]);

    useEffect(() => () => {
        if (audioPreviewRef.current) { try { audioPreviewRef.current.pause(); } catch (_) {} }
    }, []);

    const abrirNueva = () => {
        setNombre(''); setDescripcion(''); setBpm(''); setAudioUrl(''); setArchivo(null);
        setEdicion({ tipo: 'nueva' });
    };

    const abrirEditar = (pista: PistaAdmin) => {
        setNombre(pista.nombre);
        setDescripcion(pista.descripcion || '');
        setBpm(pista.bpm != null ? String(pista.bpm) : '');
        setAudioUrl(pista.audio_url);
        setArchivo(null);
        setEdicion({ tipo: 'editando', pista });
    };

    const cerrarForm = () => setEdicion({ tipo: 'cerrado' });

    const onArchivoSeleccionado = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        setArchivo(f);
    };

    const guardar = async () => {
        const nombreLimpio = nombre.trim();
        if (!nombreLimpio) { setError('El nombre es obligatorio'); return; }

        setGuardando(true);
        setError(null);
        try {
            // Si hay archivo nuevo, subirlo primero.
            let urlFinal = audioUrl.trim();
            if (archivo) {
                setSubiendo(true);
                urlFinal = await subirAudioPistaAdmin(archivo);
                setSubiendo(false);
            }
            if (!urlFinal) { setError('Tenés que subir un MP3 o pegar una URL'); setGuardando(false); return; }

            const bpmNum = bpm.trim() ? Number(bpm) : null;
            const datos = {
                nombre: nombreLimpio,
                descripcion: descripcion.trim() || null,
                bpm: bpmNum != null && Number.isFinite(bpmNum) ? Math.floor(bpmNum) : null,
                audio_url: urlFinal,
            };

            if (edicion.tipo === 'nueva') {
                await crearPistaAdmin(datos);
            } else if (edicion.tipo === 'editando') {
                await actualizarPistaAdmin(edicion.pista.id, datos);
            }
            cerrarForm();
            await cargar();
        } catch (e: any) {
            setError(e?.message || 'Error guardando pista');
        } finally {
            setSubiendo(false);
            setGuardando(false);
        }
    };

    const eliminar = async (pista: PistaAdmin) => {
        if (!confirm(`¿Eliminar la pista "${pista.nombre}"? Los estudiantes ya no la verán.`)) return;
        try {
            await eliminarPistaAdmin(pista.id);
            await cargar();
        } catch (e: any) {
            setError(e?.message || 'Error eliminando');
        }
    };

    const togglePreview = (pista: PistaAdmin) => {
        const actual = audioPreviewRef.current;
        if (reproduciendoId === pista.id && actual) {
            try { actual.pause(); } catch (_) {}
            setReproduciendoId(null);
            return;
        }
        if (actual) { try { actual.pause(); } catch (_) {} }
        const nuevo = new Audio(pista.audio_url);
        nuevo.onended = () => setReproduciendoId(null);
        audioPreviewRef.current = nuevo;
        nuevo.play().then(() => setReproduciendoId(pista.id)).catch(() => setReproduciendoId(null));
    };

    const formAbierto = edicion.tipo !== 'cerrado';

    return (
        <div className="grabv2-lista">
            <div className="grabv2-panel-titulo">
                <span>Pistas de Práctica Libre</span>
                <span className="grabv2-panel-contador">{pistas.length}</span>
                <button className="grabv2-btn-mini" onClick={cargar} title="Refrescar" disabled={cargando}>
                    <RotateCw size={12} />
                </button>
            </div>

            {!formAbierto && (
                <button className="grabv2-btn-nueva" onClick={abrirNueva}>
                    <Plus size={14} /> Subir nueva pista
                </button>
            )}

            {formAbierto && (
                <div className="grabv2-bloque" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: 13 }}>
                            {edicion.tipo === 'nueva' ? 'Nueva pista' : 'Editar pista'}
                        </strong>
                        <button className="grabv2-btn-mini" onClick={cerrarForm} title="Cancelar">
                            <X size={12} />
                        </button>
                    </div>

                    <input
                        className="grabv2-input"
                        type="text"
                        placeholder="Nombre (ej: Paseo vallenato en G)"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                    />
                    <input
                        className="grabv2-input"
                        type="text"
                        placeholder="Descripción (opcional)"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                    />
                    <input
                        className="grabv2-input"
                        type="number"
                        placeholder="BPM (opcional)"
                        value={bpm}
                        onChange={(e) => setBpm(e.target.value)}
                    />

                    <label className="grabv2-btn-mini" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px' }}>
                        <Upload size={12} />
                        {archivo ? archivo.name : 'Subir archivo MP3'}
                        <input
                            type="file"
                            accept="audio/*"
                            style={{ display: 'none' }}
                            onChange={onArchivoSeleccionado}
                        />
                    </label>

                    <input
                        className="grabv2-input"
                        type="text"
                        placeholder="…o pegar URL pública del audio"
                        value={audioUrl}
                        onChange={(e) => setAudioUrl(e.target.value)}
                        disabled={!!archivo}
                    />

                    {error && (
                        <div style={{ color: '#ff7676', fontSize: 12, padding: '4px 0' }}>{error}</div>
                    )}

                    <button
                        className="grabv2-btn-guardar"
                        onClick={guardar}
                        disabled={guardando || subiendo}
                        style={{ alignSelf: 'flex-start' }}
                    >
                        {(guardando || subiendo)
                            ? <><Loader2 size={14} className="spin" /> {subiendo ? 'Subiendo…' : 'Guardando…'}</>
                            : <><Save size={14} /> Guardar pista</>}
                    </button>
                </div>
            )}

            {!formAbierto && error && (
                <div style={{ color: '#ff7676', fontSize: 12, padding: '4px 8px' }}>{error}</div>
            )}

            <div className="grabv2-lista-items">
                {cargando && <div className="grabv2-lista-vacio">Cargando…</div>}
                {!cargando && pistas.length === 0 && (
                    <div className="grabv2-lista-vacio">Aún no hay pistas. Subí la primera arriba.</div>
                )}
                {pistas.map((p) => (
                    <div
                        key={p.id}
                        className="grabv2-lista-item"
                        onClick={() => abrirEditar(p)}
                        style={{ cursor: 'pointer' }}
                    >
                        <Music2 size={13} className="grabv2-lista-icono" />
                        <div className="grabv2-lista-info">
                            <span className="grabv2-lista-titulo">{p.nombre}</span>
                            <span className="grabv2-lista-meta">
                                {p.bpm ? `${p.bpm} BPM` : 'sin BPM'}
                                {p.descripcion ? ` · ${p.descripcion}` : ''}
                            </span>
                        </div>
                        <button
                            className="grabv2-btn-mini"
                            onClick={(e) => { e.stopPropagation(); togglePreview(p); }}
                            title={reproduciendoId === p.id ? 'Pausar' : 'Escuchar'}
                        >
                            {reproduciendoId === p.id ? <Pause size={11} /> : <Play size={11} />}
                        </button>
                        <button
                            className="grabv2-btn-mini grabv2-btn-del"
                            onClick={(e) => { e.stopPropagation(); eliminar(p); }}
                            title="Eliminar pista"
                        >
                            <Trash2 size={11} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PanelPistasAdmin;
