const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDir = 'c:/Users/acord/OneDrive/Desktop/Academia2026/public/audio/Muestras_Cromaticas/Armonizado copy';
const ffmpegPath = 'ffmpeg'; // Ya verifiqué que está en el PATH

// 1. Notas requeridas según el .ino (Resumen único de las 3 hileras)
const notasRequeridas = [
    'Gb - 4', 'C - 4', 'Eb - 4', 'G - 4', 'A - 4', 'C - 5', 'Eb - 5', 'G - 5', 'A - 5', 'C - 6',
    'E - 4', 'Bb - 3', 'D - 4', 'F - 4', 'Bb - 4', 'D - 5', 'F - 5', 'Bb - 5', 'D - 6', 'F - 6',
    'B - 4', 'Ab - 4', 'Ab - 5', 'Ab - 6', 'Bb - 6', 'E - 5', 'Db - 5', 'Db - 6', 'G - 6',
    'Gb - 5', 'C - 7', 'Eb - 6', 'Db - 4', 'F - 6', 'B - 3', 'G - 3', 'A - 3' // Agregadas algunas por si acaso para bajos o extensiones
];

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
    console.log('🚀 Iniciando proceso de rescate y optimización...');
    
    if (!fs.existsSync(targetDir)) {
        console.error('❌ Error: No existe la carpeta de destino.');
        return;
    }

    const archivosExistentes = fs.readdirSync(targetDir).filter(f => f.endsWith('.wav'));
    const mapaExistentes = {};
    
    archivosExistentes.forEach(f => {
        const match = f.match(/([a-zA-Z#]+)\s*-\s*(\d+)/);
        if (match) {
            const id = notaANum(match[1], match[2]);
            mapaExistentes[id] = f;
        }
    });

    for (const req of notasRequeridas) {
        const match = req.match(/([a-zA-Z#]+)\s*-\s*(\d+)/);
        if (!match) continue;
        
        const targetId = notaANum(match[1], match[2]);
        const targetName = `${req}-cm.wav`;

        if (!mapaExistentes[targetId]) {
            console.log(`🔍 Buscando reemplazo para: ${targetName}`);
            
            // Buscar la nota más cercana en el mapa de existentes
            let mejorId = -1;
            let minDiff = Infinity;
            
            Object.keys(mapaExistentes).forEach(id => {
                const diff = Math.abs(id - targetId);
                if (diff < minDiff) {
                    minDiff = diff;
                    mejorId = id;
                }
            });

            if (mejorId !== -1) {
                const sourceFile = path.join(targetDir, mapaExistentes[mejorId]);
                const outFile = path.join(targetDir, targetName);
                const semitonos = targetId - mejorId;
                const ratio = Math.pow(2, semitonos / 12);
                
                console.log(`🎹 Generando ${targetName} desde ${mapaExistentes[mejorId]} (Shift: ${semitonos} semitonos)`);
                try {
                    // Generar con pitch shift y forzar 22050Hz Mono
                    const cmd = `${ffmpegPath} -y -i "${sourceFile}" -af "rubberband=pitch=${ratio}" -ar 22050 -ac 1 -sample_fmt s16 "${outFile}"`;
                    execSync(cmd, { stdio: 'ignore' });
                } catch (e) {
                    console.log(`⚠️ Error con rubberband, usando atempo fallback para: ${targetName}`);
                    const cmd = `${ffmpegPath} -y -i "${sourceFile}" -af "asetrate=22050*${ratio},aresample=22050" -ac 1 -sample_fmt s16 "${outFile}"`;
                    execSync(cmd, { stdio: 'ignore' });
                }
            }
        }
    }

    // Finalmente optimizar TODOS los archivos a 22050Hz Mono (por si alguno era 44100Hz)
    console.log('📦 Optimizando peso de toda la carpeta...');
    const todos = fs.readdirSync(targetDir).filter(f => f.endsWith('.wav'));
    for (const f of todos) {
        const filepath = path.join(targetDir, f);
        const tempPath = path.join(targetDir, 'temp_' + f);
        const cmd = `${ffmpegPath} -y -i "${filepath}" -ar 22050 -ac 1 -sample_fmt s16 "${tempPath}"`;
        execSync(cmd, { stdio: 'ignore' });
        fs.unlinkSync(filepath);
        fs.renameSync(tempPath, filepath);
    }

    console.log('✅ PROCESO COMPLETADO CON ÉXITO.');
    console.log(`📁 Total archivos en Armonizado copy: ${fs.readdirSync(targetDir).length}`);
}

procesar();
