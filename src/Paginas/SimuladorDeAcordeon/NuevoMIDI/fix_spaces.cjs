const fs = require('fs');

let path = 'c:/Users/acord/OneDrive/Desktop/Academia2026/src/Paginas/SimuladorDeAcordeon/NuevoMIDI/acordeon_esp32.ino';
let code = fs.readFileSync(path, 'utf8');

// The file names in the user's SD card have spaces. For example: "A - 4-cm.wav" instead of "A-4-cm.wav".
// We need to replace /Brillante/X-Y-cm.wav with /Brillante/X - Y-cm.wav
code = code.replace(/\/Brillante\/([A-G]b?)-([0-9]-cm\.wav)/g, '/Brillante/$1 - $2');

fs.writeFileSync(path, code);
console.log('Fixed spaces in Brillante filenames');
