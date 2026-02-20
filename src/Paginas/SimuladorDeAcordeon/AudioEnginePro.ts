/**
 * 🚀 MOTOR DE AUDIO - V24.0 (Zero-Latency Mobile & Hardcore Keep-Alive)
 * 
 * CAMBIOS CRÍTICOS V4.5 → V5.0 → V24.0:
 * PROBLEMA: createBufferSource() + createGain() + connect() en Android tarda 20-80ms.
 * SOLUCIÓN 1: Eliminar DynamicsCompressor (el más costoso en CPU móvil, +15ms por nota).
 * SOLUCIÓN 2: latencyHint: 0 (número cero, NO string) = latencia mínima absoluta del hardware.
 * SOLUCIÓN 3: Ataque de ganancia directo — sin rampas exponenciales, setValueAtTime puro.
 * SOLUCIÓN 4: Pool de GainNodes pre-conectados por voz — no crear en el momento del toque.
 * SOLUCIÓN 5: Zombie Mode V2.0 (ScriptProcessor) para evitar suspensión en single-touch.
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
    public contexto: AudioContext;
    private bancos: Map<string, BancoSonido>;
    private nodoGananciaPrincipal: GainNode;
    private MAX_VOCES = 24;
    private esMovil = false;

    // 🏊 POOL DE VOCES PRE-CONECTADAS
    private poolVoces: VozPooled[] = [];

    constructor() {
        this.esMovil = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;

        // ⚡ latencyHint: 'interactive' = Balance ideal entre latencia y estabilidad
        // Aunque 0 es teóricamente más rápido, 'interactive' evita glitches en dispositivos gama media.
        const opcionesContexto: AudioContextOptions = {
            latencyHint: 'interactive'
        };

        if (this.esMovil) {
            this.MAX_VOCES = 20;
            console.log("📱 Motor V24.0 Móvil: latencyHint=interactive, pool pre-conectado (20 voces)");
        } else {
            this.MAX_VOCES = 48;
            console.log("💻 Motor V24.0 Escritorio: pool máximo (48 voces)");
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
                console.log("🔊 AudioContext V24.0 reanimado.");
                this.iniciarKeepAlive();
            } catch (e) {
                console.error("❌ No se pudo reanimar el AudioContext:", e);
            }
        } else {
            this.iniciarKeepAlive();
        }
    }

    /**
     * 🧟 ZOMBIE MODE V2.0 (HARDCORE KEEP-ALIVE)
     * El oscilador simple a veces es ignorado por optimizaciones de batería.
     * Usamos un ScriptProcessor (técnica legacy robusta) para forzar al
     * hilo de audio a procesar bloques constantemente.
     */
    private keepAliveNode: ScriptProcessorNode | null = null;
    private keepAliveOscillator: OscillatorNode | null = null;

    private iniciarKeepAlive() {
        if (this.keepAliveNode || this.keepAliveOscillator) return;

        try {
            // 1. Oscilador base (60Hz para asegurar que pase filtros DC offset)
            const osc = this.contexto.createOscillator();
            osc.type = 'sawtooth'; // Onda más rica que seno para evitar compresión
            osc.frequency.value = 60;

            // 2. Ganancia infinitesimal (inaudible pero matemáticamente significativa)
            const gain = this.contexto.createGain();
            gain.gain.value = 0.000001;

            // 3. ScriptProcessor: El "Latido" del Audio
            // Forzamos al navegador a procesar audio en el hilo principal
            // Esto evita que Chrome suspenda la actividad de audio por "inactividad"
            const bufferSize = 4096;
            const scriptNode = this.contexto.createScriptProcessor(bufferSize, 1, 1);

            scriptNode.onaudioprocess = (e) => {
                const output = e.outputBuffer.getChannelData(0);
                // Generar ruido blanco aleatorio de muy baja amplitud
                // Esto asegura que cada buffer sea único y el navegador no optimice "silencio"
                for (let i = 0; i < bufferSize; i++) {
                    output[i] = (Math.random() * 2 - 1) * 0.000001;
                }
            };

            osc.connect(gain);
            gain.connect(scriptNode);
            scriptNode.connect(this.contexto.destination);
            // Conectar también directo para redundancia
            gain.connect(this.contexto.destination);

            osc.start();

            this.keepAliveOscillator = osc;
            this.keepAliveNode = scriptNode;

            console.log("🧟 Audio Zombie Mode V2.0 (HARDCORE) ACTIVADO");
        } catch (e) {
            console.warn("No se pudo iniciar Keep-Alive V2:", e);
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
     * Detención con Release Suave (Evita Clics)
     */
    detener(instancia: { fuente: AudioBufferSourceNode, ganancia: GainNode }, rapidez: number = 0.05) {
        try {
            const ahora = this.contexto.currentTime;
            const g = instancia.ganancia.gain;

            // Cancelar cambios programados previos
            g.cancelScheduledValues(ahora);

            // Fijar el valor actual explícitamente para evitar saltos
            g.setValueAtTime(g.value, ahora);

            // Release exponencial suave hacia casi cero (0.001)
            g.exponentialRampToValueAtTime(0.001, ahora + rapidez);

            // Detener el oscilador/fuente un poco después para asegurar silencio total
            instancia.fuente.stop(ahora + rapidez + 0.01);
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
