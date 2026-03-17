const fs = require('fs');

const elr = JSON.parse(fs.readFileSync('elr_notes.json', 'utf8'));
const muestras = JSON.parse(fs.readFileSync('public/muestrasLocales.json', 'utf8'));

// Utilidad para pitch a nota MIDI aproximada si fuera útil,
// o búsqueda de la mejor muestra basada en la frecuencia
function frecuenciaAMidiFormat(frecuencia) {
    if (Array.isArray(frecuencia)) frecuencia = frecuencia[0];
    const notas = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    const do0 = 16.35;
    const mediaPasos = Math.round(12 * Math.log2(frecuencia / do0));
    const octava = Math.floor(mediaPasos / 12);
    const notaIdx = mediaPasos % 12;
    return `${notas[notaIdx]}-${octava}`;
}

function parseMuestraInfo(nombre) {
    const match = nombre.match(/([A-G]b?)-(\d+)/);
    if (match) {
        const notaStr = match[1];
        const octava = parseInt(match[2]);
        const notas = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
        const num = notas.indexOf(notaStr);
        const freq = 16.35 * Math.pow(2, octava + (num / 12));
        return { freq, filePath: `/Brillante/${nombre}` };
    }
    return null;
}

const brillantes = muestras.pitos.map(parseMuestraInfo).filter(m => m);
const bajosDisponibles = muestras.bajos.map(n => `/Bajos/${n}`);

function findBestPito(targetFreq) {
    if (Array.isArray(targetFreq)) targetFreq = targetFreq[0];
    let best = brillantes[0];
    let minDiff = Infinity;
    for (let m of brillantes) {
        const diff = Math.abs(12 * Math.log2(targetFreq / m.freq));
        if (diff < minDiff) {
            minDiff = diff;
            best = m;
        }
    }
    const ratio = targetFreq / best.freq;
    return `{ "${best.filePath}", ${ratio.toFixed(4)} }`;
}

function findBestBajo(targetFreqArray, name) {
    // Para simplificar, usamos un mapeo por nombre de la nota, esto es más robusto para bajos
    // porque los acordes y unísonos Tienen nombres clave
    let baseNota = name.split(" ")[0].replace("Bajo", "").trim();
    // Mapeos más sencillos:
    const mapBajos = {
        "Fa": "BajoF",
        "Do": "BajoC",
        "Sib": "BajoBb",
        "Solb": "BajoGb", // No está? Vamos a buscar en muestras completas
        "Mib": "BajoEb",
        "Lab": "BajoAb",
        "Reb": "BajoDb",
        "Si": "BajoB",
        "Mi": "BajoE",
        "La": "BajoA",
        "Sol": "BajoG",
        "Re": "BajoD"
    };

    let pfix = mapBajos[baseNota] || "BajoC"; // C fallback

    // Si es un acorde, buscamos el que dice (acorde) o m(acorde)
    let isChord = name.includes("Mayor") || name.includes("Menor");
    let isMenor = name.includes("Menor");

    let targetFileName = "";
    if (isChord) {
        if (isMenor) {
            targetFileName = `${pfix}m(acorde)-cm.mp3`;
        } else {
            targetFileName = `${pfix}(acorde)-cm.mp3`;
        }
    } else {
        targetFileName = `${pfix}-cm.mp3`;
    }

    // Comprobamos si existe en las muestras, si no, intentamos un fallback
    if (!bajosDisponibles.includes(`/Bajos/${targetFileName}`)) {
        // Fallback a versión sin m (mayor por menor) u otra alternativa
        if (isChord && bajosDisponibles.includes(`/Bajos/${pfix}(acorde)-cm.mp3`)) {
            targetFileName = `${pfix}(acorde)-cm.mp3`;
        } else if (bajosDisponibles.includes(`/Bajos/${pfix}-cm.mp3`)) {
            targetFileName = `${pfix}-cm.mp3`; // Usar nota simple como acorde
        } else {
            targetFileName = "BajoC-cm.mp3"; // El fallback último
        }
    }

    return `{ "/Bajos/${targetFileName}", 1.0 }`;
}

// ARMAR ARRAYS
let out = "";

['primeraFila', 'segundaFila', 'terceraFila'].forEach((fila, idx) => {
    let r_empujar = [];
    let r_halar = [];
    const notes = elr[fila];

    // Hasta 16 elementos porque los arreglos son de 16
    for (let i = 0; i < 16; i++) {
        let nE = notes.find(n => n.id === `${idx + 1}-${i + 1}-empujar`);
        let nH = notes.find(n => n.id === `${idx + 1}-${i + 1}-halar`);

        if (nE) r_empujar.push(findBestPito(nE.frecuencia));
        else r_empujar.push(`{ "", 1.0 }`);

        if (nH) r_halar.push(findBestPito(nH.frecuencia));
        else r_halar.push(`{ "", 1.0 }`);
    }

    out += `const ArchivoAudio F${idx + 1}_Empujar[16] = { ${r_empujar.join(', ')} };\n`;
    out += `const ArchivoAudio F${idx + 1}_Halar[16] = { ${r_halar.join(', ')} };\n`;
});

// Bajos
let b1_emp = [], b1_hal = []; // disposicionBajos.una (Interiores)
let b2_emp = [], b2_hal = []; // disposicionBajos.dos (Exteriores)

for (let i = 1; i <= 6; i++) {
    let un_emp = elr.disposicionBajos.una.find(b => b.id === `1-${i}-empujar-bajo`);
    let un_hal = elr.disposicionBajos.una.find(b => b.id === `1-${i}-halar-bajo`);
    let do_emp = elr.disposicionBajos.dos.find(b => b.id === `2-${i}-empujar-bajo`);
    let do_hal = elr.disposicionBajos.dos.find(b => b.id === `2-${i}-halar-bajo`);

    if (un_emp) b1_emp.push(findBestBajo(un_emp.frecuencia, un_emp.nombre)); else b1_emp.push(`{ "", 1.0 }`);
    if (un_hal) b1_hal.push(findBestBajo(un_hal.frecuencia, un_hal.nombre)); else b1_hal.push(`{ "", 1.0 }`);
    if (do_emp) b2_emp.push(findBestBajo(do_emp.frecuencia, do_emp.nombre)); else b2_emp.push(`{ "", 1.0 }`);
    if (do_hal) b2_hal.push(findBestBajo(do_hal.frecuencia, do_hal.nombre)); else b2_hal.push(`{ "", 1.0 }`);
}

out += `const ArchivoAudio B1_Empujar[6] = { ${b1_emp.join(', ')} };\n`;
out += `const ArchivoAudio B1_Halar[6] = { ${b1_hal.join(', ')} };\n`;
out += `const ArchivoAudio B2_Empujar[6] = { ${b2_emp.join(', ')} };\n`;
out += `const ArchivoAudio B2_Halar[6] = { ${b2_hal.join(', ')} };\n`;

console.log(out);
fs.writeFileSync('c:/Users/acord/OneDrive/Desktop/Academia2026/arreglos_elr.txt', out);
