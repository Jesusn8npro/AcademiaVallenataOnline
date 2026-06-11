// Convierte las miniaturas PNG de personajes a webp 256x320 y borra los PNG.
import sharp from 'sharp'
import fs from 'node:fs'

for (const s of ['pelao', 'sudadera', 'muchacha', 'rojo', 'vacana', 'gris']) {
  const i = `public/personajes/${s}.png`
  const o = `public/personajes/${s}.webp`
  await sharp(i).resize(256, 320).webp({ quality: 84 }).toFile(o)
  fs.unlinkSync(i)
  console.log(s, (fs.statSync(o).size / 1024).toFixed(0) + 'KB')
}
