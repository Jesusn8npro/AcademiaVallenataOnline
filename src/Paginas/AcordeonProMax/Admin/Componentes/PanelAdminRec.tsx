import React from 'react';
import { Circle, Play, Pause, RotateCcw, Upload, Music, Timer, Volume2 } from 'lucide-react';
import BarraTransporte from '../../Modos/BarraTransporte';
import './PanelAdminRec.css';

interface PanelAdminRecProps {
  bpm: number;
  setBpm: (bpm: number) => void;
  grabando: boolean;
  onIniciarGrabacion: () => void;
  onDetenerGrabacion: () => void;
  totalNotas: number;
  tiempoGrabacionMs: number;
  // Props para backing track
  pistaActualUrl?: string | null;
  onPistaChange?: (url: string | null, archivo: File | null) => void;
  reproduciendoHero?: boolean;
  cancionActual?: any;
  tickActual?: number;
  totalTicks?: number;
  onAlternarPausaHero?: () => void;
  onDetenerHero?: () => void;
  onBuscarTick?: (tick: number) => void;
  bpmGrabacion?: number;
  // PUNCH-IN / PRE-ROLL
  cuentaAtrasPreRoll?: number | null;
  metronomoActivo?: boolean;
  setMetronomoActivo?: (val: boolean) => void;
}

const PanelAdminRec: React.FC<PanelAdminRecProps> = ({
  bpm,
  setBpm,
  grabando,
  onIniciarGrabacion,
  onDetenerGrabacion,
  totalNotas,
  tiempoGrabacionMs,
  pistaActualUrl,
  onPistaChange,
  reproduciendoHero,
  cancionActual,
  tickActual = 0,
  totalTicks = 0,
  onAlternarPausaHero,
  onDetenerHero,
  onBuscarTick,
  bpmGrabacion,
  cuentaAtrasPreRoll,
  metronomoActivo,
  setMetronomoActivo,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [volumen, setVolumen] = React.useState(0.8);
  const estadoPrevioPlay = React.useRef(false);

  // --- Sincronización de Audio (Basado en GestorPistasHero.tsx) ---
  React.useEffect(() => {
    if (!audioRef.current || !pistaActualUrl) return;

    const debeReproducir = reproduciendoHero || grabando;
    
    if (debeReproducir && !estadoPrevioPlay.current) {
      const bps = (grabando ? (bpmGrabacion || bpm) : bpm) / 60;
      const ticksPorSegundo = bps * 192;
      const segundosAbsolutos = tickActual / ticksPorSegundo;
      
      if (segundosAbsolutos < 0.05) {
        audioRef.current.currentTime = 0;
      } else {
        audioRef.current.currentTime = segundosAbsolutos;
      }

      audioRef.current.play().catch(e => console.warn('Error autoplay pista:', e));
    } else if (!debeReproducir && estadoPrevioPlay.current) {
      audioRef.current.pause();
    }
    
    estadoPrevioPlay.current = debeReproducir;
  }, [reproduciendoHero, grabando, pistaActualUrl]);

  // Sincronización de Salto (Seek)
  const tickAnterior = React.useRef(tickActual);
  React.useEffect(() => {
    if (!audioRef.current || !pistaActualUrl) return;
    
    if (!reproduciendoHero && !grabando && Math.abs(tickActual - tickAnterior.current) > 10) {
      const bps = bpm / 60;
      const ticksPorSegundo = bps * 192;
      audioRef.current.currentTime = tickActual / ticksPorSegundo;
    }
    tickAnterior.current = tickActual;
  }, [tickActual, reproduciendoHero, grabando, bpm, pistaActualUrl]);

  // Sincronización de Velocidad
  React.useEffect(() => {
    if (!audioRef.current) return;
    
    let bpmBase = bpmGrabacion || 120;
    let bpmActual = grabando ? (bpmGrabacion || bpm) : bpm;
    
    const ratio = bpmActual / bpmBase;
    const velocidadAjustada = Math.min(Math.max(ratio, 0.1), 3.0);
    
    audioRef.current.playbackRate = velocidadAjustada;
    (audioRef.current as any).preservesPitch = true;
  }, [bpm, bpmGrabacion, grabando]);

  // Volumen
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volumen;
    }
  }, [volumen]);

  const formatearTiempo = (ms: number) => {
    const totalSegundos = Math.floor(ms / 1000);
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    return `${minutos}:${segundos.toString().padStart(2, '0')}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPistaChange) {
      const url = URL.createObjectURL(file);
      onPistaChange(url, file);
    }
  };

  return (
    <div className="panel-admin-rec">

      {/* 🎯 CONTROLES BÁSICOS */}
      <div className="panel-admin-rec-bloque">
        <div className="panel-admin-rec-bloque-titulo">Grabación</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label className="panel-admin-rec-switch-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Timer size={14} /> <span>🎚️ Metrónomo (Tempo visual)</span>
            </div>
            <button
              className={`panel-admin-rec-switch ${metronomoActivo ? 'activo' : ''}`}
              onClick={() => setMetronomoActivo?.(!metronomoActivo)}
            >
              <span />
            </button>
          </label>
        </div>
      </div>

      {/* 🎵 BACKING TRACK SELECTOR */}
      <div className="panel-admin-rec-bloque">
        <div className="panel-admin-rec-bloque-titulo">Pista de acompañamiento</div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '10px',
          padding: '12px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {pistaActualUrl ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa' }}>
                  <Music size={16} />
                  <span style={{ fontSize: '13px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Pista cargada
                  </span>
                </div>
                <button 
                  onClick={() => onPistaChange?.(null, null)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '11px' }}
                >
                  Quitar
                </button>
              </div>

              {/* Control de Volumen Pista */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
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

              {/* Elemento Audio Oculto */}
              <audio 
                ref={audioRef} 
                src={pistaActualUrl} 
                crossOrigin="anonymous" 
                onPlaying={() => {
                  if (typeof (window as any).sincronizarRelojConPista === 'function') {
                    (window as any).sincronizarRelojConPista();
                  }
                }}
              />
            </>
          ) : (
            <button 
              className="panel-admin-rec-btn"
              onClick={() => fileInputRef.current?.click()}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Upload size={16} /> Seleccionar MP3/WAV
            </button>
          )}
          <input type="file" ref={fileInputRef} hidden accept="audio/*" onChange={handleFileChange} />
        </div>
      </div>


      {/* 🔴 CONTROLES Y CUENTA ATRÁS */}
      <div className="panel-admin-rec-bloque">
        {cuentaAtrasPreRoll !== null && (
          <div style={{ 
            textAlign: 'center', 
            margin: '10px 0', 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#fbbf24',
            animation: 'pulse 1s infinite'
          }}>
            {cuentaAtrasPreRoll}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            className="panel-admin-rec-btn"
            onClick={grabando ? onDetenerGrabacion : onIniciarGrabacion}
            style={{
              background: grabando ? '#ef4444' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: grabando ? '0 0 15px rgba(239, 68, 68, 0.4)' : 'none'
            }}
          >
            {grabando ? <Pause size={18} /> : <Circle size={18} fill="currentColor" />}
            {grabando ? 'Detener Grabación' : 'Iniciar Grabación'}
          </button>

        </div>
      </div>
    </div>
  );
};

export default PanelAdminRec;
