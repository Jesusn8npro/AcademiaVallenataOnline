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
}

// --- SISTEMA DE TRANSPOSICIÓN ---

// Lista cromática para calcular índices
const NOTAS_CROMATICAS = ['Do', 'Reb', 'Re', 'Mib', 'Mi', 'Fa', 'Solb', 'Sol', 'Lab', 'La', 'Sib', 'Si'];
const NOTAS_CROMATICAS_SOSTENIDOS = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

// Definición base abstracta (Tonalidad FBE - Fa Sib Mib)
// Se usa esta estructura para generar cualquier otra tonalidad mediante transposición
const DEFINICION_BASE = {
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
        { i: 1, n: 'Reb', o: 4, t: 'empujar' }, { i: 2, n: 'Sib', o: 3, t: 'empujar' }, { i: 3, n: 'Mib', o: 4, t: 'empujar' },
        { i: 4, n: 'Sol', o: 4, t: 'empujar' }, { i: 5, n: 'Sib', o: 4, t: 'empujar' }, { i: 6, n: 'Mib', o: 5, t: 'empujar' },
        { i: 7, n: 'Sib', o: 5, t: 'empujar' }, { i: 8, n: 'Sib', o: 5, t: 'empujar' }, { i: 9, n: 'Mib', o: 6, t: 'empujar' },
        { i: 10, n: 'Sol', o: 6, t: 'empujar' }
    ],
    // Bajos (Simplificado para transposición de fundamentales, los acordes se construyen dinámicamente)
    // Definimos solo la nota fundamental y octava, el sistema de bajos debe reconstruir el acorde
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

// Función auxiliar para transponer una nota
function transponerNota(nota: string, octava: number, semitonos: number, usarSostenidos: boolean = false): { nombre: string, octava: number, frecuencia: number } {
    const idx = NOTAS_CROMATICAS.indexOf(nota);
    // Si no está en la lista estándar (quizás ya es sostenido o nombre en inglés), buscamos en la de sostenidos por si acaso, o retornamos tal cual
    if (idx === -1) {
        const idxSos = NOTAS_CROMATICAS_SOSTENIDOS.indexOf(nota);
        if (idxSos !== -1) {
            // Lógica idéntica pero partiendo de sostenidos
            let nuevoIdx = idxSos + semitonos;
            let nuevaOctava = octava;
            while (nuevoIdx >= 12) { nuevoIdx -= 12; nuevaOctava++; }
            while (nuevoIdx < 0) { nuevoIdx += 12; nuevaOctava--; }
            const lista = usarSostenidos ? NOTAS_CROMATICAS_SOSTENIDOS : NOTAS_CROMATICAS;
            const nuevoNombre = lista[nuevoIdx];
            const freqs = (tono as any)[nuevoNombre] || (tono as any)[NOTAS_CROMATICAS[nuevoIdx]]; // Fallback freq
            let freq = 0;
            if (freqs && freqs[nuevaOctava]) freq = freqs[nuevaOctava];
            else if (freqs) freq = freqs[Math.min(Math.max(0, nuevaOctava), freqs.length - 1)];
            return { nombre: nuevoNombre, octava: nuevaOctava, frecuencia: freq };
        }
        return { nombre: nota, octava, frecuencia: 0 };
    }

    let nuevoIdx = idx + semitonos;
    let nuevaOctava = octava;

    // Ajustar octava si nos salimos del rango (hacia arriba o abajo)
    while (nuevoIdx >= 12) {
        nuevoIdx -= 12;
        nuevaOctava++;
    }
    while (nuevoIdx < 0) {
        nuevoIdx += 12;
        nuevaOctava--;
    }

    const listaNombres = usarSostenidos ? NOTAS_CROMATICAS_SOSTENIDOS : NOTAS_CROMATICAS;
    const nuevoNombre = listaNombres[nuevoIdx];

    // Obtener frecuencia segura. 
    // NOTA: El objeto `tono` usa claves como 'Do', 'Reb', etc. (FLATS). 
    // Si nuevoNombre es 'Do#' (SHARP), necesitamos buscar la frecuencia usando su equivalente FLAT 'Reb' 
    // porque `mapaTecladoYFrecuencias.ts` solo tiene definiciones con bemoles (flats) por defecto.
    const nombreParaFrecuencia = NOTAS_CROMATICAS[nuevoIdx]; // Siempre usamos el nombre flat para buscar la frecuencia

    const freqs = (tono as any)[nombreParaFrecuencia];
    let freq = 0;

    // Mapeo seguro de índices de array de frecuencias
    if (freqs && freqs[nuevaOctava]) {
        freq = freqs[nuevaOctava];
    } else if (freqs) {
        // Fallback si la octava no existe (muy aguda o grave), clamping
        freq = freqs[Math.min(Math.max(0, nuevaOctava), freqs.length - 1)];
    }

    return { nombre: nuevoNombre, octava: nuevaOctava, frecuencia: freq };
}

// Función para construir acordes de bajos transpuestos
function construirAcordeBajo(notaBase: string, octavaBase: number, tipo: string, semitonos: number, usarSostenidos: boolean): number[] | number {
    // Transponer la fundamental
    const fund = transponerNota(notaBase, octavaBase, semitonos, usarSostenidos);

    // Intervalos en semitonos desde la fundamental
    // Mayor: 0, 4 (3ra M), 7 (5ta J)
    // Menor: 0, 3 (3ra m), 7 (5ta J)
    // Nota sola: 0

    // Para simplificar y reutilizar transponerNota, calculamos las frecuencias de las componentes
    const f1 = fund.frecuencia;

    if (tipo === 'nota') return f1;

    let tercerIntervalo = tipo === 'mayor' ? 4 : 3;
    const f3 = transponerNota(notaBase, octavaBase, semitonos + tercerIntervalo, usarSostenidos).frecuencia;
    const f5 = transponerNota(notaBase, octavaBase, semitonos + 7, usarSostenidos).frecuencia;

    return [f1, f3, f5];
}

// Generador de Tonalidad
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
            if (b.tipo === 'nota') {
                freq = transponerNota(b.n, b.o, semitonosOffset, usarSostenidos).frecuencia;
            } else {
                freq = construirAcordeBajo(b.n, b.o, b.tipo, semitonosOffset, usarSostenidos);
            }
            // Nombre descriptivo (ej: Sol Mayor, Sol)
            const n = transponerNota(b.n, b.o, semitonosOffset, usarSostenidos).nombre;
            const sufijo = b.tipo === 'mayor' ? ' Mayor' : b.tipo === 'menor' ? ' Menor' : '';

            return {
                id: `${prefijoId}-${b.i}-${b.t}-bajo`,
                nombre: n + sufijo,
                frecuencia: freq
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

// --- DEFINICIÓN DE TONALIDADES ---

export const TONALIDADES = {
    'F-Bb-Eb': generarTonalidad(0), // Fa - Sib - Mib (Original)
    'Gb-B-E': generarTonalidad(1), // Solb - Si - Mi (Gb-B-E) (Original + 1st)
    'GCF': generarTonalidad(2), // Sol - Do - Fa (GCF) (Original + 2st)
    'ADG_FLAT': generarTonalidad(3), // Lab - Reb - Solb (Ab-Db-Gb) (Original + 3st)
    'ADG': generarTonalidad(4), // La - Re - Sol (ADG) (Original + 4st)
    'BES': generarTonalidad(5), // Sib - Mib - Lab (Cinco Letras) (Original + 5st)
    'BEA': generarTonalidad(6), // Si - Mi - La (Original + 6st)
    'CFB': generarTonalidad(7), // Do - Fa - Sib (Original + 7st)
    'DGB': generarTonalidad(8), // Reb - Solb - Si (Db Gb B) (Original + 8st)
    'GDC': generarTonalidad(9), // Re - Sol - Do (GDC) (Original + 9st)
    'ELR': generarTonalidad(10), // Mib - Lab - Reb (ELR) (Original + 10st)
};

// Exportar por defecto la tonalidad FBE para mantener compatibilidad
const tonalidadPorDefecto = TONALIDADES['F-Bb-Eb'];
export const primeraFila = tonalidadPorDefecto.primeraFila;
export const segundaFila = tonalidadPorDefecto.segundaFila;
export const terceraFila = tonalidadPorDefecto.terceraFila;
export const disposicionBajos = tonalidadPorDefecto.disposicionBajos;

export const disposicion: Record<string, BotonNota[]> = { primeraFila, segundaFila, terceraFila }

// Mapa de botones por ID (Esto se recalculará si cambiamos de tono en el componente, pero dejamos este estático por compatibilidad)
// NOTA: Si se cambia de tono dinámicamente, este mapa estático NO servirá. El componente debe generar su propio mapa.
const allButtons = [
    ...primeraFila,
    ...segundaFila,
    ...terceraFila,
    ...disposicionBajos.una,
    ...disposicionBajos.dos
];

export const mapaBotonesPorId: Record<string, BotonNota> = allButtons.reduce(
    (acc, value) => {
        return { ...acc, [value.id]: value }
    },
    {} as Record<string, BotonNota>
)

export const mapaFilas: Record<number, string> = { 1: 'primeraFila', 2: 'segundaFila', 3: 'terceraFila' }
export const mapaFilasBajos: Record<number, string> = { 1: 'una', 2: 'dos' }
export const tonosFilas: Record<string, Record<string, string>> = { FBE: { primeraFila: 'Fa', segundaFila: 'Sib', terceraFila: 'Mib' } }
export const filas = ['primeraFila', 'segundaFila', 'terceraFila']
export const filasBajos = ['una', 'dos']
export const cambiarFuelle = 'q'