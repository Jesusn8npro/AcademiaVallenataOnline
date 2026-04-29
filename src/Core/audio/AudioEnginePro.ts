import type { BancoSonido, VozPooled } from './_tipos';
import { cargarSonidoEnBanco as _cargarSonido } from './_cargador';

export type { BancoSonido };

export class MotorAudioPro {
    private contexto: AudioContext;
    private bancos: Map<string, BancoSonido>;
    private nodoGananciaPrincipal: GainNode;
    private MAX_VOCES = 24;
    private esMovil = false;
    private poolVoces: VozPooled[] = [];
    private mixBus: GainNode;
    private filtroBajos!: BiquadFilterNode;
    private filtroMedios!: BiquadFilterNode;
    private filtroAltos!: BiquadFilterNode;
    private reverbNode!: ConvolverNode;
    private reverbGanancia!: GainNode;

    constructor() {
        this.esMovil = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        this.MAX_VOCES = this.esMovil ? 40 : 128;
        this.contexto = new AudioContextClass({ latencyHint: 0 });
        this.bancos = new Map();

        this.nodoGananciaPrincipal = this.contexto.createGain();
        this.nodoGananciaPrincipal.gain.setValueAtTime(0.85, this.contexto.currentTime);
        this.nodoGananciaPrincipal.connect(this.contexto.destination);

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

        this.filtroBajos.connect(this.filtroMedios);
        this.filtroMedios.connect(this.filtroAltos);
        this.filtroAltos.connect(this.nodoGananciaPrincipal);

        this.mixBus = this.contexto.createGain();
        this.mixBus.connect(this.filtroBajos);

        this.reverbGanancia = this.contexto.createGain();
        this.reverbGanancia.gain.value = 0;

        this.reverbNode = this.contexto.createConvolver();
        this._crearImpulsoSintetico();
        this.mixBus.connect(this.reverbNode);
        this.reverbNode.connect(this.reverbGanancia);
        this.reverbGanancia.connect(this.nodoGananciaPrincipal);

        this._inicializarPool();

        document.addEventListener('visibilitychange', () => this.activarContexto());
        window.addEventListener('focus', () => this.activarContexto());
    }

    private _inicializarPool() {
        for (let i = 0; i < this.MAX_VOCES; i++) {
            const ganancia = this.contexto.createGain();
            ganancia.gain.setValueAtTime(0, this.contexto.currentTime);
            ganancia.connect(this.mixBus);
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
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
            }
        }
        this.reverbNode.buffer = buffer;
    }

    actualizarEQ(bajos: number, medios: number, altos: number) {
        const cTime = this.contexto.currentTime;
        this.filtroBajos.gain.setTargetAtTime(bajos, cTime, 0.05);
        this.filtroMedios.gain.setTargetAtTime(medios, cTime, 0.05);
        this.filtroAltos.gain.setTargetAtTime(altos, cTime, 0.05);
    }

    actualizarReverb(cantidad: number) {
        this.reverbGanancia.gain.setTargetAtTime(cantidad * 0.5, this.contexto.currentTime, 0.05);
    }

    private _obtenerVozLibre(): VozPooled {
        let voz = this.poolVoces.find(v => !v.ocupada);
        if (!voz) {
            voz = this.poolVoces.reduce((oldest, v) =>
                v.tiempo < oldest.tiempo ? v : oldest, this.poolVoces[0]);
            this._liberarVoz(voz);
        }
        return voz;
    }

    private _liberarVoz(voz: VozPooled) {
        if (voz.fuente) {
            try { voz.fuente.onended = null; voz.fuente.stop(); voz.fuente.disconnect(); } catch (_) { }
            voz.fuente = null;
        }
        try {
            voz.ganancia.gain.cancelScheduledValues(this.contexto.currentTime);
            voz.ganancia.gain.setTargetAtTime(0, this.contexto.currentTime, 0.015);
        } catch (_) { }
        voz.ocupada = false;
    }

    async activarContexto() {
        if (this.contexto.state === 'suspended' || this.contexto.state === 'interrupted') {
            try { await this.contexto.resume(); } catch (_) { }
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
        await _cargarSonido(banco, idSonido, url, this.contexto);
    }

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
        if (semitonos !== 0) fuente.playbackRate.value = Math.pow(2, semitonos / 12);
        fuente.connect(voz.ganancia);
        voz.ganancia.gain.cancelScheduledValues(cTime);
        voz.ganancia.gain.setValueAtTime(volumen, startTime);
        fuente.start(startTime, offset);
        voz.fuente = fuente;

        if (duracionSec !== undefined && duracionSec > 0) {
            const endTime = startTime + duracionSec;
            const fadeDur = Math.min(0.02, duracionSec / 2);
            voz.ganancia.gain.setTargetAtTime(0, endTime - fadeDur, fadeDur);
            fuente.stop(endTime + 0.01);
        }

        fuente.onended = () => {
            if (voz.fuente === fuente) {
                try { fuente.disconnect(); } catch (_) { }
                voz.fuente = null;
                try { voz.ganancia.gain.setTargetAtTime(0, this.contexto.currentTime, 0.015); } catch (_) { }
                voz.ocupada = false;
            }
        };

        return { fuente, ganancia: voz.ganancia, tiempo: startTime };
    }

    detener(instancia: { fuente: AudioBufferSourceNode, ganancia: GainNode }, rapidez: number = 0.01, tiempoProgramado?: number) {
        try {
            const ahora = tiempoProgramado !== undefined ? Math.max(this.contexto.currentTime, this.contexto.currentTime + tiempoProgramado) : this.contexto.currentTime;
            const g = instancia.ganancia.gain;
            g.cancelScheduledValues(ahora);
            g.setTargetAtTime(0, ahora, rapidez > 0 ? rapidez : 0.015);
            instancia.fuente.stop(ahora + (rapidez * 2) + 0.01);
        } catch (_) { }
    }

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
        if (banco) { banco.muestras.clear(); banco.offsets.clear(); }
    }

    setVolumenMaestro(volumen: number, tiempoRampa: number = 0.05) {
        if (!this.nodoGananciaPrincipal) return;
        const cTime = this.contexto.currentTime;
        this.nodoGananciaPrincipal.gain.cancelScheduledValues(cTime);
        this.nodoGananciaPrincipal.gain.setTargetAtTime(volumen, cTime, tiempoRampa);
    }

    get tiempoActual() { return this.contexto.currentTime; }
    get contextoAudio() { return this.contexto; }
}

export const motorAudioPro = new MotorAudioPro();
(window as any).motorAudioPro = motorAudioPro;
