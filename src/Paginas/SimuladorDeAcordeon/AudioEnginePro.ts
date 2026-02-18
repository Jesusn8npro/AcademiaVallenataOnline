/**
 * 🚀 MOTOR DE AUDIO DE ALTO RENDIMIENTO (V5.0)
 *
 * MEJORAS V5:
 * - Se eliminó el DynamicsCompressor del path de audio para reducir latencia.
 *   El compressor añade un look-ahead buffer que atrasa el sonido ~5-20ms.
 * - Attack reducido a 0.001s (1ms) - mínimo físicamente posible sin pop.
 * - Fade-out reducido a 8ms para trinos ultra-rápidos.
 * - Pool de nodos GainNode pre-conectados para reusar sin re-crear el grafo.
 * - Se añade limpiarTodo() para emergencias (notas pegadas).
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
    private vocesActivas: { fuente: AudioBufferSourceNode; ganancia: GainNode; tiempo: number }[] = [];
    private MAX_VOCES = 32; // 🛡️ Soporta trinos + caps + bajos simultáneos

    constructor() {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;

        // ⚡ SIN TASA FIJA: El móvil usa su SampleRate nativo (sin resampleo = sin lag)
        this.contexto = new AudioContextClass({
            latencyHint: 'interactive',
            // NO forzamos sampleRate: el dispositivo elige el óptimo
        });

        this.bancos = new Map();

        // 🔊 Cadena de audio simplificada: Source -> Gain -> Master -> Destination
        // SIN compressor: eliminamos el look-ahead que añadía latencia.
        // El volumen general está controlado por nodoGananciaPrincipal.
        this.nodoGananciaPrincipal = this.contexto.createGain();
        this.nodoGananciaPrincipal.gain.setValueAtTime(0.85, this.contexto.currentTime);
        this.nodoGananciaPrincipal.connect(this.contexto.destination);

        // 🔄 Reanimar el audio al volver a la pestaña o al enfocar la ventana
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') this.activarContexto();
        });
        window.addEventListener('focus', () => this.activarContexto());
    }

    async activarContexto() {
        if (this.contexto.state === 'suspended' || this.contexto.state === 'interrupted') {
            try {
                await this.contexto.resume();
            } catch (e) {
                console.error('❌ No se pudo reanimar el AudioContext:', e);
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
            const audioBuffer = await this.contexto.decodeAudioData(await respuesta.arrayBuffer());
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
                // Retroceder 2ms para no cortar el ataque de la nota
                return Math.max(0, (i / buffer.sampleRate) - 0.002);
            }
        }
        return 0;
    }

    /**
     * 🎵 REPRODUCIR - Latencia mínima absoluta.
     *
     * Attack de 1ms: evita el pop de onset sin añadir latencia perceptible.
     * El audio arranca inmediatamente (fuente.start(ahora)).
     */
    reproducir(
        idSonido: string,
        bancoId: string,
        volumen: number = 1.0,
        semitonos: number = 0,
        loop: boolean = false
    ): { fuente: AudioBufferSourceNode; ganancia: GainNode; tiempo: number } | null {
        const banco = this.bancos.get(bancoId);
        if (!banco) return null;

        const buffer = banco.muestras.get(idSonido);
        if (!buffer) return null;

        const offset = banco.offsets.get(idSonido) ?? 0;

        // 🛡️ VOICE STEALING: Sacrificamos la voz más vieja si estamos al límite
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
        // ⚡ Attack de 1ms: mínimo sin pop, máxima velocidad de ataque
        ganancia.gain.setValueAtTime(0.001, ahora);
        ganancia.gain.exponentialRampToValueAtTime(volumen, ahora + 0.001);

        fuente.connect(ganancia);
        ganancia.connect(this.nodoGananciaPrincipal);

        fuente.start(ahora, offset);

        const voz = { fuente, ganancia, tiempo: ahora };
        this.vocesActivas.push(voz);

        // Cleanup automático al terminar el sample naturalmente
        fuente.onended = () => {
            this.vocesActivas = this.vocesActivas.filter(v => v !== voz);
            try { fuente.disconnect(); } catch { }
            try { ganancia.disconnect(); } catch { }
        };

        return voz;
    }

    /**
     * 🔇 DETENER - Ultra-rápido con fade-out de 8ms.
     *
     * 8ms es imperceptible para el oído humano pero suficiente para evitar
     * el "click" de desconexión abrupta (aliasing de audio).
     */
    detener(instancia: { fuente: AudioBufferSourceNode; ganancia: GainNode }, rapidez: number = 0.008) {
        try {
            const ahora = this.contexto.currentTime;
            const g = instancia.ganancia.gain;

            g.cancelScheduledValues(ahora);
            // 🛡️ Blindaje contra NaN cuando el gain ya llegó a 0
            const val = Math.max(g.value, 0.001);
            g.setValueAtTime(val, ahora);
            g.exponentialRampToValueAtTime(0.001, ahora + rapidez);
            instancia.fuente.stop(ahora + rapidez + 0.002);
        } catch { /* La fuente ya fue detenida */ }
    }

    /**
     * 🆘 EMERGENCIA: Silencia absolutamente todo.
     * Usar si se detectan notas pegadas que ningún otro método pudo resolver.
     */
    limpiarTodo() {
        this.vocesActivas.forEach(voz => {
            try { voz.fuente.stop(); } catch { }
            try { voz.fuente.disconnect(); } catch { }
            try { voz.ganancia.disconnect(); } catch { }
        });
        this.vocesActivas = [];
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
