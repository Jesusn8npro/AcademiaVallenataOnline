import { PitchShifter } from 'soundtouchjs';

/**
 * Wrapper sobre `PitchShifter` de soundtouchjs para la pestaña Mis Pistas.
 *
 * Por qué SoundTouch y no Web Audio playbackRate+detune:
 * - playbackRate cambia velocidad pero también pitch.
 * - detune compensa pitch pero solo bien hasta ±6 semitonos; más allá suena robótico.
 * - SoundTouch (phase vocoder + WSOLA) cambia velocidad y tono INDEPENDIENTES con calidad
 *   profesional (tipo Moises/AnyTune) en todo el rango ±12 semitonos / 0.5x..1.5x.
 *
 * Tradeoff: ~30% CPU vs Web Audio nativo. Aceptable para una pista de fondo.
 *
 * API expuesta:
 * - cargarUrl(url): descarga y decodifica.
 * - play() / pause() / seekSeg(s).
 * - setVelocidad(n): 0.5..1.5.
 * - setSemitonos(n): -12..+12.
 * - setLoop(inicioSeg, finSeg) / quitarLoop().
 * - onTimeUpdate(cb): callback con {seg, pct} cada ~50ms.
 */

export interface InfoTiempo {
  seg: number;
  pct: number;
  duracion: number;
}

export class ReproductorSoundTouch {
  private contexto: AudioContext;
  private buffer: AudioBuffer | null = null;
  private shifter: any = null;
  private gain: GainNode;
  private conectado = false;
  private _velocidad = 1;
  private _semitonos = 0;
  private _volumen = 1;
  private _loop: { inicioSeg: number; finSeg: number } | null = null;
  private listeners: Set<(t: InfoTiempo) => void> = new Set();
  private listenersFin: Set<() => void> = new Set();
  private _src = '';

  constructor(contexto: AudioContext) {
    this.contexto = contexto;
    this.gain = contexto.createGain();
    this.gain.gain.value = 1;
    this.gain.connect(contexto.destination);
  }

  get duration(): number { return this.buffer?.duration ?? 0; }
  get currentTime(): number { return this.shifter?.timePlayed ?? 0; }
  get paused(): boolean { return !this.conectado; }
  get cargado(): boolean { return !!this.buffer; }
  get src(): string { return this._src; }
  /** Acceso al AudioBuffer ya decodificado (para análisis: detector de tono, etc). */
  get audioBuffer(): AudioBuffer | null { return this.buffer; }

  async cargarUrl(url: string): Promise<void> {
    if (this._src === url && this.buffer) return;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arr = await res.arrayBuffer();
    const buf = await this.contexto.decodeAudioData(arr);
    this.buffer = buf;
    this._src = url;
    this._reconstruirShifter();
  }

  /** Carga directamente desde un AudioBuffer ya decodificado (caso file local). */
  cargarBuffer(buffer: AudioBuffer, src = 'local'): void {
    this.buffer = buffer;
    this._src = src;
    this._reconstruirShifter();
  }

  private _crearShifterEn(posicionSeg: number): any {
    if (!this.buffer) return null;
    const shifter = new PitchShifter(this.contexto, this.buffer, 4096, () => {
      // onEnd del filter: el buffer interno se agotó (llegamos al final).
      this.listenersFin.forEach((fn) => { try { fn(); } catch (_) {} });
      this.pause();
    });
    shifter.tempo = this._velocidad;
    shifter.pitchSemitones = this._semitonos;
    if (posicionSeg > 0 && this.buffer.duration > 0) {
      shifter.percentagePlayed = (Math.min(posicionSeg, this.buffer.duration) / this.buffer.duration) * 100;
    }
    shifter.on('play', (data: any) => {
      const seg: number = data?.timePlayed ?? 0;
      const dur = this.duration;
      // Loop A-B: si llegamos al final del rango, volvemos al inicio del rango.
      if (this._loop && seg >= this._loop.finSeg) {
        this.seekSeg(this._loop.inicioSeg);
        return;
      }
      const t: InfoTiempo = { seg, pct: dur > 0 ? seg / dur : 0, duracion: dur };
      this.listeners.forEach((fn) => { try { fn(t); } catch (_) {} });
    });
    return shifter;
  }

  private _reconstruirShifter(): void {
    if (!this.buffer) return;
    const estabaSonando = this.conectado;
    const posicionSeg = this.currentTime;
    this._destruirShifter();
    this.shifter = this._crearShifterEn(posicionSeg);
    if (estabaSonando) this.play();
  }

  private _destruirShifter(): void {
    if (this.shifter) {
      try { this.shifter.off(); } catch (_) {}
      try { this.shifter.disconnect(); } catch (_) {}
      this.shifter = null;
    }
    this.conectado = false;
  }

  async play(): Promise<void> {
    if (this.contexto.state !== 'running') {
      try { await this.contexto.resume(); } catch (_) {}
    }
    if (!this.shifter) return;
    if (this.conectado) return;
    this.shifter.connect(this.gain);
    this.conectado = true;
  }

  pause(): void {
    if (!this.shifter) return;
    if (!this.conectado) return;
    try { this.shifter.disconnect(); } catch (_) {}
    this.conectado = false;
  }

  seekSeg(seg: number): void {
    if (!this.buffer) return;
    const objetivo = Math.max(0, Math.min(this.buffer.duration, seg));
    // PitchShifter tiene un buffer interno en el SoundTouch que NO se limpia con
    // `percentagePlayed`, así que después del seek seguían sonando samples viejos hasta
    // que el buffer interno se vaciaba → "se trababa". Reconstruimos el shifter completo
    // posicionado en `objetivo` y, si estaba reproduciendo, lo reconectamos vía play()
    // (que también asegura que el AudioContext esté running tras el gesto del usuario).
    const estabaSonando = this.conectado;
    if (this.shifter) {
      try { this.shifter.off(); } catch (_) {}
      try { this.shifter.disconnect(); } catch (_) {}
    }
    this.conectado = false;
    this.shifter = this._crearShifterEn(objetivo);
    if (estabaSonando) {
      void this.play();
    }
  }

  get velocidad(): number { return this._velocidad; }
  setVelocidad(v: number): void {
    const c = Math.max(0.5, Math.min(1.5, v));
    this._velocidad = c;
    if (this.shifter) this.shifter.tempo = c;
  }

  get semitonos(): number { return this._semitonos; }
  setSemitonos(n: number): void {
    const c = Math.max(-12, Math.min(12, Math.round(n)));
    this._semitonos = c;
    if (this.shifter) this.shifter.pitchSemitones = c;
  }

  get volumen(): number { return this._volumen; }
  setVolumen(v: number): void {
    const c = Math.max(0, Math.min(1, v));
    this._volumen = c;
    this.gain.gain.value = c;
  }

  setLoop(inicioSeg: number, finSeg: number): void {
    if (finSeg <= inicioSeg) { this._loop = null; return; }
    this._loop = { inicioSeg, finSeg };
  }

  quitarLoop(): void { this._loop = null; }
  get loopActivo(): boolean { return this._loop !== null; }

  onTimeUpdate(fn: (t: InfoTiempo) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  onFin(fn: () => void): () => void {
    this.listenersFin.add(fn);
    return () => this.listenersFin.delete(fn);
  }

  destruir(): void {
    this._destruirShifter();
    try { this.gain.disconnect(); } catch (_) {}
    this.listeners.clear();
    this.listenersFin.clear();
    this.buffer = null;
  }
}
