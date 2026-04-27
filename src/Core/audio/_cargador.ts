import type { BancoSonido } from './_tipos';

function detectarInicioReal(buffer: AudioBuffer): number {
    const datos = buffer.getChannelData(0);
    const umbral = 0.005;
    for (let i = 0; i < datos.length; i++) {
        if (Math.abs(datos[i]) > umbral) {
            return Math.max(0, (i / buffer.sampleRate) - 0.002);
        }
    }
    return 0;
}

export async function cargarSonidoEnBanco(banco: BancoSonido, idSonido: string, url: string, contexto: AudioContext): Promise<void> {
    if (banco.muestras.has(idSonido)) return;

    try {
        const cacheName = 'sim-audios-v3';
        let audioData: ArrayBuffer | null = null;

        try {
            const cache = await caches.open(cacheName);
            const cachedResponse = await cache.match(url);

            if (cachedResponse) {
                audioData = await cachedResponse.arrayBuffer();
            } else {
                const respuesta = await fetch(url);
                if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
                await cache.put(url, respuesta.clone());
                audioData = await respuesta.arrayBuffer();
            }
        } catch {
            const respuesta = await fetch(url);
            if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
            audioData = await respuesta.arrayBuffer();
        }

        if (!audioData) return;

        const audioBuffer = await contexto.decodeAudioData(audioData);
        const offset = detectarInicioReal(audioBuffer);

        banco.muestras.set(idSonido, audioBuffer);
        banco.offsets.set(idSonido, offset);
    } catch { /* ignorar errores de carga individual */ }
}
