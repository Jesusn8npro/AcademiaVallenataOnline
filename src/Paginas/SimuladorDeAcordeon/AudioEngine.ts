export class AudioEngine {
    private audioContext: AudioContext;
    private buffers: Map<string, AudioBuffer>;
    private offsets: Map<string, number>;
    private gainNode: GainNode;

    constructor() {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass({
            latencyHint: 'interactive',
        });
        this.buffers = new Map();
        this.offsets = new Map();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
    }

    async cargarSonido(id: string, url: string): Promise<void> {
        if (this.buffers.has(id)) return;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && !contentType.includes('audio') && !contentType.includes('application/octet-stream')) {
                console.warn(`⚠️ El archivo en ${url} no parece ser un audio válido (Content-Type: ${contentType}). Saltando...`);
                return;
            }

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // ✂️ RECORTE INTELIGENTE: Detectar el primer pico de audio para saltar el silencio inicial del MP3
            const offset = this.detectarInicioAudio(audioBuffer);

            this.buffers.set(id, audioBuffer);
            this.offsets.set(id, offset);
        } catch (error) {
            console.error(`❌ Error cargando sonido en ${url}:`, error);
        }
    }

    private detectarInicioAudio(buffer: AudioBuffer): number {
        const data = buffer.getChannelData(0);
        const threshold = 0.01; // Sensibilidad del umbral
        for (let i = 0; i < data.length; i++) {
            if (Math.abs(data[i]) > threshold) {
                // Volver un poco atrás para no cortar el ataque brusco (5ms de margen)
                return Math.max(0, (i / buffer.sampleRate) - 0.005);
            }
        }
        return 0;
    }

    async resume() {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    reproducir(id: string, volumen: number = 1.0, semitonos: number = 0, loop: boolean = true): { source: AudioBufferSourceNode, gain: GainNode } | null {
        const buffer = this.buffers.get(id);
        const offset = this.offsets.get(id) || 0;

        if (!buffer) {
            return null;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = loop; // ♾️ Loop opcional (Acordeón real suele ser loop)

        // 🔥 PITCH SHIFT REAL (Semitonos)
        if (semitonos !== 0) {
            source.playbackRate.value = Math.pow(2, semitonos / 12);
        }

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(volumen, this.audioContext.currentTime);

        source.connect(gain);
        gain.connect(this.gainNode);

        // Iniciar con el offset detectado para eliminar la latencia del MP3
        source.start(0, offset);

        return { source, gain };
    }

    limpiar() {
        this.buffers.clear();
        this.offsets.clear();
    }
}

export const motorAudio = new AudioEngine();
