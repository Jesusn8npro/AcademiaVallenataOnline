import { DEFINICION_BASE, generarTonalidad, transponerNota } from './_definicionBase'

interface KeyMapping {
    fila: number;
    columna: number;
}

export const mapaTeclasBajos: Record<string, KeyMapping> = {
    1: { fila: 1, columna: 1 },
    2: { fila: 1, columna: 2 },
    3: { fila: 2, columna: 1 },
    4: { fila: 2, columna: 2 },
    5: { fila: 1, columna: 3 },
    6: { fila: 1, columna: 4 },
    7: { fila: 2, columna: 3 },
    8: { fila: 2, columna: 4 },
    9: { fila: 1, columna: 5 },
    0: { fila: 1, columna: 6 },
    '-': { fila: 2, columna: 5 },
    '=': { fila: 2, columna: 6 },
}

export interface BotonNota {
    id: string;
    nombre: string;
    frecuencia: number | number[];
    tipo?: string;
}

export const TONALIDADES = {
    'F-Bb-Eb': generarTonalidad(0),
    'Gb-B-E': generarTonalidad(1),
    'GCF': generarTonalidad(2),
    'ADG_FLAT': generarTonalidad(3),
    'ADG': generarTonalidad(4),
    'BES': generarTonalidad(5),
    'CINCO_LETRAS': generarTonalidad(5),
    'BEA': generarTonalidad(6),
    'CFB': generarTonalidad(7),
    'DGB': generarTonalidad(8),
    'GDC': generarTonalidad(9),
    'ELR': generarTonalidad(10),
    'EAD': generarTonalidad(11),
};

const tonalidadPorDefecto = TONALIDADES['F-Bb-Eb'];
export const primeraFila = tonalidadPorDefecto.primeraFila;
export const segundaFila = tonalidadPorDefecto.segundaFila;
export const terceraFila = tonalidadPorDefecto.terceraFila;
export const disposicionBajos = tonalidadPorDefecto.disposicionBajos;

export const TONALIDAD_OFFSETS: Record<string, number> = {
    'F-Bb-Eb': 0, 'Gb-B-E': 1, 'GCF': 2, 'ADG_FLAT': 3, 'ADG': 4, 'BES': 5, 'CINCO_LETRAS': 5,
    'BEA': 6, 'CFB': 7, 'DGB': 8, 'GDC': 9, 'ELR': 10, 'EAD': 11
};

export const HILERAS_NATIVAS: Record<string, string[]> = {
    'F-Bb-Eb': ['FA', 'SIB', 'MIB'],
    'Gb-B-E': ['FA#', 'SI', 'MI'],
    'GCF': ['SOL', 'DO', 'FA'],
    'ADG_FLAT': ['SOL#', 'DO#', 'FA#'],
    'ADG': ['LA', 'RE', 'SOL'],
    'BES': ['SIB', 'MIB', 'LAB'],
    'CINCO_LETRAS': ['SIB', 'MIB', 'LAB'],
    'BEA': ['SI', 'MI', 'LA'],
    'CFB': ['DO', 'FA', 'SIB'],
    'DGB': ['RE', 'SOL', 'DO'],
    'GDC': ['SOL', 'DO', 'FA'],
    'ELR': ['MI', 'LA', 'RE'],
    'EAD': ['MI', 'LA', 'RE']
};

export const CIRCULO_OFFSETS: Record<string, number> = {
    'FA': 0, 'SOLB': 1, 'FA#': 1, 'SOL': 2, 'LAB': 3, 'SOL#': 3, 'LA': 4, 'SIB': 5, 'SI': 6, 'DO': 7, 'REB': 8, 'DO#': 8, 'RE': 9, 'MIB': 10, 'RE#': 10, 'MI': 11
};

export function resolverNotaDeBoton(id: string, offset: number): string {
    const parts = id.split('-');
    if (parts.length < 3) return '?';

    const fila = parts[0];
    const index = parseInt(parts[1]);
    const fuelle = parts[2];

    let baseInfo: any = null;

    if (fila === '1') baseInfo = DEFINICION_BASE.primeraFila.find(b => b.i === index && b.t === fuelle);
    else if (fila === '2') baseInfo = DEFINICION_BASE.segundaFila.find(b => b.i === index && b.t === fuelle);
    else if (fila === '3') baseInfo = DEFINICION_BASE.terceraFila.find(b => b.i === index && b.t === fuelle);
    else if (fila === 'b') {
        baseInfo = [...DEFINICION_BASE.bajos.una, ...DEFINICION_BASE.bajos.dos].find(b => b.i === index && b.t === fuelle);
    }

    if (!baseInfo) return '?';

    const t = transponerNota(baseInfo.n, baseInfo.o, offset);
    return t.nombre;
}

export function obtenerNotasDelAcorde(botones: string[], offset: number = 2): string {
    if (!botones || !Array.isArray(botones)) return '';
    const notas = botones.map(id => resolverNotaDeBoton(id, offset)).filter(n => n !== '?');
    const unicas = Array.from(new Set(notas));
    return unicas.join(', ');
}

export function identificarNombreAcorde(botones: string[], offset: number = 2): string {
    if (!botones || !Array.isArray(botones)) return 'Acorde Desconocido';

    const notasOriginales = botones.map(id => resolverNotaDeBoton(id, offset)).filter(n => n !== '?');

    const normalizar = (n: string) => {
        const mapa: Record<string, string> = {
            'Do#': 'Reb', 'Re#': 'Mib', 'Fa#': 'Solb', 'Sol#': 'Lab', 'La#': 'Sib'
        };
        return mapa[n] || n;
    };

    const setNotasNormalizadas = new Set(notasOriginales.map(normalizar));

    const NOTAS = ['Do', 'Reb', 'Re', 'Mib', 'Mi', 'Fa', 'Solb', 'Sol', 'Lab', 'La', 'Sib', 'Si'];

    const obtenerADN = (rootIdx: number, tipo: 'Mayor' | 'Menor' | 'Septima' | 'Menor7') => {
        const root = NOTAS[rootIdx];
        const terceraMayor = NOTAS[(rootIdx + 4) % 12];
        const terceraMenor = NOTAS[(rootIdx + 3) % 12];
        const quinta = NOTAS[(rootIdx + 7) % 12];
        const septimaMenor = NOTAS[(rootIdx + 10) % 12];

        if (tipo === 'Mayor') return { nombre: `${root} Mayor`, adn: [root, terceraMayor, quinta] };
        if (tipo === 'Menor') return { nombre: `${root} Menor`, adn: [root, terceraMenor, quinta] };
        if (tipo === 'Septima') return { nombre: `${root} Septima`, adn: [root, terceraMayor, quinta, septimaMenor] };
        if (tipo === 'Menor7') return { nombre: `${root} Menor 7`, adn: [root, terceraMenor, quinta, septimaMenor] };
        return { nombre: '', adn: [] };
    };

    const TABLA_ADN: { nombre: string, adn: string[] }[] = [];
    for (let i = 0; i < 12; i++) {
        TABLA_ADN.push(obtenerADN(i, 'Septima'));
        TABLA_ADN.push(obtenerADN(i, 'Menor7'));
        TABLA_ADN.push(obtenerADN(i, 'Mayor'));
        TABLA_ADN.push(obtenerADN(i, 'Menor'));
    }

    for (const item of TABLA_ADN) {
        if (item.adn.length === 0) continue;
        const coincide = item.adn.every(nota => setNotasNormalizadas.has(nota));
        if (coincide) return item.nombre;
    }

    return 'Acorde Libre';
}

export const disposicion: Record<string, BotonNota[]> = { primeraFila, segundaFila, terceraFila }

export const mapaFilas: Record<number, string> = { 1: 'primeraFila', 2: 'segundaFila', 3: 'terceraFila' }
export const mapaFilasBajos: Record<number, string> = { 1: 'una', 2: 'dos' }
export const tonosFilas: Record<string, Record<string, string>> = { FBE: { primeraFila: 'Fa', segundaFila: 'Sib', terceraFila: 'Mib' } }
export const filas = ['primeraFila', 'segundaFila', 'terceraFila']
export const filasBajos = ['una', 'dos']
export const cambiarFuelle = 'q'
