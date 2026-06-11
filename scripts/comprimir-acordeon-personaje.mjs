// Comprime el acordeón del personaje (raw ~124MB) para el visor web.
//  - Decima SOLO el fuelle (la pieza pesada, ~59k verts) conservando su morph 'Cerrar'
//    (suave, para no rasgar los pliegues). El resto de piezas rígidas: decimado leve.
//  - Texturas → webp 1024. Draco al final (el visor ya carga /draco/, conserva morphs).
// Uso: node scripts/comprimir-acordeon-personaje.mjs <in.glb> <out.glb> [fuelleRatio=0.4] [rigidoRatio=0.6]
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, draco, simplifyPrimitive, textureCompress } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import draco3d from 'draco3dgltf'
import sharp from 'sharp'
import fs from 'node:fs'

const IN = process.argv[2]
const OUT = process.argv[3]
const FUELLE_RATIO = parseFloat(process.argv[4] || '0.4')
const RIGIDO_RATIO = parseFloat(process.argv[5] || '0.6')

await MeshoptSimplifier.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})

const doc = await io.read(IN)
const root = doc.getRoot()
const tris = () => root.listMeshes().reduce((a, m) =>
  a + m.listPrimitives().reduce((b, p) => b + (p.getIndices()?.getCount() || 0) / 3, 0), 0)
const trisAntes = tris()

const decimadas = []
for (const m of root.listMeshes()) {
  const esFuelle = (m.getExtras()?.targetNames || []).includes('Cerrar')
  // Mallas muy pequeñas (botones, tornillos) no vale la pena decimarlas.
  const triCount = m.listPrimitives().reduce((b, p) => b + (p.getIndices()?.getCount() || 0) / 3, 0)
  if (!esFuelle && triCount < 400) continue
  const ratio = esFuelle ? FUELLE_RATIO : RIGIDO_RATIO
  let antes = 0, despues = 0
  for (const p of m.listPrimitives()) {
    antes += (p.getIndices()?.getCount() || 0) / 3
    simplifyPrimitive(p, { simplifier: MeshoptSimplifier, ratio, error: esFuelle ? 0.001 : 0.01, lockBorder: true })
    despues += (p.getIndices()?.getCount() || 0) / 3
  }
  if (esFuelle) decimadas.push(`fuelle: ${Math.round(antes)}→${Math.round(despues)}`)
}

await doc.transform(dedup(), prune({ keepLeaves: true }))
await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 82 }))
await doc.transform(draco({ method: 'edgebreaker', quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12, quantizeGeneric: 12 }))
await io.write(OUT, doc)

console.log(JSON.stringify({
  in: IN, out: OUT,
  mb: +(fs.statSync(OUT).size / 1e6).toFixed(2),
  trisAntes: Math.round(trisAntes), trisDespues: Math.round(tris()),
  parrilla: root.listNodes().some((n) => n.getName() === 'parrilla'),
  morphsVivos: root.listMeshes().filter((m) => m.listPrimitives()[0]?.listTargets().length)
    .map((m) => `${m.getName()}: ${(m.getExtras()?.targetNames || []).join(',')}`),
  materiales: root.listMaterials().map((m) => m.getName()),
  decimadas,
}, null, 2))
