import { tono } from './mapaTecladoYFrecuencias'

const NOTAS_CROMATICAS = ['Do', 'Reb', 'Re', 'Mib', 'Mi', 'Fa', 'Solb', 'Sol', 'Lab', 'La', 'Sib', 'Si'];
const NOTAS_CROMATICAS_SOSTENIDOS = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

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

export function transponerNota(nota: string, octava: number, semitonos: number, usarSostenidos: boolean = false): { nombre: string, octava: number, frecuencia: number } {
    let idx = NOTAS_CROMATICAS.indexOf(nota);
    if (idx === -1) idx = NOTAS_CROMATICAS_SOSTENIDOS.indexOf(nota);
    if (idx === -1) return { nombre: nota, octava, frecuencia: 0 };

    let nuevoIdx = idx + semitonos;
    let nuevaOctava = octava;

    while (nuevoIdx >= 12) { nuevoIdx -= 12; nuevaOctava++; }
    while (nuevoIdx < 0) { nuevoIdx += 12; nuevaOctava--; }

    const listaNombres = usarSostenidos ? NOTAS_CROMATICAS_SOSTENIDOS : NOTAS_CROMATICAS;
    const nuevoNombre = listaNombres[nuevoIdx];

    const nombreReferencia = NOTAS_CROMATICAS[nuevoIdx];
    const freqs = (tono as any)[nombreReferencia];

    let freq = 0;
    if (freqs) {
        if (freqs[nuevaOctava]) {
            freq = freqs[nuevaOctava];
        } else {
            const octavasDisponibles = Object.keys(freqs).map(Number).sort((a, b) => a - b);
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
    const tercerIntervalo = tipo === 'mayor' ? 4 : 3;
    const f3 = transponerNota(notaBase, octavaBase, semitonos + tercerIntervalo, usarSostenidos).frecuencia;
    const f5 = transponerNota(notaBase, octavaBase, semitonos + 7, usarSostenidos).frecuencia;
    return [f1, f3, f5];
}

export function generarTonalidad(semitonosOffset: number, usarSostenidos: boolean = false) {
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
