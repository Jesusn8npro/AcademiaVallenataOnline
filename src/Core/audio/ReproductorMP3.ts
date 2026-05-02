/**
 * ReproductorMP3: reemplazo de HTMLAudioElement para fondo de canción usando AudioBufferSourceNode.
 *
 * Por qué existe: HTMLAudio tiene latencia variable del decoder (50-500ms), audio.currentTime actualiza
 * en saltos de 16-50ms (jitter), y el evento 'playing' fires en momentos impredecibles. Estos problemas
 * causan desincronización inevitable cuando intentas alinear notas con el MP3.
 *
 * AudioBufferSourceNode resuelve todo:
 * - Cero latencia de decoder (PCM ya en memoria).
 * - currentTime calculado desde AudioContext.currentTime (continuo, sample-accurate).
 * - source.start(when, offset) inicia con precisión de 1/sampleRate (típicamente ~21µs).
 * - Pasa por el mismo AudioContext que las notas → mismo clock → cero drift.
 *
 * Costo: hay que descargar y decodificar el MP3 una vez al cargar la canción (~200ms).
 *
 * API: emula HTMLAudioElement en lo que setAudioSync y la lógica del proyecto necesitan
 * (currentTime, paused, readyState, addEventListener para 'playing'/'seeked'/'pause'/'canplay').
 */
export class ReproductorMP3 {
  private contexto: AudioContext;
  private gainNode: GainNode;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  // Posición del audio en segundos cuando se llamó al último start.
  private startOffset: number = 0;
  // AudioContext.currentTime cuando se llamó al último start.
  private startContextTime: number = 0;
  private _paused: boolean = true;
  private _playbackRate: number = 1;
  private _volume: number = 1;
  private _src: string = '';
  private cargandoUrl: string | null = null;
  private listeners: Map<string, Set<() => void>> = new Map();

  constructor(contexto: AudioContext) {
    this.contexto = contexto;
    this.gainNode = contexto.createGain();
    this.gainNode.gain.value = 1;
    this.gainNode.connect(contexto.destination);
  }

  // --------- Eventos (emulan HTMLAudioElement) ---------

  addEventListener(event: string, fn: () => void, _options?: any): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
  }

  removeEventListener(event: string, fn: () => void): void {
    this.listeners.get(event)?.delete(fn);
  }

  private _emit(event: string): void {
    const set = this.listeners.get(event);
    if (!set) return;
    // Snapshot para que listeners 'once' que se eliminan a sí mismos no muten durante el forEach.
    Array.from(set).forEach(fn => { try { fn(); } catch (_) {} });
  }

  // --------- Carga ---------

  /** Descarga y decodifica el MP3. Cache simple por URL: si ya está cargada, no re-fetcha. */
  async cargar(url: string): Promise<void> {
    if (this._src === url && this.buffer) return;
    if (this.cargandoUrl === url) return;
    this.cargandoUrl = url;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arr = await res.arrayBuffer();
      const buf = await this.contexto.decodeAudioData(arr);
      // Otra llamada concurrente cambió la URL: ignora el resultado de ésta.
      if (this.cargandoUrl !== url) return;
      this.buffer = buf;
      this._src = url;
      this._emit('loadeddata');
      this._emit('canplay');
      this._emit('canplaythrough');
    } finally {
      if (this.cargandoUrl === url) this.cargandoUrl = null;
    }
  }

  get cargado(): boolean { return !!this.buffer; }
  get src(): string { return this._src; }

  // readyState 4 = HAVE_ENOUGH_DATA (suficiente para reproducir hasta el final). Para nuestro caso: si hay buffer.
  get readyState(): number { return this.buffer ? 4 : 0; }
  get duration(): number { return this.buffer?.duration ?? 0; }

  // --------- Estado de reproducción ---------

  get paused(): boolean { return this._paused; }

  /**
   * currentTime CONTINUO: calculado desde AudioContext.currentTime + startOffset.
   * Sin jitter (a diferencia de HTMLAudio.currentTime que actualiza cada 16-50ms en saltos).
   */
  get currentTime(): number {
    if (this._paused || !this.source) return this.startOffset;
    const elapsed = this.contexto.currentTime - this.startContextTime;
    const t = this.startOffset + elapsed * this._playbackRate;
    return Math.max(0, Math.min(this.duration, t));
  }

  /** Setear currentTime: si está paused, actualiza el offset; si está playing, hace stop+start nuevo. */
  set currentTime(seg: number) {
    const objetivo = Math.max(0, Math.min(this.duration, seg));
    const wasPlaying = !this._paused;
    if (wasPlaying) this._stopSource();
    this.startOffset = objetivo;
    this._emit('seeked');
    if (wasPlaying) this._startSource();
  }

  // --------- Volumen / playbackRate ---------

  get volume(): number { return this._volume; }
  set volume(v: number) {
    const clamp = Math.max(0, Math.min(1, v));
    this._volume = clamp;
    this.gainNode.gain.value = clamp;
  }

  get playbackRate(): number { return this._playbackRate; }
  set playbackRate(rate: number) {
    const clamp = Math.max(0.1, Math.min(4, rate));
    if (this.source && !this._paused) {
      // Re-anclar checkpoint con la rate vieja, después aplicar la nueva.
      const now = this.contexto.currentTime;
      const elapsed = now - this.startContextTime;
      this.startOffset = Math.min(this.duration, this.startOffset + elapsed * this._playbackRate);
      this.startContextTime = now;
      this.source.playbackRate.setValueAtTime(clamp, now);
    }
    this._playbackRate = clamp;
  }

  // --------- Play / Pause ---------

  /** Inicia (o reinicia) reproducción desde startOffset. No-op si ya está playing. */
  async play(): Promise<void> {
    if (!this._paused) return;
    if (!this.buffer) {
      // Espera a canplaythrough con timeout corto si está cargando.
      if (this.cargandoUrl) {
        await new Promise<void>((resolve) => {
          const handler = () => { this.removeEventListener('canplaythrough', handler); resolve(); };
          this.addEventListener('canplaythrough', handler);
          setTimeout(() => { this.removeEventListener('canplaythrough', handler); resolve(); }, 4000);
        });
      }
      if (!this.buffer) return;
    }
    this._startSource();
  }

  /**
   * Programa el inicio del buffer EN UN INSTANTE FUTURO del AudioContext, comenzando desde `offsetSeg`.
   * Web Audio garantiza arranque sample-accurate en `contextStartTime` (siempre que `contextStartTime`
   * esté en el futuro y el buffer esté decodificado). Devuelve true si se programó, false si no había
   * buffer o el contexto estaba detenido.
   *
   * Esta es la API correcta para sincronización con un reloj externo: el caller programa el audio en un
   * tiempo X y luego ancla su RAF/scheduler al mismo X. Cero race condition entre seek + play + 'playing'.
   */
  programarReproduccion(offsetSeg: number, contextStartTime: number, playbackRate?: number): boolean {
    if (!this.buffer) return false;
    if (this.contexto.state !== 'running') {
      try { this.contexto.resume(); } catch (_) {}
    }
    if (!this._paused) this._stopSource();
    const objetivo = Math.max(0, Math.min(this.duration, offsetSeg));
    const rate = typeof playbackRate === 'number' ? Math.max(0.1, Math.min(4, playbackRate)) : this._playbackRate;
    this._playbackRate = rate;
    this.startOffset = objetivo;
    this.startContextTime = contextStartTime;
    this.source = this.contexto.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.playbackRate.value = rate;
    this.source.connect(this.gainNode);
    try {
      this.source.start(contextStartTime, objetivo);
    } catch (_) {
      // start() lanza si contextStartTime es < currentTime — fallback: arranca ya.
      try { this.source.start(0, objetivo); } catch (__) {}
      this.startContextTime = this.contexto.currentTime;
    }
    this._paused = false;
    this.source.onended = () => { this._paused = true; };
    // Emite 'playing' para listeners legacy (no es necesario para el camino anclado).
    queueMicrotask(() => { if (!this._paused) this._emit('playing'); });
    return true;
  }

  pause(): void {
    if (this._paused) return;
    // Capturar posición actual antes de stop.
    const elapsed = this.contexto.currentTime - this.startContextTime;
    this.startOffset = Math.max(0, Math.min(this.duration, this.startOffset + elapsed * this._playbackRate));
    this._stopSource();
    this._paused = true;
    this._emit('pause');
  }

  // --------- Internas ---------

  private _stopSource(): void {
    if (!this.source) return;
    try { this.source.onended = null; this.source.stop(); } catch (_) {}
    try { this.source.disconnect(); } catch (_) {}
    this.source = null;
  }

  private _startSource(): void {
    if (!this.buffer) return;
    this.source = this.contexto.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.playbackRate.value = this._playbackRate;
    this.source.connect(this.gainNode);
    // start(when=0=ahora, offset=startOffset). El pipeline de Web Audio empieza este sample en este AudioContext.currentTime.
    this.startContextTime = this.contexto.currentTime;
    this.source.start(0, this.startOffset);
    this._paused = false;
    // Emitir 'playing' en el SIGUIENTE microtask para imitar HTMLAudio (que también es asíncrono).
    // Listeners 'once' del caller registran y luego este emit los dispara — orden correcto garantizado.
    queueMicrotask(() => {
      if (!this._paused) this._emit('playing');
    });
    // 'ended' cuando el audio termina (no por stop).
    this.source.onended = () => {
      // Si fue stop manual, _stopSource ya puso onended a null.
      this._paused = true;
    };
  }

  /** Limpia recursos. */
  destruir(): void {
    this._stopSource();
    try { this.gainNode.disconnect(); } catch (_) {}
    this.listeners.clear();
    this.buffer = null;
  }

  /** Acceso al GainNode para conectarlo a otro punto del grafo (EQ, etc). Por defecto va al destination. */
  get nodoSalida(): GainNode { return this.gainNode; }
}
