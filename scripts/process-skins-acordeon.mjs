// Genera las 7 "pieles" del acordeón para la web a partir de las carpetas fuente
// TEXTURA_01..07. Cada piel = ese folder aplicado a todas las piezas. Por pieza saca
// baseColor + metallicRoughness(combo) + normal en WebP 1024.
// Salida: public/texturas-acordeon/<N>/<part>_{base,mr,normal}.webp
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const TEX_ROOT = 'C:\\Users\\acord\\OneDrive\\Desktop\\Acordeno 3d Terminado\\acordeon\\TEXTURAS'
const OUT_ROOT = './public/texturas-acordeon'
const SIZE = 1024
const PARTS = ['cuerpo', 'fuelle', 'botones', 'pack', 'parte botones'] // 'axe' no está en el GLB

const findFile = (folder, cands) => {
  for (const c of cands) { const p = path.join(TEX_ROOT, folder, c); if (fs.existsSync(p)) return p }
  return null
}
const baseWebp = (p, out) => sharp(p).resize(SIZE, SIZE, { fit: 'fill' }).webp({ quality: 86 }).toFile(out)
const normWebp = (p, out) => sharp(p).resize(SIZE, SIZE, { fit: 'fill' }).webp({ quality: 90 }).toFile(out)
async function mrWebp(roughP, metalP, out) {
  const g = await sharp(roughP).resize(SIZE, SIZE, { fit: 'fill' }).removeAlpha().toColourspace('b-w').raw().toBuffer()
  const b = await sharp(metalP).resize(SIZE, SIZE, { fit: 'fill' }).removeAlpha().toColourspace('b-w').raw().toBuffer()
  const buf = Buffer.alloc(SIZE * SIZE * 3)
  for (let i = 0; i < SIZE * SIZE; i++) { buf[i * 3] = 255; buf[i * 3 + 1] = g[i]; buf[i * 3 + 2] = b[i] }
  await sharp(buf, { raw: { width: SIZE, height: SIZE, channels: 3 } }).webp({ quality: 86 }).toFile(out)
}

const slug = (s) => s.replace(/\s+/g, '-')
let count = 0
for (let n = 1; n <= 7; n++) {
  const folder = `TEXTURA_0${n}`
  const outDir = path.join(OUT_ROOT, String(n))
  fs.mkdirSync(outDir, { recursive: true })
  for (const part of PARTS) {
    const baseP = findFile(folder, [`${part}_Base_color.png`, `${part}_BaseColor.png`])
    const roughP = findFile(folder, [`${part}_Roughness.png`])
    const metalP = findFile(folder, [`${part}_Metallic.png`])
    const normP = findFile(folder, [`${part}_Normal_OpenGL.png`, `${part}_Normal.png`])
    if (baseP) { await baseWebp(baseP, path.join(outDir, `${slug(part)}_base.webp`)); count++ }
    if (roughP && metalP) { await mrWebp(roughP, metalP, path.join(outDir, `${slug(part)}_mr.webp`)); count++ }
    if (normP) { await normWebp(normP, path.join(outDir, `${slug(part)}_normal.webp`)); count++ }
  }
  console.log(`Piel ${n} (${folder}) lista`)
}
console.log(`TOTAL imágenes generadas: ${count} en ${OUT_ROOT}`)
