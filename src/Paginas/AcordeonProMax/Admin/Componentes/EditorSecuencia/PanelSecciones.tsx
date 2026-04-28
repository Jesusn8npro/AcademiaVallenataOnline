import React from 'react';
import { Play, Pause, Save, Trash2, RefreshCw, Plus, Layout, Coins, Pencil, X } from 'lucide-react';
import { PALETA_SECCIONES, fmtSeg } from './tiposEditor';
import type { Seccion } from './tiposEditor';

interface PanelSeccionesProps {
  secciones: Seccion[];
  eliminarSeccion: (i: number) => void;
  handleSeek: (tick: number) => void;
  bpmModal: number;
  resolucion: number;
  duracionAudio: number;
  duracionSegundosModal: number;
  seccionCursorSeg: number;
  setSeccionCursorSeg: (v: number) => void;
  audioCurrentTime: (t: number) => void;
  reproduciendoSeccion: boolean;
  togglePlaySeccion: () => void;
  stopSeccion: () => void;
  saltarSeccion: (delta: number) => void;
  seccionNombre: string;
  setSeccionNombre: (v: string) => void;
  seccionTickInicio: number;
  setSeccionTickInicio: (v: number) => void;
  seccionTickFin: number;
  setSeccionTickFin: (v: number) => void;
  seccionMonedas: number;
  setSeccionMonedas: (v: number) => void;
  actualizarMonedasSeccion: (index: number, monedas: number) => void;
  agregarSeccion: () => void;
  handleGuardarSecciones: () => void;
  guardandoSecciones: boolean;
  desbloqueoSecuencial: boolean;
  setDesbloqueoSecuencial: (v: boolean) => void;
  umbralPrecisionSeccion: number;
  setUmbralPrecisionSeccion: (v: number) => void;
  intentosParaMoneda: number;
  setIntentosParaMoneda: (v: number) => void;
  guardandoConfigSecciones: boolean;
  handleGuardarConfigSecciones: () => void;
  seccionesAbiertas: boolean;
  setSeccionesAbiertas: (v: (prev: boolean) => boolean) => void;
  seccionEditandoIndex?: number | null;
  iniciarEdicionSeccion?: (i: number) => void;
  cancelarEdicionSeccion?: () => void;
}

const PanelSecciones: React.FC<PanelSeccionesProps> = ({
  secciones, eliminarSeccion, handleSeek, bpmModal, resolucion,
  duracionAudio, duracionSegundosModal, seccionCursorSeg, setSeccionCursorSeg,
  audioCurrentTime, reproduciendoSeccion, togglePlaySeccion, stopSeccion, saltarSeccion,
  seccionNombre, setSeccionNombre, seccionTickInicio, setSeccionTickInicio,
  seccionTickFin, setSeccionTickFin, seccionMonedas, setSeccionMonedas,
  actualizarMonedasSeccion, agregarSeccion,
  handleGuardarSecciones, guardandoSecciones,
  desbloqueoSecuencial, setDesbloqueoSecuencial,
  umbralPrecisionSeccion, setUmbralPrecisionSeccion,
  intentosParaMoneda, setIntentosParaMoneda,
  guardandoConfigSecciones, handleGuardarConfigSecciones,
  seccionesAbiertas, setSeccionesAbiertas,
  seccionEditandoIndex = null, iniciarEdicionSeccion, cancelarEdicionSeccion,
}) => (
  <section className="editor-seccion">
    <div
      className={`secciones-cabecera-acordeon ${seccionesAbiertas ? 'abierto' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => setSeccionesAbiertas(v => !v)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSeccionesAbiertas(v => !v); } }}
    >
      <div className="editor-seccion-titulo" style={{ marginBottom: 0 }}>
        <Layout size={16} /> Estructura de Secciones
        {secciones.length > 0 && (
          <span className="secciones-contador-badge">{secciones.length}</span>
        )}
      </div>
      <div className="secciones-cabecera-derecha">
        {secciones.length > 0 && seccionesAbiertas && (
          <button
            onClick={e => { e.stopPropagation(); handleGuardarSecciones(); }}
            disabled={guardandoSecciones}
            className="secciones-boton-guardar-mini"
          >
            {guardandoSecciones
              ? <><RefreshCw size={12} className="spin" /> Guardando…</>
              : <><Save size={12} /> Guardar</>}
          </button>
        )}
        <span className="secciones-acordeon-icono">▼</span>
      </div>
    </div>

    <div className={`secciones-cuerpo-acordeon ${seccionesAbiertas ? 'abierto' : ''}`}>
      <div className="config-secciones-panel">
        <div className="config-secciones-titulo">⚙️ Configuración del flujo de secciones</div>
        <label className="config-secciones-toggle">
          <input
            type="checkbox"
            checked={desbloqueoSecuencial}
            onChange={e => setDesbloqueoSecuencial(e.target.checked)}
          />
          <span><strong>Desbloqueo secuencial</strong> — el alumno debe completar las secciones en orden</span>
        </label>
        <div className="config-secciones-grid">
          <label className="config-secciones-input">
            <span>Umbral % precisión para completar</span>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={umbralPrecisionSeccion}
              onChange={e => setUmbralPrecisionSeccion(Number(e.target.value))}
            />
          </label>
          <label className="config-secciones-input">
            <span>Intentos para ganar monedas</span>
            <input
              type="number"
              min={1}
              max={99}
              step={1}
              value={intentosParaMoneda}
              onChange={e => setIntentosParaMoneda(Number(e.target.value))}
            />
          </label>
        </div>
        <button
          onClick={handleGuardarConfigSecciones}
          disabled={guardandoConfigSecciones}
          className="secciones-boton-guardar-mini"
        >
          {guardandoConfigSecciones
            ? <><RefreshCw size={12} className="spin" /> Guardando…</>
            : <><Save size={12} /> Guardar configuración</>}
        </button>
      </div>

      <div className="editor-lista-secciones">
        {secciones.length === 0 && (
          <div className="editor-vacio-notificacion">
            Sin secciones aún. Añade la primera usando el formulario de abajo.
          </div>
        )}
        {secciones.map((s, i) => {
          const color = PALETA_SECCIONES[i % PALETA_SECCIONES.length];
          return (
            <div key={s.id || i} className="seccion-fila-pro" style={{ borderLeft: `3px solid ${color.borde}` }}>
              <div className="seccion-punto-color" style={{ background: color.borde }} />
              <div className="seccion-info-texto">
                <strong style={{ color: color.texto }}>{s.nombre}</strong>
                <span>
                  {fmtSeg((s.tickInicio / resolucion) * (60 / bpmModal))} →{' '}
                  {fmtSeg((s.tickFin / resolucion) * (60 / bpmModal))}
                </span>
              </div>
              <label className="seccion-monedas-input" title="Monedas que gana el alumno al completar esta sección">
                <Coins size={12} />
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={s.monedas ?? 1}
                  onChange={e => actualizarMonedasSeccion(i, Number(e.target.value))}
                />
              </label>
              <button
                onClick={() => handleSeek(s.tickInicio)}
                className="seccion-boton-ir"
                title="Ir al inicio de esta sección"
              >
                <Play size={12} fill="currentColor" />
              </button>
              {iniciarEdicionSeccion && (
                <button
                  onClick={() => iniciarEdicionSeccion(i)}
                  className={`seccion-boton-ir ${seccionEditandoIndex === i ? 'editando' : ''}`}
                  title="Editar esta sección"
                  style={{ background: seccionEditandoIndex === i ? 'rgba(59, 130, 246, 0.4)' : undefined }}
                >
                  <Pencil size={12} />
                </button>
              )}
              <button
                onClick={() => eliminarSeccion(i)}
                className="seccion-boton-eliminar"
                title="Eliminar sección"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>

      <div className={`formulario-nueva-seccion${seccionEditandoIndex !== null ? ' editando' : ''}`}>
        <div className="formulario-titulo">
          {seccionEditandoIndex !== null
            ? <><Pencil size={13} /> Editando sección</>
            : <><Plus size={13} /> Nueva sección</>}
        </div>

        <div className="formulario-posicion-contenedor">
          <div className="formulario-posicion-cabecera">
            <span className="formulario-cursor-valor">{fmtSeg(seccionCursorSeg, true)}</span>
            <span className="formulario-cursor-etiqueta" style={{ marginLeft: 'auto' }}>
              / {fmtSeg(duracionAudio || duracionSegundosModal)}
            </span>
          </div>

          <input
            type="range"
            min={0} max={duracionAudio || duracionSegundosModal || 300} step={0.1}
            value={seccionCursorSeg}
            onChange={e => {
              const v = Number(e.target.value);
              setSeccionCursorSeg(v);
              audioCurrentTime(v);
            }}
            className="formulario-posicion-slider"
          />

          <div className="formulario-controles-audio">
            <button onClick={() => saltarSeccion(-10)} className="formulario-boton-control" title="-10 segundos">
              ⏪ -10s
            </button>
            <button
              onClick={togglePlaySeccion}
              className={`formulario-boton-control formulario-boton-play ${reproduciendoSeccion ? 'playing' : ''}`}
            >
              {reproduciendoSeccion ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
            </button>
            <button onClick={stopSeccion} className="formulario-boton-control" title="Detener y volver al inicio">
              ⏹
            </button>
            <button onClick={() => saltarSeccion(10)} className="formulario-boton-control" title="+10 segundos">
              +10s ⏩
            </button>
          </div>
        </div>

        <input
          placeholder="Nombre de la sección (ej: Intro, Estrofa, Coro…)"
          value={seccionNombre}
          onChange={e => setSeccionNombre(e.target.value)}
          className="formulario-input-nombre"
        />

        <label className="formulario-monedas-nueva" title="Monedas que gana el alumno al completar esta sección">
          <Coins size={14} />
          <span>Monedas:</span>
          <input
            type="number"
            min={0}
            step={0.5}
            value={seccionMonedas}
            onChange={e => setSeccionMonedas(Number(e.target.value))}
          />
        </label>

        <div className="formulario-botones-marcadores">
          <button
            onClick={() => setSeccionTickInicio(Math.round(seccionCursorSeg * (bpmModal / 60) * resolucion))}
            className={`boton-marcador ${seccionTickInicio > 0 ? 'marcado' : ''}`}
          >
            📌 Marcar Inicio
            <span className={`marcador-tiempo-v ${seccionTickInicio > 0 ? 'activo' : ''}`}>
              {seccionTickInicio > 0 ? fmtSeg((seccionTickInicio / resolucion) * (60 / bpmModal)) : '--:--'}
            </span>
          </button>
          <button
            onClick={() => setSeccionTickFin(Math.round(seccionCursorSeg * (bpmModal / 60) * resolucion))}
            className={`boton-marcador ${seccionTickFin > 0 ? 'marcado' : ''}`}
          >
            🏁 Marcar Fin
            <span className={`marcador-tiempo-v ${seccionTickFin > 0 ? 'activo' : ''}`}>
              {seccionTickFin > 0 ? fmtSeg((seccionTickFin / resolucion) * (60 / bpmModal)) : '--:--'}
            </span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={agregarSeccion}
            disabled={!seccionNombre.trim() || seccionTickFin <= seccionTickInicio}
            className="formulario-boton-agregar"
            style={{ flex: 1 }}
          >
            {seccionEditandoIndex !== null
              ? <><Pencil size={16} /> Guardar cambios</>
              : <><Plus size={16} /> Agregar Sección</>}
          </button>
          {seccionEditandoIndex !== null && cancelarEdicionSeccion && (
            <button
              onClick={cancelarEdicionSeccion}
              className="formulario-boton-agregar"
              style={{ background: 'rgba(100, 116, 139, 0.3)', flex: '0 0 auto' }}
              title="Cancelar edición"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {seccionTickFin > 0 && seccionTickFin <= seccionTickInicio && (
          <div className="formulario-error-msj">
            ⚠ El tiempo de fin debe ser mayor que el inicio.
          </div>
        )}
      </div>
    </div>
  </section>
);

export default PanelSecciones;
