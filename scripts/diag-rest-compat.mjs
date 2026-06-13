// Compara las rotaciones de REST de los huesos comunes entre el pack de bailes y un
// personaje: si difieren, los clips (rotaciones absolutas glTF) distorsionan al retargetear.
// Uso: node scripts/diag-rest-compat.mjs public/modelos3d/bailes-pack-v1.glb public/modelos3d/personaje-pelao.glb
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
})
const [docA, docB] = await Promise.all([io.read(process.argv[2]), io.read(process.argv[3])])

const mapa = (doc) => {
  const m = new Map()
  for (const n of doc.getRoot().listNodes()) m.set(n.getName(), n)
  return m
}
const A = mapa(docA), B = mapa(docB)

const angulo = (qa, qb) => {
  // angulo entre cuaterniones, en grados
  const dot = Math.abs(qa[0]*qb[0] + qa[1]*qb[1] + qa[2]*qb[2] + qa[3]*qb[3])
  return +(2 * Math.acos(Math.min(1, dot)) * 180 / Math.PI).toFixed(2)
}

const out = []
for (const [nombre, na] of A) {
  if (!nombre.startsWith('mixamorig')) continue
  const nb = B.get(nombre)
  if (!nb) { out.push({ hueso: nombre, falta_en_personaje: true }); continue }
  const deg = angulo(na.getRotation(), nb.getRotation())
  if (deg > 0.5) out.push({ hueso: nombre, dif_deg: deg })
}
console.log(JSON.stringify({ comparados: A.size, problemas: out.length ? out : 'NINGUNO — rests compatibles' }, null, 2))
