const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir = 'public/audio/Muestras_Cromaticas/Armonizado';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.mp3'));

console.log(`Encontrados ${files.length} archivos para re-procesar.`);

files.forEach(file => {
    const fullPath = path.join(dir, file);
    const tmpPath = fullPath + '.tmp.mp3';
    try {
        console.log(`Procesando: ${file}...`);
        // Re-codificar a un estándar muy compatible (44.1kHz, 128k, estéreo)
        execSync(`ffmpeg -y -i "${fullPath}" -ar 44100 -ac 2 -ab 128k "${tmpPath}"`, { stdio: 'ignore' });
        fs.unlinkSync(fullPath);
        fs.renameSync(tmpPath, fullPath);
    } catch (e) {
        console.error(`Error procesando ${file}:`, e.message);
    }
});

console.log('¡Proceso completado!');
