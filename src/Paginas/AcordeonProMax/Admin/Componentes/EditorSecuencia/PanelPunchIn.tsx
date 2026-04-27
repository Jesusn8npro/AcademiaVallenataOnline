import React from 'react';
import {
  Play, Pause, Save, Trash2, RefreshCw, Square,
  Activity, Clock, Ear, Volume2, MapPin, Scissors,
} from 'lucide-react';
import type { NotaHero } from '../../../TiposProMax';
import { formatearTiempoDesdeTicks } from './tiposEditor';
import type { ModoEdicion } from './tiposEditor';

interface PanelPunchInProps {
  modoEdicion: ModoEdicion;
  cuentaAtrasLocal: number | null;
  notasGrabadas: NotaHero[];
  punchInTickLocal: number | null;
  setPunchInTickLocal: (t: number | null) => void;
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
  metronomoLocal: boolean;
  setMetronomoLocal: (v: boolean) => void;
  setMetronomoActivo: (v: boolean) => void;
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
}

const PanelPunchIn: React.FC<PanelPunchInProps> = ({
  modoEdicion, cuentaAtrasLocal, notasGrabadas, punchInTickLocal, setPunchInTickLocal,
  punchInTickSnapshotCurrent, mensajeLocal, bpmModal, resolucion, secuenciaPreview,
  reproduciendoLocal, handleSeek, togglePlay, preRollSegsLocal, setPreRollSegsLocal,
  setPreRollSegundos, metronomoLocal, setMetronomoLocal, setMetronomoActivo,
  iniciarEdicionPunch, detenerEdicionPunch, guardarToma, guardandoToma,
  onRepetirToma, descartarToma, tickLocalRefCurrent,
  edicionAbierta, setEdicionAbierta, totalTicksModal,
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
                  ? <><RefreshCw size={16} className="spin" /> Guardando...</>
                  : <><Save size={16} /> Guardar Toma</>}
              </button>
              <button className="btn-iniciar-edicion-pro detener" onClick={onRepetirToma}>
                <RefreshCw size={16} /> Repetir toma
              </button>
              <button
                className="btn-iniciar-edicion-pro detener"
                onClick={descartarToma}
                style={{ flex: '0 0 auto', minWidth: 0 }}
                title="Descartar y volver sin guardar"
              >
                <Trash2 size={16} />
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
            <div className="edicion-controles-punch">
              <button
                className={`btn-punch-config ${punchInTickLocal !== null ? 'activo' : ''}`}
                onClick={() => setPunchInTickLocal(Math.round(tickLocalRefCurrent()))}
                title="Marca el instante actual del timeline como inicio de grabación"
              >
                <MapPin size={14} />
                <strong>Marcar Entrada (In)</strong>
                <span>
                  {punchInTickLocal !== null
                    ? formatearTiempoDesdeTicks(punchInTickLocal, bpmModal)
                    : 'Clic para marcar posición actual'}
                </span>
              </button>

              <button
                className={`btn-punch-config ${metronomoLocal ? 'activo' : ''}`}
                onClick={() => { const v = !metronomoLocal; setMetronomoLocal(v); setMetronomoActivo(v); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong>Metrónomo</strong>
                  {metronomoLocal ? <Volume2 size={14} /> : <Ear size={14} />}
                </div>
                <span>{metronomoLocal ? 'Activado' : 'Desactivado'}</span>
              </button>

              {punchInTickLocal !== null && (
                <button
                  className="btn-punch-config"
                  style={{ width: '44px', justifyContent: 'center' }}
                  onClick={() => setPunchInTickLocal(null)}
                  title="Limpiar marca"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="punch-metropoli">
              <div className="punch-metropoli-head">
                <span>Preparación (Pre-roll)</span>
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
                  <Play size={14} fill="currentColor" /> Previsualizar contexto (ir al pre-roll)
                </button>
              </div>
            )}

            <button
              className="btn-iniciar-edicion-pro"
              onClick={iniciarEdicionPunch}
              disabled={punchInTickLocal === null}
            >
              <Play size={18} fill="currentColor" /> Iniciar Edición Programada
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
