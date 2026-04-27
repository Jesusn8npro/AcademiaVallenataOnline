export interface BancoSonido {
    id: string;
    nombre: string;
    muestras: Map<string, AudioBuffer>;
    offsets: Map<string, number>;
}

export interface VozPooled {
    ganancia: GainNode;
    fuente: AudioBufferSourceNode | null;
    ocupada: boolean;
    tiempo: number;
}
