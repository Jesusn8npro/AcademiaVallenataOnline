import { motorAudioPro } from './AudioEnginePro';

/**
 * ReproductorMP3PreservaTono: alternativa a `ReproductorMP3` que usa HTMLAudioElement
 * con `preservesPitch = true` ruteado por Web Audio (MediaElementAudioSourceNode).
 *
 * Cuándo usarlo: SOLO en modo Maestro, donde el alumno controla el tempo manualmente
 * con el slider de BPM y necesita que el tono se mantenga al bajar la velocidad.
 *
 * Para Competencia / Synthesia / Replays / GrabadorV2 SE SIGUE USANDO `ReproductorMP3`
 * (AudioBufferSourceNode), que da sample-accurate sync sin tocar el tono porque
 * en esos modos el BPM no cambia.
 *
 * Trade-off (aceptable solo aquí):
 *   - `currentTime` jitter ~16-50ms (HTMLAudio limitation).
 *   - `play()` cold-start ~50-300ms entre play() y primer sample real.
 * El proyecto ya re-ancla el reloj de notas al evento 'playing' leyendo
 * `audio.currentTime` REAL — patrón validado en useReproductorHero.
 *
 * API: idéntica a `ReproductorMP3` para que `audioFondoRef` pueda apuntar a
 * cualquiera de las dos según el modo.
 */
export class ReproductorMP3PreservaTono {
  private audioEl: HTMLAudioElement;
  private gainNode: GainNode;
  private _src: string = '';
  private _playbackRate: number = 1;
  private _volume: number = 1;
  private _cargado: boolean = false;
  private cargandoUrl: string | null = null;
  private listeners: Map<string, Set<() => void>> = new Map();

  // Compat: el caller pasa el AudioContext, pero el ruteo Web Audio lo maneja
  // motorAudioPro.conectarMediaElement (singleton, WeakMap).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_contexto: AudioContext) {
    this.audioEl = new Audio();
    this.audioEl.preload = 'auto';
    this.audioEl.crossOrigin = 'anonymous';
    this.audioEl.volume = 1;
    this._aplicarPreservarTono();

    const eventosARePropagar = ['playing', 'pause', 'seeked', 'canplay', 'canplaythrough', 'loadeddata', 'ended'] as const;
    for (const ev of eventosARePropagar) {
      this.audioEl.addEventListener(ev, () => this._emit(ev));
    }

    this.gainNode = motorAudioPro.conectarMediaElement(this.audioEl);
  }

  /** Re-asegura preservesPitch tras setear src o playbackRate (algunos browsers lo resetean). */
  private _aplicarPreservarTono(): void {
    (this.audioEl as any).preservesPitch = true;
    (this.audioEl as any).mozPreservesPitch = true;
    (this.audioEl as any).webkitPreservesPitch = true;
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
    Array.from(set).forEach(fn => { try { fn(); } catch (_) {} });
  }

  // --------- Carga ---------

  async cargar(url: string): Promise<void> {
    if (this._src === url && this._cargado) return;
    if (this.cargandoUrl === url) return;
    this.cargandoUrl = url;
    try {
      this.audioEl.src = url;
      this._src = url;
      this._aplicarPreservarTono();
      if (this.audioEl.readyState < 3) {
        await new Promise<void>((resolve) => {
          let resuelto = false;
          const finish = () => { if (resuelto) return; resuelto = true; resolve(); };
          const onReady = () => {
            this.audioEl.removeEventListener('canplaythrough', onReady);
            this.audioEl.removeEventListener('canplay', onReady);
            finish();
          };
          this.audioEl.addEventListener('canplaythrough', onReady);
          this.audioEl.addEventListener('canplay', onReady);
          setTimeout(finish, 8000);
        });
      }
      if (this.cargandoUrl !== url) return;
      this._cargado = true;
    } finally {
      if (this.cargandoUrl === url) this.cargandoUrl = null;
    }
  }

  get cargado(): boolean { return this._cargado; }
  get src(): string { return this._src; }
  get readyState(): number { return this.audioEl.readyState; }
  get duration(): number { return isNaN(this.audioEl.duration) ? 0 : this.audioEl.duration; }

  // --------- Estado de reproducción ---------

  get paused(): boolean { return this.audioEl.paused; }

  get currentTime(): number { return this.audioEl.currentTime; }
  set currentTime(seg: number) {
    const objetivo = Math.max(0, Math.min(this.duration || Infinity, seg));
    try { this.audioEl.currentTime = objetivo; } catch (_) {}
  }

  // --------- Volumen / playbackRate ---------

  get volume(): number { return this._volume; }
  set volume(v: number) {
    const clamp = Math.max(0, Math.min(1, v));
    this._volume = clamp;
    this.audioEl.volume = clamp;
  }

  get playbackRate(): number { return this._playbackRate; }
  set playbackRate(rate: number) {
    const clamp = Math.max(0.1, Math.min(4, rate));
    this._playbackRate = clamp;
    this.audioEl.playbackRate = clamp;
    this._aplicarPreservarTono();
  }

  // --------- Play / Pause ---------

  async play(): Promise<void> {
    if (!this.audioEl.paused) return;
    if (!this._cargado && this.cargandoUrl) {
      await new Promise<void>((resolve) => {
        const handler = () => { this.removeEventListener('canplaythrough', handler); resolve(); };
        this.addEventListener('canplaythrough', handler);
        setTimeout(() => { this.removeEventListener('canplaythrough', handler); resolve(); }, 4000);
      });
    }
    try {
      await this.audioEl.play();
    } catch (_) {}
  }

  /**
   * HTMLAudio no tiene scheduling sample-accurate; aproximamos con setTimeout
   * sobre la diferencia entre contextStartTime y AudioContext.currentTime.
   * Solo se usa en GrabadorV2; aquí no aplica salvo por simetría con la API.
   */
  programarReproduccion(offsetSeg: number, contextStartTime: number, playbackRate?: number): boolean {
    if (!this._cargado) return false;
    const ctx = this.gainNode.context;
    if (ctx.state !== 'running') {
      try { (ctx as AudioContext).resume(); } catch (_) {}
    }
    const objetivo = Math.max(0, Math.min(this.duration, offsetSeg));
    const rate = typeof playbackRate === 'number' ? Math.max(0.1, Math.min(4, playbackRate)) : this._playbackRate;
    this._playbackRate = rate;
    this.audioEl.playbackRate = rate;
    this._aplicarPreservarTono();
    try { this.audioEl.currentTime = objetivo; } catch (_) {}

    const delaySec = Math.max(0, contextStartTime - ctx.currentTime);
    if (delaySec > 0) {
      setTimeout(() => { this.audioEl.play().catch(() => {}); }, delaySec * 1000);
    } else {
      this.audioEl.play().catch(() => {});
    }
    return true;
  }

  pause(): void {
    if (this.audioEl.paused) return;
    this.audioEl.pause();
  }

  destruir(): void {
    try { this.audioEl.pause(); } catch (_) {}
    try { this.audioEl.removeAttribute('src'); this.audioEl.load(); } catch (_) {}
    this.listeners.clear();
    this._cargado = false;
    this._src = '';
  }

  get nodoSalida(): GainNode { return this.gainNode; }
}
