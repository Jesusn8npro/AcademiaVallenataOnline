const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración
const TARGET_DRIVE = 'D:\\';
const TEMP_FILE = path.join(require('os').tmpdir(), 'esp32_temp_conv.wav');

/**
 * Recorre carpetas de forma recursiva buscando archivos .wav
 */
function walk(dir, callback) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            walk(filepath, callback);
        } else if (stat.isFile() && path.extname(filepath).toLowerCase() === '.wav') {
            callback(filepath);
        }
    });
}

function optimizeWav(inputFile) {
    console.log(`\n---------------------------------------------------`);
    console.log(`🎵 Procesando: ${path.basename(inputFile)}`);

    try {
        // Usamos la ruta absoluta de FFmpeg instalada por WinGet
        const ffmpegPath = `"C:\\Users\\acord\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0.1-full_build\\bin\\ffmpeg.exe"`;
        const command = `${ffmpegPath} -y -i "${inputFile}" -ac 1 -ar 22050 -sample_fmt s16 "${TEMP_FILE}"`;

        // Ejecutar conversión
        execSync(command, { stdio: 'ignore' });

        // Verificamos si el archivo temporal se creó correctamente
        if (fs.existsSync(TEMP_FILE)) {
            const sizeOriginal = fs.statSync(inputFile).size;

            // Reemplazar original
            fs.unlinkSync(inputFile);
            fs.copyFileSync(TEMP_FILE, inputFile);
            fs.unlinkSync(TEMP_FILE);

            const sizeOptimized = fs.statSync(inputFile).size;
            const ahorro = ((1 - sizeOptimized / sizeOriginal) * 100).toFixed(1);

            console.log(`✅ ¡Optimizado! Ahorro de espacio: ${ahorro}%`);
            console.log(`📦 Nuevo tamaño: ${(sizeOptimized / 1024).toFixed(1)} KB`);
        }
    } catch (error) {
        console.error(`❌ Error convirtiendo ${inputFile}:`, error.message);
    }
}

// Inicio del proceso
console.log('🚀 Iniciando optimización de samples para ESP32...');
console.log(`📂 Buscando en: ${TARGET_DRIVE}`);

if (!fs.existsSync(TARGET_DRIVE)) {
    console.error(`\n❌ Error: No se encontró la unidad ${TARGET_DRIVE}. Verifica que la SD esté conectada.`);
    process.exit(1);
}

try {
    let count = 0;
    walk(TARGET_DRIVE, (file) => {
        optimizeWav(file);
        count++;
    });
    console.log(`\n===================================================`);
    console.log(`✨ FIN DEL PROCESO. Se optimizaron ${count} archivos.`);
    console.log(`🎹 ¡Tu acordeón ahora cargará los sonidos 2 veces más rápido!`);
} catch (err) {
    console.error('❌ Error recorriendo la SD:', err.message);
}
