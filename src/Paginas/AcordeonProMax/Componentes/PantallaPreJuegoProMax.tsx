import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Music, Zap, BookOpen, Volume2, X } from 'lucide-react';
import type { ModoPractica, ModoAudioSynthesia } from '../TiposProMax';
import type { Seccion } from '../Admin/Componentes/EditorSecuencia/tiposEditor';
import SelectorSeccion from './SelectorSeccion';
import { useProgresoSecciones, seccionesConEstado } from '../Hooks/useProgresoSecciones';

interface PantallaPreJuegoProMaxProps {
    cancion: any;
    modoSeleccionado: ModoPractica;
    setModoSeleccionado: (m: ModoPractica) => void;
    bpm: number;
    setBpm: (b: number) => void;
    bpmOriginal: number;
    maestroSuena: boolean;
    setMaestroSuena: (v: boolean) => void;
    modoAudioSynthesia: ModoAudioSynthesia;
    setModoAudioSynthesia: (modo: ModoAudioSynthesia) => void;
    seccionSeleccionada: Seccion | null;
    onSeleccionarSeccion: (seccion: Seccion | null) => void;
    progresoVersion?: number;
    onEmpezar: () => void;
    onVolver: () => void;
}

/**
 * 🎨 PANTALLA PRE-JUEGO PRO MAX — Intersticial de Selección
 * ─────────────────────────────────────────────────────────────
 * Réplica premium del selector de modos original con estética Rhythm+.
 */
const PantallaPreJuegoProMax: React.FC<PantallaPreJuegoProMaxProps> = ({
    cancion,
    modoSeleccionado,
    setModoSeleccionado,
    bpm,
    setBpm,
    bpmOriginal,
    maestroSuena,
    setMaestroSuena,
    modoAudioSynthesia,
    setModoAudioSynthesia,
    seccionSeleccionada,
    onSeleccionarSeccion,
    progresoVersion = 0,
    onEmpezar,
    onVolver
}) => {

    const porcentajeBpm = Math.round((bpm / bpmOriginal) * 100);

    // Secciones de la canción (puede venir como JSON string o array)
    const seccionesCancion: Seccion[] = useMemo(() => {
        let secs = cancion?.secciones || [];
        if (typeof secs === 'string') {
            try { secs = JSON.parse(secs); } catch { secs = []; }
        }
        return Array.isArray(secs)
            ? secs.filter((s: any) => s && typeof s.id === 'string' && s.id.length > 0)
            : [];
    }, [cancion?.secciones]);

    const desbloqueoSecuencial = cancion?.desbloqueo_secuencial !== false;
    const intentosParaMoneda = typeof cancion?.intentos_para_moneda === 'number' ? cancion.intentos_para_moneda : 3;

    const { progreso } = useProgresoSecciones(cancion?.id || null, progresoVersion);
    const seccionesEstado = useMemo(
        () => seccionesConEstado(seccionesCancion, progreso, desbloqueoSecuencial, intentosParaMoneda),
        [seccionesCancion, progreso, desbloqueoSecuencial, intentosParaMoneda],
    );

    const tieneSecciones = seccionesEstado.length > 0;
    const seccionActualBloqueada = seccionSeleccionada
        ? !seccionesEstado.find(s => s.id === seccionSeleccionada.id)?.disponible
        : false;
    const todasCompletadas = seccionesEstado.length > 0 && seccionesEstado.every(s => s.completada);
    const cancionCompletaPermitida = !desbloqueoSecuencial || todasCompletadas;
    const empezarBloqueado = tieneSecciones && (
        seccionActualBloqueada || (seccionSeleccionada === null && !cancionCompletaPermitida)
    );

    const MODOS = [
        { id: 'ninguno' as ModoPractica, icono: <Zap size={22} />, titulo: 'Competitivo', sub: 'Puntos, vida y combo' },
        { id: 'libre' as ModoPractica, icono: <Music size={22} />, titulo: 'Libre', sub: 'Sin penalización' },
        { id: 'synthesia' as ModoPractica, icono: <Zap size={22} />, titulo: 'Synthesia', sub: 'Pausa en cada nota' },
        { id: 'maestro_solo' as ModoPractica, icono: <BookOpen size={22} />, titulo: 'Maestro Solo', sub: 'Rebobina y practica' },
    ];

    return (
        <motion.div 
            className="promax-prejuego-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* 🎬 FONDO DE VIDEO DINÁMICO */}
            <video
                className="prejuego-video-bg"
                src="/videos/fondo_blue_paint.mp4"
                autoPlay
                loop
                muted
                playsInline
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: -2
                }}
            />
            <div className="prejuego-overlay-dim" style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                zIndex: -1
            }} />

            <motion.div 
                className="promax-prejuego-card glass-morphism"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
            >
                {/* 🏷️ CABECERA */}
                <div className="prejuego-header">
                    <h1 className="prejuego-titulo">{cancion?.titulo || 'Cargando...'}</h1>
                    <p className="prejuego-autor">{cancion?.autor || 'Academia Vallenata'}</p>
                    <div className="prejuego-tonalidad">TONO: {cancion?.tonalidad || 'ADG'}</div>
                </div>

                {/* 🎮 SECTOR DE MODOS */}
                <div className="prejuego-seccion">
                    <label className="seccion-label">MODO DE JUEGO</label>
                    <div className="prejuego-modos-grid">
                        {MODOS.map(m => (
                            <button 
                                key={m.id}
                                className={`modo-card ${modoSeleccionado === m.id ? 'activo' : ''}`}
                                onClick={() => setModoSeleccionado(m.id)}
                            >
                                <div className="modo-icono">{m.icono}</div>
                                <div className="modo-textos">
                                    <span className="modo-titulo">{m.titulo}</span>
                                    <span className="modo-sub">{m.sub}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ⏱️ CONFIGURACIÓN DE VELOCIDAD */}
                <div className="prejuego-seccion">
                    <div className="seccion-header-fila">
                        <label className="seccion-label">VELOCIDAD</label>
                        <span className="valor-resaltado">{porcentajeBpm}% — {bpm} BPM</span>
                    </div>
                    <div className="slider-wrapper">
                        <span className="slider-limit">40%</span>
                        <input 
                            type="range" 
                            min={Math.round(bpmOriginal * 0.4)} 
                            max={Math.round(bpmOriginal * 1.5)} 
                            value={bpm}
                            onChange={(e) => setBpm(parseInt(e.target.value))}
                            className="prejuego-slider"
                        />
                        <span className="slider-limit">150%</span>
                    </div>
                </div>

                {/* 🔊 CONFIGURACIÓN DE SONIDO */}
                <div className="prejuego-seccion sound-toggle">
                    <div className="modo-card full-width no-hover">
                        <div className="modo-icono"><Volume2 size={22} /></div>
                        <div className="modo-textos">
                            <span className="modo-titulo">Guía de audio</span>
                            <span className="modo-sub">
                                {modoSeleccionado === 'synthesia'
                                    ? 'Elige si quieres oír todo el maestro o solo la referencia correcta'
                                    : 'Escucha la referencia del maestro durante la partida'}
                            </span>
                        </div>
                        <label className="promax-switch">
                            <input 
                                type="checkbox" 
                                checked={maestroSuena}
                                onChange={(e) => setMaestroSuena(e.target.checked)}
                            />
                            <span className="switch-slider round"></span>
                        </label>
                    </div>
                    {modoSeleccionado === 'synthesia' && (
                        <div className="prejuego-modos-grid" style={{ marginTop: '12px' }}>
                            <button
                                className={`modo-card ${modoAudioSynthesia === 'solo_notas' ? 'activo' : ''}`}
                                onClick={() => setModoAudioSynthesia('solo_notas')}
                            >
                                <div className="modo-icono"><Music size={22} /></div>
                                <div className="modo-textos">
                                    <span className="modo-titulo">Solo notas correctas</span>
                                    <span className="modo-sub">Suena solo la ayuda cuando toque responder</span>
                                </div>
                            </button>
                            <button
                                className={`modo-card ${modoAudioSynthesia === 'maestro' ? 'activo' : ''}`}
                                onClick={() => setModoAudioSynthesia('maestro')}
                            >
                                <div className="modo-icono"><Volume2 size={22} /></div>
                                <div className="modo-textos">
                                    <span className="modo-titulo">Acordeón del maestro</span>
                                    <span className="modo-sub">Escucha toda la ejecución del maestro</span>
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                {tieneSecciones && (
                    <div className="prejuego-seccion">
                        <SelectorSeccion
                            secciones={seccionesEstado}
                            desbloqueoSecuencial={desbloqueoSecuencial}
                            seccionSeleccionadaId={seccionSeleccionada?.id ?? null}
                            onSeleccionar={(id) => {
                                if (id === null) {
                                    onSeleccionarSeccion(null);
                                    return;
                                }
                                const s = seccionesCancion.find(x => x.id === id);
                                onSeleccionarSeccion(s || null);
                            }}
                        />
                    </div>
                )}

                {/* 🚀 ACCIONES */}
                <div className="prejuego-acciones">
                    <button className="btn-volver-promax" onClick={onVolver}>
                        <X size={18} /> Volver
                    </button>
                    <button
                        className="btn-empezar-promax"
                        onClick={onEmpezar}
                        disabled={empezarBloqueado}
                        title={empezarBloqueado ? 'Selecciona una sección disponible' : ''}
                    >
                        <Play size={18} fill="currentColor" />
                        {seccionSeleccionada ? `¡Empezar: ${seccionSeleccionada.nombre}!` : '¡Empezar!'}
                    </button>
                </div>

            </motion.div>
        </motion.div>
    );
};

export default PantallaPreJuegoProMax;
