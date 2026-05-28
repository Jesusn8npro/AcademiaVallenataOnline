'use client';

import * as React from 'react';
import { Upload, Music, Trash2, Play, Crown, Loader2, Key } from 'lucide-react';
import { useUsuario } from '../../../../contextos/UsuarioContext';
import {
  listarPistasUsuario, crearPistaUsuario, eliminarPistaUsuario,
  subirArchivoPistaUsuario, type PistaUsuario,
} from '../Servicios/servicioPistasUsuario';
import { comprimirAMp3 } from '../Utilidades/compresorMP3';
import { detectarTono } from '../Utilidades/detectorTono';
import { obtenerLimitePistas, LIMITE_PISTAS_FREE } from '../../../../config/limitesPlan';
import ReproductorPistaUsuario from './ReproductorPistaUsuario';

type EstadoSubida =
  | { fase: 'idle' }
  | { fase: 'comprimiendo'; pct: number }
  | { fase: 'detectando_tono'; pct: number }
  | { fase: 'subiendo' }
  | { fase: 'guardando' }
  | { fase: 'error'; mensaje: string };

const MAX_BYTES_ENTRADA = 50 * 1024 * 1024; // 50 MB pre-compresión

interface MisPistasUsuarioProps {
  /** Callback que avisa al padre cuando hay una pista activa en el reproductor
   *  (para que pueda ocultar tabs/cabecera y dejar el reproductor full panel). */
  onReproductorActivo?: (activo: boolean) => void;
}

const MisPistasUsuario: React.FC<MisPistasUsuarioProps> = ({ onReproductorActivo }) => {
  const { usuario } = useUsuario();
  const [pistas, setPistas] = React.useState<PistaUsuario[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [limite, setLimite] = React.useState<number>(LIMITE_PISTAS_FREE);
  const [esPremium, setEsPremium] = React.useState(false);
  const [estadoSubida, setEstadoSubida] = React.useState<EstadoSubida>({ fase: 'idle' });
  const [reproduciendo, setReproduciendo] = React.useState<PistaUsuario | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // ─────────────── Cargar pistas + límite ───────────────
  const refrescar = React.useCallback(async () => {
    if (!usuario?.id) return;
    setCargando(true);
    try {
      const [lista, info] = await Promise.all([
        listarPistasUsuario(),
        obtenerLimitePistas(usuario.id),
      ]);
      setPistas(lista);
      setLimite(info.limite);
      setEsPremium(info.esPremium);
    } catch (e) {
      console.error('[MisPistasUsuario] error cargando', e);
    } finally {
      setCargando(false);
    }
  }, [usuario?.id]);

  React.useEffect(() => { void refrescar(); }, [refrescar]);

  // Avisa al padre cuando el reproductor se abre/cierra (para que oculte tabs/cabecera).
  React.useEffect(() => {
    onReproductorActivo?.(reproduciendo !== null);
  }, [reproduciendo, onReproductorActivo]);

  const enLimite = pistas.length >= limite;
  const subiendo = estadoSubida.fase !== 'idle' && estadoSubida.fase !== 'error';

  // ─────────────── Subir ───────────────
  const elegirArchivo = () => {
    if (enLimite || subiendo) return;
    inputRef.current?.click();
  };

  const onArchivoSeleccionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo || !usuario?.id) return;

    if (archivo.size > MAX_BYTES_ENTRADA) {
      setEstadoSubida({ fase: 'error', mensaje: `El archivo pesa ${(archivo.size / 1024 / 1024).toFixed(1)} MB. Máx 50 MB.` });
      return;
    }

    try {
      setEstadoSubida({ fase: 'comprimiendo', pct: 0 });
      const comprimido = await comprimirAMp3(archivo, {
        onProgreso: (pct) => setEstadoSubida({ fase: 'comprimiendo', pct }),
      });

      // Detector de tono: analizamos el audioBuffer ya decodificado (no se decodifica 2 veces).
      // Si falla, seguimos sin tonalidad — no bloqueamos el upload.
      setEstadoSubida({ fase: 'detectando_tono', pct: 0 });
      let tonalidad: string | undefined;
      let confianza: number | undefined;
      try {
        const tono = await detectarTono(comprimido.audioBuffer, {
          onProgreso: (pct) => setEstadoSubida({ fase: 'detectando_tono', pct }),
        });
        tonalidad = tono.etiqueta;
        confianza = tono.confianza;
      } catch (_) { /* no bloqueante */ }

      setEstadoSubida({ fase: 'subiendo' });
      const storagePath = await subirArchivoPistaUsuario(usuario.id, comprimido.blob, archivo.name);

      setEstadoSubida({ fase: 'guardando' });
      const titulo = archivo.name.replace(/\.[^.]+$/, '');
      await crearPistaUsuario({
        titulo,
        storage_path: storagePath,
        duracion_seg: comprimido.duracionSeg,
        tamano_bytes: comprimido.tamanoBytes,
        config: tonalidad ? { tonalidad, tonalidadConfianza: confianza } : undefined,
      });

      setEstadoSubida({ fase: 'idle' });
      await refrescar();
    } catch (e: any) {
      setEstadoSubida({ fase: 'error', mensaje: e?.message || 'Error al subir.' });
    }
  };

  const eliminar = async (pista: PistaUsuario) => {
    if (!confirm(`¿Eliminar "${pista.titulo}"? Esta acción no se puede deshacer.`)) return;
    try {
      await eliminarPistaUsuario(pista);
      if (reproduciendo?.id === pista.id) setReproduciendo(null);
      await refrescar();
    } catch (e: any) {
      alert(`No se pudo eliminar: ${e?.message || 'error'}`);
    }
  };

  // ─────────────── UI ───────────────
  if (!usuario) {
    return <div style={{ fontSize: 12, color: '#94a3b8', padding: 10 }}>Iniciá sesión para subir tus pistas.</div>;
  }

  // Cuando hay una pista en reproducción, reemplaza el listado por el reproductor inline.
  // key={reproduciendo.id} fuerza re-montar el componente al cambiar de pista → estado limpio
  // (secciones de la pista nueva, sin contaminación de la anterior).
  if (reproduciendo) {
    return (
      <ReproductorPistaUsuario
        key={reproduciendo.id}
        pista={reproduciendo}
        onVolver={() => setReproduciendo(null)}
        onCambios={(cambios) => {
          setPistas((prev) => prev.map((p) => (p.id === reproduciendo.id ? { ...p, ...cambios } : p)));
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header con contador */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
          Mis pistas <span style={{ color: enLimite ? '#ef4444' : '#22c55e' }}>{pistas.length}/{isFinite(limite) ? limite : '∞'}</span>
        </div>
        {esPremium && (
          <span style={{ fontSize: 10, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
            <Crown size={11} /> Premium
          </span>
        )}
      </div>

      {/* Botón subir */}
      <input
        ref={inputRef}
        type="file"
        accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/x-wav,audio/x-m4a,audio/mp4"
        onChange={onArchivoSeleccionado}
        style={{ display: 'none' }}
      />
      <button
        onClick={elegirArchivo}
        disabled={enLimite || subiendo}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 8, border: 'none',
          background: enLimite ? 'rgba(239, 68, 68, 0.15)' : subiendo ? 'rgba(59, 130, 246, 0.15)' : '#3b82f6',
          color: enLimite ? '#fca5a5' : 'white',
          fontSize: 13, fontWeight: 600,
          cursor: enLimite || subiendo ? 'not-allowed' : 'pointer',
        }}
      >
        {subiendo ? <Loader2 size={14} className="anim-spin" /> : <Upload size={14} />}
        {estadoSubida.fase === 'comprimiendo' ? `Subiendo… ${estadoSubida.pct}%`
          : estadoSubida.fase === 'detectando_tono' ? `Detectando tonalidad… ${estadoSubida.pct}%`
          : estadoSubida.fase === 'subiendo' ? 'Subiendo a la nube…'
          : estadoSubida.fase === 'guardando' ? 'Guardando…'
          : enLimite ? 'Llegaste al límite de tu plan'
          : 'Subir canción (MP3/WAV)'}
      </button>

      {estadoSubida.fase === 'error' && (
        <div style={{ fontSize: 12, color: '#fca5a5', padding: '6px 10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 6 }}>
          ⚠ {estadoSubida.mensaje}
          <button onClick={() => setEstadoSubida({ fase: 'idle' })} style={{ marginLeft: 8, background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', textDecoration: 'underline', fontSize: 11 }}>Cerrar</button>
        </div>
      )}

      {enLimite && !esPremium && (
        <div style={{ fontSize: 12, color: '#fbbf24', padding: '8px 10px', background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Crown size={14} />
          <div>
            <strong>Plan gratis</strong> permite {LIMITE_PISTAS_FREE} canciones. Pasate a Premium para subir más, secciones ilimitadas y guardar tus configuraciones.
          </div>
        </div>
      )}

      {/* Lista */}
      {cargando ? (
        <div style={{ fontSize: 12, color: '#94a3b8', padding: 10, textAlign: 'center' }}>Cargando tus pistas…</div>
      ) : pistas.length === 0 ? (
        <div style={{ fontSize: 12, color: '#64748b', padding: 14, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.1)' }}>
          Todavía no subiste ninguna pista.
          <br /><span style={{ fontSize: 11, opacity: 0.7 }}>Sube un MP3 para bajarle la velocidad, cambiarle el tono y crear secciones para practicar en loop.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 360, overflowY: 'auto' }}>
          {pistas.map((p) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
              background: reproduciendo?.id === p.id ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255,255,255,0.04)',
              border: reproduciendo?.id === p.id ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
            }}>
              <Music size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {p.titulo}
                  {p.config?.tonalidad && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      background: (p.config.tonalidadConfianza ?? 0) >= 0.5 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(251, 191, 36, 0.15)',
                      color: (p.config.tonalidadConfianza ?? 0) >= 0.5 ? '#22c55e' : '#fbbf24',
                      flexShrink: 0,
                    }} title={`Tonalidad detectada (confianza ${Math.round((p.config.tonalidadConfianza ?? 0) * 100)}%)`}>
                      <Key size={9} /> {p.config.tonalidad}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: '#64748b', display: 'flex', gap: 8 }}>
                  {p.duracion_seg ? `${Math.floor(p.duracion_seg / 60)}:${String(Math.floor(p.duracion_seg % 60)).padStart(2, '0')}` : ''}
                  {p.tamano_bytes ? ` · ${(p.tamano_bytes / 1024 / 1024).toFixed(1)} MB` : ''}
                  {p.secciones?.length ? ` · ${p.secciones.length} sec.` : ''}
                </div>
              </div>
              <button onClick={() => setReproduciendo(p)} title="Reproducir"
                style={{ background: '#22c55e', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}>
                <Play size={12} fill="white" />
              </button>
              <button onClick={() => eliminar(p)} title="Eliminar"
                style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: '#fca5a5', display: 'flex', alignItems: 'center' }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .anim-spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default MisPistasUsuario;
