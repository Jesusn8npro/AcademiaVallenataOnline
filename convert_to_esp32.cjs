/**
 * SCRIPT FINAL: Completa la librería Armonizado_ESP32
 * 
 * 1. Copia los 32 archivos originales (renombrados con espacios)
 * 2. Para los archivos que el firmware necesita pero NO están, los genera
 *    desde la muestra más cercana usando pitch shift mínimo via ffmpeg
 * 
 * Archivos que necesita el firmware (extraídos del .ino):
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceFolder  = 'c:/Users/acord/OneDrive/Desktop/Academia2026/public/audio/Muestras_Cromaticas/Armonizado copy';
const outputFolder  = 'c:/Users/acord/OneDrive/Desktop/Academia2026/public/audio/Muestras_Cromaticas/Armonizado_ESP32';

// Lista EXACTA de notas que usa el firmware (extraídas del .ino)
const notasRequeridas = [
    // F1 Halar
    "Gb - 4", "C - 4", "Eb - 4", "G - 4", "A - 4", "C - 5", "Eb - 5", "G - 5", "A - 5", "C - 6",
    // F1 Empujar
    "E - 4", "Bb - 3", "D - 4", "F - 4", "Bb - 4", "D - 5", "F - 5", "Bb - 5", "D - 6", "F - 6",
    // F2 Halar
    "B - 4", "D - 4", "F - 4", "Ab - 4", "C - 5", "D - 5", "F - 5", "Ab - 5", "C - 6", "D - 6", "F - 6",
    // F2 Empujar
    "A - 4", "Bb - 3", "Eb - 4", "G - 4", "Bb - 4", "Eb - 5", "G - 5", "Bb - 5", "Eb - 6", "G - 6", "Bb - 6",
    // F3 Halar
    "E - 5", "G - 4", "Bb - 4", "Db - 5", "F - 5", "G - 5", "Bb - 5", "Db - 6", "F - 6", "G - 6",
    // F3 Empujar
    "Gb - 5", "Eb - 4", "Ab - 4", "C - 5", "Eb - 5", "Ab - 5", "C - 6", "Eb - 6", "Ab - 6", "C - 7",
];

const NOTAS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const noteVal = (n, o) => parseInt(o) * 12 + NOTAS.indexOf(n);

const unicas = [...new Set(notasRequeridas)];

// 🧹 Limpiar
if (fs.existsSync(outputFolder)) {
    fs.readdirSync(outputFolder).forEach(f => fs.unlinkSync(path.join(outputFolder, f)));
}
fs.mkdirSync(outputFolder, { recursive: true });

// Escanear fuente (formato sin espacios: "Gb-4-cm.wav")
const fuente = fs.readdirSync(sourceFolder)
    .filter(f => f.endsWith('.wav'))
    .map(f => {
        const m = f.match(/^([A-G][b#]?)-(\d+)-cm\.wav$/i);
        if (!m) return null;
        return { file: f, nota: m[1], oct: parseInt(m[2]), val: noteVal(m[1], m[2]) };
    }).filter(Boolean);

console.log(`📂 Fuente: ${fuente.length} archivos | Objetivos: ${unicas.length} notas únicas\n`);

let copiados = 0, generados = 0;

unicas.forEach(target => {
    const m = target.match(/^([A-G][b#]?) - (\d+)$/i);
    if (!m) return;
    const [, tNota, tOct] = m;
    const tVal = noteVal(tNota, tOct);
    const outName = `${tNota} - ${tOct}-cm.wav`;
    const outPath = path.join(outputFolder, outName);

    // ¿Existe exactamente en la fuente?
    const exacto = fuente.find(f => f.nota === tNota && f.oct === parseInt(tOct));

    if (exacto) {
        // Copia directa sin tocar el audio
        fs.copyFileSync(path.join(sourceFolder, exacto.file), outPath);
        console.log(`  ✅ COPIA  ${outName}`);
        copiados++;
    } else {
        // No está → encontrar la más cercana y hacer pitch shift mínimo
        let mejor = fuente[0], minD = Infinity;
        fuente.forEach(f => { const d = Math.abs(tVal - f.val); if (d < minD) { minD = d; mejor = f; }});
        const semitonos = tVal - mejor.val;
        const newRate = Math.round(22050 * Math.pow(2, semitonos / 12));
        const inPath = path.join(sourceFolder, mejor.file);
        try {
            execSync(`ffmpeg -y -i "${inPath}" -af "asetrate=${newRate},aresample=22050" -ac 1 -c:a pcm_s16le "${outPath}"`, { stdio: 'ignore' });
            console.log(`  🔧 GENERADO ${outName} (desde ${mejor.file}, ${semitonos > 0 ? '+' : ''}${semitonos} semitonos)`);
            generados++;
        } catch(e) {
            console.error(`  ❌ ERROR generando ${outName}:`, e.message);
        }
    }
});

console.log(`\n✅ LISTO: ${copiados} copiados + ${generados} generados = ${copiados + generados} archivos totales`);
console.log('👉 Copia TODO el contenido de "Armonizado_ESP32" a la carpeta "Armonizado" de tu SD.');
