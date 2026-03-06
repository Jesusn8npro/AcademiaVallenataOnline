import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const bannerPath = path.resolve('public/images/Home/Banner- Academia vallenata ONLINE.jpg');
const logoPath = path.resolve('public/images/logo academia vallenata.png');

async function optimizeImages() {
    try {
        if (fs.existsSync(bannerPath)) {
            await sharp(bannerPath)
                .webp({ quality: 75 })
                .toFile(path.resolve('public/images/Home/Banner- Academia vallenata ONLINE.webp'));
            console.log('✅ Banner convertido a WebP');

            // Let's also compress the original jpg just in case it's hardcoded somewhere 
            await sharp(bannerPath)
                .jpeg({ quality: 75, progressive: true })
                .toBuffer()
                .then(data => fs.writeFileSync(bannerPath, data));
            console.log('✅ Banner JPG optimizado');
        }

        if (fs.existsSync(logoPath)) {
            await sharp(logoPath)
                .webp({ quality: 80 })
                .toFile(path.resolve('public/images/logo academia vallenata.webp'));
            console.log('✅ Logo convertido a WebP');

            // Resize and compress the original logo
            await sharp(logoPath)
                .resize({ width: 200 }) // Reduciendo de 300 a algo más cercano a 175x113 que es lo q se muestra
                .png({ compressionLevel: 9, quality: 80 })
                .toBuffer()
                .then(data => fs.writeFileSync(logoPath, data));
            console.log('✅ Logo PNG optimizado');
        }

        // Optimizar imagen de acordeon pro max si existe  
        const acordeonProMaxPath = path.resolve('public/images/Acordeon PRO MAX.png');
        if (fs.existsSync(acordeonProMaxPath)) {
            const stats = fs.statSync(acordeonProMaxPath);
            if (stats.size > 1000000) { // Si es más de 1MB, comprimir y escalar un poco
                await sharp(acordeonProMaxPath)
                    .resize({ width: 800 })
                    .png({ compressionLevel: 9, quality: 80 })
                    .toBuffer()
                    .then(data => fs.writeFileSync(acordeonProMaxPath, data));
                console.log('✅ Acordeon PRO MAX PNG redimensionado y optimizado');
            }
        }
    } catch (error) {
        console.error('❌ Error optimizando imágenes:', error);
    }
}

optimizeImages();
