import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Play, Volume2, Music } from 'lucide-react';

interface GestorPistasHeroProps {
    pistaActualUrl: string | null;
    onPistaChange: (url: string | null, archivoLocal: File | null) => void;
    reproduciendo: boolean;
    bpmSecuencia: number;
    bpmGrabacion: number;
    enGrabacion: boolean;
    tickActual: number;
}

export const GestorPistasHero: React.FC<GestorPistasHeroProps> = ({
    pistaActualUrl,
    onPistaChange,
    reproduciendo,
    bpmSecuencia,
    bpmGrabacion,
    enGrabacion,
    tickActual
}) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [volumen, setVolumen] = useState(0.8);
    const estadoPrevioPlay = useRef(false);

    // --- Efecto de Sincronización de Reproducción/Grabación ---
    useEffect(() => {
        if (!audioRef.current || !pistaActualUrl) return;

        const debeReproducir = reproduciendo || enGrabacion;
        
        // Si se acaba de activar la Reproducción o Grabación, nos aseguramos de estar en el segundo exacto
        if (debeReproducir && !estadoPrevioPlay.current) {
            const bps = (enGrabacion ? bpmGrabacion : bpmSecuencia) / 60;
            const ticksPorSegundo = bps * 192;
            const segundosAbsolutos = tickActual / ticksPorSegundo;
            
            // Alinear pista exactamente al segundo que marca la secuencia
            if (segundosAbsolutos < 0.05) {
                audioRef.current.currentTime = 0;
            } else {
                audioRef.current.currentTime = segundosAbsolutos;
            }

            audioRef.current.play().catch(e => console.warn('Error autoplay pista:', e));
        } else if (!debeReproducir && estadoPrevioPlay.current) {
            audioRef.current.pause();
            // Ya NO se regresa a cero automáticamente. La pista se queda ahí esperando.
        }
        
        estadoPrevioPlay.current = debeReproducir;
    }, [reproduciendo, enGrabacion, pistaActualUrl]); // No dependemos de tickActual para evitar saltos infinitos

    // Sincronizador Mecánico Activo (Si el usuario salta por la secuencia mientras está en pausa o moviendo la barra)
    const tickAnterior = useRef(tickActual);
    useEffect(() => {
        if (!audioRef.current || !pistaActualUrl) return;
        
        // Si la diferencia es de más de 10 ticks de golpe (no fluyendo naturalmente), significa que saltamos
        if (!reproduciendo && !enGrabacion && Math.abs(tickActual - tickAnterior.current) > 10) {
             const bps = bpmSecuencia / 60;
             const ticksPorSegundo = bps * 192;
             audioRef.current.currentTime = tickActual / ticksPorSegundo;
        }
        tickAnterior.current = tickActual;
    }, [tickActual, reproduciendo, enGrabacion, bpmSecuencia, pistaActualUrl]);

    // --- Efecto de Sincronización de Velocidad (Time-Stretching Mágico sin perder tono) ---
    useEffect(() => {
        if (!audioRef.current) return;
        
        // Supongamos que la pista siempre fue grabada y subida según "BPM de Grabación".
        // Si el usuario cambia el BPM del reproductor para estudiarla más lento, ajustamos su playbackRate.
        let bpmBase = bpmGrabacion; // El BPM de base con el que se definió la pista
        let bpmActual = enGrabacion ? bpmGrabacion : bpmSecuencia;
        
        if (bpmBase <= 0) bpmBase = 120;
        if (bpmActual <= 0) bpmActual = 120;

        const ratio = bpmActual / bpmBase;
        const velocidadAjustada = Math.min(Math.max(ratio, 0.1), 3.0);
        
        audioRef.current.playbackRate = velocidadAjustada;
        // Esta es la MAGIA: Preserva el tono original (Ya es true por default en navegadores modernos, lo aseguramos explícitamente en JS vanilla a veces)
        (audioRef.current as any).preservesPitch = true;
        
    }, [bpmSecuencia, bpmGrabacion, enGrabacion]);

    // --- Efecto de Volumen ---
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volumen;
        }
    }, [volumen]);


    const manejarSubida = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Crear URL local temporal para escuchar la pista de inmediato antes de guardarla a la BD
        const urlLocal = URL.createObjectURL(file);
        onPistaChange(urlLocal, file);
    };

    const quitarPista = () => {
        if (pistaActualUrl && pistaActualUrl.startsWith('blob:')) {
            URL.revokeObjectURL(pistaActualUrl);
        }
        onPistaChange(null, null);
    };

    return (
        <div style={{
            background: 'rgba(20,20,30,0.85)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '15px',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%',
            maxWidth: '350px',
            marginTop: '15px'
        }}>
            <h3 style={{ margin: 0, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6' }}>
                <Music size={16} /> 
                Pista de Acompañamiento
            </h3>

            {/* Selector de Archivo o Pista Cargada */}
            {!pistaActualUrl ? (
                <div>
                    <input
                        type="file"
                        accept="audio/mp3, audio/wav, audio/ogg"
                        id="subirPista"
                        style={{ display: 'none' }}
                        onChange={manejarSubida}
                    />
                    <label htmlFor="subirPista" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        background: 'rgba(59,130,246,0.2)', color: '#60a5fa', padding: '10px',
                        borderRadius: '8px', cursor: 'pointer', fontSize: '12px', border: '1px dashed #3b82f6'
                    }}>
                        <Upload size={16} />
                        Cargar MP3 / WAV
                    </label>
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <Play size={14} color="#10b981" />
                        <span style={{ fontSize: '12px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: '#a7f3d0' }}>
                            Pista Cargada
                        </span>
                    </div>
                    <button onClick={quitarPista} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>
                        <X size={16} />
                    </button>
                    
                    {/* Reproductor oculto */}
                    <audio 
                        ref={audioRef} 
                        src={pistaActualUrl} 
                        crossOrigin="anonymous" 
                        onPlaying={() => {
                            // MAGIA: Compensación de Latencia
                            // Avisamos al sistema el instante exacto en que el audio de verdad empezó a sonar
                            if (typeof (window as any).sincronizarRelojConPista === 'function') {
                                (window as any).sincronizarRelojConPista();
                            }
                        }}
                    />
                </div>
            )}

            {/* Control de Volumen (Sólo si hay pista cargada) */}
            {pistaActualUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Volume2 size={16} color="#9ca3af" />
                    <input 
                        type="range" 
                        min="0" max="1" step="0.05"
                        value={volumen}
                        onChange={e => setVolumen(parseFloat(e.target.value))}
                        style={{ flex: 1, accentColor: '#3b82f6' }}
                    />
                    <span style={{ fontSize: '10px', color: '#9ca3af', width: '30px' }}>{Math.round(volumen * 100)}%</span>
                </div>
            )}
        </div>
    );
};
