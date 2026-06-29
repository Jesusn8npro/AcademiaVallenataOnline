// Comprime el GLB combinado Pelao+acordeon (raw ~142MB) para /test-personaje-3d.
//  - NO decima la malla del CUERPO (skinned, JOINTS_0) -> cara/manos crujientes.
//  - Decima el FUELLE (morph 'Abrir', suave error 0.001) y las piezas RIGIDAS pesadas del acordeon.
//  - Texturas -> webp 1024. Draco al final (en este repo conserva morphs + skin; el visor carga /draco/).
// Uso: node scripts/comprimir-pelao-fuelle.mjs <in.glb> <out.glb> [fuelleRatio=0.5] [rigidoRatio=0.6]
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, draco, simplifyPrimitive, textureCompress } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import draco3d from 'draco3dgltf'
import sharp from 'sharp'
import fs from 'node:fs'

const IN = process.argv[2]
const OUT = process.argv[3]
const FUELLE_RATIO = parseFloat(process.argv[4] || '0.5')
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
  const prims = m.listPrimitives()
  const esSkinned = prims.some((p) => p.getAttribute('JOINTS_0'))
  if (esSkinned) continue // CUERPO: no tocar (calidad)
  const esFuelle = (m.getExtras()?.targetNames || []).some((n) => /^Abrir/.test(n))
  const triCount = prims.reduce((b, p) => b + (p.getIndices()?.getCount() || 0) / 3, 0)
  if (!esFuelle && triCount < 400) continue // botones/tornillos: no vale la pena
  const ratio = esFuelle ? FUELLE_RATIO : RIGIDO_RATIO
  let antes = 0, despues = 0
  for (const p of prims) {
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
  ancla: root.listNodes().some((n) => n.getName() === 'AnclaAcordeon'),
  skins: root.listSkins().length,
  morphsVivos: root.listMeshes().filter((m) => m.listPrimitives()[0]?.listTargets().length).length,
  acciones: root.listAnimations().map((a) => a.getName()),
}, null, 2))
