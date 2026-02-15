/**
 * 🚀 MOTOR DE AUDIO DE ALTO RENDIMIENTO (V3)
 * Optimizado para latencia ultra-baja y sonidos reales.
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

    constructor() {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;

        // 🎧 Configuración de Alta Fidelidad (Standard Profesional)
        this.contexto = new AudioContextClass({
            latencyHint: 'interactive', // Balance perfecto entre rapidez y calidad
            sampleRate: 44100
        });

        this.bancos = new Map();

        // 🛡️ Limitador de Seguridad: Evita que el sonido se "rompa" (digital distortion)
        // cuando tocas muchos pitos y bajos al mismo tiempo.
        this.nodoGananciaPrincipal = this.contexto.createGain();
        const limitador = this.contexto.createDynamicsCompressor();

        // Configuración para que el limitador sea invisible al oído pero protector
        limitador.threshold.setValueAtTime(-1.0, this.contexto.currentTime);
        limitador.knee.setValueAtTime(0, this.contexto.currentTime);
        limitador.ratio.setValueAtTime(20, this.contexto.currentTime);
        limitador.attack.setValueAtTime(0, this.contexto.currentTime);
        limitador.release.setValueAtTime(0.1, this.contexto.currentTime);

        this.nodoGananciaPrincipal.connect(limitador);
        limitador.connect(this.contexto.destination);
    }

    /**
     * Asegura que el contexto esté activo (requerido por navegadores tras interacción)
     */
    async activarContexto() {
        if (this.contexto.state === 'suspended') {
            await this.contexto.resume();
        }
    }

    /**
     * Crea o recupera un banco de sonidos
     */
    obtenerBanco(id: string, nombre: string): BancoSonido {
        if (!this.bancos.has(id)) {
            this.bancos.set(id, {
                id,
                nombre,
                muestras: new Map(),
                offsets: new Map()
            });
        }
        return this.bancos.get(id)!;
    }

    /**
     * Carga un sonido directamente a la RAM
     */
    async cargarSonidoEnBanco(bancoId: string, idSonido: string, url: string): Promise<void> {
        const banco = this.obtenerBanco(bancoId, bancoId);
        if (banco.muestras.has(idSonido)) return;

        try {
            const respuesta = await fetch(url);
            if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

            const arrayBuffer = await respuesta.arrayBuffer();
            const audioBuffer = await this.contexto.decodeAudioData(arrayBuffer);

            // ✂️ Recorte mucho más suave para no tocar la esencia del sonido real
            const offset = this.detectarInicioReal(audioBuffer);

            banco.muestras.set(idSonido, audioBuffer);
            banco.offsets.set(idSonido, offset);
        } catch (error) {
            console.error(`❌ Error cargando sonido [${idSonido}] en banco [${bancoId}]:`, error);
        }
    }

    /**
     * Detecta dónde empieza el sonido de verdad para eliminar el lag del MP3
     */
    private detectarInicioReal(buffer: AudioBuffer): number {
        const datos = buffer.getChannelData(0);
        const umbral = 0.01; // Menos agresivo para preservar el "aire" inicial
        for (let i = 0; i < datos.length; i++) {
            if (Math.abs(datos[i]) > umbral) {
                // Dejamos 5ms de margen (más natural) en lugar de recortar casi todo
                return Math.max(0, (i / buffer.sampleRate) - 0.005);
            }
        }
        return 0;
    }

    /**
     * Reproduce un sonido del banco activo con latencia mínima
     */
    reproducir(idSonido: string, bancoId: string, volumen: number = 1.0, semitonos: number = 0, loop: boolean = false): { fuente: AudioBufferSourceNode, ganancia: GainNode } | null {
        const banco = this.bancos.get(bancoId);
        if (!banco) return null;

        const buffer = banco.muestras.get(idSonido);
        const offset = banco.offsets.get(idSonido) || 0;

        if (!buffer) return null;

        const fuente = this.contexto.createBufferSource();
        fuente.buffer = buffer;
        fuente.loop = loop;

        if (semitonos !== 0) {
            fuente.playbackRate.value = Math.pow(2, semitonos / 12);
        }

        const ganancia = this.contexto.createGain();
        ganancia.gain.setValueAtTime(volumen, this.contexto.currentTime);

        fuente.connect(ganancia);
        ganancia.connect(this.nodoGananciaPrincipal);

        fuente.start(0, offset);

        return { fuente, ganancia };
    }

    /**
     * Limpia la memoria de un banco específico
     */
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
