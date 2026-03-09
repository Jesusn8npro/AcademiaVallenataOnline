const fs = require('fs');
const path = require('path');

function cleanBrillante() {
    const dir = 'D:/Brillante';
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    let count = 0;
    files.forEach(file => {
        if (!file.endsWith('.wav')) return;
        const newName = file.replace(/\s+/g, ''); // removes ALL spaces
        if (newName !== file) {
            fs.renameSync(path.join(dir, file), path.join(dir, newName));
            count++;
        }
    });
    console.log(`Brillante: Renombrados ${count} archivos sacando espacios.`);
}

function cleanBajos() {
    const dir = 'D:/Bajos';
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    let count = 0;
    files.forEach(file => {
        if (!file.endsWith('.wav')) return;
        // Reemplazar multiples espacios por 1 espacio, quitar espacio al final antes del guion o algo
        let newName = file.replace(/\s+/g, ' ');
        newName = newName.replace(/\s+-cm/g, '-cm'); // "Bajo C -cm" -> "Bajo C-cm"
        if (newName !== file) {
            fs.renameSync(path.join(dir, file), path.join(dir, newName));
            count++;
        }
    });
    console.log(`Bajos: Renombrados ${count} archivos ajustando espacios simples.`);
}

function updateArduinoFile() {
    let filePath = 'c:/Users/acord/OneDrive/Desktop/Academia2026/src/Paginas/SimuladorDeAcordeon/NuevoMIDI/acordeon_esp32.ino';
    if (fs.existsSync(filePath)) {
        let code = fs.readFileSync(filePath, 'utf8');
        // Rvertir "/Brillante/X - Y-cm.wav" a "/Brillante/X-Y-cm.wav"
        code = code.replace(/\/Brillante\/([A-Gb#]+) - ([0-9]+)-cm/g, '/Brillante/$1-$2-cm');

        // Ajustar bajos si quedaron raros (Bajo C -cm a Bajo C-cm)
        code = code.replace(/\/Bajos\/Bajo ([a-zA-Z#]+) -cm/g, '/Bajos/Bajo $1-cm');

        fs.writeFileSync(filePath, code);
        console.log("Archivo acordeon_esp32.ino ajustado para usar rutas limpias.");
    }
}

cleanBrillante();
cleanBajos();
updateArduinoFile();
