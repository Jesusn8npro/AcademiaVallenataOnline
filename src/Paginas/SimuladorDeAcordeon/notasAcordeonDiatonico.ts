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

const NOTAS_CROMATICAS = ['Do', 'Reb', 'Re', 'Mib', 'Mi', 'Fa', 'Solb', 'Sol', 'Lab', 'La', 'Sib', 'Si'];
const NOTAS_CROMATICAS_SOSTENIDOS = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

// Definición base abstracta (Tonalidad FBE - Fa Sib Mib)
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
    const idx = NOTAS_CROMATICAS.indexOf(nota);
    if (idx === -1) {
        const idxSos = NOTAS_CROMATICAS_SOSTENIDOS.indexOf(nota);
        if (idxSos !== -1) {
            let nuevoIdx = idxSos + semitonos;
            let nuevaOctava = octava;
            while (nuevoIdx >= 12) { nuevoIdx -= 12; nuevaOctava++; }
            while (nuevoIdx < 0) { nuevoIdx += 12; nuevaOctava--; }
            const lista = usarSostenidos ? NOTAS_CROMATICAS_SOSTENIDOS : NOTAS_CROMATICAS;
            const nuevoNombre = lista[nuevoIdx];
            const freqs = (tono as any)[nuevoNombre] || (tono as any)[NOTAS_CROMATICAS[nuevoIdx]];
            let freq = 0;
            if (freqs && freqs[nuevaOctava]) freq = freqs[nuevaOctava];
            else if (freqs) freq = freqs[Math.min(Math.max(0, nuevaOctava), freqs.length - 1)];
            return { nombre: nuevoNombre, octava: nuevaOctava, frecuencia: freq };
        }
        return { nombre: nota, octava, frecuencia: 0 };
    }

    let nuevoIdx = idx + semitonos;
    let nuevaOctava = octava;

    while (nuevoIdx >= 12) { nuevoIdx -= 12; nuevaOctava++; }
    while (nuevoIdx < 0) { nuevoIdx += 12; nuevaOctava--; }

    const listaNombres = usarSostenidos ? NOTAS_CROMATICAS_SOSTENIDOS : NOTAS_CROMATICAS;
    const nuevoNombre = listaNombres[nuevoIdx];
    const nombreParaFrecuencia = NOTAS_CROMATICAS[nuevoIdx];
    const freqs = (tono as any)[nombreParaFrecuencia];
    let freq = 0;
    if (freqs && freqs[nuevaOctava]) freq = freqs[nuevaOctava];
    else if (freqs) freq = freqs[Math.min(Math.max(0, nuevaOctava), freqs.length - 1)];

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

export const TONALIDADES = {
    'F-Bb-Eb': generarTonalidad(0),
    'Gb-B-E': generarTonalidad(1),
    'GCF': generarTonalidad(2),
    'ADG_FLAT': generarTonalidad(3),
    'ADG': generarTonalidad(4),
    'BES': generarTonalidad(5),
    'BEA': generarTonalidad(6),
    'CFB': generarTonalidad(7),
    'DGB': generarTonalidad(8),
    'GDC': generarTonalidad(9),
    'ELR': generarTonalidad(10),
};

const tonalidadPorDefecto = TONALIDADES['F-Bb-Eb'];
export const primeraFila = tonalidadPorDefecto.primeraFila;
export const segundaFila = tonalidadPorDefecto.segundaFila;
export const terceraFila = tonalidadPorDefecto.terceraFila;
export const disposicionBajos = tonalidadPorDefecto.disposicionBajos;
export const disposicion: Record<string, BotonNota[]> = { primeraFila, segundaFila, terceraFila }

export const mapaFilas: Record<number, string> = { 1: 'primeraFila', 2: 'segundaFila', 3: 'terceraFila' }
export const mapaFilasBajos: Record<number, string> = { 1: 'una', 2: 'dos' }
export const tonosFilas: Record<string, Record<string, string>> = { FBE: { primeraFila: 'Fa', segundaFila: 'Sib', terceraFila: 'Mib' } }
export const filas = ['primeraFila', 'segundaFila', 'terceraFila']
export const filasBajos = ['una', 'dos']
export const cambiarFuelle = 'q'