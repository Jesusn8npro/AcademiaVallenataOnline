/**
 * 🎵 UNIVERSAL SAMPLER ENGINE
 * Lógica para mapear notas a las mejores muestras disponibles y calcular el pitch shift.
 */

const NOTAS_ORDEN = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export interface Muestra {
    nota: string;
    octava: number;
    url_audio: string;
}

/**
 * Convierte una nota y octava a un valor numérico (índice de semitonos)
 */
export const notaANumero = (nota: string, octava: number): number => {
    // Normalizar nota (ej. C# -> Db)
    const normalized = nota
        .replace('C#', 'Db')
        .replace('D#', 'Eb')
        .replace('F#', 'Gb')
        .replace('G#', 'Ab')
        .replace('A#', 'Bb');

    const index = NOTAS_ORDEN.indexOf(normalized);
    if (index === -1) return 60; // Default C4
    return (octava * 12) + index;
};

/**
 * Encuentra la mejor muestra para una nota deseada y devuelve los semitonos de ajuste
 */
export const encontrarMejorMuestra = (notaDeseada: string, octavaDeseada: number, muestras: Muestra[]) => {
    if (!muestras || muestras.length === 0) return null;

    const targetVal = notaANumero(notaDeseada, octavaDeseada);
    let mejorMuestra = muestras[0];
    let minDiff = Infinity;

    for (const m of muestras) {
        const currentVal = notaANumero(m.nota, m.octava);
        const diff = Math.abs(targetVal - currentVal);

        if (diff < minDiff) {
            minDiff = diff;
            mejorMuestra = m;
        }
    }

    const mVal = notaANumero(mejorMuestra.nota, mejorMuestra.octava);
    const semitonosAjuste = targetVal - mVal;

    return {
        url: mejorMuestra.url_audio,
        pitch: semitonosAjuste
    };
};
