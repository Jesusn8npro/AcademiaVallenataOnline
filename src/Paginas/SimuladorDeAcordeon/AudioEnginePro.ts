/**
 * 🚀 MOTOR DE AUDIO - V5.0 (Zero-Latency Mobile)
 * 
 * CAMBIOS CRÍTICOS V4.5 → V5.0:
 * PROBLEMA: createBufferSource() + createGain() + connect() en Android tarda 20-80ms.
 * SOLUCIÓN 1: Eliminar DynamicsCompressor (el más costoso en CPU móvil, +15ms por nota).
 * SOLUCIÓN 2: latencyHint: 0 (número cero, NO string) = latencia mínima absoluta del hardware.
 * SOLUCIÓN 3: Ataque de ganancia directo — sin rampas exponenciales, setValueAtTime puro.
 * SOLUCIÓN 4: Pool de GainNodes pre-conectados por voz — no crear en el momento del toque.
 */

export interface BancoSonido {
    id: string;
    nombre: string;
    muestras: Map<string, AudioBuffer>;
    offsets: Map<string, number>;
}

// Voz pre-conectada al grafo. Solo necesitamos hacer start() en el momento del toque.
interface VozPooled {
    ganancia: GainNode;
    fuente: AudioBufferSourceNode | null;
    ocupada: boolean;
    tiempo: number;
}

export class MotorAudioPro {
    private contexto: AudioContext;
    private bancos: Map<string, BancoSonido>;
    private nodoGananciaPrincipal: GainNode;
    private MAX_VOCES = 24;
    private esMovil = false;

    // 🏊 POOL DE VOCES PRE-CONECTADAS
    private poolVoces: VozPooled[] = [];

    constructor() {
        this.esMovil = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;

        // ⚡ latencyHint: 0 (número) = MÍNIMA LATENCIA ABSOLUTA del hardware
        // Diferencia crítica: latencyHint: 'interactive' puede ser 40ms, latencyHint: 0 es ~5ms
        const opcionesContexto: AudioContextOptions = {
            latencyHint: 0
        };

        if (this.esMovil) {
            this.MAX_VOCES = 20;
            console.log("📱 Motor V5.0 Móvil: latencyHint=0, sin compresor, pool pre-conectado (20 voces)");
        } else {
            this.MAX_VOCES = 48;
            console.log("💻 Motor V5.0 Escritorio: latencyHint=0, pool máximo (48 voces)");
        }

        this.contexto = new AudioContextClass(opcionesContexto);
        this.bancos = new Map();

        // NODO PRINCIPAL: Solo ganancia, SIN compresor
        // El DynamicsCompressor costaba ~15ms extra de procesamiento por nota en Android
        this.nodoGananciaPrincipal = this.contexto.createGain();
        this.nodoGananciaPrincipal.gain.setValueAtTime(0.85, this.contexto.currentTime);
        this.nodoGananciaPrincipal.connect(this.contexto.destination);

        // 🏊 PRE-CREAR EL POOL DE VOCES
        // Cada voz tiene su GainNode YA CONECTADO al grafo.
        // En el momento del toque, solo hacemos: voz.ganancia.gain = volumen → fuente.start()
        this._inicializarPool();

        document.addEventListener('visibilitychange', () => this.activarContexto());
        window.addEventListener('focus', () => this.activarContexto());
    }

    private _inicializarPool() {
        for (let i = 0; i < this.MAX_VOCES; i++) {
            const ganancia = this.contexto.createGain();
            ganancia.gain.setValueAtTime(0, this.contexto.currentTime);
            ganancia.connect(this.nodoGananciaPrincipal);
            this.poolVoces.push({ ganancia, fuente: null, ocupada: false, tiempo: 0 });
        }
    }

    private _obtenerVozLibre(): VozPooled {
        // Buscar voz libre
        let voz = this.poolVoces.find(v => !v.ocupada);

        // Voice stealing: robar la voz más antigua si no hay libres
        if (!voz) {
            voz = this.poolVoces.reduce((oldest, v) =>
                v.tiempo < oldest.tiempo ? v : oldest, this.poolVoces[0]);
            this._liberarVoz(voz);
        }

        return voz;
    }

    private _liberarVoz(voz: VozPooled) {
        if (voz.fuente) {
            try {
                voz.fuente.onended = null;
                voz.fuente.stop();
                voz.fuente.disconnect();
            } catch (_) { }
            voz.fuente = null;
        }
        // Silenciar inmediatamente su GainNode (sigue conectado al grafo)
        try {
            voz.ganancia.gain.cancelScheduledValues(this.contexto.currentTime);
            voz.ganancia.gain.setValueAtTime(0, this.contexto.currentTime);
        } catch (_) { }
        voz.ocupada = false;
    }

    async activarContexto() {
        if (this.contexto.state === 'suspended' || this.contexto.state === 'interrupted') {
            try {
                await this.contexto.resume();
                console.log("🔊 AudioContext V5.0 reanimado.");
            } catch (e) {
                console.error("❌ No se pudo reanimar el AudioContext:", e);
            }
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
        if (banco.muestras.has(idSonido)) return;

        try {
            const respuesta = await fetch(url);
            if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

            const arrayBuffer = await respuesta.arrayBuffer();
            const audioBuffer = await this.contexto.decodeAudioData(arrayBuffer);
            const offset = this.detectarInicioReal(audioBuffer);

            banco.muestras.set(idSonido, audioBuffer);
            banco.offsets.set(idSonido, offset);
        } catch (error) {
            console.error(`❌ Error cargando sonido [${idSonido}]:`, error);
        }
    }

    private detectarInicioReal(buffer: AudioBuffer): number {
        const datos = buffer.getChannelData(0);
        const umbral = 0.005;
        for (let i = 0; i < datos.length; i++) {
            if (Math.abs(datos[i]) > umbral) {
                return Math.max(0, (i / buffer.sampleRate) - 0.002);
            }
        }
        return 0;
    }

    /**
     * 🎯 REPRODUCIR V5.0
     * 
     * ANTES (V4.5): createBufferSource() + createGain() + connect() en el momento del toque → 20-80ms lag
     * AHORA (V5.0): La GainNode YA está conectada. Solo creamos el SourceNode (el más barato) + start().
     * 
     * AudioBufferSourceNode es de un solo uso por spec — no se puede evitar crearlo.
     * Pero eliminamos todo lo demás del camino crítico.
     */
    reproducir(idSonido: string, bancoId: string, volumen: number = 1.0, semitonos: number = 0, loop: boolean = false): { fuente: AudioBufferSourceNode, ganancia: GainNode, tiempo: number } | null {
        const banco = this.bancos.get(bancoId);
        if (!banco || !this.contexto) return null;

        const buffer = banco.muestras.get(idSonido);
        const offset = banco.offsets.get(idSonido) || 0;
        if (!buffer) return null;

        // ⚡ OBTENER VOZ DEL POOL (GainNode ya conectado)
        const voz = this._obtenerVozLibre();
        voz.ocupada = true;
        voz.tiempo = this.contexto.currentTime;

        // ⚡ SOLO creamos el SourceNode (obligatorio por spec Web Audio)
        const fuente = this.contexto.createBufferSource();
        fuente.buffer = buffer;
        fuente.loop = loop;

        if (semitonos !== 0) {
            fuente.playbackRate.value = Math.pow(2, semitonos / 12);
        }

        // Conectar fuente → GainNode del pool (GainNode ya → destino)
        fuente.connect(voz.ganancia);

        // ⚡ ACTIVAR GANANCIA DIRECTAMENTE — sin rampas costosas
        voz.ganancia.gain.cancelScheduledValues(voz.tiempo);
        voz.ganancia.gain.setValueAtTime(volumen, voz.tiempo);

        fuente.start(voz.tiempo, offset);
        voz.fuente = fuente;

        const instancia = { fuente, ganancia: voz.ganancia, tiempo: voz.tiempo };

        fuente.onended = () => {
            try { fuente.disconnect(); } catch (_) { }
            voz.fuente = null;
            // Silenciar la ganancia para que no interfiera con la próxima nota
            try { voz.ganancia.gain.setValueAtTime(0, this.contexto.currentTime); } catch (_) { }
            voz.ocupada = false;
        };

        return instancia;
    }

    /**
     * Detención ultra-rápida
     */
    detener(instancia: { fuente: AudioBufferSourceNode, ganancia: GainNode }, rapidez: number = 0.01) {
        try {
            const ahora = this.contexto.currentTime;
            const g = instancia.ganancia.gain;
            g.cancelScheduledValues(ahora);
            g.setValueAtTime(0, ahora + rapidez);
            instancia.fuente.stop(ahora + rapidez + 0.002);
        } catch (err) {
            // Silencioso — es normal que falle si ya terminó
        }
    }

    /**
     * 🧹 LIMPIEZA TOTAL (Para cambios de fuelle rápidos)
     */
    detenerTodo(rapidez: number = 0.012) {
        const ahora = this.contexto.currentTime;
        this.poolVoces.forEach(voz => {
            if (voz.ocupada && voz.fuente) {
                try {
                    voz.ganancia.gain.cancelScheduledValues(ahora);
                    voz.ganancia.gain.setValueAtTime(0, ahora + rapidez);
                    voz.fuente.stop(ahora + rapidez + 0.002);
                } catch (_) { }
                voz.fuente = null;
                voz.ocupada = false;
            }
        });
    }

    limpiarBanco(bancoId: string) {
        const banco = this.bancos.get(bancoId);
        if (banco) {
            banco.muestras.clear();
            banco.offsets.clear();
        }
    }

    get tiempoActual() {
        return this.contexto.currentTime;
    }
}

export const motorAudioPro = new MotorAudioPro();
