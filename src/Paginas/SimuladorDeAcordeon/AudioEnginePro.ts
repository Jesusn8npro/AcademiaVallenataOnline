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

const BANK_RELEASE_DELAY = 1000;

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
            this.MAX_VOCES = 128;
            console.log("💻 Motor V5.0 Escritorio: latencyHint=0, pool máximo (128 voces)");
        }

        this.contexto = new AudioContextClass(opcionesContexto);
        this.bancos = new Map();

        // 1. NODO PRINCIPAL: Ganancia Final
        this.nodoGananciaPrincipal = this.contexto.createGain();
        this.nodoGananciaPrincipal.gain.setValueAtTime(0.85, this.contexto.currentTime);
        this.nodoGananciaPrincipal.connect(this.contexto.destination);

        // 2. EQUALIZADOR (3 Bandas)
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

        // Conectar EQ en cadena
        this.filtroBajos.connect(this.filtroMedios);
        this.filtroMedios.connect(this.filtroAltos);
        this.filtroAltos.connect(this.nodoGananciaPrincipal);

        // 3. REVERB (Algoritmica simple o por Convolver si hay impulso)
        // Por ahora usaremos un GainNode intermedio para el EQ -> Principal
        // y un envío paralelo para la Reverb.
        this.mixBus = this.contexto.createGain();
        this.mixBus.connect(this.filtroBajos);

        this.reverbGanancia = this.contexto.createGain();
        this.reverbGanancia.gain.value = 0; // Seco por defecto
        
        // Simulación de reverb simple (Delay + Feedback) si no tenemos impulso
        // Para vallenato, un delay corto y múltiple funciona bien.
        // Pero para ser pros, intentaremos crear un buffer de impulso sintético corto.
        this.reverbNode = this.contexto.createConvolver();
        this._crearImpulsoSintetico();
        
        this.mixBus.connect(this.reverbNode);
        this.reverbNode.connect(this.reverbGanancia);
        this.reverbGanancia.connect(this.nodoGananciaPrincipal);

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
            ganancia.connect(this.mixBus); // Conectado al MixBus que tiene el EQ
            this.poolVoces.push({ ganancia, fuente: null, ocupada: false, tiempo: 0 });
        }
    }

    private _crearImpulsoSintetico() {
        const duracion = 1.5;
        const rate = this.contexto.sampleRate;
        const length = rate * duracion;
        const buffer = this.contexto.createBuffer(2, length, rate);
        
        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                // Ruido blanco que decae exponencialmente
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
            }
        }
        this.reverbNode.buffer = buffer;
    }

    private mixBus: GainNode;
    private filtroBajos!: BiquadFilterNode;
    private filtroMedios!: BiquadFilterNode;
    private filtroAltos!: BiquadFilterNode;
    private reverbNode!: ConvolverNode;
    private reverbGanancia!: GainNode;

    /**
     * Actualiza el ecualizador en tiempo real
     */
    actualizarEQ(bajos: number, medios: number, altos: number) {
        const cTime = this.contexto.currentTime;
        this.filtroBajos.gain.setTargetAtTime(bajos, cTime, 0.05);
        this.filtroMedios.gain.setTargetAtTime(medios, cTime, 0.05);
        this.filtroAltos.gain.setTargetAtTime(altos, cTime, 0.05);
    }

    /**
     * Actualiza la mezcla de reverb (0 a 1)
     */
    actualizarReverb(cantidad: number) {
        const cTime = this.contexto.currentTime;
        // Ajustamos la curva para que se sienta natural
        this.reverbGanancia.gain.setTargetAtTime(cantidad * 0.5, cTime, 0.05);
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
            voz.ganancia.gain.setTargetAtTime(0, this.contexto.currentTime, 0.015);
        } catch (_) { }
        voz.ocupada = false;
    }

    async activarContexto() {
        if (this.contexto.state === 'suspended' || this.contexto.state === 'interrupted') {
            try {
                await this.contexto.resume();
                // console.log("🔊 AudioContext V5.0 reanimado.");
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
        
        // 1. Verificación de Memoria RAM (Ultra-rápido)
        if (banco.muestras.has(idSonido)) return;

        // 🔍 LOG DIAGNÓSTICO (Oculto)
        // console.log(`%c 📥 CARGANDO [${bancoId.slice(0,8)}] ${url} `, 'background:#0f766e;color:white;padding:2px;border-radius:3px;font-size:10px;');

        try {
            const cacheName = 'sim-audios-v3'; // v3 = ARCHIVOS CONVERTIDOS RECIENTES (30KB+)
            let audioData: ArrayBuffer | null = null;

            // 2. Intento desde Cache API (Persistencia en disco)
            try {
                const cache = await caches.open(cacheName);
                const cachedResponse = await cache.match(url);

                if (cachedResponse) {
                    audioData = await cachedResponse.arrayBuffer();
                    // console.log(`  ✅ DESDE CACHÉ: ${url}`);
                } else {
                    // 3. Descarga desde Red/Supabase (Solo si no está en caché)
                    // console.log(`  📡 [RED] Descargando: ${url}`);
                    const respuesta = await fetch(url);
                    if (!respuesta.ok) {
                        console.error(`  ❌ HTTP ${respuesta.status} al descargar: ${url}`);
                        throw new Error(`HTTP ${respuesta.status}`);
                    }
                    // console.log(`  ✅ Descargado OK (${respuesta.headers.get('content-type')}): ${url}`);

                    // Guardar en caché para la próxima vez
                    const respuestaACachear = respuesta.clone();
                    await cache.put(url, respuestaACachear);
                    audioData = await respuesta.arrayBuffer();
                }
            } catch (cacheError) {
                // Fallback si la Cache API falla por alguna razón (ej. modo incógnito)
                // console.warn(`  ⚠️ Cache API falló, intentando fetch directo: ${url}`);
                const respuesta = await fetch(url);
                if (!respuesta.ok) {
                    console.error(`  ❌ HTTP ${respuesta.status} (fallback) al descargar: ${url}`);
                    throw new Error(`HTTP ${respuesta.status}`);
                }
                audioData = await respuesta.arrayBuffer();
            }

            if (!audioData) return;

            // 4. Decodificación y almacenamiento en RAM
            const audioBuffer = await this.contexto.decodeAudioData(audioData);
            const offset = this.detectarInicioReal(audioBuffer);

            banco.muestras.set(idSonido, audioBuffer);
            banco.offsets.set(idSonido, offset);
            // console.log(`  🎵 Decoded OK → banco['${bancoId.slice(0,8)}']['${idSonido.slice(-30)}']`);
        } catch (error) {
            console.error(`❌ Error en motor de audio [${idSonido}]:`, error);
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

        if (semitonos !== 0) {
            fuente.playbackRate.value = Math.pow(2, semitonos / 12);
        }

        fuente.connect(voz.ganancia);

        voz.ganancia.gain.cancelScheduledValues(cTime);
        voz.ganancia.gain.setValueAtTime(volumen, startTime);

        fuente.start(startTime, offset);
        voz.fuente = fuente;

        // 🛡️ REGLA DE ORO: Si conocemos la duración (Secuenciador), programamos el fin 
        // directamente en el hardware. Esto previene notas pegadas aunque el JS colapse.
        if (duracionSec !== undefined && duracionSec > 0) {
            const endTime = startTime + duracionSec;
            const fadeDur = Math.min(0.02, duracionSec / 2);
            voz.ganancia.gain.setTargetAtTime(0, endTime - fadeDur, fadeDur);
            fuente.stop(endTime + 0.01);
        }

        const instancia = { fuente, ganancia: voz.ganancia, tiempo: startTime };

        fuente.onended = () => {
            if (voz.fuente === fuente) {
                try { fuente.disconnect(); } catch (_) { }
                voz.fuente = null;
                try { voz.ganancia.gain.setTargetAtTime(0, this.contexto.currentTime, 0.015); } catch (_) { }
                voz.ocupada = false;
            }
        };

        return instancia;
    }

    /**
     * Detención ultra-rápida
     */
    detener(instancia: { fuente: AudioBufferSourceNode, ganancia: GainNode }, rapidez: number = 0.01, tiempoProgramado?: number) {
        try {
            const ahora = tiempoProgramado !== undefined ? Math.max(this.contexto.currentTime, this.contexto.currentTime + tiempoProgramado) : this.contexto.currentTime;
            const g = instancia.ganancia.gain;
            
            // 🔥 BULLETPROOF STOP: Usa RC curve exponent (setTargetAtTime) que es atómico
            // No depende de anclar el estado actual como linearRamp, por lo que nunca
            // sufrirá del bug de "nota congelada en el futuro" de Chromium/WebKit.
            g.cancelScheduledValues(ahora);
            g.setTargetAtTime(0, ahora, rapidez > 0 ? rapidez : 0.015);
            
            instancia.fuente.stop(ahora + (rapidez * 2) + 0.01);
        } catch (err) {
            // Silencioso
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
        if (banco) {
            banco.muestras.clear();
            banco.offsets.clear();
        }
    }

    /**
     * 🔊 CONTROL DE VOLUMEN MAESTRO
     * @param volumen 0.0 a 1.0 (recomendado)
     */
    setVolumenMaestro(volumen: number, tiempoRampa: number = 0.05) {
        if (!this.nodoGananciaPrincipal) return;
        const cTime = this.contexto.currentTime;
        this.nodoGananciaPrincipal.gain.cancelScheduledValues(cTime);
        this.nodoGananciaPrincipal.gain.setTargetAtTime(volumen, cTime, tiempoRampa);
    }

    get tiempoActual() {
        return this.contexto.currentTime;
    }

    get contextoAudio() {
        return this.contexto;
    }
}

export const motorAudioPro = new MotorAudioPro();
(window as any).motorAudioPro = motorAudioPro;
