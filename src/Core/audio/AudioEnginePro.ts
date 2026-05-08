import type { BancoSonido, VozPooled } from './_tipos';
import { cargarSonidoEnBanco as _cargarSonido } from './_cargador';

export type { BancoSonido };

// ─── Presets de Reverb (impulse responses sintéticos) ──────────────────────
// Basado en Moorer "About This Reverberation Business": ruido blanco con
// decay exponencial es un IR sorprendentemente convincente. Cada preset
// modela un espacio distinto cambiando duración, decay shape, pre-delay,
// reflexiones tempranas y filtrado tonal (brillo).
export interface ReverbPreset {
    duracion: number;           // segundos del cuerpo del IR (cola)
    preDelay: number;           // segundos de silencio antes del cuerpo (sensación de distancia)
    decayShape: number;         // exponente del decay (mayor = más rápido = más seco)
    earlyRefl: number[];        // tiempos en segundos de las reflexiones tempranas
    amplitudReflexiones: number; // 0..1 amplitud de los pulsos discretos
    brillo: number;             // <1 más cálido (graves), >1 más brillante (agudos)
}

export type PresetReverbId =
    | 'cuarto_mediano'
    | 'cuarto_grande'
    | 'vestibulo_mediano'
    | 'vestibulo_grande'
    | 'escenario_abierto';

export const PRESETS_REVERB: Record<PresetReverbId, ReverbPreset> = {
    // Cuarto seco y rápido: simula una sala de ensayo pequeña con decay corto.
    cuarto_mediano: {
        duracion: 0.7, preDelay: 0.005, decayShape: 3.5,
        earlyRefl: [0.012, 0.025], amplitudReflexiones: 0.4, brillo: 1.0,
    },
    // Sala de tamaño medio con cola perceptible y reflexiones más espaciadas.
    cuarto_grande: {
        duracion: 1.4, preDelay: 0.012, decayShape: 2.6,
        earlyRefl: [0.020, 0.040, 0.065], amplitudReflexiones: 0.42, brillo: 0.95,
    },
    // Vestíbulo / lobby con cola larga y tonalidad ligeramente cálida.
    vestibulo_mediano: {
        duracion: 2.2, preDelay: 0.025, decayShape: 2.0,
        earlyRefl: [0.030, 0.060, 0.090, 0.130], amplitudReflexiones: 0.38, brillo: 0.85,
    },
    // Vestíbulo grande tipo iglesia/teatro: cola muy larga, mucho cuerpo en bajos.
    vestibulo_grande: {
        duracion: 3.5, preDelay: 0.040, decayShape: 1.7,
        earlyRefl: [0.040, 0.080, 0.120, 0.170], amplitudReflexiones: 0.35, brillo: 0.78,
    },
    // Escenario abierto: pre-delay grande (sensación de distancia), reflexiones
    // dispersas (sin paredes cercanas), decay medio con brillo presente.
    escenario_abierto: {
        duracion: 1.8, preDelay: 0.060, decayShape: 1.6,
        earlyRefl: [0.050, 0.100, 0.150, 0.210], amplitudReflexiones: 0.5, brillo: 1.1,
    },
};

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

    // Sub-buses con volumen + pan stereo independientes para teclado y bajos.
    // Permiten que el alumno controle ambos por separado en el panel de efectos
    // sin tocar el routing principal (latencia Android intacta — añadimos solo
    // 2 GainNode + 2 StereoPannerNode al path de las notas, ~0.5ms total).
    private busTeclado!: GainNode;
    private busBajos!: GainNode;
    private panTeclado!: StereoPannerNode;
    private panBajos!: StereoPannerNode;
    // Cache de elementos HTMLAudio ruteados por Web Audio (createMediaElementSource solo se puede llamar una vez por elemento).
    private mediaElementSources: WeakMap<HTMLAudioElement, { source: MediaElementAudioSourceNode; gain: GainNode }> = new WeakMap();

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

        // Sub-buses con pan: las voces del pool se ruteán a uno u otro según
        // sea pito (teclado) o bajo. Cada bus tiene su propia ganancia + pan
        // stereo, controlables independientemente desde el panel de efectos.
        // Conectados al directBus por default (sin filtros = latencia mínima).
        this.busTeclado = this.contexto.createGain();
        this.panTeclado = this.contexto.createStereoPanner();
        this.busTeclado.connect(this.panTeclado);
        this.panTeclado.connect(this.directBus);

        this.busBajos = this.contexto.createGain();
        this.panBajos = this.contexto.createStereoPanner();
        this.busBajos.connect(this.panBajos);
        this.panBajos.connect(this.directBus);

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
            // Default al busTeclado. Cuando reproducir() detecta que es un bajo
            // (seccion='bajos' o ruta con '/Bajos/'), reconecta al busBajos.
            ganancia.connect(this.busTeclado);
            this.poolVoces.push({ ganancia, fuente: null, ocupada: false, tiempo: 0, seccion: 'teclado' });
        }
    }

    // Conmuta el routing entre directBus (sin EQ/reverb) y mixBus (con efectos).
    // Reconectamos los SUB-BUSES (no el pool) — así el routing por sección
    // (teclado/bajos) se preserva y solo cambia el destino global.
    private _conmutarRuta(usarFiltros: boolean) {
        if (usarFiltros === this.rutaConFiltros) return;
        const destino = usarFiltros ? this.mixBus : this.directBus;
        try { this.panTeclado.disconnect(); } catch (_) { }
        try { this.panBajos.disconnect(); } catch (_) { }
        this.panTeclado.connect(destino);
        this.panBajos.connect(destino);
        this.rutaConFiltros = usarFiltros;
    }

    private _evaluarRuta() {
        const necesitaFiltros = this.targetEQ.bajos !== 0 || this.targetEQ.medios !== 0 || this.targetEQ.altos !== 0 || this.targetReverb > 0;
        this._conmutarRuta(necesitaFiltros);
    }

    // Generador de impulse response sintético basado en el paper de Moorer
    // ("About This Reverberation Business"): ruido blanco con decay exponencial.
    // Agregamos pre-delay (silencio inicial) y early reflections (pulsos discretos
    // sobre el ataque) para dar sensación de espacio realista. Cada canal usa
    // ruido descorrelacionado para sensación estéreo.
    private _generarIRSintetico(preset: ReverbPreset): AudioBuffer {
        const { duracion, preDelay, decayShape, earlyRefl, amplitudReflexiones, brillo } = preset;
        const sampleRate = this.contexto.sampleRate;
        const totalLength = Math.floor((preDelay + duracion) * sampleRate);
        const preDelayLength = Math.floor(preDelay * sampleRate);
        const buffer = this.contexto.createBuffer(2, totalLength, sampleRate);

        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            const bodyLength = totalLength - preDelayLength;
            // Cuerpo principal: ruido blanco con decay exponencial. El brillo
            // simula filtrado tonal: <1 atenúa agudos (más cálido), >1 los realza.
            let prev = 0;
            const filterFactor = Math.max(0.05, Math.min(0.6, 0.3 / brillo));
            for (let i = 0; i < bodyLength; i++) {
                const t = i / bodyLength;
                const ruido = (Math.random() * 2 - 1) * Math.pow(1 - t, decayShape);
                // Filtro IIR de un polo (lowpass simple): suaviza el ruido
                // según el brillo. Más cálido = más filtrado.
                prev = prev * (1 - filterFactor) + ruido * filterFactor;
                data[preDelayLength + i] = prev * brillo;
            }
            // Early reflections: pulsos discretos en los primeros ms con
            // descorrelación estéreo para amplitud espacial.
            earlyRefl.forEach((tiempo, idx) => {
                const offset = ch === 0 ? 0 : Math.floor(0.0007 * sampleRate);
                const sampleIdx = Math.floor(tiempo * sampleRate) + offset;
                if (sampleIdx < totalLength) {
                    const factorAtenuacion = amplitudReflexiones * (1 - idx / Math.max(earlyRefl.length, 1));
                    data[sampleIdx] += (Math.random() * 2 - 1) * factorAtenuacion;
                }
            });
        }
        return buffer;
    }

    private _crearImpulsoSintetico() {
        // Default: cuarto grande (preset balanceado para arranque).
        this.reverbNode.buffer = this._generarIRSintetico(PRESETS_REVERB.cuarto_grande);
    }

    /**
     * Cambia el preset del reverb regenerando el impulse response. La intensidad
     * (gain del wet) se mantiene — solo cambia la "personalidad" del espacio.
     */
    cargarPresetReverb(presetId: PresetReverbId) {
        const preset = PRESETS_REVERB[presetId];
        if (!preset || !this.reverbNode) return;
        this.reverbNode.buffer = this._generarIRSintetico(preset);
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
        // Factor 0.85 (antes 0.5): el alumno pidió que el efecto se sintiera
        // más perceptible. Por encima de 1.0 empieza a saturar el wet — 0.85
        // da presencia clara sin distorsión audible incluso en intensidad 100%.
        this.reverbGanancia.gain.setTargetAtTime(cantidad * 0.85, this.contexto.currentTime, 0.05);
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

    reproducir(idSonido: string, bancoId: string, volumen: number = 1.0, semitonos: number = 0, loop: boolean = false, tiempoProgramado?: number, duracionSec?: number, seccion?: 'teclado' | 'bajos'): { fuente: AudioBufferSourceNode, ganancia: GainNode, tiempo: number } | null {
        const banco = this.bancos.get(bancoId);
        if (!banco || !this.contexto) return null;
        const buffer = banco.muestras.get(idSonido);
        const offset = banco.offsets.get(idSonido) || 0;
        if (!buffer) return null;

        const voz = this._obtenerVozLibre();
        voz.ocupada = true;

        // Detección automática de sección si no viene explícita: el cargador
        // usa rutas que contienen "/Bajos/" para los samples de bajos.
        const seccionFinal: 'teclado' | 'bajos' = seccion
            ?? (idSonido.includes('/Bajos/') || idSonido.includes('Bajos') ? 'bajos' : 'teclado');
        if (voz.seccion !== seccionFinal) {
            const destino = seccionFinal === 'bajos' ? this.busBajos : this.busTeclado;
            try { voz.ganancia.disconnect(); } catch (_) { }
            try { voz.ganancia.connect(destino); } catch (_) { }
            voz.seccion = seccionFinal;
        }
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

    // ─── Sub-buses TECLADO / BAJOS ──────────────────────────────────────────
    // Volumen 0..1 y pan -1..1 (izquierda → derecha) con ramp de 30ms para
    // evitar zipper noise en sliders de UI.
    setVolumenBusTeclado(volumen: number) {
        if (!this.busTeclado) return;
        this.busTeclado.gain.setTargetAtTime(Math.max(0, Math.min(1, volumen)), this.contexto.currentTime, 0.03);
    }

    setVolumenBusBajos(volumen: number) {
        if (!this.busBajos) return;
        this.busBajos.gain.setTargetAtTime(Math.max(0, Math.min(1, volumen)), this.contexto.currentTime, 0.03);
    }

    setPanTeclado(pan: number) {
        if (!this.panTeclado) return;
        this.panTeclado.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), this.contexto.currentTime, 0.03);
    }

    setPanBajos(pan: number) {
        if (!this.panBajos) return;
        this.panBajos.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), this.contexto.currentTime, 0.03);
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
