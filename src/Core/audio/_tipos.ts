export interface BancoSonido {
    id: string;
    nombre: string;
    muestras: Map<string, AudioBuffer>;
    offsets: Map<string, number>;
}

export type SeccionAudio = 'teclado' | 'bajos';

export interface VozPooled {
    ganancia: GainNode;
    fuente: AudioBufferSourceNode | null;
    ocupada: boolean;
    tiempo: number;
    // Sub-bus al que está conectada actualmente esta voz. Sirve para evitar
    // reconectar si la nueva voz es del mismo tipo que la última.
    seccion: SeccionAudio;
}
