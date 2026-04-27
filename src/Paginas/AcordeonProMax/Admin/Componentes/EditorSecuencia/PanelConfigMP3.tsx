import React from 'react';
import { Save, RefreshCw, Clock, Activity } from 'lucide-react';
import { fmtSeg } from './tiposEditor';

interface PanelConfigMP3Props {
  duracionGuardada: number;
  duracionAudio: number;
  duracionSegundosModal: number;
  setDuracionSegundosModal: (v: number) => void;
  duracionCambiada: boolean;
  guardandoDuracion: boolean;
  handleGuardarDuracion: () => void;
}

const PanelConfigMP3: React.FC<PanelConfigMP3Props> = ({
  duracionGuardada, duracionAudio, duracionSegundosModal, setDuracionSegundosModal,
  duracionCambiada, guardandoDuracion, handleGuardarDuracion,
}) => (
  <section className="editor-seccion seccion-tecnica-mp3">
    <div className="editor-seccion-titulo">
      <Activity size={16} /> Configuración Técnica MP3
    </div>

    <div className="tecnica-tarjeta">
      <div className="tecnica-info-superior">
        <div className="tecnica-info-col">
          <span className="tecnica-etiqueta-mini">Duración Actual (Base Datos)</span>
          <span className="tecnica-valor-db">{fmtSeg(duracionGuardada)}</span>
        </div>
        <div className="tecnica-info-col">
          <span className="tecnica-etiqueta-mini">Longitud Real Archivo MP3</span>
          <span className="tecnica-valor-real">
            {duracionAudio > 0 ? fmtSeg(duracionAudio) : 'Cargando...'}
          </span>
        </div>
      </div>

      <div className="tecnica-ajuste-contenedor">
        <div className="tecnica-ajuste-cabecera">
          <Clock size={18} className="icon-main" />
          <div className="tecnica-ajuste-texto">
            <span className="tecnica-ajuste-nombre">Duración Programada</span>
            <p className="tecnica-ajuste-ayuda">
              Define cuánto tiempo se reproducirá el audio en el simulador.
            </p>
          </div>
          {duracionCambiada && (
            <span className="tecnica-badge-alerta pulso">⚠ Cambios Pendientes</span>
          )}
        </div>

        <div className="tecnica-valor-central">
          {fmtSeg(duracionSegundosModal, true)}
          <span className="unidad-segundos">seg</span>
        </div>

        <input
          type="range"
          min={1} max={duracionAudio > 0 ? duracionAudio : 600} step={0.1}
          value={duracionSegundosModal}
          onChange={e => setDuracionSegundosModal(Number(e.target.value))}
          className="tecnica-slider"
        />

        <div className="tecnica-acciones-finales">
          <button
            onClick={() => setDuracionSegundosModal(duracionAudio)}
            disabled={!duracionAudio || Math.abs(duracionSegundosModal - duracionAudio) < 0.2}
            className="tecnica-boton-sincronizar"
            title="Ajustar exactamente a la duración completa del archivo MP3"
          >
            <RefreshCw size={14} /> Usar MP3 Completo
          </button>
          <button
            onClick={handleGuardarDuracion}
            disabled={!duracionCambiada || guardandoDuracion}
            className={`tecnica-boton-guardar ${duracionCambiada ? 'activo' : ''}`}
          >
            {guardandoDuracion
              ? <><RefreshCw size={14} className="spin" /> Guardando...</>
              : <><Save size={14} /> Guardar Duración</>}
          </button>
        </div>
      </div>
    </div>
  </section>
);

export default PanelConfigMP3;
