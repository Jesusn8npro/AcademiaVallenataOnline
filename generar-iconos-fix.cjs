// Script para generar iconos PWA válidos
const fs = require('fs');
const path = require('path');

console.log('🚀 Generando iconos PWA válidos...');

// Crear un SVG simple con Canvas (compatible con Node.js)
function crearIconoSVG(tamaño) {
    return `<svg width="${tamaño}" height="${tamaño}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${tamaño}" height="${tamaño}" fill="#1e40af"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.floor(tamaño * 0.4)}" 
              font-weight="bold" text-anchor="middle" dy="0.35em" fill="white">AV</text>
    </svg>`;
}

// Tamaños requeridos para PWA
const tamaños = [72, 96, 128, 144, 152, 192, 384, 512];
const directorioIconos = path.join(__dirname, 'static', 'iconos-pwa');

// Crear directorio si no existe
if (!fs.existsSync(directorioIconos)) {
    fs.mkdirSync(directorioIconos, { recursive: true });
}

console.log(`📁 Directorio: ${directorioIconos}`);

// Generar cada icono como SVG (compatible con navegadores)
tamaños.forEach(tamaño => {
    const svgContent = crearIconoSVG(tamaño);
    const fileName = `icon-${tamaño}x${tamaño}.svg`;
    const filePath = path.join(directorioIconos, fileName);
    
    try {
        fs.writeFileSync(filePath, svgContent);
        console.log(`✅ Generado: ${fileName} (${svgContent.length} bytes)`);
    } catch (error) {
        console.error(`❌ Error creando ${fileName}:`, error.message);
    }
});

console.log('\n🎉 ¡Iconos PWA generados exitosamente!');
console.log('\n💡 Estos iconos SVG son válidos y ligeros para PWA');
console.log('📝 Ahora necesitas actualizar el manifest.json para usar archivos SVG o PNG'); 