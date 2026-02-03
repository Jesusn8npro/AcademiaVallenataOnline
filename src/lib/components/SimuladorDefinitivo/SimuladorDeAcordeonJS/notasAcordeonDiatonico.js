
import { tono } from './mapaTecladoYFrecuencias.js' // Importa las frecuencias de notas en español

// Mapa de teclas de bajos (mano izquierda)
export const mapaTeclasBajos = {
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

// Primera fila de botones (mano derecha)
export const primeraFila = [
  // Halar (Pull)
  { id: '1-1-halar', nombre: 'Reb', frecuencia: tono.Reb[4] },
  { id: '1-2-halar', nombre: 'Sol', frecuencia: tono.Sol[3] },
  { id: '1-3-halar', nombre: 'Sib', frecuencia: tono.Sib[3] },
  { id: '1-4-halar', nombre: 'Re', frecuencia: tono.Re[4] },
  { id: '1-5-halar', nombre: 'Mi', frecuencia: tono.Mi[4] },
  { id: '1-6-halar', nombre: 'Sol', frecuencia: tono.Sol[4] },
  { id: '1-7-halar', nombre: 'Sib', frecuencia: tono.Sib[4] },
  { id: '1-8-halar', nombre: 'Re', frecuencia: tono.Re[5] },
  { id: '1-9-halar', nombre: 'Mi', frecuencia: tono.Mi[5] },
  { id: '1-10-halar', nombre: 'Sol', frecuencia: tono.Sol[5] },
  // Empujar (Push)
  { id: '1-1-empujar', nombre: 'Si', frecuencia: tono.Si[3] },
  { id: '1-2-empujar', nombre: 'Fa', frecuencia: tono.Fa[3] },
  { id: '1-3-empujar', nombre: 'La', frecuencia: tono.La[3] },
  { id: '1-4-empujar', nombre: 'Do', frecuencia: tono.Do[4] },
  { id: '1-5-empujar', nombre: 'Fa', frecuencia: tono.Fa[4] },
  { id: '1-6-empujar', nombre: 'La', frecuencia: tono.La[4] },
  { id: '1-7-empujar', nombre: 'Do', frecuencia: tono.Do[5] },
  { id: '1-8-empujar', nombre: 'Fa', frecuencia: tono.Fa[5] },
  { id: '1-9-empujar', nombre: 'La', frecuencia: tono.La[5] },
  { id: '1-10-empujar', nombre: 'Do', frecuencia: tono.Do[6] },
]

// Segunda fila de botones (mano derecha)
export const segundaFila = [
  // Halar (Pull)
  { id: '2-1-halar', nombre: 'Solb', frecuencia: tono.Solb[4] },
  { id: '2-2-halar', nombre: 'La', frecuencia: tono.La[3] },
  { id: '2-3-halar', nombre: 'Do', frecuencia: tono.Do[4] },
  { id: '2-4-halar', nombre: 'Mib', frecuencia: tono.Mib[4] },
  { id: '2-5-halar', nombre: 'Sol', frecuencia: tono.Sol[4] },
  { id: '2-6-halar', nombre: 'La', frecuencia: tono.La[4] },
  { id: '2-7-halar', nombre: 'Do', frecuencia: tono.Do[5] },
  { id: '2-8-halar', nombre: 'Mib', frecuencia: tono.Mib[5] },
  { id: '2-9-halar', nombre: 'Sol', frecuencia: tono.Sol[5] },
  { id: '2-10-halar', nombre: 'La', frecuencia: tono.La[5] },
  { id: '2-11-halar', nombre: 'Do', frecuencia: tono.Do[6] },
  // Empujar (Push)
  { id: '2-1-empujar', nombre: 'Mi', frecuencia: tono.Mi[4] },
  { id: '2-2-empujar', nombre: 'Fa', frecuencia: tono.Fa[3] },
  { id: '2-3-empujar', nombre: 'Sib', frecuencia: tono.Sib[3] },
  { id: '2-4-empujar', nombre: 'Re', frecuencia: tono.Re[4] },
  { id: '2-5-empujar', nombre: 'Fa', frecuencia: tono.Fa[4] },
  { id: '2-6-empujar', nombre: 'Sib', frecuencia: tono.Sib[4] },
  { id: '2-7-empujar', nombre: 'Re', frecuencia: tono.Re[5] },
  { id: '2-8-empujar', nombre: 'Fa', frecuencia: tono.Fa[5] },
  { id: '2-9-empujar', nombre: 'Sib', frecuencia: tono.Sib[5] },
  { id: '2-10-empujar', nombre: 'Re', frecuencia: tono.Re[6] },
  { id: '2-11-empujar', nombre: 'Fa', frecuencia: tono.Fa[6] },
]

// Tercera fila de botones (mano derecha)
export const terceraFila = [
  // Halar (Pull)
  { id: '3-1-halar', nombre: 'Si', frecuencia: tono.Si[4] },
  { id: '3-2-halar', nombre: 'Re', frecuencia: tono.Re[4] },
  { id: '3-3-halar', nombre: 'Fa', frecuencia: tono.Fa[4] },
  { id: '3-4-halar', nombre: 'Lab', frecuencia: tono.Lab[4] },
  { id: '3-5-halar', nombre: 'Do', frecuencia: tono.Do[5] },
  { id: '3-6-halar', nombre: 'Re', frecuencia: tono.Re[5] },
  { id: '3-7-halar', nombre: 'Fa', frecuencia: tono.Fa[5] },
  { id: '3-8-halar', nombre: 'Lab', frecuencia: tono.Lab[5] },
  { id: '3-9-halar', nombre: 'Do', frecuencia: tono.Do[6] },
  { id: '3-10-halar', nombre: 'Re', frecuencia: tono.Re[6] },
  // Empujar (Push)
  { id: '3-1-empujar', nombre: 'Reb', frecuencia: tono.Reb[4] },
  { id: '3-2-empujar', nombre: 'Sib', frecuencia: tono.Sib[3] },
  { id: '3-3-empujar', nombre: 'Mib', frecuencia: tono.Mib[4] },
  { id: '3-4-empujar', nombre: 'Sol', frecuencia: tono.Sol[4] },
  { id: '3-5-empujar', nombre: 'Sib', frecuencia: tono.Sib[4] },
  { id: '3-6-empujar', nombre: 'Mib', frecuencia: tono.Mib[5] },
  { id: '3-7-empujar', nombre: 'Sib', frecuencia: tono.Sib[5] },
  { id: '3-8-empujar', nombre: 'Sib', frecuencia: tono.Sib[5] },
  { id: '3-9-empujar', nombre: 'Mib', frecuencia: tono.Mib[6] },
  { id: '3-10-empujar', nombre: 'Sol', frecuencia: tono.Sol[6] },
]

// Disposición de bajos (mano izquierda)
export const disposicionBajos = {
  una: [
    { id: '1-1-halar-bajo', nombre: 'sol menor', frecuencia: [tono.Sol[3], tono.Sib[4], tono.Re[4]] },
    { id: '1-2-halar-bajo', nombre: 'Sol', frecuencia: tono.Sol[2] },
    { id: '1-1-empujar-bajo', nombre: 're menor', frecuencia: [tono.Re[3], tono.Solb[4], tono.La[4]] },
    { id: '1-2-empujar-bajo', nombre: 'Re', frecuencia: tono.Re[3] },

    { id: '1-3-halar-bajo', nombre: 'do menor', frecuencia: [tono.Do[3], tono.Mib[4], tono.Sol[4]] },
    { id: '1-4-halar-bajo', nombre: 'Do', frecuencia: tono.Do[3] },
    { id: '1-3-empujar-bajo', nombre: 'sol mayor', frecuencia: [tono.Do[3], tono.Mi[4], tono.Sol[4]] },
    { id: '1-4-empujar-bajo', nombre: 'Sol', frecuencia: tono.Sol[2] },

    { id: '1-5-halar-bajo', nombre: 'la bemol', frecuencia: [tono.Lab[3], tono.Do[4], tono.Mib[4]] },
    { id: '1-6-halar-bajo', nombre: 'Lab', frecuencia: tono.Lab[3] },
    { id: '1-5-empujar-bajo', nombre: 'la bemol', frecuencia: [tono.Lab[3], tono.Do[4], tono.Mib[4]] },
    { id: '1-6-empujar-bajo', nombre: 'Lab', frecuencia: tono.Lab[3] },
  ],
  dos: [
    { id: '2-1-halar-bajo', nombre: 'do mayor', frecuencia: [tono.Do[3], tono.Mi[4], tono.Sol[4]] },
    { id: '2-2-halar-bajo', nombre: 'Do', frecuencia: tono.Do[3] },
    { id: '2-1-empujar-bajo', nombre: 'fa mayor', frecuencia: [tono.Fa[3], tono.La[4], tono.Do[4]] },
    { id: '2-2-empujar-bajo', nombre: 'Fa', frecuencia: tono.Fa[3] },

    { id: '2-3-halar-bajo', nombre: 'fa mayor', frecuencia: [tono.Fa[3], tono.La[4], tono.Do[4]] },
    { id: '2-4-halar-bajo', nombre: 'Fa', frecuencia: tono.Fa[3] },
    { id: '2-3-empujar-bajo', nombre: 'si bemol', frecuencia: [tono.Sib[3], tono.Re[4], tono.Fa[4]] },
    { id: '2-4-empujar-bajo', nombre: 'Sib', frecuencia: tono.Sib[3] },

    { id: '2-5-halar-bajo', nombre: 'si bemol', frecuencia: [tono.Sib[3], tono.Re[4], tono.Fa[4]] },
    { id: '2-6-halar-bajo', nombre: 'Sib', frecuencia: tono.Sib[3] },
    { id: '2-5-empujar-bajo', nombre: 'mib mayor', frecuencia: [tono.Mib[3], tono.Sol[4], tono.Sib[4]] },
    { id: '2-6-empujar-bajo', nombre: 'Mib', frecuencia: tono.Mib[3] },
  ],
}

// Scales
// Escalas musicales disponibles
export const escalas = {
  F: {
    notes: [
      ['3-3-pull'],
      ['1-6-pull'],
      ['2-6-pull'],
      ['1-7-pull'],
      ['2-7-pull'],
      ['3-6-pull'],
      ['1-9-pull'],
      ['3-7-pull'],
    ],
    thirds: [
      ['2-6-pull', '3-3-pull'],
      ['1-6-pull', '1-7-pull'],
      ['2-6-pull', '2-7-pull'],
      ['1-7-pull', '1-8-pull'],
      ['1-9-pull', '2-7-pull'],
      ['3-7-pull', '3-6-pull'],
      ['1-9-pull', '1-10-pull'],
      ['2-10-pull', '3-7-pull'],
    ],
  },
  Bb: {
    notes: [
      ['1-3-pull'],
      ['2-3-pull'],
      ['3-2-pull'],
      ['2-4-pull'],
      ['3-3-pull'],
      ['1-6-pull'],
      ['2-6-pull'],
      ['1-7-pull'],
    ],
    thirds: [
      ['1-3-pull', '1-4-pull'],
      ['2-3-pull', '2-4-pull'],
      ['3-2-pull', '3-3-pull'],
      ['2-4-pull', '2-5-pull'],
      ['3-3-pull', '2-6-pull'],
      ['1-6-pull', '1-7-pull'],
      ['2-6-pull', '2-7-pull'],
      ['1-7-pull', '1-8-pull'],
    ],
  },
  Eb: {
    notes: [
      ['2-4-pull'],
      ['3-3-pull'],
      ['2-5-pull'],
      ['3-4-pull'],
      ['1-7-pull'],
      ['2-7-pull'],
      ['3-6-pull'],
      ['2-8-pull'],
    ],
    thirds: [
      ['2-5-pull', '2-4-pull'],
      ['3-3-pull', '3-4-pull'],
      ['2-5-pull', '1-7-pull'],
      ['3-4-pull', '3-5-pull'],
      ['1-7-pull', '1-8-pull'],
      ['2-7-pull', '2-8-pull'],
      ['3-6-pull', '3-7-pull'],
      ['2-8-pull', '2-9-pull'],
    ],
  },
}

// Disposición general de filas
export const disposicion = { primeraFila, segundaFila, terceraFila }
// Mapa de botones por ID
export const mapaBotonesPorId = [
  ...primeraFila, 
  ...segundaFila, 
  ...terceraFila, 
  ...disposicionBajos.una, 
  ...disposicionBajos.dos
].reduce(
  (acc, value) => {
    return { ...acc, [value.id]: value }
  },
  {}
)
export const mapaFilas = { 1: 'primeraFila', 2: 'segundaFila', 3: 'terceraFila' }
export const mapaFilasBajos = { 1: 'una', 2: 'dos' }
export const tonosFilas = { FBE: { primeraFila: 'Fa', segundaFila: 'Sib', terceraFila: 'Mib' } }
export const filas = ['primeraFila', 'segundaFila', 'terceraFila']
export const filasBajos = ['una', 'dos']
export const cambiarFuelle = 'q'
