const fs = require('fs');

let path = 'c:/Users/acord/OneDrive/Desktop/Academia2026/src/Paginas/SimuladorDeAcordeon/NuevoMIDI/acordeon_esp32.ino';
let code = fs.readFileSync(path, 'utf8');

// Fix the missing comma for the elements
code = code.replace(/}(\s*)\/\/ Boton(.*?)(,?)\r?$/gm, '},$1// Boton$2');

fs.writeFileSync(path, code);
console.log('Fixed syntax errors in acordeon_esp32.ino');
