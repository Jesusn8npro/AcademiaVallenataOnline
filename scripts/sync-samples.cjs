const fs = require('fs');
const path = require('path');

const pitosPath = path.join(__dirname, '../public/audio/Muestras_Cromaticas/Brillante');
const bajosPath = path.join(__dirname, '../public/audio/Muestras_Cromaticas/Bajos');
const outputPath = path.join(__dirname, '../public/muestrasLocales.json');

function getFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ext === '.mp3' || ext === '.wav';
    });
}

const pitos = getFiles(pitosPath);
const bajos = getFiles(bajosPath);

const data = {
    pitos,
    bajos,
    lastUpdate: new Date().toISOString()
};

fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
console.log(`✅ Sincronización completa. ${pitos.length} pitos y ${bajos.length} bajos detectados.`);
console.log(`📂 Lista guardada en: ${outputPath}`);
