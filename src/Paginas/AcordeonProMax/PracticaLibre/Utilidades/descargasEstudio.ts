import { Mp3Encoder } from '@breezystack/lamejs';
import type { NotaHero, SeccionV2 } from '../../GrabadorV2/tipos';

/**
 * Utilidades de descarga del Grabador de pistas del alumno.
 *
 * - `seccionAMp3Blob`: recorta el tramo [inicioSeg, finSeg] del AudioBuffer de fondo y lo
 *   encodea a MP3 96 kbps mono (mismo pipeline que el compresor de subida). Es la forma más
 *   simple y confiable de entregar "la sección seleccionada en audio mp3" sin montar captura
 *   en tiempo real del sintetizador.
 * - `descargarBlob` / `descargarJson`: helpers de descarga en el navegador.
 */

const SAMPLE_BLOCK = 1152;
const BITRATE = 96;
const SR_OUT = 44100;

function recortarMono(buffer: AudioBuffer, inicioSeg: number, finSeg: number): Float32Array {
  const sr = buffer.sampleRate;
  const ini = Math.max(0, Math.floor(inicioSeg * sr));
  const fin = Math.min(buffer.length, Math.floor(finSeg * sr));
  const n = Math.max(0, fin - ini);
  const out = new Float32Array(n);
  const canales = buffer.numberOfChannels;
  for (let c = 0; c < canales; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < n; i++) out[i] += data[ini + i] / canales;
  }
  return out;
}

function resamplearLineal(input: Float32Array, srIn: number, srOut: number): Float32Array {
  if (srIn === srOut) return input;
  const ratio = srIn / srOut;
  const len = Math.floor(input.length / ratio);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    out[i] = input[idx] * (1 - frac) + (input[idx + 1] || 0) * frac;
  }
  return out;
}

function floatToInt16(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

/** Recorta [inicioSeg, finSeg] del buffer de fondo y devuelve un Blob MP3. */
export function seccionAMp3Blob(buffer: AudioBuffer, inicioSeg: number, finSeg: number): Blob {
  const mono = recortarMono(buffer, inicioSeg, finSeg);
  const pcm = floatToInt16(resamplearLineal(mono, buffer.sampleRate, SR_OUT));
  const encoder = new Mp3Encoder(1, SR_OUT, BITRATE);
  const partes: Uint8Array[] = [];
  for (let i = 0; i < pcm.length; i += SAMPLE_BLOCK) {
    const chunk = pcm.subarray(i, Math.min(i + SAMPLE_BLOCK, pcm.length));
    const buf = encoder.encodeBuffer(chunk);
    if (buf.length > 0) partes.push(buf);
  }
  const fin = encoder.flush();
  if (fin.length > 0) partes.push(fin);
  return new Blob(partes as BlobPart[], { type: 'audio/mpeg' });
}

export function sanitizarNombre(nombre: string): string {
  return (nombre || 'pista').replace(/[^\w\-]+/g, '_').slice(0, 60);
}

// ─── Render OFFLINE (rápido, no real-time) ──────────────────────────────────
export interface MuestraRender { buffer: AudioBuffer; offset: number; semitonos: number; }
export interface NotaRender { inicioSeg: number; duracionSeg: number; volumen: number; muestras: MuestraRender[]; }

/**
 * Renderiza la mezcla (fondo + notas del acordeón) en un OfflineAudioContext → mucho más rápido
 * que capturar en tiempo real. Los AudioBuffer del banco son independientes del contexto, así que
 * se reusan tal cual aquí.
 */
export async function renderizarMezclaOffline(opts: {
  fondo: { buffer: AudioBuffer; offsetSeg: number; volumen: number; playbackRate: number } | null;
  notas: NotaRender[];
  duracionSeg: number;
  sampleRate: number;
}): Promise<AudioBuffer> {
  const { fondo, notas, duracionSeg, sampleRate } = opts;
  const length = Math.max(1, Math.ceil(duracionSeg * sampleRate));
  const OfflineCtx: any = (globalThis as any).OfflineAudioContext || (globalThis as any).webkitOfflineAudioContext;
  if (!OfflineCtx) throw new Error('OfflineAudioContext no disponible');
  const ctx: OfflineAudioContext = new OfflineCtx(2, length, sampleRate);

  if (fondo && fondo.buffer) {
    const src = ctx.createBufferSource();
    src.buffer = fondo.buffer;
    src.playbackRate.value = fondo.playbackRate || 1;
    const g = ctx.createGain();
    g.gain.value = fondo.volumen;
    src.connect(g); g.connect(ctx.destination);
    try { src.start(0, Math.max(0, fondo.offsetSeg)); } catch (_) {}
  }

  for (const n of notas) {
    const fin = n.inicioSeg + n.duracionSeg;
    const fade = Math.min(0.02, n.duracionSeg / 2);
    for (const m of n.muestras) {
      const src = ctx.createBufferSource();
      src.buffer = m.buffer;
      if (m.semitonos) src.playbackRate.value = Math.pow(2, m.semitonos / 12);
      const g = ctx.createGain();
      g.gain.setValueAtTime(n.volumen, n.inicioSeg);
      g.gain.setTargetAtTime(0, Math.max(n.inicioSeg, fin - fade), fade);
      src.connect(g); g.connect(ctx.destination);
      try { src.start(n.inicioSeg, m.offset); src.stop(fin + 0.05); } catch (_) {}
    }
  }

  return await ctx.startRendering();
}

/** Encodea un AudioBuffer completo a MP3 cediendo el thread y reportando progreso 0..100. */
export async function audioBufferAMp3Async(
  buffer: AudioBuffer,
  onProgreso?: (pct: number) => void,
): Promise<Blob> {
  const mono = recortarMono(buffer, 0, buffer.duration);
  const pcm = floatToInt16(resamplearLineal(mono, buffer.sampleRate, SR_OUT));
  const encoder = new Mp3Encoder(1, SR_OUT, BITRATE);
  const partes: Uint8Array[] = [];
  const total = Math.max(1, Math.ceil(pcm.length / SAMPLE_BLOCK));
  let b = 0;
  for (let i = 0; i < pcm.length; i += SAMPLE_BLOCK, b++) {
    const chunk = pcm.subarray(i, Math.min(i + SAMPLE_BLOCK, pcm.length));
    const buf = encoder.encodeBuffer(chunk);
    if (buf.length > 0) partes.push(buf);
    if (b % 80 === 0) { onProgreso?.(Math.round((b / total) * 100)); await new Promise((r) => setTimeout(r, 0)); }
  }
  const fin = encoder.flush();
  if (fin.length > 0) partes.push(fin);
  onProgreso?.(100);
  return new Blob(partes as BlobPart[], { type: 'audio/mpeg' });
}

export function descargarBlob(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function descargarJson(datos: unknown, nombreArchivo: string): void {
  descargarBlob(new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' }), nombreArchivo);
}

/**
 * Descarga una sección: su audio de fondo recortado en MP3 + las notas grabadas dentro del
 * rango de la sección en JSON. ticksPorSegundo = (bpm/60)*resolucion.
 */
export function descargarSeccion(
  buffer: AudioBuffer,
  seccion: SeccionV2,
  secuencia: NotaHero[],
  bpm: number,
  resolucion: number,
): void {
  const ticksPorSeg = (bpm / 60) * resolucion;
  const inicioSeg = seccion.tickInicio / ticksPorSeg;
  const finSeg = seccion.tickFin / ticksPorSeg;
  const base = sanitizarNombre(seccion.nombre);

  // Audio MP3 del tramo.
  const mp3 = seccionAMp3Blob(buffer, inicioSeg, finSeg);
  descargarBlob(mp3, `${base}.mp3`);

  // Secuencia grabada dentro del rango (ticks relativos al inicio de la sección).
  const notas = secuencia
    .filter((n) => n.tick + n.duracion > seccion.tickInicio && n.tick < seccion.tickFin)
    .map((n) => ({ ...n, tick: Math.max(0, n.tick - seccion.tickInicio) }));
  descargarJson({ nombre: seccion.nombre, bpm, resolucion, secuencia: notas }, `${base}.json`);
}
