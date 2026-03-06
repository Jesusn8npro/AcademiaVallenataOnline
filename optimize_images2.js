import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const bannerPath = path.resolve('public/images/Home/Banner- Academia vallenata ONLINE.jpg');
const logoPath = path.resolve('public/images/logo academia vallenata.png');
const heroImgPath = path.resolve('public/images/Acordeon PRO MAX.png');

async function optimizeImages() {
    try {
        if (fs.existsSync(bannerPath)) {
            const bannerData = fs.readFileSync(bannerPath);
            await sharp(bannerData)
                .jpeg({ quality: 60, progressive: true })
                .toFile(bannerPath);
            console.log('✅ Banner JPG optimizado en sitio');
        }

        if (fs.existsSync(logoPath)) {
            const logoData = fs.readFileSync(logoPath);
            await sharp(logoData)
                .resize({ width: 175 })
                .png({ compressionLevel: 9, quality: 70 })
                .toFile(logoPath);
            console.log('✅ Logo PNG optimizado y redimensionado');
        }

        if (fs.existsSync(heroImgPath)) {
            const heroData = fs.readFileSync(heroImgPath);
            const stats = fs.statSync(heroImgPath);
            if (stats.size > 500000) {
                await sharp(heroData)
                    .resize({ width: 800 })
                    .png({ compressionLevel: 9, quality: 75 })
                    .toFile(heroImgPath);
                console.log('✅ Acordeon PRO MAX PNG redimensionado y optimizado');
            }
        }
    } catch (error) {
        console.error('❌ Error optimizando imágenes:', error);
    }
}

optimizeImages();
