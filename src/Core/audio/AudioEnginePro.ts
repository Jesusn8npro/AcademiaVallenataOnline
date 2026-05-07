import type { BancoSonido, VozPooled } from './_tipos';
import { cargarSonidoEnBanco as _cargarSonido } from './_cargador';

export type { BancoSonido };

export class MotorAudioPro {
    private contexto: AudioContext;
    private bancos: Map<string, BancoSonido>;
    private nodoGananciaPrincipal: GainNode;
    private MAX_VOCES = 24;
    private esMovil = false;
    private poolVoces: VozPooled[] = [];
    private mixBus: GainNode;
    private directBus!: GainNode;
    private filtroBajos!: BiquadFilterNode;
    private filtroMedios!: BiquadFilterNode;
    private filtroAltos!: BiquadFilterNode;
    private reverbNode!: ConvolverNode;
    private reverbGanancia!: GainNode;
    private rutaConFiltros = false;
    private targetEQ = { bajos: 0, medios: 0, altos: 0 };
    private targetReverb = 0;
    // Cache de elementos HTMLAudio ruteados por Web Audio (createMediaElementSource solo se puede llamar una vez por elemento).
    private mediaElementSources: WeakMap<HTMLAudioElement, { source: MediaElementAudioSourceNode; gain: GainNode }> = new WeakMap();
    // Singleton HTMLAudio compartido para el modo Maestro. Compartirlo entre
    // todos los iniciarJuego de Maestro permite "cebarlo" durante un gesto del
    // usuario (click EMPEZAR) y reusar el MISMO elemento ya desbloqueado en
    // el iniciarJuego que corre despues en useEffect — donde el gesto de iOS
    // ya expiro. Sin el elemento compartido, cada iniciarJuego crearia un Audio
    // nuevo bloqueado por el browser.
    private _audioMaestroEl: HTMLAudioElement | null = null;

    constructor() {
        this.esMovil = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        this.MAX_VOCES = this.esMovil ? 40 : 128;
        // 'interactive' (string) en lugar de 0 (número): la spec de WebAudio acepta ambos
        // pero algunos browsers (especialmente Chrome Android) malinterpretan el número
        // y caen en modo NORMAL (callback ~40ms = latencia ~80-160ms). El string fuerza
        // AAUDIO_PERFORMANCE_MODE_LOW_LATENCY cuando es posible.
        this.contexto = new AudioContextClass({ latencyHint: 'interactive' });
        this.bancos = new Map();

        this.nodoGananciaPrincipal = this.contexto.createGain();
        this.nodoGananciaPrincipal.gain.setValueAtTime(0.85, this.contexto.currentTime);
        this.nodoGananciaPrincipal.connect(this.contexto.destination);

        this.filtroBajos = this.contexto.createBiquadFilter();
        this.filtroBajos.type = 'lowshelf';
        this.filtroBajos.frequency.value = 320;

        this.filtroMedios = this.contexto.createBiquadFilter();
        this.filtroMedios.type = 'peaking';
        this.filtroMedios.frequency.value = 1000;
        this.filtroMedios.Q.value = 0.7;

        this.filtroAltos = this.contexto.createBiquadFilter();
        this.filtroAltos.type = 'highshelf';
        this.filtroAltos.frequency.value = 3200;

        this.filtroBajos.connect(this.filtroMedios);
        this.filtroMedios.connect(this.filtroAltos);
        this.filtroAltos.connect(this.nodoGananciaPrincipal);

        this.mixBus = this.contexto.createGain();
        this.mixBus.connect(this.filtroBajos);

        this.reverbGanancia = this.contexto.createGain();
        this.reverbGanancia.gain.value = 0;

        this.reverbNode = this.contexto.createConvolver();
        this._crearImpulsoSintetico();
        this.mixBus.connect(this.reverbNode);
        this.reverbNode.connect(this.reverbGanancia);
        this.reverbGanancia.connect(this.nodoGananciaPrincipal);

        // 🎯 Android latency optimization: bus directo (sin EQ ni reverb) que se usa
        // cuando ningun efecto está activo. Ahorra 3 BiquadFilters + ConvolverNode en
        // el path de cada voz, reduciendo latencia y carga de CPU en devices low-end.
        // Cuando se activa EQ o reverb (PracticaLibre, Replays), se conmuta a mixBus.
        this.directBus = this.contexto.createGain();
        this.directBus.connect(this.nodoGananciaPrincipal);

        this._inicializarPool();
        this._iniciarKeepAlive();

        document.addEventListener('visibilitychange', () => this.activarContexto());
        window.addEventListener('focus', () => this.activarContexto());
    }

    // Mantiene el AudioContext "caliente" con un buffer silencioso en loop.
    // Sin esto, el contexto entra en modo de bajo poder entre toques y, al volver
    // a usarse, hay un wake-up cost de 30-100ms. Especialmente notorio en Android
    // Chrome donde AAudio cae a modo NORMAL si detecta inactividad.
    // El gain está en 0 absoluto: completamente inaudible, pero mantiene el pipeline
    // de audio en LOW_LATENCY.
    private _iniciarKeepAlive() {
        try {
            const buffer = this.contexto.createBuffer(1, this.contexto.sampleRate, this.contexto.sampleRate);
            const source = this.contexto.createBufferSource();
            source.buffer = buffer;
            source.loop = true;
            const gain = this.contexto.createGain();
            gain.gain.value = 0;
            source.connect(gain);
            gain.connect(this.contexto.destination);
            source.start(0);
        } catch (_) { }
    }

    private _inicializarPool() {
        for (let i = 0; i < this.MAX_VOCES; i++) {
            const ganancia = this.contexto.createGain();
            ganancia.gain.setValueAtTime(0, this.contexto.currentTime);
            ganancia.connect(this.directBus);
            this.poolVoces.push({ ganancia, fuente: null, ocupada: false, tiempo: 0 });
        }
    }

    // Conmuta el routing del pool entre directBus (sin EQ/reverb) y mixBus (con efectos).
    // Hacerlo a nivel de pool en vez de por voz evita reconectar nodos durante reproducción.
    private _conmutarRuta(usarFiltros: boolean) {
        if (usarFiltros === this.rutaConFiltros) return;
        const desde = this.rutaConFiltros ? this.mixBus : this.directBus;
        const hasta = usarFiltros ? this.mixBus : this.directBus;
        this.poolVoces.forEach(voz => {
            try { voz.ganancia.disconnect(desde); } catch (_) { }
            try { voz.ganancia.connect(hasta); } catch (_) { }
        });
        this.rutaConFiltros = usarFiltros;
    }

    private _evaluarRuta() {
        const necesitaFiltros = this.targetEQ.bajos !== 0 || this.targetEQ.medios !== 0 || this.targetEQ.altos !== 0 || this.targetReverb > 0;
        this._conmutarRuta(necesitaFiltros);
    }

    private _crearImpulsoSintetico() {
        const duracion = 1.5;
        const rate = this.contexto.sampleRate;
        const length = rate * duracion;
        const buffer = this.contexto.createBuffer(2, length, rate);
        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
            }
        }
        this.reverbNode.buffer = buffer;
    }

    actualizarEQ(bajos: number, medios: number, altos: number) {
        const cTime = this.contexto.currentTime;
        this.filtroBajos.gain.setTargetAtTime(bajos, cTime, 0.05);
        this.filtroMedios.gain.setTargetAtTime(medios, cTime, 0.05);
        this.filtroAltos.gain.setTargetAtTime(altos, cTime, 0.05);
        this.targetEQ = { bajos, medios, altos };
        this._evaluarRuta();
    }

    actualizarReverb(cantidad: number) {
        this.reverbGanancia.gain.setTargetAtTime(cantidad * 0.5, this.contexto.currentTime, 0.05);
        this.targetReverb = cantidad;
        this._evaluarRuta();
    }

    private _obtenerVozLibre(): VozPooled {
        let voz = this.poolVoces.find(v => !v.ocupada);
        if (!voz) {
            voz = this.poolVoces.reduce((oldest, v) =>
                v.tiempo < oldest.tiempo ? v : oldest, this.poolVoces[0]);
            this._liberarVoz(voz);
        }
        return voz;
    }

    private _liberarVoz(voz: VozPooled) {
        if (voz.fuente) {
            try { voz.fuente.onended = null; voz.fuente.stop(); voz.fuente.disconnect(); } catch (_) { }
            voz.fuente = null;
        }
        try {
            voz.ganancia.gain.cancelScheduledValues(this.contexto.currentTime);
            voz.ganancia.gain.setTargetAtTime(0, this.contexto.currentTime, 0.015);
        } catch (_) { }
        voz.ocupada = false;
    }

    async activarContexto() {
        if (this.contexto.state === 'suspended' || this.contexto.state === 'interrupted') {
            try { await this.contexto.resume(); } catch (_) { }
        }
        // Log de latencia para diagnostico en mobile (solo se imprime una vez).
        if (!(this as any)._latenciaLogueada) {
            (this as any)._latenciaLogueada = true;
            try {
                const ctx: any = this.contexto;
                const baseMs = (ctx.baseLatency || 0) * 1000;
                const outputMs = (ctx.outputLatency || 0) * 1000;
                console.log(`[motorAudioPro] sampleRate=${ctx.sampleRate}Hz | baseLatency=${baseMs.toFixed(1)}ms | outputLatency=${outputMs.toFixed(1)}ms | state=${ctx.state}`);
            } catch (_) { }
        }
    }

    obtenerBanco(id: string, nombre: string): BancoSonido {
        if (!this.bancos.has(id)) {
            this.bancos.set(id, { id, nombre, muestras: new Map(), offsets: new Map() });
        }
        return this.bancos.get(id)!;
    }

    async cargarSonidoEnBanco(bancoId: string, idSonido: string, url: string): Promise<void> {
        const banco = this.obtenerBanco(bancoId, bancoId);
        await _cargarSonido(banco, idSonido, url, this.contexto);
    }

    reproducir(idSonido: string, bancoId: string, volumen: number = 1.0, semitonos: number = 0, loop: boolean = false, tiempoProgramado?: number, duracionSec?: number): { fuente: AudioBufferSourceNode, ganancia: GainNode, tiempo: number } | null {
        const banco = this.bancos.get(bancoId);
        if (!banco || !this.contexto) return null;
        const buffer = banco.muestras.get(idSonido);
        const offset = banco.offsets.get(idSonido) || 0;
        if (!buffer) return null;

        const voz = this._obtenerVozLibre();
        voz.ocupada = true;
        const cTime = this.contexto.currentTime;
        const startTime = tiempoProgramado !== undefined ? Math.max(cTime, cTime + tiempoProgramado) : cTime;
        voz.tiempo = startTime;

        const fuente = this.contexto.createBufferSource();
        fuente.buffer = buffer;
        fuente.loop = loop;
        if (semitonos !== 0) fuente.playbackRate.value = Math.pow(2, semitonos / 12);
        fuente.connect(voz.ganancia);
        voz.ganancia.gain.cancelScheduledValues(cTime);
        voz.ganancia.gain.setValueAtTime(volumen, startTime);
        fuente.start(startTime, offset);
        voz.fuente = fuente;

        if (duracionSec !== undefined && duracionSec > 0) {
            const endTime = startTime + duracionSec;
            const fadeDur = Math.min(0.02, duracionSec / 2);
            voz.ganancia.gain.setTargetAtTime(0, endTime - fadeDur, fadeDur);
            fuente.stop(endTime + 0.01);
        }

        fuente.onended = () => {
            if (voz.fuente === fuente) {
                try { fuente.disconnect(); } catch (_) { }
                voz.fuente = null;
                try { voz.ganancia.gain.setTargetAtTime(0, this.contexto.currentTime, 0.015); } catch (_) { }
                voz.ocupada = false;
            }
        };

        return { fuente, ganancia: voz.ganancia, tiempo: startTime };
    }

    detener(instancia: { fuente: AudioBufferSourceNode, ganancia: GainNode }, rapidez: number = 0.01, tiempoProgramado?: number) {
        try {
            const ahora = tiempoProgramado !== undefined ? Math.max(this.contexto.currentTime, this.contexto.currentTime + tiempoProgramado) : this.contexto.currentTime;
            const g = instancia.ganancia.gain;
            g.cancelScheduledValues(ahora);
            g.setTargetAtTime(0, ahora, rapidez > 0 ? rapidez : 0.015);
            instancia.fuente.stop(ahora + (rapidez * 2) + 0.01);
        } catch (_) { }
    }

    detenerTodo(rapidez: number = 0.012) {
        const ahora = this.contexto.currentTime;
        this.poolVoces.forEach(voz => {
            if (voz.ocupada && voz.fuente) {
                try {
                    voz.ganancia.gain.cancelScheduledValues(ahora);
                    voz.ganancia.gain.setTargetAtTime(0, ahora, rapidez > 0 ? rapidez : 0.015);
                    voz.fuente.stop(ahora + (rapidez * 2) + 0.002);
                } catch (_) { }
                voz.fuente = null;
                voz.ocupada = false;
            }
        });
    }

    limpiarBanco(bancoId: string) {
        const banco = this.bancos.get(bancoId);
        if (banco) { banco.muestras.clear(); banco.offsets.clear(); }
    }

    setVolumenMaestro(volumen: number, tiempoRampa: number = 0.05) {
        if (!this.nodoGananciaPrincipal) return;
        const cTime = this.contexto.currentTime;
        this.nodoGananciaPrincipal.gain.cancelScheduledValues(cTime);
        this.nodoGananciaPrincipal.gain.setTargetAtTime(volumen, cTime, tiempoRampa);
    }

    get tiempoActual() { return this.contexto.currentTime; }
    get contextoAudio() { return this.contexto; }

    /**
     * Rutea un HTMLAudioElement (MP3 de fondo) a través del MISMO AudioContext que las notas.
     * Sin esto, el MP3 sale por un pipeline distinto del browser (HTMLAudio decoder) y las notas por Web Audio
     * → latencias diferentes → desincronización. Conectándolo aquí, ambos pasan por la misma cadena → mismas
     * latencias → notas y MP3 alineados deterministamente. Patrón canónico (Chris Wilson "A Tale of Two Clocks").
     *
     * Devuelve el GainNode que controla el volumen del MP3 (NO usar audio.volume después de conectar — hacerlo
     * por aquí para control sample-accurate). createMediaElementSource solo se puede llamar UNA vez por elemento;
     * el WeakMap evita errores en re-conexiones.
     */
    /**
     * Devuelve el HTMLAudio compartido para el modo Maestro. Lazy create.
     * El llamador puede usarlo directamente como audioElExterno de
     * ReproductorMP3PreservaTono.
     */
    obtenerAudioMaestro(): HTMLAudioElement {
        if (!this._audioMaestroEl) {
            const a = new Audio();
            a.preload = 'auto';
            a.crossOrigin = 'anonymous';
            (a as any).preservesPitch = true;
            (a as any).mozPreservesPitch = true;
            (a as any).webkitPreservesPitch = true;
            this._audioMaestroEl = a;
        }
        return this._audioMaestroEl;
    }

    /**
     * Desbloquea el HTMLAudio Maestro durante un gesto del usuario.
     * Se debe llamar dentro de un onClick (EMPEZAR / Otra vez / Practicar)
     * SINCRONO. Asi el iniciarJuego que sigue en useEffect puede llamar
     * play() sobre el mismo elemento sin chocar con la politica de
     * autoplay de iOS / Chrome Android.
     *
     * Si url se pasa, se setea como src para que el browser empiece a
     * descargar inmediatamente — minimiza la espera del audioListo.
     */
    cebarAudioMaestro(url?: string): void {
        const a = this.obtenerAudioMaestro();
        if (url && a.src !== url) {
            a.src = url;
        }
        a.muted = true;
        const p = a.play();
        if (p && typeof p.then === 'function') {
            p.then(() => {
                a.pause();
                a.muted = false;
            }).catch(() => {
                a.muted = false;
            });
        }
    }

    conectarMediaElement(audio: HTMLAudioElement): GainNode {
        const existente = this.mediaElementSources.get(audio);
        if (existente) return existente.gain;
        const source = this.contexto.createMediaElementSource(audio);
        const gain = this.contexto.createGain();
        gain.gain.value = 1;
        source.connect(gain);
        // Directo al destination, no por los filtros EQ del acordeón (el MP3 no debe filtrarse).
        gain.connect(this.contexto.destination);
        this.mediaElementSources.set(audio, { source, gain });
        return gain;
    }
}

export const motorAudioPro = new MotorAudioPro();
(window as any).motorAudioPro = motorAudioPro;
