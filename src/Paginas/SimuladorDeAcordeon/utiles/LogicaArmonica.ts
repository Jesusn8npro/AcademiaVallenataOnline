/**
 * 🎵 LÓGICA ARMÓNICA - ACORDEÓN HERO
 * Este archivo contiene las funciones que calculan los acordes basándose en
 * las relaciones armónicas (I, IV, V) del acordeón vallenato.
 */

export interface PatronAcorde {
    hilera: number;
    botones: number[];
    fuelle: 'abriendo' | 'cerrando';
}

/**
 * 🎹 Obtener los grados armónicos básicos (I, IV, V) según la hilera líder.
 * Por ejemplo, si en un GCF (Sol-Do-Fa) la líder es la del Medio (Do),
 * el IV es la de Adentro (Fa) y el V es la de Afuera (Sol).
 */
export const obtenerRelacionArmonica = (hileraLider: number) => {
    switch (hileraLider) {
        case 1: // AFUERA (Ej: Sol)
            return { I: 1, IV: 2, V: [1, 2] }; // El V en la de afuera suele ser cruzado
        case 2: // MEDIO (Ej: Do)
            return { I: 2, IV: 3, V: 1 };
        case 3: // ADENTRO (Ej: Fa)
            return { I: 3, IV: [2, 3], V: 2 };
        default:
            return { I: 2, IV: 3, V: 1 };
    }
};

/**
 * 🔄 Estructura de un Acorde Mayor (Triada)
 * Un acorde mayor en el acordeón diatónico se forma comúnmente verticalmente
 * en la misma hilera, por ejemplo empujando botones consecutivos.
 */
export const obtenerBotonesAcordeVertical = (hilera: number, botonInicio: number, fuelle: 'abriendo' | 'cerrando') => {
    return {
        hilera,
        botones: [botonInicio, botonInicio + 1, botonInicio + 2],
        fuelle
    };
};

/**
 * 🔃 Calcular Inversiones
 * Dado un conjunto de botones, propone las inversiones (subiendo octavas).
 */
export const calcularInversiones = (patron: PatronAcorde) => {
    const fundamental = [...patron.botones];
    
    // En el acordeón, una inversión física a veces es saltar un botón o buscar una octava.
    // Una inversión de triada cerrada suele ser:
    // Fundamental: 4-5-6
    // 1ra Inv: 5-6-8 (buscando la octava del 4)
    // 2da Inv: 6-8-9 (buscando la octava del 5)
    
    return [
        { ...patron, nombre: 'Fundamental' },
        { ...patron, botones: [patron.botones[1], patron.botones[2], patron.botones[0] + 4], nombre: '1ra Inversión' },
        { ...patron, botones: [patron.botones[2], patron.botones[0] + 4, patron.botones[1] + 4], nombre: '2da Inversión' }
    ];
};

/**
 * 🌍 Transposición Automática
 * Esta función es la "Mágica". No necesita calcular notas, solo proyectar
 * los mismos botones sobre el nuevo mapa del acordeón.
 */
export const proyectarAcordeEnTonalidad = (patron: PatronAcorde, mapaActual: any) => {
    // Aquí el sistema simplemente ilumina los botones del patron.hilera / patron.botones
    // en el componente de UI. El sonido vendrá del mapa (AudioContext).
};
