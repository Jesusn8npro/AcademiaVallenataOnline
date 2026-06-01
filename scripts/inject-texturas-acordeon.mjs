// Texturiza el ACORDEÓN del GLB v22 (que salía rosado: todas sus mallas comparten un
// material plano 'ACC' sin textura). Crea 6 materiales por pieza y los asigna POR NODO
// (malla), usando los UVs que cada malla ya trae + las texturas fuente (1024 WebP).
// Conserva geometría, pose, rig (morphs) y TODO el personaje intacto.
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { draco, prune } from '@gltf-transform/functions'
import draco3d from 'draco3dgltf'
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const TEX_ROOT = 'C:\\Users\\acord\\OneDrive\\Desktop\\Acordeno 3d Terminado\\acordeon\\TEXTURAS'
const GLB = './public/modelos3d/personaje-acordeon.glb'
const SIZE = 1024

// pieza -> carpeta + stem de archivo
const PARTS = {
  cuerpo:         { folder: 'TEXTURA_03', stem: 'cuerpo' },
  fuelle:         { folder: 'TEXTURA_03', stem: 'fuelle' },
  botones:        { folder: 'TEXTURA_01', stem: 'botones' },
  pack:           { folder: 'TEXTURA_01', stem: 'pack' },
  axe:            { folder: 'TEXTURA_01', stem: 'axe' },
  'parte botones':{ folder: 'TEXTURA_01', stem: 'parte botones' },
}

// nombre de nodo normalizado -> pieza (derivado de Blender)
const norm = (s) => (s || '').toLowerCase().replace(/_m$/i, '').replace(/\.\d+/g, '').replace(/[^a-z0-9]/g, '')
function parteDeNodo(name) {
  const n = norm(name)
  if (n.startsWith('botond') || n.startsWith('botoni')) return 'botones'
  const fijo = {
    cuerpo: 'cuerpo', bajp: 'cuerpo',
    fuelle: 'fuelle',
    basebotones: 'parte botones',
    acorderon: 'pack', parrilla: 'pack', rejilla: 'pack',
    bordeparrilla: 'pack', bordeparrilla2: 'pack',
    tapafuelle1: 'pack', tornillosparrilla: 'pack',
    metalcorrea: 'axe', correafuelle: 'axe',
  }
  return fijo[n] || null
}

const findFile = (folder, cands) => {
  for (const c of cands) { const p = path.join(TEX_ROOT, folder, c); if (fs.existsSync(p)) return p }
  return null
}
const baseWebp = (p) => sharp(p).resize(SIZE, SIZE, { fit: 'fill' }).webp({ quality: 88 }).toBuffer()
const normWebp = (p) => sharp(p).resize(SIZE, SIZE, { fit: 'fill' }).webp({ quality: 92 }).toBuffer()
async function mrWebp(roughP, metalP) {
  const g = await sharp(roughP).resize(SIZE, SIZE, { fit: 'fill' }).removeAlpha().toColourspace('b-w').raw().toBuffer()
  const b = await sharp(metalP).resize(SIZE, SIZE, { fit: 'fill' }).removeAlpha().toColourspace('b-w').raw().toBuffer()
  const out = Buffer.alloc(SIZE * SIZE * 3)
  for (let i = 0; i < SIZE * SIZE; i++) { out[i * 3] = 255; out[i * 3 + 1] = g[i]; out[i * 3 + 2] = b[i] }
  return sharp(out, { raw: { width: SIZE, height: SIZE, channels: 3 } }).webp({ quality: 88 }).toBuffer()
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})
const doc = await io.read(GLB)
const root = doc.getRoot()
const mkTex = (buf, name) => doc.createTexture(name).setMimeType('image/webp').setImage(buf)

// Crear un material por pieza (una sola vez), con sus texturas.
const matCache = {}
async function materialDePieza(key) {
  if (matCache[key]) return matCache[key]
  const e = PARTS[key]
  const baseP = findFile(e.folder, [`${e.stem}_Base_color.png`, `${e.stem}_BaseColor.png`])
  const roughP = findFile(e.folder, [`${e.stem}_Roughness.png`])
  const metalP = findFile(e.folder, [`${e.stem}_Metallic.png`])
  const normP = findFile(e.folder, [`${e.stem}_Normal_OpenGL.png`, `${e.stem}_Normal.png`])
  const m = doc.createMaterial(`acc_${key}`).setBaseColorFactor([1, 1, 1, 1])
  if (baseP) m.setBaseColorTexture(mkTex(await baseWebp(baseP), `${key}_base`))
  if (roughP && metalP) { m.setMetallicRoughnessTexture(mkTex(await mrWebp(roughP, metalP), `${key}_mr`)); m.setRoughnessFactor(1); m.setMetallicFactor(1) }
  if (normP) m.setNormalTexture(mkTex(await normWebp(normP), `${key}_n`))
  matCache[key] = m
  return m
}

const conteo = {}
const sinMapear = []
for (const node of root.listNodes()) {
  const mesh = node.getMesh()
  if (!mesh) continue
  const key = parteDeNodo(node.getName())
  if (!key) continue
  const m = await materialDePieza(key)
  for (const prim of mesh.listPrimitives()) prim.setMaterial(m)
  conteo[key] = (conteo[key] || 0) + 1
}

// Detectar mallas que sigan en 'ACC' (no texturizadas) para diagnóstico.
for (const node of root.listNodes()) {
  const mesh = node.getMesh()
  if (!mesh) continue
  for (const prim of mesh.listPrimitives()) {
    const mn = prim.getMaterial()?.getName() || ''
    if (/^acc$/i.test(mn)) { sinMapear.push(node.getName()); break }
  }
}

await doc.transform(prune(), draco())
await io.write(GLB, doc)

console.log('NODOS TEXTURIZADOS por pieza:', JSON.stringify(conteo))
console.log('NODOS aún en ACC (sin textura):', sinMapear)
console.log('OK ->', GLB)
