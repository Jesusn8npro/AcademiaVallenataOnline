/**
 * 🚀 MOTOR DE AUDIO DE ALTO RENDIMIENTO (V4)
 * Optimizado para trinos extremos, velocidad profesional y latencia ultra-baja.
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
    private poolNodos: Map<string, { fuente: AudioBufferSourceNode, ganancia: GainNode }[]>;

    constructor() {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;

        this.contexto = new AudioContextClass({
            latencyHint: 'interactive',
            sampleRate: 44100
        });

        this.bancos = new Map();
        this.poolNodos = new Map();

        this.nodoGananciaPrincipal = this.contexto.createGain();
        const limitador = this.contexto.createDynamicsCompressor();

        limitador.threshold.setValueAtTime(-1.0, this.contexto.currentTime);
        limitador.knee.setValueAtTime(0, this.contexto.currentTime);
        limitador.ratio.setValueAtTime(20, this.contexto.currentTime);
        limitador.attack.setValueAtTime(0, this.contexto.currentTime);
        limitador.release.setValueAtTime(0.1, this.contexto.currentTime);

        this.nodoGananciaPrincipal.connect(limitador);
        limitador.connect(this.contexto.destination);
    }

    async activarContexto() {
        if (this.contexto.state === 'suspended') {
            await this.contexto.resume();
        }
    }

    obtenerBanco(id: string, nombre: string): BancoSonido {
        if (!this.bancos.has(id)) {
            this.bancos.set(id, {
                id, nombre, muestras: new Map(), offsets: new Map()
            });
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
     * Reproduce un sonido con latencia mínima.
     * ⚡ OPTIMIZACIÓN DE TRINOS: Gestión de polifonía por botón.
     */
    reproducir(idSonido: string, bancoId: string, volumen: number = 1.0, semitonos: number = 0, loop: boolean = false): { fuente: AudioBufferSourceNode, ganancia: GainNode } | null {
        const banco = this.bancos.get(bancoId);
        if (!banco) return null;

        const buffer = banco.muestras.get(idSonido);
        const offset = banco.offsets.get(idSonido) || 0;

        if (!buffer) return null;

        // Crear nodos
        const fuente = this.contexto.createBufferSource();
        fuente.buffer = buffer;
        fuente.loop = loop;

        if (semitonos !== 0) {
            fuente.playbackRate.value = Math.pow(2, semitonos / 12);
        }

        const ganancia = this.contexto.createGain();
        ganancia.gain.setValueAtTime(0.001, this.contexto.currentTime);
        // Attack ultra-rápido para trinos (2ms)
        ganancia.gain.exponentialRampToValueAtTime(volumen, this.contexto.currentTime + 0.002);

        fuente.connect(ganancia);
        ganancia.connect(this.nodoGananciaPrincipal);

        fuente.start(0, offset);

        return { fuente, ganancia };
    }

    /**
     * Detención ultra-rápida optimizada para repeticiones constantes (Trinos)
     */
    detener(instancia: { fuente: AudioBufferSourceNode, ganancia: GainNode }, rapidez: number = 0.015) {
        try {
            const ahora = this.contexto.currentTime;
            const g = instancia.ganancia.gain;

            g.cancelScheduledValues(ahora);
            g.setValueAtTime(g.value, ahora);

            // Fundido gausiano ultra-corto para trinos cristalinos (15ms)
            // Esto elimina la 'bola de sonido' en ejecuciones rápidas
            g.exponentialRampToValueAtTime(0.001, ahora + rapidez);
            instancia.fuente.stop(ahora + rapidez + 0.005);

            // Limpieza nativa
            instancia.fuente.onended = () => {
                try {
                    instancia.fuente.disconnect();
                    instancia.ganancia.disconnect();
                } catch (e) { }
            };
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
