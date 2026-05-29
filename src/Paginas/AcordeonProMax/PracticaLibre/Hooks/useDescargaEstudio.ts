import { useCallback, useEffect, useRef, useState } from 'react';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';
import type { NotaHero, SeccionV2 } from '../../GrabadorV2/tipos';
import type { ReproductorMP3V2 } from '../../GrabadorV2/hooks/useReproductorMP3V2';
import {
  seccionAMp3Blob, descargarBlob, sanitizarNombre,
  renderizarMezclaOffline, audioBufferAMp3Async, type NotaRender,
} from '../Utilidades/descargasEstudio';
import type { CancionEstudio } from '../Servicios/servicioEstudioUsuario';

type Rango = { inicio: number; fin: number } | null;

interface Args {
  reproductor: ReproductorMP3V2;
  bpm: number;
  totalTicks: number;
  secuencia: NotaHero[];
  vista: 'lista' | 'editor';
  logicaRef: React.MutableRefObject<any>;
  ultimoTickFiredRef: React.MutableRefObject<number>;
  setTickActual: (t: number) => void;
  setMensajeError: (m: string | null) => void;
  cargarEnEditor: (c: CancionEstudio) => Promise<void>;
}

/**
 * Descarga/render de la mezcla (acordeón + fondo) a MP3. Intenta OFFLINE (rápido, OfflineAudioContext)
 * y, si falla, cae a captura en tiempo real. Expone progreso para la barra de carga.
 */
export function useDescargaEstudio(args: Args) {
  const {
    reproductor, bpm, totalTicks, secuencia, vista,
    logicaRef, ultimoTickFiredRef, setTickActual, setMensajeError, cargarEnEditor,
  } = args;

  const [renderizando, setRenderizando] = useState<string | null>(null);
  const [progresoPct, setProgresoPct] = useState(0);
  const [descargaPendiente, setDescargaPendiente] = useState<{ nombre: string } | null>(null);

  // OFFLINE: sintetiza notas + fondo en un OfflineAudioContext y encodea MP3. Lanza si no hay muestras.
  const renderOffline = useCallback(async (rango: Rango, nombreBase: string) => {
    const backing = reproductor.getAudioBuffer();
    if (!backing) throw new Error('sin-fondo');
    const lg = logicaRef.current;
    if (!lg?.resolverTono) throw new Error('sin-resolver');
    const ticksPorSeg = (bpm / 60) * 192;
    const startTick = rango ? rango.inicio : 0;
    const endTick = rango ? rango.fin : totalTicks;
    const durSeg = Math.max(0.3, (endTick - startTick) / ticksPorSeg) + 0.4;
    const sr = motorAudioPro.sampleRateActual;
    const enRango = secuencia.filter((n) => n.tick + n.duracion > startTick && n.tick < endTick);

    // Precarga de muestras que falten en el banco.
    const rutas = new Map<string, string>();
    for (const n of enRango) {
      for (const s of lg.resolverTono(n.botonId).samples) {
        const rf = s.idSonido.startsWith('http') || s.idSonido.startsWith('/') ? s.idSonido : `/${s.idSonido}`;
        rutas.set(s.idSonido, rf);
      }
    }
    const bancoId = lg.resolverTono(enRango[0]?.botonId ?? '').bancoId;
    await Promise.allSettled(Array.from(rutas.entries()).map(([id, rf]) =>
      motorAudioPro.obtenerMuestra(bancoId, id) ? Promise.resolve() : motorAudioPro.cargarSonidoEnBanco(bancoId, id, rf),
    ));

    const notas: NotaRender[] = [];
    for (const n of enRango) {
      const res = lg.resolverTono(n.botonId);
      const muestras = res.samples
        .map((s: any) => { const m = motorAudioPro.obtenerMuestra(res.bancoId, s.idSonido); return m ? { buffer: m.buffer, offset: m.offset, semitonos: s.semitonos } : null; })
        .filter(Boolean) as NotaRender['muestras'];
      if (!muestras.length) continue;
      notas.push({ inicioSeg: (n.tick - startTick) / ticksPorSeg, duracionSeg: Math.max(0.05, n.duracion / ticksPorSeg), volumen: res.volumen, muestras });
    }
    if (enRango.length > 0 && notas.length === 0) throw new Error('sin-muestras');

    setRenderizando('Generando audio…'); setProgresoPct(10);
    const rendered = await renderizarMezclaOffline({
      fondo: { buffer: backing, offsetSeg: startTick / ticksPorSeg, volumen: 0.85, playbackRate: 1 },
      notas, duracionSeg: durSeg, sampleRate: sr,
    });
    setRenderizando('Codificando MP3…');
    const mp3 = await audioBufferAMp3Async(rendered, (p) => setProgresoPct(p));
    descargarBlob(mp3, `${nombreBase}.mp3`);
  }, [reproductor, bpm, totalTicks, secuencia, logicaRef]);

  // Fallback REAL-TIME: captura la salida mientras suena.
  const renderRealtime = useCallback(async (rango: Rango, nombreBase: string) => {
    const ctx = motorAudioPro.contextoAudio;
    const ticksPorSeg = (bpm / 60) * 192;
    const startTick = rango ? rango.inicio : 0;
    const endTick = rango ? rango.fin : totalTicks;
    const durMs = Math.max(300, ((endTick - startTick) / ticksPorSeg) * 1000);
    let dest: MediaStreamAudioDestinationNode | null = null;
    setRenderizando('Renderizando en tiempo real… (suena la canción)');
    const t0 = Date.now();
    const tick = window.setInterval(() => setProgresoPct(Math.min(99, Math.round(((Date.now() - t0) / (durMs + 500)) * 100))), 150);
    try {
      await motorAudioPro.activarContexto();
      dest = ctx.createMediaStreamDestination();
      motorAudioPro.conectarCaptura(dest);
      reproductor.conectarSalida(dest);
      const chunks: BlobPart[] = [];
      const rec = new MediaRecorder(dest.stream);
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      const detenido = new Promise<void>((res) => { rec.onstop = () => res(); });
      ultimoTickFiredRef.current = startTick;
      setTickActual(startTick);
      reproductor.seek(startTick);
      rec.start();
      await reproductor.play(startTick);
      await new Promise((r) => setTimeout(r, durMs + 500));
      reproductor.pause();
      rec.stop();
      await detenido;
      const audioBuf = await ctx.decodeAudioData(await (new Blob(chunks)).arrayBuffer());
      descargarBlob(seccionAMp3Blob(audioBuf, 0, audioBuf.duration), `${nombreBase}.mp3`);
    } finally {
      window.clearInterval(tick);
      if (dest) { motorAudioPro.desconectarCaptura(dest); reproductor.desconectarSalida(dest); }
    }
  }, [reproductor, bpm, totalTicks, ultimoTickFiredRef, setTickActual]);

  // Unificada: intenta offline (rápido); si falla, cae a tiempo real. UN solo MP3.
  const descargar = useCallback(async (rango: Rango, nombreBase: string) => {
    if (renderizando) return;
    if (!reproductor.cargado) { setMensajeError('Abrí la pista en el editor primero.'); return; }
    setMensajeError(null);
    setRenderizando('Generando audio…'); setProgresoPct(5);
    try {
      try { await renderOffline(rango, nombreBase); }
      catch (_) { await renderRealtime(rango, nombreBase); }
    } catch (e: any) {
      setMensajeError(`No se pudo generar el audio: ${e.message || e}`);
    } finally {
      setRenderizando(null); setProgresoPct(0);
    }
  }, [renderizando, reproductor, renderOffline, renderRealtime, setMensajeError]);

  const descargarSeccionAudio = useCallback((s: SeccionV2) => {
    void descargar({ inicio: s.tickInicio, fin: s.tickFin }, sanitizarNombre(s.nombre));
  }, [descargar]);

  const descargarPistaCompleta = useCallback((c: CancionEstudio) => {
    setDescargaPendiente({ nombre: sanitizarNombre(c.titulo) });
    void cargarEnEditor(c);
  }, [cargarEnEditor]);

  // Tras cargar la canción en el editor (desde la lista), dispara el render con el estado fresco.
  useEffect(() => {
    if (!descargaPendiente) return;
    if (vista !== 'editor' || !reproductor.cargado || renderizando) return;
    const nombre = descargaPendiente.nombre;
    setDescargaPendiente(null);
    void descargar(null, nombre);
  }, [descargaPendiente, vista, reproductor.cargado, renderizando, descargar]);

  return { renderizando, progresoPct, descargar, descargarSeccionAudio, descargarPistaCompleta };
}
