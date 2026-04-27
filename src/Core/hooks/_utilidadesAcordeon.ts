export const NOMBRES_INGLES: Record<string, string> = {
    'do': 'C', 'do#': 'Db', 'reb': 'Db', 're': 'D', 're#': 'Eb', 'mib': 'Eb', 'mi': 'E',
    'fa': 'F', 'fa#': 'Gb', 'solb': 'Gb', 'sol': 'G', 'sol#': 'Ab', 'lab': 'Ab', 'la': 'A', 'la#': 'Bb', 'sib': 'Bb', 'si': 'B'
};

// Hardcoded defaults — guarantee availability without depending on async fetch
export const SAMPLES_BRILLANTE_DEFAULT: string[] = [
    'A-4-cm.mp3', 'A-5-cm.mp3', 'Ab-4-cm.mp3', 'Ab-5-cm.mp3', 'Ab-6-cm.mp3',
    'B-3-cm.mp3', 'B-4-cm.mp3', 'B-5-cm.mp3', 'Bb-3-cm.mp3', 'Bb-4-cm.mp3',
    'Bb-5-cm.mp3', 'Bb-6-cm.mp3', 'C-4-cm.mp3', 'C-5-cm.mp3', 'C-6-cm.mp3',
    'C-7-cm.mp3', 'D-4-cm.mp3', 'D-5-cm.mp3', 'D-6-cm.mp3', 'Db-5-cm.mp3',
    'Db-6-cm.mp3', 'E-4-cm.mp3', 'E-5-cm.mp3', 'Eb-4-cm.mp3', 'Eb-5-cm.mp3',
    'Eb-6-cm.mp3', 'F-4-cm.mp3', 'F-5-cm.mp3', 'F-6-cm.mp3', 'G-4-cm.mp3',
    'G-5-cm.mp3', 'G-6-cm.mp3', 'Gb-4-cm.mp3', 'Gb-5-cm.mp3'
];

export const SAMPLES_ARMONIZADO_DEFAULT: string[] = [
    'A-4-cm.mp3', 'A-5-cm.mp3', 'A-6-cm.mp3', 'Ab-4-cm.mp3', 'Ab-5-cm.mp3',
    'Ab-6-cm.mp3', 'B-3-cm.mp3', 'B-4-cm.mp3', 'B-5-cm.mp3', 'B-6-cm.mp3',
    'Bb-4-cm.mp3', 'Bb-5-cm.mp3', 'C-5-cm.mp3', 'D-5-cm.mp3', 'D-6-cm.mp3',
    'Db-4-cm.mp3', 'Db-5-cm.mp3', 'Db-6-cm.mp3', 'Db-7-cm.mp3', 'E-4-cm.mp3',
    'E-5-cm.mp3', 'E-6-cm.mp3', 'Eb-4-cm.mp3', 'Eb-5-cm.mp3', 'Eb-6-cm.mp3',
    'F-4-cm.mp3', 'F-5-cm.mp3', 'G-4-cm.mp3', 'G-5-cm.mp3', 'Gb-4-cm.mp3',
    'Gb-5-cm.mp3', 'Gb-6-cm.mp3'
];

export const EXTRAER_NOTA_OCTAVA = (ruta: string) => {
    const filename = ruta.split('/').pop() || '';
    const match = filename.match(/([a-zA-Z#]+)-(\d+)/);
    if (match) {
        return { nota: match[1], octava: parseInt(match[2]) };
    }
    // Special case for Bajos: BajoC-3-cm.mp3
    if (filename.startsWith('Bajo')) {
        const notaMatch = filename.replace('Bajo', '').match(/([a-zA-Z#]+)/);
        const octMatch = filename.match(/-(\d+)-/);
        if (notaMatch) {
            return { nota: notaMatch[1], octava: octMatch ? parseInt(octMatch[1]) : 3 };
        }
    }
    return null;
};

export const VOL_PITOS = 0.55;
export const VOL_BAJOS = 0.70;
export const FADE_OUT = 10; // Ultra-fast fade for professional trills (10ms)
