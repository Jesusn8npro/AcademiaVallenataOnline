import type { BancoSonido, VozPooled } from './_tipos';
import { cargarSonidoEnBanco as _cargarSonido } from './_cargador';

export type { BancoSonido };

// ─── Presets de Reverb (impulse responses sintéticos) ──────────────────────
// Cada preset genera un IR distinto en runtime — sin archivos extra, sin
// descargas. La diferencia entre presets NO es solo duración: cada uno tiene
// un carácter tonal que cambia completamente la forma en que el generador
// construye el IR.
//
// - natural: ruido blanco con decay exp + early reflections (rooms / halls)
// - metallic: red densa de echoes Schroeder con feedback (Plate Lexicon-style)
// - spring: decay modulado con chorus (muelle de ampli vintage)
// - open: pocas reflexiones discretas, slap audible (escenario / cañón)
// - cave: oscuro, lowpass duro, ecos lejanos espaciados (cueva)
// - tile: brillante reflectivo, early refl muy marcadas (baño / garaje)
// - tunnel: slap echoes regulares con ping-pong stereo (túnel)
// - phone: bandpass angosto sin graves ni agudos (cabina / radio antigua)
// - tape: modulación lenta + ruido suave (cinta vintage)
// - shimmer: brillo extra con armónicos sumados (efecto angelical)
export interface ReverbPreset {
    duracion: number;            // segundos del cuerpo del IR (cola)
    preDelay: number;            // segundos de silencio antes del cuerpo
    decayShape: number;          // exponente del decay (mayor = más rápido = más seco)
    earlyRefl: number[];         // tiempos en segundos de las reflexiones tempranas
    amplitudReflexiones: number; // 0..1 amplitud de los pulsos discretos
    brillo: number;              // <1 más cálido, >1 más brillante (filtro tonal global)
    damping: number;             // 0..1 cuánto se atenúan los agudos a lo largo del decay (alto = catedral)
    difusion: number;            // 0..1 densidad de echoes (alto = plate)
    modulacion: number;          // 0..1 cantidad de chorus aplicado al IR (spring/tape)
    modulacionFreq: number;      // Hz de la modulación
    caracter:
        | 'natural' | 'metallic' | 'spring' | 'open'
        | 'cave' | 'tile' | 'tunnel' | 'phone' | 'tape' | 'shimmer';
}

export type PresetReverbId =
    // Pequeños / secos
    | 'habitacion' | 'estudio' | 'cuarto_mediano' | 'garaje'
    // Medianos
    | 'sala_ensayo' | 'cuarto_grande' | 'club'
    // Grandes
    | 'vestibulo_mediano' | 'iglesia' | 'vestibulo_grande' | 'catedral' | 'cueva' | 'arena'
    // Aire libre / espacios abiertos
    | 'escenario_abierto' | 'canon' | 'bosque'
    // Vintage / efectos especiales
    | 'tunel' | 'cabina' | 'plate' | 'spring' | 'tape_vintage' | 'shimmer';

export const PRESETS_REVERB: Record<PresetReverbId, ReverbPreset> = {
    // ─── Pequeños / secos ─────────────────────────────────────────────────
    habitacion: {
        duracion: 0.4, preDelay: 0.002, decayShape: 4.5,
        earlyRefl: [0.006, 0.013], amplitudReflexiones: 0.30, brillo: 1.05,
        damping: 0.15, difusion: 0.30, modulacion: 0, modulacionFreq: 0,
        caracter: 'natural',
    },
    estudio: {
        duracion: 0.6, preDelay: 0.004, decayShape: 4.0,
        earlyRefl: [0.005, 0.011, 0.018, 0.026], amplitudReflexiones: 0.55, brillo: 1.30,
        damping: 0.05, difusion: 0.55, modulacion: 0, modulacionFreq: 0,
        caracter: 'tile',
    },
    cuarto_mediano: {
        duracion: 0.9, preDelay: 0.006, decayShape: 3.2,
        earlyRefl: [0.012, 0.025, 0.038], amplitudReflexiones: 0.38, brillo: 1.0,
        damping: 0.20, difusion: 0.40, modulacion: 0, modulacionFreq: 0,
        caracter: 'natural',
    },
    garaje: {
        duracion: 1.1, preDelay: 0.008, decayShape: 2.8,
        // Tile pequeño con muchas reflexiones brillantes y slap audible
        earlyRefl: [0.014, 0.028, 0.044, 0.060, 0.078], amplitudReflexiones: 0.65, brillo: 1.25,
        damping: 0.10, difusion: 0.40, modulacion: 0, modulacionFreq: 0,
        caracter: 'tile',
    },

    // ─── Medianos ─────────────────────────────────────────────────────────
    sala_ensayo: {
        duracion: 1.3, preDelay: 0.010, decayShape: 2.8,
        earlyRefl: [0.018, 0.035, 0.055], amplitudReflexiones: 0.42, brillo: 0.85,
        damping: 0.40, difusion: 0.45, modulacion: 0, modulacionFreq: 0,
        caracter: 'natural',
    },
    cuarto_grande: {
        duracion: 1.6, preDelay: 0.014, decayShape: 2.4,
        earlyRefl: [0.022, 0.045, 0.070, 0.095], amplitudReflexiones: 0.42, brillo: 0.95,
        damping: 0.25, difusion: 0.50, modulacion: 0, modulacionFreq: 0,
        caracter: 'natural',
    },
    club: {
        duracion: 1.9, preDelay: 0.018, decayShape: 2.2,
        earlyRefl: [0.025, 0.055, 0.085, 0.120], amplitudReflexiones: 0.50, brillo: 0.75,
        damping: 0.55, difusion: 0.75, modulacion: 0, modulacionFreq: 0,
        caracter: 'natural',
    },

    // ─── Grandes ──────────────────────────────────────────────────────────
    vestibulo_mediano: {
        duracion: 2.4, preDelay: 0.025, decayShape: 1.9,
        earlyRefl: [0.030, 0.060, 0.090, 0.130], amplitudReflexiones: 0.38, brillo: 0.95,
        damping: 0.30, difusion: 0.55, modulacion: 0, modulacionFreq: 0,
        caracter: 'natural',
    },
    iglesia: {
        duracion: 3.2, preDelay: 0.035, decayShape: 1.8,
        earlyRefl: [0.040, 0.080, 0.130, 0.190], amplitudReflexiones: 0.40, brillo: 0.70,
        damping: 0.65, difusion: 0.60, modulacion: 0, modulacionFreq: 0,
        caracter: 'natural',
    },
    vestibulo_grande: {
        duracion: 3.8, preDelay: 0.045, decayShape: 1.6,
        earlyRefl: [0.045, 0.090, 0.140, 0.200], amplitudReflexiones: 0.35, brillo: 1.05,
        damping: 0.35, difusion: 0.50, modulacion: 0, modulacionFreq: 0,
        caracter: 'natural',
    },
    catedral: {
        duracion: 6.0, preDelay: 0.060, decayShape: 1.2,
        earlyRefl: [0.055, 0.110, 0.175, 0.250, 0.330], amplitudReflexiones: 0.32, brillo: 0.55,
        damping: 0.85, difusion: 0.55, modulacion: 0, modulacionFreq: 0,
        caracter: 'natural',
    },
    cueva: {
        duracion: 4.5, preDelay: 0.040, decayShape: 1.5,
        // Cave: ecos lejanos espaciados, lowpass duro (ambiente oscuro y húmedo)
        earlyRefl: [0.075, 0.155, 0.245, 0.355, 0.490], amplitudReflexiones: 0.55, brillo: 0.45,
        damping: 0.70, difusion: 0.40, modulacion: 0, modulacionFreq: 0,
        caracter: 'cave',
    },
    arena: {
        duracion: 4.8, preDelay: 0.050, decayShape: 1.4,
        // Estadio enorme: cola larguísima, brillante, reflexiones dispersas
        earlyRefl: [0.060, 0.130, 0.210, 0.310, 0.430, 0.580], amplitudReflexiones: 0.45, brillo: 1.10,
        damping: 0.45, difusion: 0.40, modulacion: 0, modulacionFreq: 0,
        caracter: 'open',
    },

    // ─── Aire libre / espacios abiertos ───────────────────────────────────
    escenario_abierto: {
        duracion: 1.8, preDelay: 0.060, decayShape: 1.7,
        earlyRefl: [0.050, 0.100, 0.150, 0.210], amplitudReflexiones: 0.50, brillo: 1.1,
        damping: 0.20, difusion: 0.30, modulacion: 0, modulacionFreq: 0,
        caracter: 'open',
    },
    canon: {
        duracion: 4.5, preDelay: 0.080, decayShape: 1.4,
        earlyRefl: [0.090, 0.190, 0.310, 0.470, 0.680, 0.920], amplitudReflexiones: 0.75, brillo: 0.95,
        damping: 0.35, difusion: 0.15, modulacion: 0, modulacionFreq: 0,
        caracter: 'open',
    },
    bosque: {
        duracion: 2.2, preDelay: 0.045, decayShape: 1.8,
        // Bosque: pocas reflexiones suaves, mucho damping de agudos por la vegetación
        earlyRefl: [0.040, 0.090, 0.150, 0.220, 0.310], amplitudReflexiones: 0.30, brillo: 0.65,
        damping: 0.55, difusion: 0.50, modulacion: 0, modulacionFreq: 0,
        caracter: 'open',
    },

    // ─── Vintage / efectos especiales ─────────────────────────────────────
    tunel: {
        duracion: 2.8, preDelay: 0.025, decayShape: 1.7,
        earlyRefl: [], amplitudReflexiones: 0, brillo: 0.90,
        damping: 0.40, difusion: 0.50, modulacion: 0, modulacionFreq: 0,
        caracter: 'tunnel',
    },
    cabina: {
        duracion: 0.5, preDelay: 0.002, decayShape: 4.0,
        earlyRefl: [], amplitudReflexiones: 0, brillo: 1.0,
        damping: 0.30, difusion: 0.85, modulacion: 0, modulacionFreq: 0,
        caracter: 'phone',
    },
    plate: {
        duracion: 2.0, preDelay: 0.005, decayShape: 2.0,
        earlyRefl: [], amplitudReflexiones: 0, brillo: 1.20,
        damping: 0.05, difusion: 0.95, modulacion: 0, modulacionFreq: 0,
        caracter: 'metallic',
    },
    spring: {
        duracion: 1.5, preDelay: 0.003, decayShape: 2.4,
        earlyRefl: [], amplitudReflexiones: 0, brillo: 0.85,
        damping: 0.25, difusion: 0.70, modulacion: 0.65, modulacionFreq: 5.5,
        caracter: 'spring',
    },
    tape_vintage: {
        duracion: 1.8, preDelay: 0.012, decayShape: 2.2,
        earlyRefl: [], amplitudReflexiones: 0, brillo: 0.75,
        damping: 0.45, difusion: 0.60, modulacion: 0.30, modulacionFreq: 0.8,
        caracter: 'tape',
    },
    shimmer: {
        duracion: 3.0, preDelay: 0.020, decayShape: 1.6,
        earlyRefl: [], amplitudReflexiones: 0, brillo: 1.40,
        damping: 0.10, difusion: 0.65, modulacion: 0, modulacionFreq: 0,
        caracter: 'shimmer',
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

    // Generador de impulse response sintético con 4 caracteres tonales que
    // producen sonidos completamente distintos (no solo duraciones distintas).
    //
    // - 'natural'  → ruido blanco con decay exp + early refl (rooms / halls)
    // - 'metallic' → red de echoes Schroeder con feedback denso (Plate vintage)
    // - 'spring'   → decay con modulación tipo chorus (muelle de amp)
    // - 'open'     → pocas reflexiones bien marcadas (espacio abierto / cañón)
    //
    // El damping se aplica como filtro lowpass cuyo cutoff se reduce con el
    // tiempo, modelando que en espacios grandes los agudos mueren primero.
    private _generarIRSintetico(preset: ReverbPreset): AudioBuffer {
        const { caracter } = preset;
        if (caracter === 'metallic') return this._irMetallic(preset);
        if (caracter === 'spring')   return this._irSpring(preset);
        if (caracter === 'cave')     return this._irCave(preset);
        if (caracter === 'tile')     return this._irTile(preset);
        if (caracter === 'tunnel')   return this._irTunnel(preset);
        if (caracter === 'phone')    return this._irPhone(preset);
        if (caracter === 'tape')     return this._irTape(preset);
        if (caracter === 'shimmer')  return this._irShimmer(preset);
        // 'natural' y 'open' comparten el mismo motor; difieren en parámetros
        // (cantidad y separación de reflexiones, decayShape, brillo).
        return this._irNatural(preset);
    }

    // Cuerpos naturales (rooms, halls, escenarios): ruido decorrelacionado por
    // canal con decay exponencial y damping progresivo de agudos.
    private _irNatural(preset: ReverbPreset): AudioBuffer {
        const { duracion, preDelay, decayShape, earlyRefl, amplitudReflexiones, brillo, damping } = preset;
        const sampleRate = this.contexto.sampleRate;
        const totalLength = Math.floor((preDelay + duracion) * sampleRate);
        const preDelayLength = Math.floor(preDelay * sampleRate);
        const buffer = this.contexto.createBuffer(2, totalLength, sampleRate);

        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            const bodyLength = totalLength - preDelayLength;
            // Filtro lowpass de un polo. El factor base depende del brillo;
            // damping añade un decremento extra a lo largo del decay para que
            // los agudos mueran antes que los graves (clave en catedrales).
            let prev = 0;
            const filterBase = Math.max(0.05, Math.min(0.6, 0.3 / brillo));
            for (let i = 0; i < bodyLength; i++) {
                const t = i / bodyLength;
                const dampFactor = filterBase * (1 - damping * t);
                const ff = Math.max(0.02, dampFactor);
                const ruido = (Math.random() * 2 - 1) * Math.pow(1 - t, decayShape);
                prev = prev * (1 - ff) + ruido * ff;
                data[preDelayLength + i] = prev * brillo;
            }
            // Early reflections con descorrelación estéreo.
            earlyRefl.forEach((tiempo, idx) => {
                const offset = ch === 0 ? 0 : Math.floor(0.0007 * sampleRate);
                const sampleIdx = Math.floor(tiempo * sampleRate) + offset;
                if (sampleIdx < totalLength) {
                    const factor = amplitudReflexiones * (1 - idx / Math.max(earlyRefl.length, 1));
                    data[sampleIdx] += (Math.random() * 2 - 1) * factor;
                }
            });
        }
        return buffer;
    }

    // Plate-style: red densa de echoes con feedback. Suena denso, brillante y
    // metálico. La técnica clave es sumar varias líneas de delay primas entre
    // sí (Schroeder) para evitar que los echoes se alineen y produzcan tonos.
    private _irMetallic(preset: ReverbPreset): AudioBuffer {
        const { duracion, preDelay, decayShape, brillo, difusion, damping } = preset;
        const sampleRate = this.contexto.sampleRate;
        const totalLength = Math.floor((preDelay + duracion) * sampleRate);
        const preDelayLength = Math.floor(preDelay * sampleRate);
        const buffer = this.contexto.createBuffer(2, totalLength, sampleRate);

        // Delays primos (en samples) — Schroeder/Moorer plate-like.
        const delaysSeg = [0.0043, 0.0067, 0.0091, 0.0113, 0.0137, 0.0163, 0.0181, 0.0211];
        const numDelays = Math.max(4, Math.floor(4 + difusion * 4));

        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            const bodyLength = totalLength - preDelayLength;

            // Impulso inicial brillante en cada canal (descorrelacionado).
            data[preDelayLength] = ch === 0 ? 0.6 : 0.55;

            // Sumar trenes de delays con feedback decreciente.
            for (let d = 0; d < numDelays; d++) {
                const delaySamples = Math.floor(delaysSeg[d] * sampleRate * (ch === 0 ? 1 : 1.03));
                const feedback = 0.85 - d * 0.04;
                let pos = preDelayLength + delaySamples;
                let amp = 0.4;
                while (pos < totalLength && amp > 0.001) {
                    data[pos] += (Math.random() * 2 - 1) * amp;
                    pos += delaySamples;
                    amp *= feedback;
                }
            }

            // Decay exponencial global + damping de agudos.
            let prev = 0;
            const filterBase = Math.max(0.1, Math.min(0.7, 0.4 / brillo));
            for (let i = 0; i < bodyLength; i++) {
                const t = i / bodyLength;
                const idx = preDelayLength + i;
                const envelope = Math.pow(1 - t, decayShape);
                const ff = Math.max(0.05, filterBase * (1 - damping * t));
                prev = prev * (1 - ff) + data[idx] * ff;
                data[idx] = prev * envelope * brillo;
            }
        }
        return buffer;
    }

    // Spring-style: decay corto con fuerte modulación tipo chorus (boing). El
    // pitch del IR se modula con un LFO senoidal — efecto característico de
    // los muelles de los amplificadores de guitarra vintage.
    private _irSpring(preset: ReverbPreset): AudioBuffer {
        const { duracion, preDelay, decayShape, brillo, modulacion, modulacionFreq, damping } = preset;
        const sampleRate = this.contexto.sampleRate;
        const totalLength = Math.floor((preDelay + duracion) * sampleRate);
        const preDelayLength = Math.floor(preDelay * sampleRate);
        const buffer = this.contexto.createBuffer(2, totalLength, sampleRate);

        // Generamos primero un IR base con muchos echoes cercanos.
        const base = new Float32Array(totalLength);
        const delaysSeg = [0.011, 0.017, 0.023, 0.029];
        for (const dSeg of delaysSeg) {
            const dSamples = Math.floor(dSeg * sampleRate);
            let pos = preDelayLength + dSamples;
            let amp = 0.5;
            while (pos < totalLength && amp > 0.001) {
                base[pos] += (Math.random() * 2 - 1) * amp;
                pos += dSamples;
                amp *= 0.75;
            }
        }

        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            const bodyLength = totalLength - preDelayLength;

            // Aplicamos modulación: leemos del IR base con un offset que oscila
            // a `modulacionFreq` Hz. Esto introduce el pitch wobble del muelle.
            const fasePh = ch === 0 ? 0 : Math.PI / 2;
            const maxOffset = modulacion * 0.004 * sampleRate; // ms de pitch shift
            let prev = 0;
            const filterBase = Math.max(0.1, Math.min(0.6, 0.35 / brillo));
            for (let i = 0; i < bodyLength; i++) {
                const t = i / bodyLength;
                const idx = preDelayLength + i;
                const lfo = Math.sin(2 * Math.PI * modulacionFreq * (i / sampleRate) + fasePh);
                const offset = Math.floor(lfo * maxOffset);
                const readIdx = Math.max(0, Math.min(totalLength - 1, idx + offset));
                const envelope = Math.pow(1 - t, decayShape);
                const sample = base[readIdx] * envelope;
                const ff = Math.max(0.05, filterBase * (1 - damping * t));
                prev = prev * (1 - ff) + sample * ff;
                data[idx] = prev * brillo;
            }
        }
        return buffer;
    }

    // Cave: oscuro, lowpass agresivo desde el inicio + ecos lejanos espaciados.
    // Suena húmedo y ahogado, característico de cuevas naturales.
    private _irCave(preset: ReverbPreset): AudioBuffer {
        const { duracion, preDelay, decayShape, earlyRefl, amplitudReflexiones, brillo, damping } = preset;
        const sampleRate = this.contexto.sampleRate;
        const totalLength = Math.floor((preDelay + duracion) * sampleRate);
        const preDelayLength = Math.floor(preDelay * sampleRate);
        const buffer = this.contexto.createBuffer(2, totalLength, sampleRate);

        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            const bodyLength = totalLength - preDelayLength;
            // Lowpass MUY duro (filterBase muy bajo) — los agudos casi no entran.
            let prev = 0, prev2 = 0;
            const filterBase = Math.max(0.02, Math.min(0.18, 0.12 / brillo));
            for (let i = 0; i < bodyLength; i++) {
                const t = i / bodyLength;
                const ff = Math.max(0.01, filterBase * (1 - damping * t * 0.7));
                const ruido = (Math.random() * 2 - 1) * Math.pow(1 - t, decayShape);
                // Doble polo lowpass para corte más pronunciado (tipo cueva).
                prev = prev * (1 - ff) + ruido * ff;
                prev2 = prev2 * (1 - ff) + prev * ff;
                data[preDelayLength + i] = prev2 * brillo;
            }
            // Ecos lejanos discretos: cada uno suena casi como un slap distante.
            earlyRefl.forEach((tiempo, idx) => {
                const offset = ch === 0 ? 0 : Math.floor(0.0015 * sampleRate);
                const sampleIdx = Math.floor(tiempo * sampleRate) + offset;
                if (sampleIdx < totalLength) {
                    const factor = amplitudReflexiones * (1 - idx / Math.max(earlyRefl.length, 1));
                    // Cada eco lleva un pequeño tail (no es solo un click).
                    for (let k = 0; k < 200 && sampleIdx + k < totalLength; k++) {
                        data[sampleIdx + k] += (Math.random() * 2 - 1) * factor * Math.exp(-k / 50);
                    }
                }
            });
        }
        return buffer;
    }

    // Tile: reflexiones tempranas MUY marcadas y brillantes (baño / garaje).
    // El cuerpo es corto pero el ataque es percusivo y reflectivo.
    private _irTile(preset: ReverbPreset): AudioBuffer {
        const { duracion, preDelay, decayShape, earlyRefl, amplitudReflexiones, brillo, damping, difusion } = preset;
        const sampleRate = this.contexto.sampleRate;
        const totalLength = Math.floor((preDelay + duracion) * sampleRate);
        const preDelayLength = Math.floor(preDelay * sampleRate);
        const buffer = this.contexto.createBuffer(2, totalLength, sampleRate);

        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            const bodyLength = totalLength - preDelayLength;
            // Cuerpo brillante (filterBase ALTO = poco filtrado de agudos).
            let prev = 0;
            const filterBase = Math.max(0.3, Math.min(0.85, 0.55 / Math.max(0.5, 1 / brillo)));
            for (let i = 0; i < bodyLength; i++) {
                const t = i / bodyLength;
                const ff = Math.max(0.1, filterBase * (1 - damping * t));
                const ruido = (Math.random() * 2 - 1) * Math.pow(1 - t, decayShape);
                prev = prev * (1 - ff) + ruido * ff;
                data[preDelayLength + i] = prev * brillo;
            }
            // Reflexiones extra brillantes y densas (azulejo, vidrio).
            const reflBoost = 1.4;
            earlyRefl.forEach((tiempo, idx) => {
                const offset = ch === 0 ? 0 : Math.floor(0.0005 * sampleRate);
                const sampleIdx = Math.floor(tiempo * sampleRate) + offset;
                if (sampleIdx < totalLength) {
                    const factor = amplitudReflexiones * reflBoost * (1 - idx / Math.max(earlyRefl.length, 1));
                    data[sampleIdx] += (Math.random() * 2 - 1) * factor;
                }
            });
            // Reflexiones secundarias agregadas por difusion (más densidad = más tile).
            const extraRefl = Math.floor(difusion * 12);
            for (let k = 0; k < extraRefl; k++) {
                const t = 0.02 + Math.random() * 0.15;
                const sampleIdx = preDelayLength + Math.floor(t * sampleRate);
                if (sampleIdx < totalLength) {
                    data[sampleIdx] += (Math.random() * 2 - 1) * 0.18;
                }
            }
        }
        return buffer;
    }

    // Tunnel: slap echoes regulares con ping-pong stereo (eco direccional).
    // Cada repetición se atenúa pero mantiene su carácter de eco discreto.
    private _irTunnel(preset: ReverbPreset): AudioBuffer {
        const { duracion, preDelay, decayShape, brillo, damping } = preset;
        const sampleRate = this.contexto.sampleRate;
        const totalLength = Math.floor((preDelay + duracion) * sampleRate);
        const preDelayLength = Math.floor(preDelay * sampleRate);
        const buffer = this.contexto.createBuffer(2, totalLength, sampleRate);

        // Espaciado del slap (~150ms) y feedback decreciente.
        const slapMs = 0.150;
        const slapSamples = Math.floor(slapMs * sampleRate);

        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            const bodyLength = totalLength - preDelayLength;
            // Slaps alternados L/R (ping-pong)
            let pos = preDelayLength + (ch === 0 ? slapSamples : Math.floor(slapSamples * 1.5));
            let amp = 0.7;
            let count = 0;
            while (pos < totalLength && amp > 0.005) {
                // Cada slap es un pulso corto con decay propio (~30ms).
                for (let k = 0; k < 1500 && pos + k < totalLength; k++) {
                    data[pos + k] += (Math.random() * 2 - 1) * amp * Math.exp(-k / 350);
                }
                pos += slapSamples * 2; // ping-pong: 2× separación entre slaps del mismo canal
                amp *= 0.65;
                count++;
            }
            // Cuerpo tenue debajo de los slaps (cola del túnel).
            let prev = 0;
            const filterBase = Math.max(0.1, Math.min(0.35, 0.22 / brillo));
            for (let i = 0; i < bodyLength; i++) {
                const t = i / bodyLength;
                const ff = Math.max(0.02, filterBase * (1 - damping * t));
                const ruido = (Math.random() * 2 - 1) * Math.pow(1 - t, decayShape) * 0.25;
                prev = prev * (1 - ff) + ruido * ff;
                data[preDelayLength + i] += prev * brillo;
            }
        }
        return buffer;
    }

    // Phone: bandpass angosto (sin graves ni agudos), tipo cabina o radio antigua.
    // Suena lo-fi, comprimido y con presencia solo en medios.
    private _irPhone(preset: ReverbPreset): AudioBuffer {
        const { duracion, preDelay, decayShape, brillo, damping } = preset;
        const sampleRate = this.contexto.sampleRate;
        const totalLength = Math.floor((preDelay + duracion) * sampleRate);
        const preDelayLength = Math.floor(preDelay * sampleRate);
        const buffer = this.contexto.createBuffer(2, totalLength, sampleRate);

        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            const bodyLength = totalLength - preDelayLength;
            // Bandpass = highpass + lowpass en cascada. Centrado en ~1-2 kHz.
            let lp = 0, hp = 0;
            const lpCoef = 0.30; // corta agudos
            const hpCoef = 0.05; // corta graves (0=mucho corte, 1=ninguno)
            for (let i = 0; i < bodyLength; i++) {
                const t = i / bodyLength;
                const ff = Math.max(0.05, lpCoef * (1 - damping * t));
                const ruido = (Math.random() * 2 - 1) * Math.pow(1 - t, decayShape);
                lp = lp * (1 - ff) + ruido * ff;
                hp = hp * (1 - hpCoef) + (lp - hp) * hpCoef;
                data[preDelayLength + i] = (lp - hp) * brillo * 1.5;
            }
        }
        return buffer;
    }

    // Tape vintage: cuerpo cálido + modulación lenta (wow/flutter de cinta).
    // Suena suave, oscuro, con leve oscilación de pitch (rolloff de cinta).
    private _irTape(preset: ReverbPreset): AudioBuffer {
        const { duracion, preDelay, decayShape, brillo, damping, modulacion, modulacionFreq } = preset;
        const sampleRate = this.contexto.sampleRate;
        const totalLength = Math.floor((preDelay + duracion) * sampleRate);
        const preDelayLength = Math.floor(preDelay * sampleRate);
        const buffer = this.contexto.createBuffer(2, totalLength, sampleRate);

        // Generamos primero un IR base cálido.
        const base = new Float32Array(totalLength);
        let prev = 0;
        const filterBase = 0.18; // lowpass cálido permanente (cinta no tiene agudos)
        for (let i = 0; i < totalLength - preDelayLength; i++) {
            const t = i / (totalLength - preDelayLength);
            const ruido = (Math.random() * 2 - 1) * Math.pow(1 - t, decayShape);
            prev = prev * (1 - filterBase) + ruido * filterBase;
            base[preDelayLength + i] = prev;
        }

        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            const bodyLength = totalLength - preDelayLength;
            // Wow/flutter: modulación lenta del read offset (simula el motor de la cinta).
            const fasePh = ch === 0 ? 0 : Math.PI / 3;
            const maxOffset = modulacion * 0.0025 * sampleRate;
            for (let i = 0; i < bodyLength; i++) {
                const t = i / bodyLength;
                const idx = preDelayLength + i;
                const lfo = Math.sin(2 * Math.PI * modulacionFreq * (i / sampleRate) + fasePh);
                const offset = Math.floor(lfo * maxOffset);
                const readIdx = Math.max(0, Math.min(totalLength - 1, idx + offset));
                // Tape "noise" sutil (hiss característico).
                const hiss = (Math.random() * 2 - 1) * 0.015 * (1 - damping * t);
                data[idx] = (base[readIdx] + hiss) * brillo * Math.pow(1 - t, 0.4);
            }
        }
        return buffer;
    }

    // Shimmer: brillo extra agregando un IR base + un IR brillante con armónicos
    // simulados (sumando ruido filtrado en bandas altas separadas). Crea un
    // efecto angelical/etéreo característico de pedales tipo Big Sky / EHX.
    private _irShimmer(preset: ReverbPreset): AudioBuffer {
        const { duracion, preDelay, decayShape, brillo, damping, difusion } = preset;
        const sampleRate = this.contexto.sampleRate;
        const totalLength = Math.floor((preDelay + duracion) * sampleRate);
        const preDelayLength = Math.floor(preDelay * sampleRate);
        const buffer = this.contexto.createBuffer(2, totalLength, sampleRate);

        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            const bodyLength = totalLength - preDelayLength;
            // Cuerpo principal brillante.
            let prev = 0;
            const filterBase = 0.45;
            for (let i = 0; i < bodyLength; i++) {
                const t = i / bodyLength;
                const ff = Math.max(0.1, filterBase * (1 - damping * t));
                const ruido = (Math.random() * 2 - 1) * Math.pow(1 - t, decayShape);
                prev = prev * (1 - ff) + ruido * ff;
                data[preDelayLength + i] = prev * brillo;
            }
            // Capa "shimmer": ruido alta frecuencia que crece y decrece (armónicos
            // simulados). Descorrelacionado entre canales para amplitud espacial.
            const shimmerAmt = difusion * 0.4;
            for (let i = 0; i < bodyLength; i++) {
                const t = i / bodyLength;
                // Envelope con fade-in lento (50ms) + decay con la cola
                const fadeIn = Math.min(1, i / (sampleRate * 0.05));
                const env = fadeIn * Math.pow(1 - t, decayShape * 0.6);
                // Ruido de alta frecuencia (alterna +/- a sample rate completo)
                const hf = ((i + ch * 7) & 1 ? 1 : -1) * Math.random();
                data[preDelayLength + i] += hf * env * shimmerAmt;
            }
        }
        return buffer;
    }

    private _crearImpulsoSintetico() {
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
