import React from 'react';
import {
  Play, Pause, Square, Mic, Save, RotateCcw, Upload, Loader2, Music, ListMusic,
} from 'lucide-react';
import TimelineV2 from './TimelineV2';
import EditorSeccionesV2 from './EditorSeccionesV2';
import VisorCapturaEnVivo from './VisorCapturaEnVivo';
import PanelMetronomoStudio from './PanelMetronomoStudio';
import type { NotaHero, SeccionV2 } from '../tipos';

interface Props {
  // Datos basicos
  titulo: string; setTitulo: (v: string) => void;
  autor: string; setAutor: (v: string) => void;
  bpm: number; setBpmState: React.Dispatch<React.SetStateAction<number>>;
  velocidad: number; setVelocidad: React.Dispatch<React.SetStateAction<number>>;
  // Pista / metronomo
  audioUrl: string | null;
  usoMetronomo: boolean; setUsoMetronomo: (v: boolean) => void;
  metronomoExpandido: boolean; setMetronomoExpandido: React.Dispatch<React.SetStateAction<boolean>>;
  metronomo: any;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onSubirMP3: (f: File) => void;
  // Transporte
  totalTicks: number;
  tickActual: number;
  secuencia: NotaHero[];
  secciones: SeccionV2[];
  reproductor: any;
  grabador: any;
  prerollSeg: number; setPrerollSeg: React.Dispatch<React.SetStateAction<number>>;
  enPreroll: boolean;
  prerollRestanteSeg: number;
  enGrabacionPunch: boolean;
  enGrabacionNueva: boolean;
  // Acciones
  onSeekA: (tick: number) => void;
  onTogglePlay: () => void;
  onDetenerTodo: () => void;
  onCancelarPreroll: () => void;
  onIniciarGrabacionNueva: () => void;
  onDetenerGrabacion: () => void;
  onAgregarSeccion: (s: Omit<SeccionV2, 'id'>) => void;
  onActualizarSeccion: (id: string, cambios: Partial<SeccionV2>) => void;
  onEliminarSeccion: (id: string) => void;
  onGrabarSeccion: (s: SeccionV2) => void;
  onVolverALista: () => void;
  onGuardar: () => void;
  estadoGuardado: 'idle' | 'guardando' | 'guardado' | 'error';
}

const EditorCancion: React.FC<Props> = (p) => {
  return (
    <>
      {/* Barra de acciones del editor: volver a lista + guardar */}
      <div className="grabv2-editor-acciones">
        <button className="grabv2-editor-volver" onClick={p.onVolverALista}>
          ← Volver a la lista
        </button>
        <button
          className={`grabv2-btn-guardar estado-${p.estadoGuardado}`}
          onClick={p.onGuardar}
          disabled={p.estadoGuardado === 'guardando' || p.grabador.grabando}
        >
          {p.estadoGuardado === 'guardando' ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
          {p.estadoGuardado === 'guardado' ? '¡Guardado!' : 'Guardar'}
        </button>
      </div>

      {/* Datos básicos */}
      <div className="grabv2-bloque">
        <input
          className="grabv2-input grabv2-titulo"
          type="text"
          placeholder="Título de la canción"
          value={p.titulo}
          onChange={(e) => p.setTitulo(e.target.value)}
        />
        <input
          className="grabv2-input"
          type="text"
          placeholder="Autor"
          value={p.autor}
          onChange={(e) => p.setAutor(e.target.value)}
        />
        <div className="grabv2-bpm-row">
          <label>BPM</label>
          <button className="grabv2-bpm-step" onClick={() => p.setBpmState(b => Math.max(30, b - 5))}>−</button>
          <span className="grabv2-bpm-val">{p.bpm}</span>
          <button className="grabv2-bpm-step" onClick={() => p.setBpmState(b => Math.min(300, b + 5))}>+</button>
          <input
            type="range"
            min={30}
            max={300}
            value={p.bpm}
            onChange={(e) => p.setBpmState(Number(e.target.value))}
            className="grabv2-bpm-slider"
          />
        </div>
      </div>

      {/* Modo de referencia: Pista MP3 o Metrónomo. Solo se muestra el contenido del
          modo seleccionado para no abultar la columna. `usoMetronomo` es la fuente de
          verdad: false = pista, true = metrónomo. Se persiste en la canción. */}
      <div className="grabv2-bloque">
        <div className="grabv2-bloque-titulo">Modo de referencia</div>
        <div className="grabv2-modo-toggle">
          <button
            className={`grabv2-modo-opcion ${!p.usoMetronomo ? 'activa' : ''}`}
            onClick={() => p.setUsoMetronomo(false)}
          >
            <Music size={13} />
            <span>Pista MP3</span>
          </button>
          <button
            className={`grabv2-modo-opcion ${p.usoMetronomo ? 'activa' : ''}`}
            onClick={() => p.setUsoMetronomo(true)}
          >
            <ListMusic size={13} />
            <span>Metrónomo</span>
          </button>
        </div>

        {!p.usoMetronomo ? (
          <div className="grabv2-modo-contenido">
            {p.audioUrl ? (
              <div className="grabv2-mp3-cargado">
                <span className="grabv2-mp3-ok">✓ pista cargada</span>
                <span className="grabv2-mp3-dur">{p.reproductor.duracionSeg.toFixed(1)}s</span>
              </div>
            ) : (
              <div className="grabv2-mp3-vacio">Sin pista — subí un MP3 para acompañar la grabación.</div>
            )}
            <input
              ref={p.fileInputRef}
              type="file"
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) p.onSubirMP3(f);
                e.target.value = '';
              }}
            />
            <button className="grabv2-btn-secundario" onClick={() => p.fileInputRef.current?.click()}>
              <Upload size={12} /> {p.audioUrl ? 'Reemplazar pista' : 'Subir pista MP3'}
            </button>
          </div>
        ) : (
          <div className="grabv2-modo-contenido">
            <button
              className="grabv2-met-cabecera-toggle"
              onClick={() => p.setMetronomoExpandido(v => !v)}
            >
              <span className="grabv2-met-resumen">
                <Music size={12} /> {p.metronomo.bpm} BPM · {p.metronomo.compas}/4 ·
                <span className={p.metronomo.activo ? 'on' : 'off'}>
                  {p.metronomo.activo ? ' ON' : ' OFF'}
                </span>
              </span>
              <span className="grabv2-met-chevron">{p.metronomoExpandido ? '▾' : '▸'}</span>
            </button>
            {p.metronomoExpandido && <PanelMetronomoStudio met={p.metronomo} />}
          </div>
        )}
      </div>

      {/* Transporte + timeline */}
      <div className="grabv2-bloque">
        <TimelineV2
          totalTicks={p.totalTicks}
          tickActual={p.tickActual}
          secuencia={p.secuencia}
          secciones={p.secciones}
          bpm={p.bpm}
          resolucion={192}
          onSeek={p.onSeekA}
        />
        <div className="grabv2-transporte">
          <button className="grabv2-btn-trans" onClick={() => p.onSeekA(0)} title="Al inicio">
            <RotateCcw size={14} />
          </button>
          <button
            className={`grabv2-btn-play ${p.reproductor.reproduciendo ? 'activo' : ''}`}
            onClick={p.onTogglePlay}
            disabled={p.grabador.grabando}
          >
            {p.reproductor.reproduciendo ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
          </button>
          <button className="grabv2-btn-trans" onClick={p.onDetenerTodo} title="Detener todo">
            <Square size={14} />
          </button>
          {p.enPreroll ? (
            <button className="grabv2-btn-rec preroll" onClick={p.onCancelarPreroll}>
              <Square size={14} /> Cancelar preroll
            </button>
          ) : !p.grabador.grabando ? (
            <button className="grabv2-btn-rec" onClick={p.onIniciarGrabacionNueva}>
              <Mic size={14} /> Grabar todo
            </button>
          ) : (
            <button className="grabv2-btn-rec activa" onClick={p.onDetenerGrabacion}>
              <Square size={14} /> Detener {p.enGrabacionPunch ? 'punch' : ''}
            </button>
          )}
        </div>
        <div className="grabv2-preroll-row">
          <label>Pre-roll</label>
          <button className="grabv2-bpm-step" onClick={() => p.setPrerollSeg(s => Math.max(0, s - 1))} disabled={p.enPreroll || p.grabador.grabando}>−</button>
          <span className="grabv2-preroll-val">{p.prerollSeg}s</span>
          <button className="grabv2-bpm-step" onClick={() => p.setPrerollSeg(s => Math.min(8, s + 1))} disabled={p.enPreroll || p.grabador.grabando}>+</button>
          <span className="grabv2-preroll-hint">segundos antes de empezar a grabar la sección</span>
        </div>
        <div className="grabv2-velocidad-row">
          <label>Velocidad</label>
          <button className="grabv2-bpm-step" onClick={() => p.setVelocidad(v => Math.max(0.25, +(v - 0.05).toFixed(2)))}>−</button>
          <span className={`grabv2-velocidad-val ${p.velocidad !== 1 ? 'modificada' : ''}`}>
            {Math.round(p.velocidad * 100)}%
          </span>
          <button className="grabv2-bpm-step" onClick={() => p.setVelocidad(v => Math.min(2, +(v + 0.05).toFixed(2)))}>+</button>
          <input
            type="range"
            min={0.25}
            max={2}
            step={0.05}
            value={p.velocidad}
            onChange={(e) => p.setVelocidad(parseFloat(e.target.value))}
            className="grabv2-velocidad-slider"
          />
          {p.velocidad !== 1 && (
            <button className="grabv2-velocidad-reset" onClick={() => p.setVelocidad(1)} title="Restaurar 100%">
              ↺ {Math.round(p.bpm * p.velocidad)} BPM
            </button>
          )}
        </div>
        {p.enPreroll && (
          <div className="grabv2-banner-preroll">
            🎬 Preparate… <b>{p.prerollRestanteSeg.toFixed(1)}s</b> hasta que arranque la grabación
          </div>
        )}
        {p.enGrabacionPunch && (
          <div className="grabv2-banner-punch">
            🎯 Grabando punch-in en sección [{p.grabador.modo?.rango?.tickInicio}, {p.grabador.modo?.rango?.tickFin}]. Las notas fuera del rango se ignoran.
          </div>
        )}
        {p.enGrabacionNueva && (
          <div className="grabv2-banner-grab">
            ⏺ Grabando canción nueva. Detené para mezclar con la secuencia local.
          </div>
        )}
      </div>

      {/* Visor en vivo */}
      <VisorCapturaEnVivo
        eventos={p.grabador.ultimosEventos}
        bpm={p.bpm}
        resolucion={192}
      />

      {/* Editor secciones */}
      <EditorSeccionesV2
        secciones={p.secciones}
        tickActual={p.tickActual}
        bpm={p.bpm}
        resolucion={192}
        puedeGrabar={!p.grabador.grabando}
        onAgregar={p.onAgregarSeccion}
        onActualizar={p.onActualizarSeccion}
        onEliminar={p.onEliminarSeccion}
        onSeek={p.onSeekA}
        onGrabarSeccion={p.onGrabarSeccion}
      />

      <div className="grabv2-bloque grabv2-resumen">
        <div className="grabv2-resumen-item">Notas: <b>{p.secuencia.length}</b></div>
        <div className="grabv2-resumen-item">Secciones: <b>{p.secciones.length}</b></div>
        <div className="grabv2-resumen-item">
          Duración: <b>{((p.totalTicks / ((p.bpm / 60) * 192))).toFixed(1)}s</b>
        </div>
      </div>
    </>
  );
};

export default EditorCancion;
