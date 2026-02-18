/**
 * 🚀 MOTOR DE AUDIO DE ALTO RENDIMIENTO (V5.0 - BLINDADO)
 * Optimizado con Voice Pooling (Nodos pre-cargados) para trinos profesionales.
 */

export interface BancoSonido {
    id: string;
    nombre: string;
    muestras: Map<string, AudioBuffer>;
    offsets: Map<string, number>;
}

export class MotorAudioPro {
    private contexto: AudioContext;
    private bancos: Map<string, BancoSonido>;
    private nodoGananciaPrincipal: GainNode;
    private vocesActivas: Set<any> = new Set();
    private poolGanancia: GainNode[] = []; // 🚀 POOL DE NODOS PRE-CONECTADOS
    private MAX_POOL = 64;

    constructor() {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;

        // ⚡ SIN TASA FIJA: Permitimos que el móvil use su SampleRate nativo para evitar lag de remuestreo
        this.contexto = new AudioContextClass({
            latencyHint: 'interactive'
        });

        this.bancos = new Map();
        this.nodoGananciaPrincipal = this.contexto.createGain();

        const limitador = this.contexto.createDynamicsCompressor();
        limitador.threshold.setValueAtTime(-1.0, this.contexto.currentTime);
        limitador.knee.setValueAtTime(0, this.contexto.currentTime);
        limitador.ratio.setValueAtTime(20, this.contexto.currentTime);
        limitador.attack.setValueAtTime(0, this.contexto.currentTime);
        limitador.release.setValueAtTime(0.05, this.contexto.currentTime);

        this.nodoGananciaPrincipal.connect(limitador);
        limitador.connect(this.contexto.destination);

        // 🚀 PRE-CARGAR POOL DE GANANCIA (Reducción de latencia de instanciación)
        for (let i = 0; i < this.MAX_POOL; i++) {
            const g = this.contexto.createGain();
            g.gain.setValueAtTime(0, this.contexto.currentTime);
            g.connect(this.nodoGananciaPrincipal);
            this.poolGanancia.push(g);
        }

        // 🔄 Escuchar cambios de visibilidad para reanimar el sonido
        document.addEventListener('visibilitychange', () => this.activarContexto());
        window.addEventListener('focus', () => this.activarContexto());
    }

    async activarContexto() {
        if (this.contexto.state === 'suspended' || this.contexto.state === 'interrupted') {
            try {
                await this.contexto.resume();
            } catch (e) { }
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
     * Reproduce un sonido usando el Pool de Nodos pre-conectados.
     */
    reproducir(idSonido: string, bancoId: string, volumen: number = 1.0, semitonos: number = 0, loop: boolean = false): { fuente: AudioBufferSourceNode, ganancia: GainNode, tiempo: number } | null {
        const banco = this.bancos.get(bancoId);
        if (!banco || !this.contexto) return null;

        const buffer = banco.muestras.get(idSonido);
        const offset = banco.offsets.get(idSonido) || 0;
        if (!buffer) return null;

        // 🚀 RECUPERAR GANANCIA DEL POOL
        let ganancia = this.poolGanancia.pop();
        if (!ganancia) {
            // Si el pool se agota, robamos la voz más antigua (Voice Stealing)
            const antigua = Array.from(this.vocesActivas)[0];
            if (antigua) this.detener(antigua, 0.002);
            ganancia = this.contexto.createGain();
            ganancia.connect(this.nodoGananciaPrincipal);
        }

        const ahora = this.contexto.currentTime;
        const fuente = this.contexto.createBufferSource();
        fuente.buffer = buffer;
        fuente.loop = loop;

        if (semitonos !== 0) {
            fuente.playbackRate.setValueAtTime(Math.pow(2, semitonos / 12), ahora);
        }

        ganancia.gain.cancelScheduledValues(ahora);
        ganancia.gain.setValueAtTime(0.001, ahora);
        ganancia.gain.exponentialRampToValueAtTime(volumen, ahora + 0.003);

        fuente.connect(ganancia);
        fuente.start(ahora, offset);

        const voz = { fuente, ganancia, tiempo: ahora };
        this.vocesActivas.add(voz);

        fuente.onended = () => {
            this.vocesActivas.delete(voz);
            try {
                fuente.disconnect();
                // 🚀 DEVOLVER GANANCIA AL POOL
                ganancia!.gain.setValueAtTime(0, this.contexto.currentTime);
                if (this.poolGanancia.length < this.MAX_POOL) {
                    this.poolGanancia.push(ganancia!);
                }
            } catch (e) { }
        };

        return voz;
    }

    /**
     * Detención ultra-rápida (Fade-out de 15ms)
     */
    detener(instancia: { fuente: AudioBufferSourceNode, ganancia: GainNode }, rapidez: number = 0.015) {
        try {
            const ahora = this.contexto.currentTime;
            const g = instancia.ganancia.gain;

            g.cancelScheduledValues(ahora);
            const val = Math.max(g.value, 0.001);
            g.setValueAtTime(val, ahora);
            g.exponentialRampToValueAtTime(0.001, ahora + rapidez);
            instancia.fuente.stop(ahora + rapidez + 0.005);
        } catch (e) { }
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
