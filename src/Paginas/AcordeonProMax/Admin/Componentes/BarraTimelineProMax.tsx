import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Zap, SkipBack, SkipForward, ChevronDown, Music, Plus, Coins, Trash2, Pencil, X } from 'lucide-react';
import type { NotaHero } from '../../TiposProMax';
import { PALETA_SECCIONES, formatearTiempoDesdeTicks, fmtSeg } from './EditorSecuencia/tiposEditor';
import type { Seccion } from './EditorSecuencia/tiposEditor';

export interface BarraTimelineProMaxProps {
  secciones: Seccion[];
  totalTicksModal: number;
  bpmModal: number;
  bpmOriginal: number;
  setBpmModal: (v: number) => void;
  onCambiarBpm: (v: number) => void;
  punchInTickLocal?: number | null;
  punchOutTickLocal?: number | null;
  secuenciaEditada: NotaHero[];
  sliderRef?: React.RefObject<HTMLInputElement | null>;
  isSeekingRef?: React.MutableRefObject<boolean>;
  tickLocal: number;
  tiempoAudioActual?: number;
  duracionAudio?: number;
  reproduciendoLocal: boolean;
  handleSeek: (val: number) => void;
  handleReset: () => void;
  saltarSegundos: (seg: number) => void;
  togglePlay: () => void;
  metronomoActivo?: boolean;
  onToggleMetronomo?: () => void;

  resolucion?: number;
  seccionNombre?: string;
  setSeccionNombre?: (v: string) => void;
  seccionTickInicio?: number;
  setSeccionTickInicio?: (v: number) => void;
  seccionTickFin?: number;
  setSeccionTickFin?: (v: number) => void;
  seccionMonedas?: number;
  setSeccionMonedas?: (v: number) => void;
  agregarSeccion?: () => void;
  eliminarSeccion?: (i: number) => void;
  seccionEditandoIndex?: number | null;
  iniciarEdicionSeccion?: (i: number) => void;
  cancelarEdicionSeccion?: () => void;
  // Handler atómico para "ir a sección + reproducir": evita el race entre handleSeek (state async) y togglePlay
  // que arrancaba la reproducción con tickActual stale (= 0) y nunca llegaba al tickInicio de la sección.
  onSeleccionarSeccion?: (tickInicio: number) => void;
}

const BarraTimelineProMax: React.FC<BarraTimelineProMaxProps> = ({
  secciones, totalTicksModal, bpmModal, bpmOriginal, setBpmModal, onCambiarBpm,
  punchInTickLocal, punchOutTickLocal, secuenciaEditada,
  sliderRef, isSeekingRef,
  tickLocal, tiempoAudioActual = 0, duracionAudio = 0,
  reproduciendoLocal, handleSeek, handleReset, saltarSegundos, togglePlay,
  metronomoActivo = false, onToggleMetronomo,
  resolucion = 192,
  seccionNombre, setSeccionNombre,
  seccionTickInicio, setSeccionTickInicio,
  seccionTickFin, setSeccionTickFin,
  seccionMonedas, setSeccionMonedas,
  agregarSeccion, eliminarSeccion,
  seccionEditandoIndex = null, iniciarEdicionSeccion, cancelarEdicionSeccion,
  onSeleccionarSeccion,
}) => {
  const enModoEdicion = seccionEditandoIndex !== null;
  const puedeMarcar = !!(setSeccionNombre && setSeccionTickInicio && setSeccionTickFin && agregarSeccion);
  const fmtSegLocal = (ticks: number) => formatearTiempoDesdeTicks(ticks, bpmModal);
  const [seccionesOpen, setSeccionesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const internalSliderRef = useRef<HTMLInputElement>(null);
  const internalIsSeekingRef = useRef(false);
  const efectivoSliderRef = sliderRef ?? internalSliderRef;
  const efectivoIsSeekingRef = isSeekingRef ?? internalIsSeekingRef;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSeccionesOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!sliderRef && efectivoSliderRef.current && !efectivoIsSeekingRef.current) {
      efectivoSliderRef.current.value = String(tickLocal);
    }
  }, [tickLocal, sliderRef, efectivoSliderRef, efectivoIsSeekingRef]);

  const safeMax = Math.max(totalTicksModal, 1);

  const seccionActiva = secciones.findIndex(s => tickLocal >= s.tickInicio && tickLocal < s.tickFin);

  return (
    <div className="barra-timeline-promax" onClick={e => e.stopPropagation()}>
      <div className="btpm-timeline-row">
        <div className="btpm-visual">
          {secciones.map((s, i) => {
            const color = PALETA_SECCIONES[i % PALETA_SECCIONES.length];
            const leftPct = (s.tickInicio / safeMax) * 100;
            const widthPct = ((s.tickFin - s.tickInicio) / safeMax) * 100;
            return (
              <div
                key={i}
                className={`btpm-banda${i === seccionActiva ? ' activa' : ''}`}
                style={{
                  left: `${leftPct}%`,
                  width: `${Math.max(widthPct, 0.5)}%`,
                  background: color.bg,
                  borderLeft: `2px solid ${color.borde}`,
                }}
                title={`${s.nombre}: ${formatearTiempoDesdeTicks(s.tickInicio, bpmModal)} → ${formatearTiempoDesdeTicks(s.tickFin, bpmModal)}`}
              >
                {widthPct > 7 && (
                  <span className="btpm-banda-label" style={{ color: color.texto }}>{s.nombre}</span>
                )}
              </div>
            );
          })}

          {secuenciaEditada.length > 0 && (() => {
            const fin = Math.max(...secuenciaEditada.map(n => n.tick + n.duracion));
            return <div className="btpm-zona-notas" style={{ width: `${(fin / safeMax) * 100}%` }} />;
          })()}

          {punchInTickLocal != null && (
            <div className="btpm-marker btpm-marker-in" style={{ left: `${(punchInTickLocal / safeMax) * 100}%` }} title="Punch IN" />
          )}
          {punchOutTickLocal != null && (
            <div className="btpm-marker btpm-marker-out" style={{ left: `${(punchOutTickLocal / safeMax) * 100}%` }} title="Punch OUT" />
          )}

          <div
            className="btpm-playhead"
            style={{ left: `${(tickLocal / safeMax) * 100}%` }}
          />

          <input
            ref={efectivoSliderRef as React.RefObject<HTMLInputElement>}
            type="range"
            min={0}
            max={safeMax}
            // Modo admin (sin sliderRef externo): CONTROLADO con value={tickLocal} — igual que BarraTransporte
            // de ModoMaestro/Competencia. React mantiene sincronizado el slider con el state.
            // Modo modal (con sliderRef externo de ModalEditorSecuencia): UN-CONTROLLED con defaultValue —
            // el modal actualiza el value imperativamente vía ref dentro de su propio RAF.
            {...(sliderRef ? { defaultValue: 0 } : { value: tickLocal })}
            step={1}
            className="btpm-seek"
            onPointerDown={() => { efectivoIsSeekingRef.current = true; }}
            onPointerUp={e => {
              efectivoIsSeekingRef.current = false;
              // En modal mode (sin onSeleccionarSeccion) replicar el patrón del botón "Escuchar desde el
              // punto de entrada": al soltar el slider, si el audio está pausado, arrancar play. El modal
              // necesita esto porque su slider un-controlled solo dispara handleSeek (que mueve cursor) y
              // sin togglePlay no arrancaría el play.
              if (!onSeleccionarSeccion && !reproduciendoLocal) togglePlay();
              void e;
            }}
            onPointerCancel={() => { efectivoIsSeekingRef.current = false; }}
            // En cada onChange dispara handleSeek directo (igual que BarraTransporte de ModoMaestro).
            // Funciona porque handleSeek en admin llama hero.buscarTick que es LIGHT — solo seekea
            // audio.currentTime + actualiza tickRef, sin reprogramar audio. Múltiples llamadas en un
            // drag son inocuas. En modal el handleSeek también es light (mueve cursor + RAF local).
            onChange={e => handleSeek(Number(e.target.value))}
          />
        </div>

        <div className="btpm-tiempos">
          <span className="btpm-t-actual">{formatearTiempoDesdeTicks(tickLocal, bpmModal)}</span>
          <span className="btpm-t-sep">/</span>
          <span className="btpm-t-total">{formatearTiempoDesdeTicks(safeMax, bpmModal)}</span>
          {duracionAudio > 0 && (
            <span className="btpm-t-mp3">🎵 {fmtSeg(tiempoAudioActual, true)}/{fmtSeg(duracionAudio)}</span>
          )}
        </div>
      </div>

      <div className="btpm-controls-row">
        <div className="btpm-secciones-wrap" ref={dropdownRef}>
          <button
            className={`btpm-secciones-btn${seccionActiva >= 0 ? ' con-activa' : ''}`}
            onClick={() => setSeccionesOpen(v => !v)}
          >
            {seccionActiva >= 0
              ? secciones[seccionActiva].nombre
              : secciones.length > 0 ? `Secciones (${secciones.length})` : 'Sin secciones'}
            <ChevronDown size={11} />
          </button>
          {seccionesOpen && (secciones.length > 0 || puedeMarcar) && (
            <div className="btpm-secciones-dropdown">
              {secciones.map((s, i) => {
                const color = PALETA_SECCIONES[i % PALETA_SECCIONES.length];
                return (
                  <div
                    key={s.id || i}
                    className={`btpm-seccion-item${i === seccionActiva ? ' activo' : ''}`}
                    style={{ borderLeft: `3px solid ${color.borde}` }}
                  >
                    <button
                      type="button"
                      className="btpm-si-go"
                      onClick={() => {
                        setSeccionesOpen(false);
                        if (onSeleccionarSeccion) {
                          // Camino atómico: el handler recibe el tickInicio explícito y dispara seek + play en orden.
                          onSeleccionarSeccion(s.tickInicio);
                        } else {
                          // Fallback (modal del editor): solo seek; el RAF local del modal dispara play sin race con state externo.
                          handleSeek(s.tickInicio);
                          if (!reproduciendoLocal) togglePlay();
                        }
                      }}
                      title="Ir e iniciar la sección"
                    >
                      <span className="btpm-si-dot" style={{ background: color.borde }} />
                      <span className="btpm-si-nombre">{s.nombre}</span>
                      <span className="btpm-si-tiempo">{fmtSegLocal(s.tickInicio)}</span>
                    </button>
                    {iniciarEdicionSeccion && (
                      <button
                        type="button"
                        className={`btpm-si-edit${seccionEditandoIndex === i ? ' activo' : ''}`}
                        onClick={(e) => { e.stopPropagation(); iniciarEdicionSeccion(i); }}
                        title="Editar esta sección"
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                    {eliminarSeccion && (
                      <button
                        type="button"
                        className="btpm-si-del"
                        onClick={(e) => { e.stopPropagation(); eliminarSeccion(i); }}
                        title="Eliminar sección"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}

              {puedeMarcar && (
                <div className={`btpm-marcar-seccion${enModoEdicion ? ' editando' : ''}`}>
                  <div className="btpm-marcar-titulo">
                    {enModoEdicion
                      ? `✏️ Editando: ${secciones[seccionEditandoIndex!]?.nombre || 'sección'}`
                      : '📍 Marcar nueva sección'}
                  </div>
                  <input
                    type="text"
                    className="btpm-marcar-nombre"
                    placeholder="Nombre (ej: Intro, Pase Final…)"
                    value={seccionNombre ?? ''}
                    onChange={(e) => setSeccionNombre?.(e.target.value)}
                  />
                  <div className="btpm-marcar-marcadores">
                    <button
                      type="button"
                      className={`btpm-marcar-boton ${seccionTickInicio && seccionTickInicio > 0 ? 'marcado' : ''}`}
                      onClick={() => setSeccionTickInicio?.(Math.max(0, Math.round(tickLocal)))}
                      title="Marcar inicio en la posición actual"
                    >
                      📌 Inicio
                      <span className="btpm-marcar-tiempo">
                        {seccionTickInicio && seccionTickInicio > 0 ? fmtSegLocal(seccionTickInicio) : '--:--'}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`btpm-marcar-boton ${seccionTickFin && seccionTickFin > 0 ? 'marcado' : ''}`}
                      onClick={() => setSeccionTickFin?.(Math.max(0, Math.round(tickLocal)))}
                      title="Marcar fin en la posición actual"
                    >
                      🏁 Fin
                      <span className="btpm-marcar-tiempo">
                        {seccionTickFin && seccionTickFin > 0 ? fmtSegLocal(seccionTickFin) : '--:--'}
                      </span>
                    </button>
                  </div>
                  {setSeccionMonedas && (
                    <label className="btpm-marcar-monedas" title="Monedas que recibe el alumno al completar esta sección">
                      <Coins size={12} />
                      <span>Monedas:</span>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={seccionMonedas ?? 1}
                        onChange={(e) => setSeccionMonedas(Number(e.target.value))}
                      />
                    </label>
                  )}
                  <div className="btpm-marcar-acciones">
                    <button
                      type="button"
                      className="btpm-marcar-agregar"
                      onClick={() => { agregarSeccion?.(); }}
                      disabled={!seccionNombre?.trim() || !seccionTickFin || !seccionTickInicio || (seccionTickFin <= seccionTickInicio)}
                    >
                      {enModoEdicion ? <><Pencil size={12} /> Guardar cambios</> : <><Plus size={12} /> Agregar sección</>}
                    </button>
                    {enModoEdicion && cancelarEdicionSeccion && (
                      <button
                        type="button"
                        className="btpm-marcar-cancelar"
                        onClick={() => cancelarEdicionSeccion()}
                        title="Cancelar edición"
                      >
                        <X size={12} /> Cancelar
                      </button>
                    )}
                  </div>
                  {seccionTickFin && seccionTickInicio && seccionTickFin <= seccionTickInicio ? (
                    <div className="btpm-marcar-error">⚠ El fin debe ser mayor que el inicio</div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="btpm-transport">
          <button className="btpm-btn-ico" onClick={handleReset} title="Al inicio">
            <RotateCcw size={14} />
          </button>
          <button className="btpm-btn-ico" onClick={() => saltarSegundos(-10)} title="Atrás 10s">
            <SkipBack size={16} />
          </button>
          <button className={`btpm-btn-play${reproduciendoLocal ? ' activo' : ''}`} onClick={togglePlay}>
            {reproduciendoLocal ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
          </button>
          <button className="btpm-btn-ico" onClick={() => saltarSegundos(10)} title="Adelante 10s">
            <SkipForward size={16} />
          </button>
          {onToggleMetronomo && (
            <button
              className={`btpm-btn-ico btpm-btn-met${metronomoActivo ? ' activo' : ''}`}
              onClick={onToggleMetronomo}
              title={metronomoActivo ? 'Apagar metrónomo' : 'Encender metrónomo'}
            >
              <Music size={14} />
            </button>
          )}
        </div>

        <div className="btpm-bpm">
          <button
            className="btpm-bpm-step"
            onClick={() => { const v = Math.max(30, bpmModal - 5); setBpmModal(v); onCambiarBpm(v); }}
          >−</button>
          <div className="btpm-bpm-info">
            <span className="btpm-bpm-val">{bpmModal}</span>
            <span className="btpm-bpm-lbl">BPM</span>
          </div>
          <button
            className="btpm-bpm-step"
            onClick={() => { const v = Math.min(300, bpmModal + 5); setBpmModal(v); onCambiarBpm(v); }}
          >+</button>
          <input
            type="range"
            min={30}
            max={300}
            value={bpmModal}
            className="btpm-bpm-slider"
            onChange={e => { const v = Number(e.target.value); setBpmModal(v); onCambiarBpm(v); }}
          />
          {bpmOriginal > 0 && bpmModal !== bpmOriginal && (
            <div className="btpm-bpm-vel">
              <Zap size={9} />
              {((bpmModal / bpmOriginal) * 100).toFixed(0)}%
              <button
                className="btpm-bpm-reset-btn"
                onClick={() => { setBpmModal(bpmOriginal); onCambiarBpm(bpmOriginal); }}
                title="Restaurar BPM"
              >↺</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarraTimelineProMax;
