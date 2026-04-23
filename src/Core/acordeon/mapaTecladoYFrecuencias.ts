// 🎹 Mapeo de teclado y frecuencias
// Este archivo conecta las teclas del computador con la posición de botones del acordeón,
// y además define la frecuencia (tono en Hz) de cada nota musical.
// Se usa para identificar qué tecla toca qué nota, y qué frecuencia reproducir.

interface KeyMapping {
    fila: number;
    columna: number;
}

// 🔀 Mapa que conecta las teclas del computador con el acordeón (teclado diatónico)
export const mapaTeclas: Record<string, KeyMapping> = {
    z: { fila: 1, columna: 1 },
    x: { fila: 1, columna: 2 },
    c: { fila: 1, columna: 3 },
    v: { fila: 1, columna: 4 },
    b: { fila: 1, columna: 5 },
    n: { fila: 1, columna: 6 },
    m: { fila: 1, columna: 7 },
    ',': { fila: 1, columna: 8 },
    '.': { fila: 1, columna: 9 },
    '-': { fila: 1, columna: 10 },
    // El siguiente está vacío, puedes eliminarlo si no lo usas
    a: { fila: 2, columna: 1 },
    s: { fila: 2, columna: 2 },
    d: { fila: 2, columna: 3 },
    f: { fila: 2, columna: 4 },
    g: { fila: 2, columna: 5 },
    h: { fila: 2, columna: 6 },
    j: { fila: 2, columna: 7 },
    k: { fila: 2, columna: 8 },
    l: { fila: 2, columna: 9 },
    'ñ': { fila: 2, columna: 10 },
    "{'}}": { fila: 2, columna: 11 },
    w: { fila: 3, columna: 1 },
    e: { fila: 3, columna: 2 },
    r: { fila: 3, columna: 3 },
    t: { fila: 3, columna: 4 },
    y: { fila: 3, columna: 5 },
    u: { fila: 3, columna: 6 },
    i: { fila: 3, columna: 7 },
    o: { fila: 3, columna: 8 },
    p: { fila: 3, columna: 9 },
    '+': { fila: 3, columna: 10 },
    '}': { fila: 3, columna: 11 },
}

// 🎹 Mapa extendido para acordeón cromático (usa también números)
export const mapaTeclasCromatico: Record<string, KeyMapping> = {
    ...mapaTeclas,
    3: { fila: 4, columna: 1 },
    4: { fila: 4, columna: 2 },
    5: { fila: 4, columna: 3 },
    6: { fila: 4, columna: 4 },
    7: { fila: 4, columna: 5 },
    8: { fila: 4, columna: 6 },
    9: { fila: 4, columna: 7 },
    0: { fila: 4, columna: 8 },
    '-': { fila: 4, columna: 9 },
    '=': { fila: 4, columna: 10 },
}

// 🎵 Frecuencias de notas musicales (en Hertz)
// Se usan para generar el sonido real de cada nota con Web Audio API
export const tono: Record<string, number[]> = {
    Do: [16.35, 32.7, 65.41, 130.81, 261.63, 523.25, 1046.5, 2093.0, 4186.01],
    Reb: [17.32, 34.65, 69.3, 138.59, 277.18, 554.37, 1108.73, 2217.46, 4434.92],
    Re: [18.35, 36.71, 73.42, 146.83, 293.66, 587.33, 1174.66, 2349.32, 4698.64],
    Mib: [19.45, 38.89, 77.78, 155.56, 311.13, 622.25, 1244.51, 2489.02, 4978.03],
    Mi: [20.6, 41.2, 82.41, 164.81, 329.63, 659.26, 1318.51, 2637.02],
    Fa: [21.83, 43.65, 87.31, 174.61, 349.23, 698.46, 1396.91, 2793.83],
    Solb: [23.12, 46.25, 92.5, 185.0, 369.99, 739.99, 1479.98, 2959.96],
    Sol: [24.5, 49.0, 98.0, 196.0, 392.0, 783.99, 1567.98, 3135.96],
    Lab: [25.96, 51.91, 103.83, 207.65, 415.3, 830.61, 1661.22, 3322.44],
    La: [27.5, 55.0, 110.0, 220.0, 440.0, 880.0, 1760.0, 3520.0],
    Sib: [29.14, 58.27, 116.54, 233.08, 466.16, 932.33, 1864.66, 3729.31],
    Si: [30.87, 61.74, 123.47, 246.94, 493.88, 987.77, 1975.53, 3951.07],
}
