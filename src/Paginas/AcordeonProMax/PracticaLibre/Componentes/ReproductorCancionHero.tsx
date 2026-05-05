import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, Square, X, Layers } from 'lucide-react';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';
import { ReproductorMP3 } from '../../../../Core/audio/ReproductorMP3';

/**
 * Reproductor STANDALONE para canciones hero en Práctica Libre del estudiante.
 *
 * ESTADO: SINCRONÍA NOTAS↔MP3 NO RESUELTA. Las notas se disparan e iluminan correctamente,
 * pero hay desfase audible respecto al MP3 que ningún enfoque probó resolver en esta sesión:
 *   1. HTMLAudio + checkpoint vía listeners 'seeked'/'playing' → desfase variable.
 *   2. ReproductorMP3 (AudioBufferSourceNode) leyendo repro.currentTime → desfase constante.
 *   3. ReproductorMP3 + anchor sample-accurate vía programarReproduccion → mismo desfase.
 *   4. Compensación con outputLatency + baseLatency → mismo desfase.
 *
 * Hipótesis a investigar mañana:
 *   - El offset puede estar en cómo se GRABARON las notas (tick capturado contra audio.currentTime
 *     de HTMLAudio que ya incluía un offset implícito de output latency). Comparar timestamps
 *     de grabación vs reproducción en useGrabadorHero.
 *   - Verificar si Maestro/Competencia REALMENTE están sincronizados o si el oído del usuario
 *     tolera mejor un desfase pequeño en ese contexto (notas guía visual + audio fondo).
 *   - Probar una calibración manual: slider de offset que el usuario ajuste hasta sincronizar
 *     a su oído. Persistir el valor por canción/dispositivo.
 *
 * Esta versión usa ReproductorMP3 simple (sin anchor) — más limpia y predecible que la de
 * HTMLAudio. Mantiene la fix del useEffect cleanup con dep [] (RAF se canceleba al primer
 * setBotonesActivos por dep inestable).
 */

interface ReproductorCancionHeroProps {
  cancion: any;
  logica: any;
  seccionInicial?: any;
  onCerrar: () => void;
}

const formatearTiempoTicks = (ticks: number, bpm: number, resolucion = 192) => {
  const seg = (ticks / resolucion) * (60 / Math.max(1, bpm));
  if (!isFinite(seg) || seg < 0) return '0:00';
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const parsear = (raw: any): any[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; }
    catch { return []; }
  }
  return [];
};

const PALETA_SECCIONES = [
  { bg: 'rgba(34, 197, 94, 0.15)', borde: '#22c55e' },
  { bg: 'rgba(59, 130, 246, 0.15)', borde: '#3b82f6' },
  { bg: 'rgba(168, 85, 247, 0.15)', borde: '#a855f7' },
  { bg: 'rgba(245, 158, 11, 0.15)', borde: '#f59e0b' },
  { bg: 'rgba(236, 72, 153, 0.15)', borde: '#ec4899' },
];

const ReproductorCancionHero: React.FC<ReproductorCancionHeroProps> = ({ cancion, logica, seccionInicial, onCerrar }) => {
  const bpmOriginal = Number(cancion?.bpm) || 120;
  const resolucion = cancion?.resolucion || 192;
  const factor = (bpmOriginal / 60) * resolucion;
  const urlPista = cancion?.audio_fondo_url || null;

  const secuencia = useMemo(() => {
    const arr = parsear(cancion?.secuencia_json || cancion?.secuencia);
    return [...arr].sort((a: any, b: any) => (a.tick ?? 0) - (b.tick ?? 0));
  }, [cancion]);

  const totalTicks = useMemo(() => {
    if (secuencia.length === 0) return 0;
    let max = 0;
    for (const n of secuencia) {
      const fin = (n.tick || 0) + (n.duracion || 0);
      if (fin > max) max = fin;
    }
    return max;
  }, [secuencia]);

  const secciones = useMemo(() => parsear(cancion?.secciones), [cancion]);
  const totalTicksMostrar = Math.max(totalTicks, 1);

  const [tickActual, setTickActual] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [draggingSlider, setDraggingSlider] = useState(false);
  const draggingSliderRef = useRef(false);
  useEffect(() => { draggingSliderRef.current = draggingSlider; }, [draggingSlider]);

  const reproductorRef = useRef<ReproductorMP3 | null>(null);
  const animFrameRef = useRef(0);
  const notasActivasRef = useRef<Map<string, { endTick: number; instancias: any[]; botonId: string }>>(new Map());
  const secuenciaRef = useRef(secuencia);
  const ultimoTickDispRef = useRef(0);
  const logicaRef = useRef(logica);
  useEffect(() => { secuenciaRef.current = secuencia; }, [secuencia]);
  useEffect(() => { logicaRef.current = logica; }, [logica]);

  const detenerNotasActivas = useCallback(() => {
    notasActivasRef.current.forEach((info) => {
      info.instancias.forEach((inst: any) => {
        try { motorAudioPro.detener(inst, 0.05); } catch (_) {}
      });
      try { logicaRef.current.actualizarBotonActivo(info.botonId, 'remove', null, true); } catch (_) {}
    });
    notasActivasRef.current.clear();
  }, []);

  const loop = useCallback(() => {
    const repro = reproductorRef.current;
    if (!repro || repro.paused) {
      animFrameRef.current = requestAnimationFrame(loop);
      return;
    }

    const nuevoTick = repro.currentTime * factor;
    const tickAnterior = ultimoTickDispRef.current;
    const seq = secuenciaRef.current;
    const lg = logicaRef.current;

    for (const nota of seq) {
      if (nota.tick < tickAnterior) continue;
      if (nota.tick >= nuevoTick) break;
      const llave = `${nota.tick}_${nota.botonId}`;
      if (notasActivasRef.current.has(llave)) continue;

      try {
        if (typeof lg.setDireccion === 'function') {
          const dir = (nota.fuelle === 'abriendo' || nota.fuelle === 'halar') ? 'halar' : 'empujar';
          lg.setDireccion(dir);
        }
        const result = lg.reproduceTono ? lg.reproduceTono(nota.botonId) : null;
        const instancias: any[] = result?.instances || [];
        try { lg.actualizarBotonActivo(nota.botonId, 'add', instancias, false); } catch (_) {}
        notasActivasRef.current.set(llave, {
          endTick: (nota.tick || 0) + (nota.duracion || 0),
          instancias,
          botonId: nota.botonId,
        });
      } catch (_) {}
    }

    notasActivasRef.current.forEach((info, llave) => {
      if (nuevoTick >= info.endTick) {
        info.instancias.forEach((inst: any) => {
          try { motorAudioPro.detener(inst, 0.05); } catch (_) {}
        });
        try { lg.actualizarBotonActivo(info.botonId, 'remove', null, false); } catch (_) {}
        notasActivasRef.current.delete(llave);
      }
    });

    ultimoTickDispRef.current = nuevoTick;
    if (!draggingSliderRef.current) setTickActual(Math.floor(nuevoTick));

    if (totalTicks > 0 && nuevoTick > totalTicks + resolucion) {
      detenerNotasActivas();
      try { repro.pause(); } catch (_) {}
      setReproduciendo(false);
      setPausado(false);
      animFrameRef.current = 0;
      return;
    }

    animFrameRef.current = requestAnimationFrame(loop);
  }, [factor, totalTicks, resolucion, detenerNotasActivas]);

  // Crear/cargar ReproductorMP3 al montar / cambiar URL.
  useEffect(() => {
    if (!urlPista) return;
    const repro = new ReproductorMP3(motorAudioPro.contextoAudio);
    repro.volume = 0.85;
    reproductorRef.current = repro;
    repro.cargar(urlPista).catch(() => {});
    return () => {
      try { repro.destruir(); } catch (_) {}
      if (reproductorRef.current === repro) reproductorRef.current = null;
    };
  }, [urlPista]);

  // CRÍTICO: dep [] — NO incluir detenerNotasActivas. Esa función depende de logicaRef pero su
  // identidad cambia cada vez que cambia botonesActivos (que muta cada vez que el RAF dispara una
  // nota vía actualizarBotonActivo). Si el cleanup se re-ejecutara con cada cambio de logica,
  // cancelaría el RAF justo después de la primera nota → solo suena una vez.
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
      notasActivasRef.current.forEach((info) => {
        info.instancias.forEach((inst: any) => {
          try { motorAudioPro.detener(inst, 0.05); } catch (_) {}
        });
      });
      notasActivasRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const arrancarPlay = useCallback(async (tickInicio: number) => {
    const repro = reproductorRef.current;
    if (!repro) return;

    detenerNotasActivas();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = 0;

    const tickInicioNorm = Math.max(0, Math.floor(tickInicio));
    const offsetSeg = tickInicioNorm / factor;

    try {
      const ctx = motorAudioPro.contextoAudio;
      if (ctx && ctx.state !== 'running') await ctx.resume();
    } catch (_) {}

    repro.currentTime = offsetSeg;
    if (repro.paused) {
      try { await repro.play(); } catch (_) { return; }
    }

    ultimoTickDispRef.current = repro.currentTime * factor;
    setTickActual(Math.floor(ultimoTickDispRef.current));
    setReproduciendo(true);
    setPausado(false);

    if (!animFrameRef.current) animFrameRef.current = requestAnimationFrame(loop);
  }, [factor, detenerNotasActivas, loop]);

  const togglePlay = useCallback(() => {
    const repro = reproductorRef.current;
    if (!repro) return;
    if (!reproduciendo) {
      void arrancarPlay(ultimoTickDispRef.current);
      return;
    }
    if (repro.paused) {
      repro.play().then(() => {
        ultimoTickDispRef.current = repro.currentTime * factor;
      }).catch(() => {});
      setPausado(false);
      if (!animFrameRef.current) animFrameRef.current = requestAnimationFrame(loop);
    } else {
      try { repro.pause(); } catch (_) {}
      detenerNotasActivas();
      setPausado(true);
    }
  }, [reproduciendo, arrancarPlay, loop, detenerNotasActivas, factor]);

  const detener = useCallback(() => {
    const repro = reproductorRef.current;
    if (repro) {
      try { repro.pause(); repro.currentTime = 0; } catch (_) {}
    }
    detenerNotasActivas();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = 0;
    ultimoTickDispRef.current = 0;
    setTickActual(0);
    setReproduciendo(false);
    setPausado(false);
  }, [detenerNotasActivas]);

  const handleSeek = useCallback((tick: number) => {
    const repro = reproductorRef.current;
    setTickActual(tick);
    detenerNotasActivas();
    ultimoTickDispRef.current = tick;
    if (!repro) return;
    repro.currentTime = tick / factor;
    ultimoTickDispRef.current = repro.currentTime * factor;
  }, [factor, detenerNotasActivas]);

  const handleSeleccionarSeccion = useCallback((seccion: any) => {
    const inicio = seccion.tickInicio ?? seccion.inicio ?? 0;
    if (reproduciendo) {
      handleSeek(inicio);
    } else {
      void arrancarPlay(inicio);
    }
  }, [reproduciendo, handleSeek, arrancarPlay]);

  const autoPlayRef = useRef<string | null>(null);
  useEffect(() => {
    if (!urlPista) return;
    const key = `${cancion?.id ?? ''}::${seccionInicial?.id ?? seccionInicial?.tickInicio ?? 'inicio'}`;
    if (autoPlayRef.current === key) return;
    autoPlayRef.current = key;
    const tickInicio = seccionInicial ? (seccionInicial.tickInicio ?? seccionInicial.inicio ?? 0) : 0;
    const timer = window.setTimeout(() => void arrancarPlay(tickInicio), 300);
    return () => window.clearTimeout(timer);
  }, [cancion?.id, seccionInicial, urlPista, arrancarPlay]);

  const seccionActivaIdx = useMemo(() => {
    return secciones.findIndex((s: any) => {
      const ini = s.tickInicio ?? s.inicio ?? 0;
      const fin = s.tickFin ?? s.fin ?? 0;
      return tickActual >= ini && tickActual < fin;
    });
  }, [secciones, tickActual]);

  const estaSonando = reproduciendo && !pausado;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(900px, 95vw)',
        background: 'rgba(15, 23, 42, 0.97)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(59, 130, 246, 0.4)',
        borderRadius: '16px',
        padding: '14px 18px',
        zIndex: 1000,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700 }}>
            Reproduciendo Hero
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {cancion?.titulo}
          </div>
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'right' }}>
          <div>{bpmOriginal} BPM</div>
          {seccionActivaIdx >= 0 && secciones[seccionActivaIdx] && (
            <div style={{ color: PALETA_SECCIONES[seccionActivaIdx % PALETA_SECCIONES.length].borde, fontWeight: 600 }}>
              ▶ {secciones[seccionActivaIdx].nombre || `Sección ${seccionActivaIdx + 1}`}
            </div>
          )}
        </div>
        <button
          onClick={() => { detener(); onCerrar(); }}
          style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#cbd5e1', display: 'flex', alignItems: 'center' }}
          title="Cerrar reproductor"
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ position: 'relative', height: '36px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '20px', pointerEvents: 'none' }}>
          {secciones.map((s: any, i: number) => {
            const inicio = s.tickInicio ?? s.inicio ?? 0;
            const fin = s.tickFin ?? s.fin ?? 0;
            const left = (inicio / totalTicksMostrar) * 100;
            const width = ((fin - inicio) / totalTicksMostrar) * 100;
            const color = PALETA_SECCIONES[i % PALETA_SECCIONES.length];
            return (
              <div
                key={s.id ?? i}
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  width: `${Math.max(width, 0.3)}%`,
                  top: 0,
                  bottom: 0,
                  background: color.bg,
                  borderLeft: `2px solid ${color.borde}`,
                  borderRadius: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '4px',
                  fontSize: '9px',
                  color: color.borde,
                  fontWeight: 700,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
                title={s.nombre}
              >
                {width > 6 && s.nombre}
              </div>
            );
          })}
        </div>
        <div
          style={{
            position: 'absolute',
            left: `${(tickActual / totalTicksMostrar) * 100}%`,
            top: 0,
            height: '20px',
            width: '2px',
            background: '#22c55e',
            boxShadow: '0 0 8px rgba(34, 197, 94, 0.8)',
            pointerEvents: 'none',
            transform: 'translateX(-1px)',
          }}
        />
        <input
          type="range"
          min={0}
          max={totalTicksMostrar}
          value={tickActual}
          step={1}
          onPointerDown={() => setDraggingSlider(true)}
          onPointerUp={() => setDraggingSlider(false)}
          onPointerCancel={() => setDraggingSlider(false)}
          onChange={(e) => handleSeek(Number(e.target.value))}
          style={{ position: 'absolute', top: '20px', left: 0, right: 0, width: '100%', height: '16px', cursor: 'pointer', opacity: 0.7 }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={togglePlay}
            style={{
              background: estaSonando ? '#ef4444' : '#22c55e',
              border: 'none', borderRadius: '50%', width: '40px', height: '40px',
              cursor: 'pointer', color: 'white', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
            title={estaSonando ? 'Pausar' : 'Reproducir'}
          >
            {estaSonando ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" style={{ marginLeft: 2 }} />}
          </button>
          <button
            onClick={detener}
            style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%',
              width: '32px', height: '32px', cursor: 'pointer', color: '#cbd5e1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Detener"
          >
            <Square size={12} fill="currentColor" />
          </button>
        </div>

        <div style={{ fontSize: '12px', color: '#cbd5e1', fontFamily: 'monospace', fontWeight: 600 }}>
          {formatearTiempoTicks(tickActual, bpmOriginal, resolucion)} / {formatearTiempoTicks(totalTicksMostrar, bpmOriginal, resolucion)}
        </div>

        {secciones.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Layers size={10} /> Secciones:
            </span>
            {secciones.map((s: any, i: number) => {
              const color = PALETA_SECCIONES[i % PALETA_SECCIONES.length];
              const activa = i === seccionActivaIdx;
              return (
                <button
                  key={s.id ?? i}
                  onClick={() => handleSeleccionarSeccion(s)}
                  style={{
                    background: activa ? color.borde : color.bg,
                    border: `1px solid ${color.borde}`,
                    color: activa ? 'white' : color.borde,
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  title={`Saltar a ${s.nombre || `Sección ${i + 1}`}`}
                >
                  {s.nombre || `Sec ${i + 1}`}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReproductorCancionHero;
