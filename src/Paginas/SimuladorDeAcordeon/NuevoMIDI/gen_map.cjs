const fs = require('fs');

const NOTAS_CROMATICAS = ['Do', 'Reb', 'Re', 'Mib', 'Mi', 'Fa', 'Solb', 'Sol', 'Lab', 'La', 'Sib', 'Si'];
const NOTAS_CROMATICAS_ENG = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const wavsBrillante = [
    "A-4-cm", "A-5-cm", "Ab-4-cm", "Ab-5-cm", "Ab-6-cm", "B-3-cm", "B-4-cm", "B-5-cm",
    "Bb-3-cm", "Bb-4-cm", "Bb-5-cm", "Bb-6-cm", "C-4-cm", "C-5-cm", "C-6-cm", "C-7-cm",
    "D-4-cm", "D-5-cm", "D-6-cm", "Db-5-cm", "Db-6-cm", "E-4-cm", "E-5-cm", "Eb-4-cm",
    "Eb-5-cm", "Eb-6-cm", "F-4-cm", "F-5-cm", "F-6-cm", "G-4-cm", "G-5-cm", "G-6-cm",
    "Gb-4-cm", "Gb-5-cm"
];

// Archivos de Bajos disponibles según tus capturas
const wavsBajos = [
    "Bajo Eb (acorde)-cm", "Bajo Eb-cm",
    "Bajo F-2-cm", "Bajo F-cm",
    "Bajo G-2-cm", "Bajo G-cm",
    "Bajo Ab (acorde)-cm", "Bajo Ab-2-cm", "Bajo Ab-cm",
    "Bajo Bb (acorde)-cm", "Bajo Bb-cm",
    "Bajo C (acorde)-cm", "Bajo C -cm", // Notar el espacio de C -cm
    "Bajo Cm (acorde)-cm",
    "Bajo Db (acorde)-cm", "Bajo Db-cm",
    "Bajo F (acorde)-cm", "Bajo Fm (acorde)-cm",
    "Bajo G (acorde)-cm", "Bajo G-2-(acorde)-cm"
];

const DEFINICION_BASE = {
    primeraFila: [
        { i: 1, n: 'Reb', o: 4, t: 'halar' }, { i: 2, n: 'Sol', o: 3, t: 'halar' }, { i: 3, n: 'Sib', o: 3, t: 'halar' },
        { i: 4, n: 'Re', o: 4, t: 'halar' }, { i: 5, n: 'Mi', o: 4, t: 'halar' }, { i: 6, n: 'Sol', o: 4, t: 'halar' },
        { i: 7, n: 'Sib', o: 4, t: 'halar' }, { i: 8, n: 'Re', o: 5, t: 'halar' }, { i: 9, n: 'Mi', o: 5, t: 'halar' },
        { i: 10, n: 'Sol', o: 5, t: 'halar' },
        { i: 1, n: 'Si', o: 3, t: 'empujar' }, { i: 2, n: 'Fa', o: 3, t: 'empujar' }, { i: 3, n: 'La', o: 3, t: 'empujar' },
        { i: 4, n: 'Do', o: 4, t: 'empujar' }, { i: 5, n: 'Fa', o: 4, t: 'empujar' }, { i: 6, n: 'La', o: 4, t: 'empujar' },
        { i: 7, n: 'Do', o: 5, t: 'empujar' }, { i: 8, n: 'Fa', o: 5, t: 'empujar' }, { i: 9, n: 'La', o: 5, t: 'empujar' },
        { i: 10, n: 'Do', o: 6, t: 'empujar' }
    ],
    segundaFila: [
        { i: 1, n: 'Solb', o: 4, t: 'halar' }, { i: 2, n: 'La', o: 3, t: 'halar' }, { i: 3, n: 'Do', o: 4, t: 'halar' },
        { i: 4, n: 'Mib', o: 4, t: 'halar' }, { i: 5, n: 'Sol', o: 4, t: 'halar' }, { i: 6, n: 'La', o: 4, t: 'halar' },
        { i: 7, n: 'Do', o: 5, t: 'halar' }, { i: 8, n: 'Mib', o: 5, t: 'halar' }, { i: 9, n: 'Sol', o: 5, t: 'halar' },
        { i: 10, n: 'La', o: 5, t: 'halar' }, { i: 11, n: 'Do', o: 6, t: 'halar' },
        { i: 1, n: 'Mi', o: 4, t: 'empujar' }, { i: 2, n: 'Fa', o: 3, t: 'empujar' }, { i: 3, n: 'Sib', o: 3, t: 'empujar' },
        { i: 4, n: 'Re', o: 4, t: 'empujar' }, { i: 5, n: 'Fa', o: 4, t: 'empujar' }, { i: 6, n: 'Sib', o: 4, t: 'empujar' },
        { i: 7, n: 'Re', o: 5, t: 'empujar' }, { i: 8, n: 'Fa', o: 5, t: 'empujar' }, { i: 9, n: 'Sib', o: 5, t: 'empujar' },
        { i: 10, n: 'Re', o: 6, t: 'empujar' }, { i: 11, n: 'Fa', o: 6, t: 'empujar' }
    ],
    terceraFila: [
        { i: 1, n: 'Si', o: 4, t: 'halar' }, { i: 2, n: 'Re', o: 4, t: 'halar' }, { i: 3, n: 'Fa', o: 4, t: 'halar' },
        { i: 4, n: 'Lab', o: 4, t: 'halar' }, { i: 5, n: 'Do', o: 5, t: 'halar' }, { i: 6, n: 'Re', o: 5, t: 'halar' },
        { i: 7, n: 'Fa', o: 5, t: 'halar' }, { i: 8, n: 'Lab', o: 5, t: 'halar' }, { i: 9, n: 'Do', o: 6, t: 'halar' },
        { i: 10, n: 'Re', o: 6, t: 'halar' },
        { i: 1, n: 'Reb', o: 5, t: 'empujar' }, { i: 2, n: 'Sib', o: 3, t: 'empujar' }, { i: 3, n: 'Mib', o: 4, t: 'empujar' },
        { i: 4, n: 'Sol', o: 4, t: 'empujar' }, { i: 5, n: 'Sib', o: 4, t: 'empujar' }, { i: 6, n: 'Mib', o: 5, t: 'empujar' },
        { i: 7, n: 'Sol', o: 5, t: 'empujar' }, { i: 8, n: 'Sib', o: 5, t: 'empujar' }, { i: 9, n: 'Mib', o: 6, t: 'empujar' },
        { i: 10, n: 'Sol', o: 6, t: 'empujar' }
    ],
    bajosUna: [ // Hilera interior de bajos
        { i: 1, n: 'Sol', o: 3, t: 'halar', tipo: 'menor' }, { i: 2, n: 'Sol', o: 2, t: 'halar', tipo: 'nota' },
        { i: 1, n: 'Re', o: 3, t: 'empujar', tipo: 'mayor' }, { i: 2, n: 'Re', o: 3, t: 'empujar', tipo: 'nota' },
        { i: 3, n: 'Do', o: 3, t: 'halar', tipo: 'menor' }, { i: 4, n: 'Do', o: 3, t: 'halar', tipo: 'nota' },
        { i: 3, n: 'Sol', o: 3, t: 'empujar', tipo: 'mayor' }, { i: 4, n: 'Sol', o: 2, t: 'empujar', tipo: 'nota' },
        { i: 5, n: 'Lab', o: 3, t: 'halar', tipo: 'mayor' }, { i: 6, n: 'Lab', o: 3, t: 'halar', tipo: 'nota' },
        { i: 5, n: 'Lab', o: 3, t: 'empujar', tipo: 'mayor' }, { i: 6, n: 'Lab', o: 3, t: 'empujar', tipo: 'nota' },
    ],
    bajosDos: [ // Hilera exterior de bajos
        { i: 1, n: 'Do', o: 3, t: 'halar', tipo: 'mayor' }, { i: 2, n: 'Do', o: 3, t: 'halar', tipo: 'nota' },
        { i: 1, n: 'Fa', o: 3, t: 'empujar', tipo: 'mayor' }, { i: 2, n: 'Fa', o: 3, t: 'empujar', tipo: 'nota' },
        { i: 3, n: 'Fa', o: 3, t: 'halar', tipo: 'mayor' }, { i: 4, n: 'Fa', o: 3, t: 'halar', tipo: 'nota' },
        { i: 3, n: 'Sib', o: 3, t: 'empujar', tipo: 'mayor' }, { i: 4, n: 'Sib', o: 3, t: 'empujar', tipo: 'nota' },
        { i: 5, n: 'Sib', o: 3, t: 'halar', tipo: 'mayor' }, { i: 6, n: 'Sib', o: 3, t: 'halar', tipo: 'nota' },
        { i: 5, n: 'Mib', o: 3, t: 'empujar', tipo: 'mayor' }, { i: 6, n: 'Mib', o: 3, t: 'empujar', tipo: 'nota' },
    ]
};

function convertirAMidi(notaEng, octava) {
    let base = NOTAS_CROMATICAS_ENG.indexOf(notaEng);
    return base + (octava + 1) * 12;
}

function transponerNota(notaEs, octava, semitonos) {
    let idx = NOTAS_CROMATICAS.indexOf(notaEs);
    let nuevoIdx = idx + semitonos;
    let nuevaOctava = octava;
    while (nuevoIdx >= 12) { nuevoIdx -= 12; nuevaOctava++; }
    while (nuevoIdx < 0) { nuevoIdx += 12; nuevaOctava--; }
    return { nombreEng: NOTAS_CROMATICAS_ENG[nuevoIdx], nombreEs: NOTAS_CROMATICAS[nuevoIdx], octava: nuevaOctava };
}

function archivoWavMasCercanoPitos(midiNote) {
    let closest = null;
    let minDiff = 1000;

    let wavMidis = wavsBrillante.map(w => {
        let parts = w.split('-');
        let n = parts[0];
        let o = parseInt(parts[1]);
        let midi = convertirAMidi(n, o);
        return { name: w, midi: midi };
    });

    for (let w of wavMidis) {
        let diff = midiNote - w.midi;
        if (Math.abs(diff) < minDiff) {
            minDiff = diff;
            closest = w;
        }
    }
    return { wav: closest.name, semitonos: minDiff };
}

function archivoWavMasCercanoBajos(nombreEng, tipo) {
    let busqueda = "";
    if (tipo === 'nota') {
        // Buscar el bajo suelto ej. Bajo C-cm o Bajo C -cm
        buquedaA = `Bajo ${nombreEng}-cm`;
        buquedaB = `Bajo ${nombreEng}-2-cm`;
        buquedaC = `Bajo ${nombreEng} -cm`;

        if (wavsBajos.includes(buquedaA)) return buquedaA;
        if (wavsBajos.includes(buquedaB)) return buquedaB;
        if (wavsBajos.includes(buquedaC)) return buquedaC;

        // Retornar algo seguro
        return `Bajo ${nombreEng} (PITCH_NEEDED)`;
    } else {
        // Acorde
        let modoStr = tipo === 'menor' ? 'm' : '';
        busqueda = `Bajo ${nombreEng}${modoStr} (acorde)-cm`;

        if (wavsBajos.includes(busqueda)) return busqueda;
        // Buscar alternativa
        return `Bajo ${nombreEng}${modoStr} (acorde_PITCH_NEEDED)`;
    }
}

function generarArrayPitosC(fila, tipoFuelle, semitonosOffset) {
    let arr = [];
    for (let i = 1; i <= 16; i++) {
        let n = fila.find(x => x.i === i && x.t === tipoFuelle);
        if (n) {
            let tr = transponerNota(n.n, n.o, semitonosOffset);
            let midi = convertirAMidi(tr.nombreEng, tr.octava);
            let closest = archivoWavMasCercanoPitos(midi);
            let rapidez = Math.pow(2, closest.semitonos / 12);
            arr.push(`  {"/Brillante/${closest.wav}.wav", ${rapidez.toFixed(4)}}  // Boton ${i}: ${tr.nombreEs}${tr.octava}`);
        } else {
            arr.push(`  {"", 1.0000}  // Boton ${i}: Vacio`);
        }
    }
    return '{\n' + arr.join(',\n') + '\n}';
}

function generarArrayBajosC(fila_obj, tipo_fuelle, semitonosOffset) {
    let arr = [];
    for (let i = 1; i <= 6; i++) {
        let btn = fila_obj.find(x => x.i === i && x.t === tipo_fuelle);
        if (btn) {
            let tr = transponerNota(btn.n, btn.o, semitonosOffset);
            let nombreWav = archivoWavMasCercanoBajos(tr.nombreEng, btn.tipo);
            arr.push(`  {"/Bajos/${nombreWav}.wav", 1.0000} // Boton ${i}: ${tr.nombreEs} ${btn.tipo}`);
        } else {
            arr.push(`  {"", 1.0000} // Boton ${i}: Vacio`);
        }
    }
    return '{\n' + arr.join(',\n') + '\n}';
}

// 5 Letras (Sib-Mib-Lab) que es +5 semitonos de offset desde Fa-Sib-Mib
const offset_5_letras = 5;

let output = "";
output += "=========================================================\n";
output += "🎼 MAPA DE ARRAYS C++ PARA EL ESP32-S3 (CINCO LETRAS: Bb-Eb-Ab)\n";
output += "=========================================================\n\n";

output += "// ------------- HILERA 1 (HILERA DE AFUERA: Sib) -------------\n";
output += "const ArchivoAudio H1_Empujar[16] = \n" + generarArrayPitosC(DEFINICION_BASE.primeraFila, 'empujar', offset_5_letras) + ";\n\n";
output += "const ArchivoAudio H1_Halar[16] = \n" + generarArrayPitosC(DEFINICION_BASE.primeraFila, 'halar', offset_5_letras) + ";\n\n";

output += "// ------------- HILERA 2 (HILERA DEL MEDIO: Mib) -------------\n";
output += "const ArchivoAudio H2_Empujar[16] = \n" + generarArrayPitosC(DEFINICION_BASE.segundaFila, 'empujar', offset_5_letras) + ";\n\n";
output += "const ArchivoAudio H2_Halar[16] = \n" + generarArrayPitosC(DEFINICION_BASE.segundaFila, 'halar', offset_5_letras) + ";\n\n";

output += "// ------------- HILERA 3 (HILERA DE ADENTRO: Lab) -------------\n";
output += "const ArchivoAudio H3_Empujar[16] = \n" + generarArrayPitosC(DEFINICION_BASE.terceraFila, 'empujar', offset_5_letras) + ";\n\n";
output += "const ArchivoAudio H3_Halar[16] = \n" + generarArrayPitosC(DEFINICION_BASE.terceraFila, 'halar', offset_5_letras) + ";\n\n";

output += "// ------------- BAJOS -------------\n";
output += "const ArchivoAudio B_Interiores_Empujar[6] = \n" + generarArrayBajosC(DEFINICION_BASE.bajosUna, 'empujar', offset_5_letras) + ";\n\n";
output += "const ArchivoAudio B_Interiores_Halar[6] = \n" + generarArrayBajosC(DEFINICION_BASE.bajosUna, 'halar', offset_5_letras) + ";\n\n";
output += "const ArchivoAudio B_Exteriores_Empujar[6] = \n" + generarArrayBajosC(DEFINICION_BASE.bajosDos, 'empujar', offset_5_letras) + ";\n\n";
output += "const ArchivoAudio B_Exteriores_Halar[6] = \n" + generarArrayBajosC(DEFINICION_BASE.bajosDos, 'halar', offset_5_letras) + ";\n\n";


fs.writeFileSync('output_maps.txt', output);
console.log("¡Archivo output_maps.txt generado con éxito en español!");
