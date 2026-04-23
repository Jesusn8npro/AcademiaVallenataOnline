import { tono } from './mapaTecladoYFrecuencias'

interface KeyMapping {
    fila: number;
    columna: number;
}

// Mapa de teclas de bajos (mano izquierda)
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

// --- SISTEMA DE TRANSPOSICIÓN ---

const NOTAS_CROMATICAS = ['Do', 'Reb', 'Re', 'Mib', 'Mi', 'Fa', 'Solb', 'Sol', 'Lab', 'La', 'Sib', 'Si'];
const NOTAS_CROMATICAS_SOSTENIDOS = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

// Definición base abstracta (Tonalidad FBE - Fa Sib Mib)
export const DEFINICION_BASE = {
    primeraFila: [
        // Halar
        { i: 1, n: 'Reb', o: 4, t: 'halar' }, { i: 2, n: 'Sol', o: 3, t: 'halar' }, { i: 3, n: 'Sib', o: 3, t: 'halar' },
        { i: 4, n: 'Re', o: 4, t: 'halar' }, { i: 5, n: 'Mi', o: 4, t: 'halar' }, { i: 6, n: 'Sol', o: 4, t: 'halar' },
        { i: 7, n: 'Sib', o: 4, t: 'halar' }, { i: 8, n: 'Re', o: 5, t: 'halar' }, { i: 9, n: 'Mi', o: 5, t: 'halar' },
        { i: 10, n: 'Sol', o: 5, t: 'halar' },
        // Empujar
        { i: 1, n: 'Si', o: 3, t: 'empujar' }, { i: 2, n: 'Fa', o: 3, t: 'empujar' }, { i: 3, n: 'La', o: 3, t: 'empujar' },
        { i: 4, n: 'Do', o: 4, t: 'empujar' }, { i: 5, n: 'Fa', o: 4, t: 'empujar' }, { i: 6, n: 'La', o: 4, t: 'empujar' },
        { i: 7, n: 'Do', o: 5, t: 'empujar' }, { i: 8, n: 'Fa', o: 5, t: 'empujar' }, { i: 9, n: 'La', o: 5, t: 'empujar' },
        { i: 10, n: 'Do', o: 6, t: 'empujar' }
    ],
    segundaFila: [
        // Halar
        { i: 1, n: 'Solb', o: 4, t: 'halar' }, { i: 2, n: 'La', o: 3, t: 'halar' }, { i: 3, n: 'Do', o: 4, t: 'halar' },
        { i: 4, n: 'Mib', o: 4, t: 'halar' }, { i: 5, n: 'Sol', o: 4, t: 'halar' }, { i: 6, n: 'La', o: 4, t: 'halar' },
        { i: 7, n: 'Do', o: 5, t: 'halar' }, { i: 8, n: 'Mib', o: 5, t: 'halar' }, { i: 9, n: 'Sol', o: 5, t: 'halar' },
        { i: 10, n: 'La', o: 5, t: 'halar' }, { i: 11, n: 'Do', o: 6, t: 'halar' },
        // Empujar
        { i: 1, n: 'Mi', o: 4, t: 'empujar' }, { i: 2, n: 'Fa', o: 3, t: 'empujar' }, { i: 3, n: 'Sib', o: 3, t: 'empujar' },
        { i: 4, n: 'Re', o: 4, t: 'empujar' }, { i: 5, n: 'Fa', o: 4, t: 'empujar' }, { i: 6, n: 'Sib', o: 4, t: 'empujar' },
        { i: 7, n: 'Re', o: 5, t: 'empujar' }, { i: 8, n: 'Fa', o: 5, t: 'empujar' }, { i: 9, n: 'Sib', o: 5, t: 'empujar' },
        { i: 10, n: 'Re', o: 6, t: 'empujar' }, { i: 11, n: 'Fa', o: 6, t: 'empujar' }
    ],
    terceraFila: [
        // Halar
        { i: 1, n: 'Si', o: 4, t: 'halar' }, { i: 2, n: 'Re', o: 4, t: 'halar' }, { i: 3, n: 'Fa', o: 4, t: 'halar' },
        { i: 4, n: 'Lab', o: 4, t: 'halar' }, { i: 5, n: 'Do', o: 5, t: 'halar' }, { i: 6, n: 'Re', o: 5, t: 'halar' },
        { i: 7, n: 'Fa', o: 5, t: 'halar' }, { i: 8, n: 'Lab', o: 5, t: 'halar' }, { i: 9, n: 'Do', o: 6, t: 'halar' },
        { i: 10, n: 'Re', o: 6, t: 'halar' },
        // Empujar
        { i: 1, n: 'Reb', o: 5, t: 'empujar' }, { i: 2, n: 'Sib', o: 3, t: 'empujar' }, { i: 3, n: 'Mib', o: 4, t: 'empujar' },
        { i: 4, n: 'Sol', o: 4, t: 'empujar' }, { i: 5, n: 'Sib', o: 4, t: 'empujar' }, { i: 6, n: 'Mib', o: 5, t: 'empujar' },
        { i: 7, n: 'Sol', o: 5, t: 'empujar' }, { i: 8, n: 'Sib', o: 5, t: 'empujar' }, { i: 9, n: 'Mib', o: 6, t: 'empujar' },
        { i: 10, n: 'Sol', o: 6, t: 'empujar' }
    ],
    bajos: {
        una: [
            { i: 1, n: 'Sol', o: 3, t: 'halar', tipo: 'menor' }, { i: 2, n: 'Sol', o: 2, t: 'halar', tipo: 'nota' },
            { i: 1, n: 'Re', o: 3, t: 'empujar', tipo: 'mayor' }, { i: 2, n: 'Re', o: 3, t: 'empujar', tipo: 'nota' },
            { i: 3, n: 'Do', o: 3, t: 'halar', tipo: 'menor' }, { i: 4, n: 'Do', o: 3, t: 'halar', tipo: 'nota' },
            { i: 3, n: 'Sol', o: 3, t: 'empujar', tipo: 'mayor' }, { i: 4, n: 'Sol', o: 2, t: 'empujar', tipo: 'nota' },
            { i: 5, n: 'Lab', o: 3, t: 'halar', tipo: 'mayor' }, { i: 6, n: 'Lab', o: 3, t: 'halar', tipo: 'nota' },
            { i: 5, n: 'Lab', o: 3, t: 'empujar', tipo: 'mayor' }, { i: 6, n: 'Lab', o: 3, t: 'empujar', tipo: 'nota' },
        ],
        dos: [
            { i: 1, n: 'Do', o: 3, t: 'halar', tipo: 'mayor' }, { i: 2, n: 'Do', o: 3, t: 'halar', tipo: 'nota' },
            { i: 1, n: 'Fa', o: 3, t: 'empujar', tipo: 'mayor' }, { i: 2, n: 'Fa', o: 3, t: 'empujar', tipo: 'nota' },
            { i: 3, n: 'Fa', o: 3, t: 'halar', tipo: 'mayor' }, { i: 4, n: 'Fa', o: 3, t: 'halar', tipo: 'nota' },
            { i: 3, n: 'Sib', o: 3, t: 'empujar', tipo: 'mayor' }, { i: 4, n: 'Sib', o: 3, t: 'empujar', tipo: 'nota' },
            { i: 5, n: 'Sib', o: 3, t: 'halar', tipo: 'mayor' }, { i: 6, n: 'Sib', o: 3, t: 'halar', tipo: 'nota' },
            { i: 5, n: 'Mib', o: 3, t: 'empujar', tipo: 'mayor' }, { i: 6, n: 'Mib', o: 3, t: 'empujar', tipo: 'nota' },
        ]
    }
};

function transponerNota(nota: string, octava: number, semitonos: number, usarSostenidos: boolean = false): { nombre: string, octava: number, frecuencia: number } {
    // Intentar encontrar la nota en cualquiera de las dos escalas (bemoles o sostenidos)
    let idx = NOTAS_CROMATICAS.indexOf(nota);
    if (idx === -1) idx = NOTAS_CROMATICAS_SOSTENIDOS.indexOf(nota);

    // Si no se encuentra (caso raro), devolver nota base con frecuencia 0
    if (idx === -1) return { nombre: nota, octava, frecuencia: 0 };

    let nuevoIdx = idx + semitonos;
    let nuevaOctava = octava;

    // Manejo inteligente de octavas
    while (nuevoIdx >= 12) { nuevoIdx -= 12; nuevaOctava++; }
    while (nuevoIdx < 0) { nuevoIdx += 12; nuevaOctava--; }

    // Elegir la lista de nombres según la preferencia
    const listaNombres = usarSostenidos ? NOTAS_CROMATICAS_SOSTENIDOS : NOTAS_CROMATICAS;
    const nuevoNombre = listaNombres[nuevoIdx];

    // Buscar la frecuencia de forma robusta (usando nombres internos de la tabla 'tono')
    const nombreReferencia = NOTAS_CROMATICAS[nuevoIdx]; // Siempre usar la base de bemoles para buscar frecuencia
    const freqs = (tono as any)[nombreReferencia];

    let freq = 0;
    if (freqs) {
        // Si la octava existe, usarla; si no, ir a la más cercana disponible para no silenciar
        if (freqs[nuevaOctava]) {
            freq = freqs[nuevaOctava];
        } else {
            const octavasDisponibles = Object.keys(freqs).map(Number).sort((a,b) => a-b);
            if (octavasDisponibles.length > 0) {
                const octavaCercana = nuevaOctava < octavasDisponibles[0]
                    ? octavasDisponibles[0]
                    : octavasDisponibles[octavasDisponibles.length - 1];
                freq = freqs[octavaCercana];
            }
        }
    }

    return { nombre: nuevoNombre, octava: nuevaOctava, frecuencia: freq };
}

function construirAcordeBajo(notaBase: string, octavaBase: number, tipo: string, semitonos: number, usarSostenidos: boolean): number[] | number {
    const fund = transponerNota(notaBase, octavaBase, semitonos, usarSostenidos);
    const f1 = fund.frecuencia;
    if (tipo === 'nota') return f1;
    let tercerIntervalo = tipo === 'mayor' ? 4 : 3;
    const f3 = transponerNota(notaBase, octavaBase, semitonos + tercerIntervalo, usarSostenidos).frecuencia;
    const f5 = transponerNota(notaBase, octavaBase, semitonos + 7, usarSostenidos).frecuencia;
    return [f1, f3, f5];
}

function generarTonalidad(semitonosOffset: number, usarSostenidos: boolean = false) {
    const generarFilas = (filaBase: any[], prefijoId: string) => {
        return filaBase.map(b => {
            const t = transponerNota(b.n, b.o, semitonosOffset, usarSostenidos);
            return {
                id: `${prefijoId}-${b.i}-${b.t}`,
                nombre: t.nombre,
                frecuencia: t.frecuencia
            };
        });
    };

    const generarBajos = (filaBase: any[], prefijoId: string) => {
        return filaBase.map(b => {
            let freq;
            if (b.tipo === 'nota') freq = transponerNota(b.n, b.o, semitonosOffset, usarSostenidos).frecuencia;
            else freq = construirAcordeBajo(b.n, b.o, b.tipo, semitonosOffset, usarSostenidos);
            const n = transponerNota(b.n, b.o, semitonosOffset, usarSostenidos).nombre;
            const sufijo = b.tipo === 'mayor' ? 'M' : b.tipo === 'menor' ? 'm' : '';
            return {
                id: `${prefijoId}-${b.i}-${b.t}-bajo`,
                nombre: n + sufijo,
                frecuencia: freq,
                tipo: b.tipo
            };
        });
    };

    return {
        primeraFila: generarFilas(DEFINICION_BASE.primeraFila, '1'),
        segundaFila: generarFilas(DEFINICION_BASE.segundaFila, '2'),
        terceraFila: generarFilas(DEFINICION_BASE.terceraFila, '3'),
        disposicionBajos: {
            una: generarBajos(DEFINICION_BASE.bajos.una, '1'),
            dos: generarBajos(DEFINICION_BASE.bajos.dos, '2')
        }
    };
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

// --- RESOLUTORES PARA LA BIBLIOTECA ---

/**
 * Mapeo de offsets por NOMBRE DE TONALIDAD (Para el selector de acordeón)
 */
export const TONALIDAD_OFFSETS: Record<string, number> = {
    'F-Bb-Eb': 0, 'Gb-B-E': 1, 'GCF': 2, 'ADG_FLAT': 3, 'ADG': 4, 'BES': 5, 'CINCO_LETRAS': 5,
    'BEA': 6, 'CFB': 7, 'DGB': 8, 'GDC': 9, 'ELR': 10, 'EAD': 11
};

/**
 * Mapeo de TONALIDADES LÍDERES por cada hilera del acordeón seleccionado.
 */
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

/**
 * Traduce un ID de botón a su nota real según el offset
 */
export function resolverNotaDeBoton(id: string, offset: number): string {
    const parts = id.split('-'); // ej: "1-4-halar" o "b-1-halar"
    if (parts.length < 3) return '?';

    const fila = parts[0];
    const index = parseInt(parts[1]);
    const fuelle = parts[2];

    let baseInfo: any = null;

    if (fila === '1') baseInfo = DEFINICION_BASE.primeraFila.find(b => b.i === index && b.t === fuelle);
    else if (fila === '2') baseInfo = DEFINICION_BASE.segundaFila.find(b => b.i === index && b.t === fuelle);
    else if (fila === '3') baseInfo = DEFINICION_BASE.terceraFila.find(b => b.i === index && b.t === fuelle);
    else if (fila === 'b') {
        // Bajos
        baseInfo = [...DEFINICION_BASE.bajos.una, ...DEFINICION_BASE.bajos.dos].find(b => b.i === index && b.t === fuelle);
    }

    if (!baseInfo) return '?';

    const t = transponerNota(baseInfo.n, baseInfo.o, offset);
    return t.nombre;
}

/**
 * Obtiene el listado de notas de un acorde
 */
export function obtenerNotasDelAcorde(botones: string[], offset: number = 2): string {
    if (!botones || !Array.isArray(botones)) return '';
    const notas = botones.map(id => resolverNotaDeBoton(id, offset)).filter(n => n !== '?');
    // Eliminar duplicados si los hay (ej. misma nota en distintas octavas si se desea simplificado)
    const unicas = Array.from(new Set(notas));
    return unicas.join(', ');
}

/**
 * RECONOCEDOR DE ACORDES (CEREBRO ARMÓNICO)
 * Identifica el nombre del acorde analizando las notas que contiene.
 */
export function identificarNombreAcorde(botones: string[], offset: number = 2): string {
    if (!botones || !Array.isArray(botones)) return 'Acorde Desconocido';

    // Obtener las notas reales y normalizar a la escala de GCF (para búsqueda consistente)
    const notasOriginales = botones.map(id => resolverNotaDeBoton(id, offset)).filter(n => n !== '?');

    // Función interna para normalizar nombres (Do# -> Reb, etc.) para búsqueda de ADN
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

    // Generar tabla completa de búsqueda
    const TABLA_ADN: { nombre: string, adn: string[] }[] = [];
    for (let i = 0; i < 12; i++) {
        // Añadimos séptimas PRIMERO para que tengan prioridad en la detección
        TABLA_ADN.push(obtenerADN(i, 'Septima'));
        TABLA_ADN.push(obtenerADN(i, 'Menor7'));
        TABLA_ADN.push(obtenerADN(i, 'Mayor'));
        TABLA_ADN.push(obtenerADN(i, 'Menor'));
    }

    // Buscar coincidencia
    for (const item of TABLA_ADN) {
        if (item.adn.length === 0) continue;
        // Un acorde coincide si TODAS las notas de su ADN están presentes en los botones pulsados
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
