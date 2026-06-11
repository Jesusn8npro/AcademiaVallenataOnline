// Optimiza el GLB del personaje (horneado, sin esqueleto) preservando morphs
// (Cerrar + dedos R/L) y materiales acc_ (pieles). NO join/flatten/instance.
// Uso: node scripts/optimizar-personaje.mjs <in.glb> <out.glb> [simplifyRatio|0=off]
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, weld, simplify, prune, textureCompress } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import draco3d from 'draco3dgltf'
import sharp from 'sharp'

const IN = process.argv[2]
const OUT = process.argv[3]
const RATIO = parseFloat(process.argv[4] || '0') // 0 = sin simplify (preserva geometría/morphs)

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

const pasos = [dedup(), weld()]
if (RATIO > 0) pasos.push(simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: 0.004, lockBorder: true }))
pasos.push(prune())
pasos.push(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 84 }))
await doc.transform(...pasos)

const { draco } = await import('@gltf-transform/functions')
await doc.transform(draco())
await io.write(OUT, doc)

// Verificar contrato: materiales acc_ + morphs Cerrar/dedos sobreviven
const mats = root.listMaterials().map((m) => m.getName())
const body = root.listMeshes().find((m) => (m.getExtras()?.targetNames || []).includes('R_Index'))
console.log(JSON.stringify({
  trisAntes: Math.round(trisAntes), trisDespues: Math.round(tris()),
  accMats: mats.filter((n) => n.startsWith('acc_')),
  bodyMorphs: body?.getExtras()?.targetNames || 'NO ENCONTRADO',
  nMeshes: root.listMeshes().length, nTextures: root.listTextures().length,
}, null, 2))
