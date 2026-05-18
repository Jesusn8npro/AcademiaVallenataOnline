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

// Deduplicación de cargas EN VUELO. Sin esto, si el efecto de carga se
// re-ejecuta (cambio de tonalidad/instrumento/slider) antes de que termine
// la descarga+decode, el MISMO sonido se vuelve a descargar y decodificar en
// paralelo N veces => tormenta de decodeAudioData en el hilo principal =
// trabas. Con esto, una carga en curso se reutiliza (misma Promise) y nunca
// se decodifica dos veces el mismo sample.
const cargasEnVuelo = new Map<string, Promise<void>>();

async function _cargar(banco: BancoSonido, idSonido: string, url: string, contexto: AudioContext): Promise<void> {
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

export async function cargarSonidoEnBanco(banco: BancoSonido, idSonido: string, url: string, contexto: AudioContext): Promise<void> {
    if (banco.muestras.has(idSonido)) return;

    const clave = `${banco.id}::${idSonido}`;
    const enVuelo = cargasEnVuelo.get(clave);
    if (enVuelo) return enVuelo;

    const promesa = _cargar(banco, idSonido, url, contexto).finally(() => {
        cargasEnVuelo.delete(clave);
    });
    cargasEnVuelo.set(clave, promesa);
    return promesa;
}
