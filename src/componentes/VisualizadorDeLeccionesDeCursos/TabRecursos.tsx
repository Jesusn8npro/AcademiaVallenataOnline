'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { sanitizarHTML } from '../../utilidades/sanitizar';
import './TabRecursos.css';

interface Recursos {
  audio_url?: string;
  youtube_url?: string;
  texto?: string;
  imagenes?: string[];
  tono_defecto?: number;
  tono_nota?: string; // ej: "para acordeón en Mi ♭"
}

interface TabRecursosProps {
  recursos: Recursos;
}

const VELOCIDADES_AUDIO = [0.5, 0.75, 1, 1.25, 1.5];
const VELOCIDADES_YT    = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
const TONOS = [-3, -2, -1, 0, 1, 2, 3];

function esYouTube(url?: string): boolean {
  if (!url) return false;
  return /youtube\.com\/watch|youtu\.be\//.test(url);
}

function extraerVideoId(url: string): string | null {
  const m = url.match(/[?&]v=([^&]+)/) ?? url.match(/youtu\.be\/([^?&]+)/);
  return m ? m[1] : null;
}

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENTE: reproductor YouTube con YT.Player API
   ───────────────────────────────────────────────────────────── */
function ReproductorYouTube({ url }: { url: string }) {
  const mountRef    = useRef<HTMLDivElement>(null);
  const playerRef   = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [vel, setVel]              = useState(1);
  const [reproduciendo, setRep]    = useState(false);
  const [progreso, setProgreso]    = useState(0);
  const [duracion, setDuracion]    = useState(0);
  const [mostrarVideo, setMostrar] = useState(true);

  const videoId = extraerVideoId(url);

  useEffect(() => {
    if (!videoId || !mountRef.current) return;

    let ytInstance: any = null; // para cleanup aunque onReady no haya disparado

    function crearPlayer() {
      if (!mountRef.current) return;
      ytInstance = new (window as any).YT.Player(mountRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { rel: 0, modestbranding: 1, color: 'white' },
        events: {
          onReady: (e: any) => {
            // Solo aquí playVideo/pauseVideo están disponibles
            playerRef.current = e.target;
            const dur = e.target.getDuration?.() ?? 0;
            if (dur > 0) setDuracion(dur);
          },
          onStateChange: (e: any) => setRep(e.data === 1),
        },
      });
    }

    if ((window as any).YT?.Player) {
      crearPlayer();
    } else {
      if (!document.getElementById('yt-api-script')) {
        const s = document.createElement('script');
        s.id  = 'yt-api-script';
        s.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
      }
      const prev = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (typeof prev === 'function') prev();
        crearPlayer();
      };
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      playerRef.current = null;
      try { ytInstance?.destroy(); } catch { /* ignorar */ }
    };
  }, [videoId]);

  /* Polling de posición mientras reproduce */
  useEffect(() => {
    if (reproduciendo) {
      intervalRef.current = setInterval(() => {
        const p = playerRef.current;
        if (!p) return;
        const cur = p.getCurrentTime?.() ?? 0;
        const dur = p.getDuration?.()    ?? 0;
        if (dur > 0) {
          setProgreso(cur / dur);
          setDuracion(d => d !== dur ? dur : d);
        }
      }, 250);
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [reproduciendo]);

  if (!videoId) return <div className="tr-error">URL de YouTube inválida</div>;

  function togglePlay() {
    if (!playerRef.current) return;
    if (reproduciendo) playerRef.current.pauseVideo();
    else               playerRef.current.playVideo();
  }

  function cambiarVel(v: number) {
    setVel(v);
    playerRef.current?.setPlaybackRate(v);
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    if (!playerRef.current || !duracion) return;
    const r     = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    playerRef.current.seekTo(ratio * duracion, true);
    setProgreso(ratio);
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  }

  return (
    <div className="tr-yt-player">
      {/* Contenedor donde YT.Player inyecta el iframe */}
      <div className={`tr-yt-embed-wrap${mostrarVideo ? '' : ' tr-yt-embed-hidden'}`}>
        <div ref={mountRef} className="tr-yt-inner" />
      </div>

      {/* Seekbar propia — solo cuando el video está oculto */}
      {!mostrarVideo && duracion > 0 && (
        <div className="tr-seekbar-wrap" onClick={seek}>
          <div className="tr-seekbar-track">
            <div className="tr-seekbar-fill" style={{ width: `${progreso * 100}%` }} />
            <div className="tr-seekbar-thumb" style={{ left: `${progreso * 100}%` }} />
          </div>
          <div className="tr-tiempos">
            <span>{fmt(progreso * duracion)}</span>
            <span>{fmt(duracion)}</span>
          </div>
        </div>
      )}

      {/* Fila de controles */}
      <div className="tr-fila-play">
        {/* Play/Pause — solo en modo audio (video oculto) */}
        {!mostrarVideo && (
          <button className={`tr-btn-play ${reproduciendo ? 'activo' : ''}`}
            type="button" onClick={togglePlay}
            aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}>
            {reproduciendo
              ? <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              : <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            }
          </button>
        )}

        <div className="tr-grupo">
          <div className="tr-grupo-top">
            <span className="tr-grupo-label">Velocidad</span>
            <span className="tr-valor-badge">{vel.toFixed(2)}×</span>
          </div>
          <input type="range" className="tr-slider"
            min={0.25} max={2} step={0.05} value={vel}
            style={{ '--fill': `${((vel - 0.25) / 1.75) * 100}%` } as React.CSSProperties}
            onChange={e => cambiarVel(parseFloat(e.target.value))} />
          <div className="tr-chips">
            {VELOCIDADES_YT.map(v => (
              <button key={v} type="button"
                className={`tr-chip ${vel === v ? 'activo' : ''}`}
                onClick={() => cambiarVel(v)}>{v}x</button>
            ))}
          </div>
        </div>

        <button type="button"
          className={`tr-chip tr-chip-toggle-video ${!mostrarVideo ? 'activo' : ''}`}
          onClick={() => setMostrar(m => !m)}>
          {mostrarVideo ? '🎵 Solo audio' : '📺 Ver video'}
        </button>
      </div>

      <p className="tr-yt-nota">
        Tono y Loop A-B solo disponibles con archivo de audio subido.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENTE: reproductor Web Audio (velocidad + tono + loop)
   ───────────────────────────────────────────────────────────── */
function ReproductorAudio({ url, tonoDefecto = 0, tonoNota }: { url: string; tonoDefecto?: number; tonoNota?: string }) {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [reproduciendo, setReproduciendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [vel, setVel] = useState(1);
  const [tono, setTono] = useState(tonoDefecto);
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [loopOn, setLoopOn] = useState(false);

  const ctxRef    = useRef<AudioContext | null>(null);
  const srcRef    = useRef<AudioBufferSourceNode | null>(null);
  const playRef   = useRef(false);
  const offRef    = useRef(0);
  const t0Ref     = useRef(0);
  const velRef    = useRef(1);
  const tonoRef   = useRef(tonoDefecto);   // evita stale closure con el tono actual
  const rafRef    = useRef(0);
  // Refs para loop — evitan stale closure en RAF y posicion()
  const loopARef  = useRef<number | null>(null);
  const loopBRef  = useRef<number | null>(null);
  const loopOnRef = useRef(false);

  // Sincronizar tono cuando llegan los datos del servidor (carga async)
  useEffect(() => {
    if (tonoDefecto !== 0) {
      tonoRef.current = tonoDefecto;
      setTono(tonoDefecto);
    }
  }, [tonoDefecto]);

  useEffect(() => {
    setCargando(true);
    setError('');
    setReproduciendo(false);
    setProgreso(0);
    playRef.current = false;
    offRef.current  = 0;
    setAudioBuffer(null);

    const ctrl = new AbortController();
    (async () => {
      try {
        const resp = await fetch(url, { signal: ctrl.signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const buf = await resp.arrayBuffer();
        if (ctrl.signal.aborted) return;
        if (!ctxRef.current || ctxRef.current.state === 'closed')
          ctxRef.current = new AudioContext();
        const decoded = await ctxRef.current.decodeAudioData(buf);
        setAudioBuffer(decoded);
      } catch (e: any) {
        if (e.name !== 'AbortError') setError('No se pudo cargar el audio.');
      } finally {
        setCargando(false);
      }
    })();
    return () => { ctrl.abort(); pararFuente(); cancelAnimationFrame(rafRef.current); };
  }, [url]);

  function pararFuente() {
    if (srcRef.current) {
      try { srcRef.current.stop(); } catch { /* ya parado */ }
      srcRef.current.disconnect();
      srcRef.current = null;
    }
  }

  function posicion(): number {
    if (!ctxRef.current || !playRef.current) return offRef.current;
    let p = offRef.current + (ctxRef.current.currentTime - t0Ref.current) * velRef.current;
    // Wrapear dentro del rango A-B cuando loop está activo
    if (loopOnRef.current && loopARef.current !== null && loopBRef.current !== null) {
      const a = loopARef.current, b = loopBRef.current;
      if (b > a && p >= a) p = a + ((p - a) % (b - a));
    }
    return p;
  }

  function raf(buf: AudioBuffer) {
    cancelAnimationFrame(rafRef.current);
    const tick = () => {
      setProgreso(Math.min(posicion() / buf.duration, 1));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  function iniciar(buf: AudioBuffer, off: number, v: number, ton: number, lA: number | null, lB: number | null, loop: boolean) {
    if (!ctxRef.current) return;
    pararFuente();
    const src = ctxRef.current.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = v;
    src.detune.value = ton * 100;
    if (loop && lA !== null && lB !== null && lB > lA) {
      src.loop = true; src.loopStart = lA; src.loopEnd = lB;
    }
    src.connect(ctxRef.current.destination);
    src.onended = () => {
      if (srcRef.current === src) {
        playRef.current = false;
        setReproduciendo(false);
        setProgreso(0);
        offRef.current = 0;
        cancelAnimationFrame(rafRef.current);
      }
    };
    let startPos = Math.max(0, Math.min(off, buf.duration - 0.01));
    // Si loop activo y el offset está fuera del rango, volver a A
    // (evita que el audio reproduzca hasta el final del buffer antes de loopear)
    if (loop && lA !== null && lB !== null && lB > lA && startPos >= lB) {
      startPos = lA;
    }
    src.start(0, startPos);
    srcRef.current  = src;
    offRef.current  = startPos;
    t0Ref.current   = ctxRef.current.currentTime;
    velRef.current  = v;
  }

  async function togglePlay() {
    if (!audioBuffer || !ctxRef.current) return;
    if (ctxRef.current.state === 'suspended') await ctxRef.current.resume();
    if (reproduciendo) {
      offRef.current  = posicion();
      playRef.current = false;
      pararFuente();
      cancelAnimationFrame(rafRef.current);
      setReproduciendo(false);
    } else {
      playRef.current = true;
      iniciar(audioBuffer, offRef.current, velRef.current, tonoRef.current, loopARef.current, loopBRef.current, loopOnRef.current);
      setReproduciendo(true);
      raf(audioBuffer);
    }
  }

  function cambiarVel(v: number) {
    setVel(v); velRef.current = v;
    if (srcRef.current) srcRef.current.playbackRate.value = v;
  }

  function cambiarTono(t: number) {
    tonoRef.current = t;
    setTono(t);
    if (srcRef.current) srcRef.current.detune.value = t * 100;
  }

  function marcarA() {
    const p = posicion();
    loopARef.current = p;
    setLoopA(p);
    if (loopBRef.current !== null && p >= loopBRef.current) {
      loopBRef.current = null;
      setLoopB(null);
    }
  }

  function marcarB() {
    const p = posicion();
    if (loopARef.current !== null && p > loopARef.current) {
      loopBRef.current = p;
      setLoopB(p);
    }
  }

  function toggleLoop() {
    const nuevo = !loopOnRef.current;
    loopOnRef.current = nuevo;
    setLoopOn(nuevo);
    if (reproduciendo && audioBuffer) {
      // Si activamos loop y estamos fuera del rango, volver a A
      let p = posicion();
      if (nuevo && loopARef.current !== null && loopBRef.current !== null && p >= loopBRef.current) {
        p = loopARef.current;
      }
      offRef.current = p;
      iniciar(audioBuffer, p, velRef.current, tonoRef.current, loopARef.current, loopBRef.current, nuevo);
      raf(audioBuffer);
    }
  }

  function limpiarLoop() {
    loopARef.current  = null;
    loopBRef.current  = null;
    loopOnRef.current = false;
    setLoopA(null); setLoopB(null); setLoopOn(false);
    if (srcRef.current) srcRef.current.loop = false;
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioBuffer) return;
    const r = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - r.left) / r.width;
    const p = ratio * audioBuffer.duration;
    offRef.current = p;
    if (reproduciendo) { iniciar(audioBuffer, p, velRef.current, tonoRef.current, loopARef.current, loopBRef.current, loopOnRef.current); raf(audioBuffer); }
    else setProgreso(ratio);
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  }

  const dur = audioBuffer?.duration ?? 0;
  const lAp = loopA !== null && dur ? (loopA / dur) * 100 : null;
  const lBp = loopB !== null && dur ? (loopB / dur) * 100 : null;

  if (cargando) return (
    <div className="tr-cargando"><span className="tr-spinner" /> Cargando audio…</div>
  );
  if (error) return <div className="tr-error">{error}</div>;
  if (!audioBuffer) return null;

  return (
    <div className="tr-audio-wrap">

      {/* ── Seekbar ─────────────────────────────────────────── */}
      <div className="tr-seekbar-wrap" onClick={seek}>
        <div className="tr-seekbar-track">
          {/* Fill: arranca desde loopA cuando loop está activo */}
          <div className="tr-seekbar-fill" style={
            loopOn && lAp !== null
              ? { left: `${lAp}%`, width: `${Math.max(0, progreso * 100 - lAp)}%` }
              : { width: `${progreso * 100}%` }
          } />
          {lAp !== null && lBp !== null && (
            <div className="tr-loop-region" style={{ left: `${lAp}%`, width: `${lBp - lAp}%` }} />
          )}
          {lAp !== null && <div className="tr-loop-pin tr-loop-pin--a" style={{ left: `${lAp}%` }} />}
          {lBp !== null && <div className="tr-loop-pin tr-loop-pin--b" style={{ left: `${lBp}%` }} />}
          <div className="tr-seekbar-thumb" style={{ left: `${progreso * 100}%` }} />
        </div>
        <div className="tr-tiempos">
          <span>{fmt(progreso * dur)}</span>
          {loopOn && loopA !== null && loopB !== null && (
            <span className="tr-loop-timer">⟳ {fmt(loopA)} → {fmt(loopB)}</span>
          )}
          <span>{fmt(dur)}</span>
        </div>
      </div>

      {/* ── Play + Velocidad ────────────────────────────────── */}
      <div className="tr-seccion">
        <div className="tr-fila-play">
          <button className={`tr-btn-play ${reproduciendo ? 'activo' : ''}`}
            onClick={togglePlay} type="button"
            aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}>
            {reproduciendo
              ? <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              : <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            }
          </button>
          <div className="tr-grupo">
            <div className="tr-grupo-top">
              <span className="tr-grupo-label">Velocidad</span>
              <span className="tr-valor-badge">{vel.toFixed(2)}×</span>
            </div>
            <input type="range" className="tr-slider"
              min={0.25} max={2} step={0.05} value={vel}
              style={{ '--fill': `${((vel - 0.25) / 1.75) * 100}%` } as React.CSSProperties}
              onChange={e => cambiarVel(parseFloat(e.target.value))} />
            <div className="tr-chips">
              {VELOCIDADES_AUDIO.map(v => (
                <button key={v} type="button"
                  className={`tr-chip ${vel === v ? 'activo' : ''}`}
                  onClick={() => cambiarVel(v)}>{v}x</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tono ────────────────────────────────────────────── */}
      <div className="tr-seccion">
        <div className="tr-grupo">
          {tonoDefecto !== 0 && (
            <div className="tr-tono-aviso">
              <span>🎵 El profesor configuró este audio {tonoDefecto > 0 ? `+${tonoDefecto}` : tonoDefecto} semitonos
                {tonoNota ? ` — ${tonoNota}` : ''}
              </span>
            </div>
          )}
          <div className="tr-grupo-top">
            <span className="tr-grupo-label">Tono</span>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <span className="tr-valor-badge">{tono > 0 ? `+${tono}` : tono} st</span>
              {tonoDefecto !== 0 && tono !== tonoDefecto && (
                <button type="button" className="tr-btn-reset-tono"
                  onClick={() => cambiarTono(tonoDefecto)}
                  title={`Volver al tono del profesor (${tonoDefecto > 0 ? '+' : ''}${tonoDefecto})`}>
                  ↩
                </button>
              )}
            </div>
          </div>
          <input type="range" className="tr-slider"
            min={-6} max={6} step={1} value={tono}
            style={{ '--fill': `${((tono + 6) / 12) * 100}%` } as React.CSSProperties}
            onChange={e => cambiarTono(parseInt(e.target.value))} />
          <div className="tr-chips">
            {[-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6].map(t => (
              <button key={t} type="button"
                className={`tr-chip ${tono === t ? 'activo' : ''} ${t === tonoDefecto && tonoDefecto !== 0 ? 'tr-chip-defecto' : ''}`}
                onClick={() => cambiarTono(t)}>{t > 0 ? `+${t}` : t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Loop A-B ────────────────────────────────────────── */}
      <div className="tr-seccion">
        <div className="tr-grupo">
          <div className="tr-grupo-top">
            <span className="tr-grupo-label">Loop A–B</span>
            {(loopA !== null || loopB !== null) && (
              <button type="button" className="tr-btn-clear" onClick={limpiarLoop}>
                Limpiar ✕
              </button>
            )}
          </div>
          <div className="tr-loop-instruccion">
            {loopA === null
              ? 'Reproduce y presiona A para marcar el inicio'
              : loopB === null
              ? 'Presiona B para marcar el fin del loop'
              : loopOn
              ? `Repitiendo ${fmt(loopA)} → ${fmt(loopB)}`
              : `Loop listo: ${fmt(loopA)} → ${fmt(loopB)}`
            }
          </div>
          <div className="tr-loop-fila">
            <button type="button"
              className={`tr-chip tr-chip-loop ${loopA !== null ? 'marcado' : ''}`}
              onClick={marcarA}>
              ● A {loopA !== null ? fmt(loopA) : '—'}
            </button>
            <button type="button"
              className={`tr-chip tr-chip-loop ${loopB !== null ? 'marcado' : ''}`}
              onClick={marcarB} disabled={loopA === null}>
              ● B {loopB !== null ? fmt(loopB) : '—'}
            </button>
            <button type="button"
              className={`tr-chip-loop-on ${loopOn ? 'activo' : ''}`}
              onClick={toggleLoop} disabled={loopA === null || loopB === null}>
              ⟳ {loopOn ? 'Activo' : 'Iniciar loop'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   COMPONENTE PRINCIPAL
   ───────────────────────────────────────────────────────────── */
const TabRecursos: React.FC<TabRecursosProps> = ({ recursos }) => {
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);

  const urlYT      = esYouTube(recursos.audio_url) ? recursos.audio_url
                   : (recursos.youtube_url && esYouTube(recursos.youtube_url) ? recursos.youtube_url : null);
  const urlAudio   = recursos.audio_url && !esYouTube(recursos.audio_url) ? recursos.audio_url : null;
  const textoSan   = recursos.texto ? sanitizarHTML(recursos.texto) : null;

  return (
    <div className="tab-recursos">

      {/* ── Reproductor YouTube ───────────────────────────────── */}
      {urlYT && (
        <div className="tr-player-card">
          <div className="tr-player-header">
            <span className="tr-player-label">Audio de referencia</span>
            <span className="tr-badge-yt">YouTube</span>
          </div>
          <ReproductorYouTube url={urlYT} />
        </div>
      )}

      {/* ── Reproductor de archivo de audio ──────────────────── */}
      {urlAudio && (
        <div className="tr-player-card">
          <div className="tr-player-header">
            <span className="tr-player-label">Audio de referencia</span>
          </div>
          <ReproductorAudio url={urlAudio} tonoDefecto={recursos.tono_defecto ?? 0} tonoNota={recursos.tono_nota} />
        </div>
      )}

      {/* ── Texto / cifrado ───────────────────────────────────── */}
      {textoSan && (
        <div className="tr-player-card">
          <div className="tr-player-header">
            <span className="tr-player-label">Notas y cifrado</span>
          </div>
          <div className="tr-texto-contenido" dangerouslySetInnerHTML={{ __html: textoSan }} />
        </div>
      )}

      {/* ── Imágenes ──────────────────────────────────────────── */}
      {recursos.imagenes && recursos.imagenes.length > 0 && (
        <div className="tr-player-card">
          <div className="tr-player-header">
            <span className="tr-player-label">Imágenes</span>
          </div>
          <div className="tr-imagenes-grid">
            {recursos.imagenes.map((url, i) => (
              <button key={i} type="button" className="tr-imagen-thumb"
                onClick={() => setImagenAmpliada(url)} aria-label={`Ver imagen ${i + 1}`}>
                <img src={url} alt={`Recurso ${i + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Lightbox ──────────────────────────────────────────── */}
      {imagenAmpliada && (
        <div className="tr-lightbox" onClick={() => setImagenAmpliada(null)}>
          <button type="button" className="tr-lightbox-cerrar"
            onClick={() => setImagenAmpliada(null)}>✕</button>
          <img src={imagenAmpliada} alt="Imagen ampliada"
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default TabRecursos;
