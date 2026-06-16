// Convierte los renders PNG de las pieles del acordeón (scripts/_renders-pieles/piel-*.png)
// a miniaturas webp 256x256 con fondo transparente en public/pieles-acordeon/{skin}.webp.
// Recorta el margen transparente para que el acordeón llene la miniatura.
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const SKINS = ['original', '1', '2', '3', '4', '5', '6', '7']
const SRC = 'scripts/_renders-pieles'
const OUT = 'public/pieles-acordeon'
fs.mkdirSync(OUT, { recursive: true })

for (const skin of SKINS) {
  const i = path.join(SRC, `piel-${skin}.png`)
  const o = path.join(OUT, `${skin}.webp`)
  await sharp(i)
    .trim()                                   // quita el borde transparente
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 86 })
    .toFile(o)
  console.log(skin, (fs.statSync(o).size / 1024).toFixed(0) + 'KB')
}
