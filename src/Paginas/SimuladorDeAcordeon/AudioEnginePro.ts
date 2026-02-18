/**
 * 🚀 MOTOR DE AUDIO DE ALTO RENDIMIENTO (V4.2)
 * Optimizado para trinos extremos, velocidad profesional y latencia ultra-baja en móviles.
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
    private vocesActivas: { fuente: AudioBufferSourceNode, ganancia: GainNode, tiempo: number }[] = [];
    private MAX_VOCES = 16; // 🛡️ Límite para evitar saturación en móviles

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

        // 🔄 Escuchar cambios de visibilidad para reanimar el sonido
        document.addEventListener('visibilitychange', () => this.activarContexto());
        window.addEventListener('focus', () => this.activarContexto());
    }

    async activarContexto() {
        if (this.contexto.state === 'suspended' || this.contexto.state === 'interrupted') {
            try {
                await this.contexto.resume();
                console.log("🔊 AudioContext reanimado con éxito.");
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
     * Reproduce un sonido con latencia mínima y gestión de polifonía.
     */
    reproducir(idSonido: string, bancoId: string, volumen: number = 1.0, semitonos: number = 0, loop: boolean = false): { fuente: AudioBufferSourceNode, ganancia: GainNode, tiempo: number } | null {
        const banco = this.bancos.get(bancoId);
        if (!banco) return null;

        const buffer = banco.muestras.get(idSonido);
        const offset = banco.offsets.get(idSonido) || 0;
        if (!buffer) return null;

        // 🛡️ VOICE STEALING: Si excedemos el límite, detenemos la voz más antigua
        if (this.vocesActivas.length >= this.MAX_VOCES) {
            const vieja = this.vocesActivas.shift();
            if (vieja) this.detener(vieja, 0.005);
        }

        const ahora = this.contexto.currentTime;
        const fuente = this.contexto.createBufferSource();
        fuente.buffer = buffer;
        fuente.loop = loop;

        if (semitonos !== 0) {
            fuente.playbackRate.setValueAtTime(Math.pow(2, semitonos / 12), ahora);
        }

        const ganancia = this.contexto.createGain();
        ganancia.gain.setValueAtTime(0.001, ahora);
        ganancia.gain.exponentialRampToValueAtTime(volumen, ahora + 0.003); // Attack ultra-veloz

        fuente.connect(ganancia);
        ganancia.connect(this.nodoGananciaPrincipal);

        fuente.start(ahora, offset);

        const voz = { fuente, ganancia, tiempo: ahora };
        this.vocesActivas.push(voz);

        fuente.onended = () => {
            this.vocesActivas = this.vocesActivas.filter(v => v !== voz);
            try {
                fuente.disconnect();
                ganancia.disconnect();
            } catch (e) { }
        };

        return voz;
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
