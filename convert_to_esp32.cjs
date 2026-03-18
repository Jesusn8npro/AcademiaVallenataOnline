const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 📂 Rutas
const folderBrillante = 'c:/Users/acord/OneDrive/Desktop/Academia2026/public/audio/Muestras_Cromaticas/Brillante';
const folderArmonizado = 'c:/Users/acord/OneDrive/Desktop/Academia2026/public/audio/Muestras_Cromaticas/ArmonizadoPro'; // Usamos la Pro que es la buena
const outputFolder = 'c:/Users/acord/OneDrive/Desktop/Academia2026/public/audio/Muestras_Cromaticas/Armonizado_ESP32';

if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });

// 1. Establecer formato estándar ESP32 (Frecuencia: 22050Hz, Canales: 1, Formato: WAV PCM 16bit)
// Esto asegura que el archivo resultante pese exactamente ~220KB.
const targetFreq = 22050; 
const targetChannels = 1;

const files = fs.readdirSync(folderArmonizado).filter(f => f.endsWith('.mp3'));

console.log(`🚀 Iniciando conversión de ${files.length} archivos MP3 de Armonizado a formato WAV para ESP32...`);

files.forEach(file => {
    // Normalizar nombre: De "A-4-cm.mp3" a "A - 4-cm.wav" (con espacios y extensión correcta)
    let newName = file.replace(/([A-G][b#]?)-/i, '$1 - ').replace('.mp3', '.wav');
    const inputPath = path.join(folderArmonizado, file);
    const outputPath = path.join(outputFolder, newName);

    try {
        // Comando ffmpeg para igualar el peso: 22050Hz, mono, pcm 16 bits
        execSync(`ffmpeg -y -i "${inputPath}" -ar ${targetFreq} -ac ${targetChannels} -c:a pcm_s16le "${outputPath}"`, { stdio: 'ignore' });
        process.stdout.write('.');
    } catch (e) {
        console.error(`\n❌ Error en ${file}:`, e.message);
    }
});

console.log('\n✅ Conversión completada. Los archivos en "Armonizado_ESP32" ahora pesan ~220KB.');
