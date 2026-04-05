const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceDir = 'c:/Users/acord/OneDrive/Desktop/Academia2026/public/audio/Muestras_Cromaticas/Guitarra';
const targetDir = 'c:/Users/acord/OneDrive/Desktop/Academia2026/public/audio/Muestras_Cromaticas/Guitarra_ESP32';
const ffmpegPath = 'ffmpeg';

// 1. Notas requeridas según el .ino para cubrir todo el teclado
const notasRequeridas = [
    'Gb - 4', 'C - 4', 'Eb - 4', 'G - 4', 'A - 4', 'C - 5', 'Eb - 5', 'G - 5', 'A - 5', 'C - 6',
    'E - 4', 'Bb - 3', 'D - 4', 'F - 4', 'Bb - 4', 'D - 5', 'F - 5', 'Bb - 5', 'D - 6', 'F - 6',
    'B - 4', 'Ab - 4', 'Ab - 5', 'Ab - 6', 'Bb - 6', 'E - 5', 'Db - 5', 'Db - 6', 'G - 6',
    'Gb - 5', 'C - 7', 'Eb - 6', 'Db - 4', 'F - 6', 'B - 3', 'G - 3', 'A - 3',
    'G - 4', 'Gb - 4', 'F - 4', 'E - 4', 'Eb - 4', 'D - 4', 'Db - 4', 'C - 4', 'B - 3', 'Bb - 3', 'A - 3', 'Ab - 3', 'G - 3',
    'C - 3', 'Db - 3', 'D - 3', 'Eb - 3', 'E - 3', 'F - 3', 'Gb - 3', 'G - 3', 'Ab - 3', 'A - 3', 'Bb - 3', 'B - 3'
];

// Eliminamos duplicados
const notasUnicas = [...new Set(notasRequeridas)];

const NOTAS_ORDEN = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function notaANum(nota, octava) {
    return (parseInt(octava) * 12) + NOTAS_ORDEN.indexOf(nota);
}

function numANota(num) {
    const octava = Math.floor(num / 12);
    const nota = NOTAS_ORDEN[num % 12];
    return { nota, octava };
}

async function procesar() {
    console.log('🚀 Iniciando GENERACIÓN REAL de Guitarra_ESP32...');
    
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const archivosMP3 = fs.readdirSync(sourceDir).filter(f => f.endsWith('.mp3'));
    const mapaFuentes = {};
    
    archivosMP3.forEach(f => {
        const match = f.match(/([a-zA-Z#]+)-(\d+)/);
        if (match) {
            const id = notaANum(match[1], match[2]);
            mapaFuentes[id] = f;
        }
    });

    console.log(`📂 Encontradas ${archivosMP3.length} muestras base.`);

    for (const req of notasUnicas) {
        const match = req.match(/([a-zA-Z#]+)\s*-\s*(\d+)/);
        if (!match) continue;
        
        const targetId = notaANum(match[1], match[2]);
        const targetName = `${req}-cm.wav`;
        const outFile = path.join(targetDir, targetName);

        // Buscar fuente más cercana
        let mejorId = -1;
        let minDiff = Infinity;
        Object.keys(mapaFuentes).forEach(id => {
            const diff = Math.abs(id - targetId);
            if (diff < minDiff) {
                minDiff = diff;
                mejorId = id;
            }
        });

        if (mejorId !== -1) {
            const sourceFile = path.join(sourceDir, mapaFuentes[mejorId]);
            const semitonos = targetId - mejorId;
            const ratio = Math.pow(2, semitonos / 12);
            
            console.log(`🎹 Generando ${targetName} (Desde ${mapaFuentes[mejorId]} shift=${semitonos})`);
            
            // Usamos rubberband para pitch shift de alta calidad y forzamos 22050 Mono
            // Si rubberband no está, usamos asetrate
            try {
                const cmd = `${ffmpegPath} -y -i "${sourceFile}" -af "rubberband=pitch=${ratio}" -ar 22050 -ac 1 -sample_fmt s16 "${outFile}"`;
                execSync(cmd, { stdio: 'ignore' });
            } catch (e) {
                const cmd = `${ffmpegPath} -y -i "${sourceFile}" -af "asetrate=44100*${ratio},aresample=22050" -ac 1 -sample_fmt s16 "${outFile}"`;
                execSync(cmd, { stdio: 'ignore' });
            }
        }
    }

    console.log('✅ PROCESO COMPLETADO.');
    console.log(`📁 Archivos creados en Guitarra_ESP32: ${fs.readdirSync(targetDir).length}`);
}

procesar();
