import { Mp3Encoder } from '@breezystack/lamejs';

/**
 * Compresión MP3 en el cliente. El alumno sube cualquier audio (MP3, WAV, OGG…) y lo
 * re-encodeamos a MP3 96 kbps mono para uniformar tamaños y reducir lo que viaja a Supabase.
 *
 * Sin worker: lamejs es síncrono, pero procesamos en chunks de 1152 samples cediendo el
 * event loop con `setTimeout(0)` cada N chunks para que la UI siga respondiendo. Para un
 * tema de 4 min tarda 3-8 s en una laptop normal.
 *
 * Si después se quiere migrar a worker, basta envolver `comprimirAMp3` en uno: el AudioBuffer
 * decodificado se pasa por transferable como Float32Array.
 */

const SAMPLE_BLOCK_SIZE = 1152; // tamaño mínimo del frame MP3
const CHUNKS_POR_TICK = 50;     // cuántos bloques procesar antes de ceder el thread
const BITRATE_KBPS = 96;
const SAMPLE_RATE_OBJETIVO = 44100;

export interface ResultadoCompresion {
  blob: Blob;
  duracionSeg: number;
  tamanoBytes: number;
  tamanoOriginal: number;
  ratio: number; // tamaño nuevo / original
  /** Buffer decodificado (sin resamplear). Útil para análisis posterior (detector de tono). */
  audioBuffer: AudioBuffer;
}

export interface OpcionesCompresion {
  onProgreso?: (porcentaje: number) => void;
  /** AbortSignal para que el usuario pueda cancelar la subida. */
  signal?: AbortSignal;
}

function floatToInt16(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

/** Mezcla stereo a mono promediando canales. Reduce el peso ~50% sin pérdida de información musical. */
function mezclarAMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0);
  const l = buffer.getChannelData(0);
  const r = buffer.getChannelData(1);
  const out = new Float32Array(l.length);
  for (let i = 0; i < l.length; i++) out[i] = (l[i] + r[i]) * 0.5;
  return out;
}

/** Resampler lineal simple: suficiente para audio musical bajando a 44.1 kHz desde 48 kHz / 88.2. */
function resamplearLineal(input: Float32Array, sampleRateIn: number, sampleRateOut: number): Float32Array {
  if (sampleRateIn === sampleRateOut) return input;
  const ratio = sampleRateIn / sampleRateOut;
  const longitudOut = Math.floor(input.length / ratio);
  const out = new Float32Array(longitudOut);
  for (let i = 0; i < longitudOut; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    out[i] = input[idx] * (1 - frac) + (input[idx + 1] || 0) * frac;
  }
  return out;
}

/**
 * Decodifica → resampla a 44.1 kHz → mono → encodea MP3 96 kbps.
 * Cede el thread cada CHUNKS_POR_TICK iteraciones para no congelar la UI.
 */
export async function comprimirAMp3(archivo: File, opciones: OpcionesCompresion = {}): Promise<ResultadoCompresion> {
  const { onProgreso, signal } = opciones;

  if (signal?.aborted) throw new DOMException('Cancelado', 'AbortError');

  // 1. Decodificar con un AudioContext propio (no usamos el del acordeón para no contaminar).
  const arrayBuffer = await archivo.arrayBuffer();
  const AudioCtx: any = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
  if (!AudioCtx) throw new Error('AudioContext no disponible en este navegador');
  const ctx = new AudioCtx();

  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
  } catch (e: any) {
    try { await ctx.close(); } catch (_) {}
    throw new Error(`No se pudo leer el audio: ${e?.message || 'formato no soportado'}`);
  }
  // NO cerramos ctx todavía: el caller puede querer reusarlo. Lo cerramos al final.

  if (signal?.aborted) throw new DOMException('Cancelado', 'AbortError');

  // 2. Mono + resample a 44.1 kHz
  const monoF32 = mezclarAMono(audioBuffer);
  const resampled = resamplearLineal(monoF32, audioBuffer.sampleRate, SAMPLE_RATE_OBJETIVO);
  const pcm16 = floatToInt16(resampled);

  // 3. Encode MP3 en chunks cediendo el thread
  const encoder = new Mp3Encoder(1, SAMPLE_RATE_OBJETIVO, BITRATE_KBPS);
  const buffers: Uint8Array[] = [];
  const totalSamples = pcm16.length;
  const totalBloques = Math.ceil(totalSamples / SAMPLE_BLOCK_SIZE);

  for (let bloque = 0; bloque < totalBloques; bloque++) {
    if (signal?.aborted) throw new DOMException('Cancelado', 'AbortError');
    const inicio = bloque * SAMPLE_BLOCK_SIZE;
    const fin = Math.min(inicio + SAMPLE_BLOCK_SIZE, totalSamples);
    const chunk = pcm16.subarray(inicio, fin);
    const mp3buf = encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) buffers.push(mp3buf);

    if (bloque % CHUNKS_POR_TICK === 0) {
      onProgreso?.(Math.round((bloque / totalBloques) * 100));
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  const final = encoder.flush();
  if (final.length > 0) buffers.push(final);
  onProgreso?.(100);

  const blob = new Blob(buffers as BlobPart[], { type: 'audio/mpeg' });
  // No cerramos el ctx acá: el AudioBuffer devuelto sigue referenciándolo y algunos navegadores
  // invalidan los samples cuando el ctx se cierra. El ctx queda referenciado mientras el buffer
  // lo esté y el GC lo limpiará cuando se desreferencie todo.
  return {
    blob,
    duracionSeg: audioBuffer.duration,
    tamanoBytes: blob.size,
    tamanoOriginal: archivo.size,
    ratio: blob.size / archivo.size,
    audioBuffer,
  };
}
