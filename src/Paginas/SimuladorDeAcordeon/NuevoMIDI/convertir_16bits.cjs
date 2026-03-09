const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Instalar wavefile si no existe
try {
    require.resolve('wavefile');
} catch (e) {
    console.log("Instalando dependencia 'wavefile' para formatear los audios...");
    execSync('npm install wavefile --no-save', { stdio: 'inherit' });
}

const { WaveFile } = require('wavefile');

const directorios = ['D:/Brillante', 'D:/Bajos'];

console.log("=========================================");
console.log("🛠️  V-PRO CORRECTOR DE WAVs PARA ESP32 🛠️");
console.log("=========================================\n");

let archivosConvertidos = 0;
let errores = 0;

directorios.forEach(dirPath => {
    if (!fs.existsSync(dirPath)) {
        console.log(`⚠️  Directorio no encontrado: ${dirPath}. Asegúrate de que la Micro SD esté en la unidad D:`);
        return;
    }

    const archivos = fs.readdirSync(dirPath).filter(archivo => archivo.toLowerCase().endsWith('.wav'));

    console.log(`\n📂 Escaneando carpeta: ${dirPath} (${archivos.length} archivos wav)`);

    archivos.forEach(archivo => {
        const filePath = path.join(dirPath, archivo);
        try {
            const bufferArchivo = fs.readFileSync(filePath);
            const wav = new WaveFile(bufferArchivo);

            // Forzar formato estandar a 16-bit PCM (lo único que soporta ESP32)
            wav.toBitDepth('16');

            // Resample a 44100 para estandarizar la lectura
            // wav.toSampleRate(44100); 

            // Sobreescribiendo archivo
            fs.writeFileSync(filePath, wav.toBuffer());
            console.log(`✅ Formateado a 16-Bit PCM: ${archivo}`);
            archivosConvertidos++;
        } catch (error) {
            console.log(`❌ Error al procesar ${archivo}:`, error.message);
            errores++;
        }
    });
});

console.log("\n=========================================");
console.log(`🎉 ¡PROCESO TERMINADO! 🎉`);
console.log(`Archivos corregidos: ${archivosConvertidos}`);
console.log(`Errores: ${errores}`);
console.log("=========================================");
console.log("\nYa puedes sacar la SD de forma segura y ponerla en tu ESP32. ¡Ahora sí rugirá el V-PRO!");
