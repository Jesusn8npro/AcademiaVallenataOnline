import React from 'react';
import {
  Play, Save, Trash2, RefreshCw, Square,
  Activity, Clock, Ear, MapPin, Scissors, ListMusic,
} from 'lucide-react';
import type { NotaHero } from '../../../TiposProMax';
import { formatearTiempoDesdeTicks, PALETA_SECCIONES } from './tiposEditor';
import type { ModoEdicion, Seccion } from './tiposEditor';

interface PanelPunchInProps {
  modoEdicion: ModoEdicion;
  cuentaAtrasLocal: number | null;
  notasGrabadas: NotaHero[];
  punchInTickLocal: number | null;
  setPunchInTickLocal: (t: number | null) => void;
  punchOutTickLocal: number | null;
  setPunchOutTickLocal: (t: number | null) => void;
  punchInTickSnapshotCurrent: number | null;
  mensajeLocal: string | null;
  bpmModal: number;
  resolucion: number;
  secuenciaPreview: NotaHero[];
  reproduciendoLocal: boolean;
  handleSeek: (val: number) => void;
  togglePlay: () => void;
  preRollSegsLocal: number;
  setPreRollSegsLocal: (v: number) => void;
  setPreRollSegundos: (v: number) => void;
  iniciarEdicionPunch: () => void;
  detenerEdicionPunch: () => void;
  guardarToma: () => void;
  guardandoToma: boolean;
  onRepetirToma: () => void;
  descartarToma: () => void;
  tickLocalRefCurrent: () => number;
  edicionAbierta: boolean;
  setEdicionAbierta: (v: (prev: boolean) => boolean) => void;
  totalTicksModal: number;
  /** Secciones guardadas — para auto-rellenar IN/OUT con un solo clic. */
  secciones?: Seccion[];
}

const PanelPunchIn: React.FC<PanelPunchInProps> = ({
  modoEdicion, cuentaAtrasLocal, notasGrabadas, punchInTickLocal, setPunchInTickLocal,
  punchOutTickLocal, setPunchOutTickLocal,
  punchInTickSnapshotCurrent, mensajeLocal, bpmModal, resolucion, secuenciaPreview,
  reproduciendoLocal, handleSeek, togglePlay, preRollSegsLocal, setPreRollSegsLocal,
  setPreRollSegundos,
  iniciarEdicionPunch, detenerEdicionPunch, guardarToma, guardandoToma,
  onRepetirToma, descartarToma, tickLocalRefCurrent,
  edicionAbierta, setEdicionAbierta, totalTicksModal,
  secciones,
}) => (
  <section className="editor-seccion seccion-edicion-quirurgica">
    <button
      className={`secciones-cabecera-acordeon ${edicionAbierta ? 'abierto' : ''}`}
      onClick={() => setEdicionAbierta(v => !v)}
    >
      <div className="editor-seccion-titulo" style={{ marginBottom: 0 }}>
        <Scissors size={16} /> Edición Quirúrgica de Notas
        {(modoEdicion === 'grabando' || modoEdicion === 'preroll') && (
          <span className="secciones-contador-badge" style={{ background: '#ef4444' }}>⚡ Activo</span>
        )}
      </div>
      <div className="secciones-cabecera-derecha">
        <span className="secciones-acordeon-icono">▼</span>
      </div>
    </button>

    <div className={`secciones-cuerpo-acordeon ${edicionAbierta ? 'abierto' : ''}`}>
      <div className="edicion-quirurgica-card">
        <div className="edicion-quirurgica-info">
          <div className="tecnica-ajuste-texto">
            <span className="tecnica-ajuste-nombre">Grabación Quirúrgica (Punch-In)</span>
            <p className="tecnica-ajuste-ayuda">
              Marca un punto, toca el acordeón y la grabación reemplaza esa sección automáticamente con pre-roll.
            </p>
          </div>
          {modoEdicion === 'grabando' && (
            <div className="edicion-status-badge grabando"><Activity size={14} /> GRABANDO...</div>
          )}
          {modoEdicion === 'preroll' && (
            <div className="edicion-status-badge espera"><Clock size={14} /> PRE-ROLL: {cuentaAtrasLocal}s</div>
          )}
          {modoEdicion === 'revisando' && (
            <div className="edicion-status-badge"><Ear size={14} /> REVISIÓN</div>
          )}
          {modoEdicion === 'idle' && <div className="edicion-status-badge">LISTO</div>}
        </div>

        {modoEdicion === 'revisando' && (
          <div className="punch-revisando-panel">
            <div className="punch-revisando-stats">
              <div className="tecnica-info-col">
                <span className="tecnica-etiqueta-mini">Notas grabadas</span>
                <span className="tecnica-valor-db">{notasGrabadas.length}</span>
              </div>
              <div className="tecnica-info-col">
                <span className="tecnica-etiqueta-mini">Punto de entrada</span>
                <span className="tecnica-valor-real">
                  {punchInTickSnapshotCurrent !== null
                    ? formatearTiempoDesdeTicks(punchInTickSnapshotCurrent, bpmModal)
                    : '—'}
                </span>
              </div>
              <div className="tecnica-info-col">
                <span className="tecnica-etiqueta-mini">En preview</span>
                <span className="tecnica-valor-real">{secuenciaPreview.length} notas</span>
              </div>
            </div>
            <div className="punch-revisando-ayuda">
              Usa el <strong>Play ▶</strong> del Timeline para escuchar la toma.
            </div>
            <button
              className="btn-punch-config"
              style={{ width: '100%', background: 'rgba(99,102,241,0.15)', borderColor: '#6366f1' }}
              onClick={() => {
                const t = Math.max(0, (punchInTickSnapshotCurrent ?? 0) - Math.round(2 * (bpmModal / 60) * resolucion));
                handleSeek(t);
                if (!reproduciendoLocal) togglePlay();
              }}
            >
              <Play size={14} fill="currentColor" /> Escuchar desde el punto de entrada
            </button>
            <div className="punch-acciones-fila">
              <button className="btn-iniciar-edicion-pro" onClick={guardarToma} disabled={guardandoToma}>
                {guardandoToma
                  ? <><RefreshCw size={15} className="spin" /> Guardando...</>
                  : <><Save size={15} /> Guardar</>}
              </button>
              <button className="btn-iniciar-edicion-pro detener" onClick={onRepetirToma}>
                <RefreshCw size={15} /> Repetir
              </button>
              <button
                className="punch-btn-descartar"
                onClick={descartarToma}
                title="Descartar toma y volver"
              >
                <Trash2 size={15} />
              </button>
            </div>
            {mensajeLocal && <div className="punch-mensaje-resultado">{mensajeLocal}</div>}
          </div>
        )}

        {(modoEdicion === 'grabando' || modoEdicion === 'preroll') && (
          <div className="punch-activo-panel">
            {modoEdicion === 'preroll' && (
              <div className="punch-preroll-box">
                <div className="punch-preroll-numero">{cuentaAtrasLocal}</div>
                <div className="punch-preroll-label">Preparando grabación...</div>
              </div>
            )}
            {modoEdicion === 'grabando' && (
              <div className="punch-grabando-box">
                <div className="punch-grabando-pulso">●</div>
                <div>
                  <div className="punch-grabando-titulo">GRABANDO</div>
                  <div className="punch-grabando-contador">{notasGrabadas.length} notas capturadas</div>
                </div>
              </div>
            )}
            <button className="btn-iniciar-edicion-pro detener" onClick={detenerEdicionPunch}>
              <Square size={18} fill="currentColor" /> Detener Grabación
            </button>
          </div>
        )}

        {modoEdicion === 'idle' && (
          <>
            {secciones && secciones.length > 0 && (
              <div className="punch-secciones-picker">
                <div className="punch-secciones-header">
                  <ListMusic size={12} />
                  <span>Cargar región desde sección guardada</span>
                </div>
                <div className="punch-secciones-lista">
                  {secciones.map((s, i) => {
                    const color = PALETA_SECCIONES[i % PALETA_SECCIONES.length];
                    const activa = punchInTickLocal === s.tickInicio && punchOutTickLocal === s.tickFin;
                    return (
                      <button
                        key={s.id}
                        className={`punch-seccion-chip${activa ? ' activa' : ''}`}
                        style={{ borderColor: color.borde, color: activa ? '#fff' : color.texto, background: activa ? color.bg : 'transparent' }}
                        onClick={() => {
                          setPunchInTickLocal(s.tickInicio);
                          setPunchOutTickLocal(s.tickFin);
                        }}
                        title={`${s.nombre}: ${formatearTiempoDesdeTicks(s.tickInicio, bpmModal)} → ${formatearTiempoDesdeTicks(s.tickFin, bpmModal)}`}
                      >
                        <span className="punch-seccion-chip-dot" style={{ background: color.borde }} />
                        <span className="punch-seccion-chip-nombre">{s.nombre}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="punch-markers-row">
              <button
                className={`punch-marker-btn ${punchInTickLocal !== null ? 'activo-in' : ''}`}
                onClick={() => setPunchInTickLocal(Math.round(tickLocalRefCurrent()))}
                title="Marca la posición actual como inicio de grabación"
              >
                <span className="punch-marker-label"><MapPin size={11} /> IN</span>
                <span className="punch-marker-time">
                  {punchInTickLocal !== null ? formatearTiempoDesdeTicks(punchInTickLocal, bpmModal) : '—'}
                </span>
                {punchInTickLocal !== null && (
                  <span className="punch-marker-clear" onClick={e => { e.stopPropagation(); setPunchInTickLocal(null); }}>✕</span>
                )}
              </button>

              <button
                className={`punch-marker-btn ${punchOutTickLocal !== null ? 'activo-out' : ''}`}
                onClick={() => setPunchOutTickLocal(Math.round(tickLocalRefCurrent()))}
                title="Marca la posición actual como fin de grabación (opcional — detiene auto)"
              >
                <span className="punch-marker-label"><MapPin size={11} /> OUT</span>
                <span className="punch-marker-time">
                  {punchOutTickLocal !== null ? formatearTiempoDesdeTicks(punchOutTickLocal, bpmModal) : '—'}
                </span>
                {punchOutTickLocal !== null && (
                  <span className="punch-marker-clear" onClick={e => { e.stopPropagation(); setPunchOutTickLocal(null); }}>✕</span>
                )}
              </button>
            </div>

            <div className="punch-metropoli">
              <div className="punch-metropoli-head">
                <span>Pre-roll</span>
                <span>{preRollSegsLocal}s</span>
              </div>
              <input
                type="range" min={1} max={8} step={1}
                value={preRollSegsLocal}
                onChange={e => { const v = Number(e.target.value); setPreRollSegsLocal(v); setPreRollSegundos(v); }}
                className="tecnica-slider"
              />
            </div>

            {punchInTickLocal !== null && (
              <div style={{ marginBottom: '4px' }}>
                <button
                  className="btn-punch-config"
                  style={{ width: '100%', background: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6' }}
                  onClick={() => handleSeek(Math.max(0, punchInTickLocal - Math.round(preRollSegsLocal * (bpmModal / 60) * resolucion)))}
                  title="Ir al inicio del pre-roll para escuchar el contexto"
                >
                  <Play size={14} fill="currentColor" /> Previsualizar contexto
                </button>
              </div>
            )}

            <button
              className="btn-iniciar-edicion-pro"
              onClick={iniciarEdicionPunch}
              disabled={punchInTickLocal === null}
            >
              <Play size={18} fill="currentColor" /> Iniciar Grabación
            </button>

            {mensajeLocal && (
              <div className="formulario-error-msj" style={{ margin: 0, padding: '10px' }}>
                {mensajeLocal}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  </section>
);

export default PanelPunchIn;
