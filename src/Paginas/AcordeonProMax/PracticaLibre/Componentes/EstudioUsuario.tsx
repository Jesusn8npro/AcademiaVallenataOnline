'use client';

import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import EditorCancion from '../../GrabadorV2/componentes/EditorCancion';
import ListaCancionesV2 from '../../GrabadorV2/componentes/ListaCancionesV2';
import '../../GrabadorV2/PaginaGrabadorV2.css';
import { useEstudioGrabador } from '../Hooks/useEstudioGrabador';
import { LIMITE_GRABACIONES_FREE } from '../../../../config/limitesPlan';

interface Props {
  /** Lógica del acordeón COMPARTIDA de práctica libre (una sola instancia → sin conflictos). */
  logica: any;
  onCerrar?: () => void;
  /** Avisa al panel cuando entramos/salimos del editor (para ocultar los chips de modo arriba). */
  onEditorActivo?: (activo: boolean) => void;
}

/**
 * Grabador de pistas del alumno (vista). Toda la lógica vive en `useEstudioGrabador`.
 * Reusa el editor/lista del grabador admin (GrabadorV2) con la lógica compartida de práctica libre.
 */
const EstudioUsuario: React.FC<Props> = ({ logica, onEditorActivo }) => {
  const e = useEstudioGrabador(logica, onEditorActivo);

  return (
    <div className="estudio-practica-libre-seccion estudio-grabador-panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input ref={e.fileNuevaRef} type="file" accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/x-m4a,audio/mp4"
        onChange={e.onArchivoNueva} style={{ display: 'none' }} />

      {e.mensajeError && (
        <div className="grabv2-banner-error">
          <AlertCircle size={14} /> {e.mensajeError}
          <button onClick={() => e.setMensajeError(null)}>×</button>
        </div>
      )}
      {e.subiendo && (
        <div className="grabv2-banner-error" style={{ background: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6', color: '#bfdbfe' }}>
          {e.subiendo}
        </div>
      )}
      {e.renderizando && (
        <div style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid #a855f7', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#e9d5ff', fontWeight: 600 }}>
            <span>⏺ {e.renderizando}</span>
            <span>{e.progresoPct}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${e.progresoPct}%`, background: 'linear-gradient(90deg,#a855f7,#22d3ee)', transition: 'width 0.2s ease' }} />
          </div>
        </div>
      )}

      {e.vista === 'lista' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, padding: '0 2px' }}>
            <span>Mis canciones <span style={{ color: e.enLimite ? '#ef4444' : '#22c55e' }}>{e.canciones.length}/{isFinite(e.limite) ? e.limite : '∞'}</span></span>
            {e.esPremium && <span style={{ color: '#fbbf24' }}>★ Premium</span>}
          </div>
          {e.enLimite && (
            <div className="grabv2-banner-error" style={{ background: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.4)', color: '#fbbf24' }}>
              Llegaste al límite de {LIMITE_GRABACIONES_FREE} grabaciones del plan gratis. Pasate a Premium para grabar sin límite.
            </div>
          )}
          <ListaCancionesV2
            canciones={e.canciones as any}
            cancionActivaId={e.cancionId}
            cargando={e.cargandoLista}
            onSeleccionar={(c: any) => void e.cargarEnEditor(c)}
            onNueva={e.pedirNueva}
            onRefrescar={e.refrescarLista}
            onEliminar={e.eliminarCancionDeLista}
            onEditar={(c: any) => void e.cargarEnEditor(c)}
            onDescargar={(c: any) => e.descargarPistaCompleta(c)}
          />
        </>
      )}

      {e.vista === 'editor' && (
        <EditorCancion
          titulo={e.titulo} setTitulo={e.setTitulo}
          autor={e.autor} setAutor={e.setAutor}
          bpm={e.bpm} setBpmState={e.setBpmState}
          velocidad={e.velocidad} setVelocidad={e.setVelocidad}
          audioUrl={e.audioUrl}
          usoMetronomo={e.usoMetronomo} setUsoMetronomo={e.setUsoMetronomo}
          metronomoExpandido={e.metronomoExpandido} setMetronomoExpandido={e.setMetronomoExpandido}
          metronomo={e.metronomo}
          fileInputRef={e.fileNuevaRef}
          onSubirMP3={e.pedirNueva}
          totalTicks={e.totalTicks}
          tickActual={e.tickActual}
          secuencia={e.secuencia}
          secciones={e.secciones}
          reproductor={e.reproductor}
          grabador={e.grabador}
          prerollSeg={e.prerollSeg} setPrerollSeg={e.setPrerollSeg}
          enPreroll={e.enPreroll}
          prerollRestanteSeg={e.prerollRestanteSeg}
          enGrabacionPunch={e.enGrabacionPunch}
          enGrabacionNueva={e.enGrabacionNueva}
          onSeekA={e.seekA}
          onTogglePlay={e.togglePlay}
          onDetenerTodo={e.detenerTodo}
          onCancelarPreroll={e.cancelarPreroll}
          onIniciarGrabacionNueva={e.iniciarGrabacionNueva}
          onDetenerGrabacion={e.detenerGrabacion}
          onAgregarSeccion={e.agregarSeccion}
          onActualizarSeccion={e.actualizarSeccion}
          onEliminarSeccion={e.eliminarSeccion}
          onGrabarSeccion={e.grabarSeccion}
          onVolverALista={e.volverALista}
          onGuardar={e.guardar}
          estadoGuardado={e.estadoGuardado}
          mostrarCaptura={false}
          mostrarMonedas={false}
          onDescargarSeccion={e.descargarSeccionAudio}
        />
      )}
    </div>
  );
};

export default EstudioUsuario;
