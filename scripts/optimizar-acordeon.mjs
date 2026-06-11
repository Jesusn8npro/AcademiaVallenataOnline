// Optimiza el GLB crudo del acordeón exportado de Blender.
// Preserva nombres de nodo + morphs del fuelle (NO join/flatten/instance).
// Uso: node scripts/optimizar-acordeon.mjs <in.glb> <out.glb> [ratio]
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, weld, simplify, prune, textureCompress } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import draco3d from 'draco3dgltf'
import sharp from 'sharp'

const IN = process.argv[2]
const OUT = process.argv[3]
const RATIO = parseFloat(process.argv[4] || '0.25')

await MeshoptSimplifier.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})

const doc = await io.read(IN)
const root = doc.getRoot()

// Quitar el prefijo WEBNODE_ (lo usé en Blender para evitar colisiones de nombre).
for (const node of root.listNodes()) {
  const n = node.getName()
  if (n && n.startsWith('WEBNODE_')) node.setName(n.slice('WEBNODE_'.length))
}

const trisAntes = root.listMeshes().reduce((a, m) =>
  a + m.listPrimitives().reduce((b, p) => b + (p.getIndices()?.getCount() || 0) / 3, 0), 0)

// RATIO <= 0  → NO simplify ni weld (la geometría ya viene decimada de Blender por pieza,
// con el fuelle suave para conservar pliegues). Simplify de gltf-transform + lockBorder
// arruinaba los pliegues del fuelle cerca de las cajas.
const pasos = [dedup()]
if (RATIO > 0) {
  pasos.push(weld())
  pasos.push(simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: 0.005, lockBorder: true }))
}
pasos.push(prune())
pasos.push(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 82 }))
await doc.transform(...pasos)

// Draco al final (el visor ya carga /draco/). Lo aplica el NodeIO al escribir si
// registramos la extensión vía draco() — usamos la función draco() del paquete.
const { draco } = await import('@gltf-transform/functions')
await doc.transform(draco({ method: 'edgebreaker' }))

await io.write(OUT, doc)

const trisDespues = root.listMeshes().reduce((a, m) =>
  a + m.listPrimitives().reduce((b, p) => b + (p.getIndices()?.getCount() || 0) / 3, 0), 0)

const fuelle = root.listMeshes().find((m) => (m.getExtras()?.targetNames || []).includes('Cerr_uniforme'))
console.log(JSON.stringify({
  trisAntes: Math.round(trisAntes),
  trisDespues: Math.round(trisDespues),
  fuelleMorphs: fuelle?.getExtras()?.targetNames || 'NO ENCONTRADO',
  nMeshes: root.listMeshes().length,
}, null, 2))
