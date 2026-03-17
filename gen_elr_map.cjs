const fs = require('fs');
const path = require('path');

// 1. CARGAMOS LA TONALIDAD ELR
const code = fs.readFileSync('src/Paginas/SimuladorDeAcordeon/notasAcordeonDiatonico.ts', 'utf8');
const TONALIDADES_MATCH = code.match(/export const TONALIDADES: Record<string, Tonalidad> = ([\s\S]*?\n\};\n)/);
let TONALIDADES;
if (TONALIDADES_MATCH) {
    // Para simplificar, mejor parseamos el output que ya tuvimos.
}
