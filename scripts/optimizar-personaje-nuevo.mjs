// Optimiza el export crudo del personaje NUEVO (_personaje-nuevo-raw.glb) → personaje-2026.glb
// Para el test "ver si el personaje es correcto": quita TODOS los morphs (no se usan aún),
// decima piezas pesadas (fuelle, pelo, ropa, cajas acordeón), protege cara/ojos/manos/botones,
// comprime texturas a 512 webp y Draco. La animación se agrega después.
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, weld, prune, textureCompress, draco, simplifyPrimitive } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import draco3d from 'draco3dgltf'
import sharp from 'sharp'

const IN = 'public/modelos3d/_personaje-nuevo-raw.glb'
const OUT = 'public/modelos3d/personaje-2026.glb'

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

// 1) Quitar TODOS los morph targets (blendshapes faciales = peso enorme, no se usan)
let morphsQuitados = 0
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    for (const t of prim.listTargets()) { prim.removeTarget(t); t.dispose(); morphsQuitados++ }
  }
  mesh.setWeights([])
  const ex = mesh.getExtras()
  if (ex && ex.targetNames) { const e = { ...ex }; delete e.targetNames; mesh.setExtras(e) }
}

await doc.transform(dedup(), weld())

// 2) Decimar por pieza (nombre de mesh/nodo o material). null = proteger.
function planFor(name, mat) {
  const n = (name + ' ' + mat).toLowerCase()
  if (/fuelle/.test(n)) return { ratio: 0.18, error: 0.02 }
  if (/pelo|hair|afro/.test(n)) return { ratio: 0.35, error: 0.03 }
  if (/camiza|shirt|jean|zapato|sneaker|slim|fit/.test(n)) return { ratio: 0.50, error: 0.01 }
  if (/broche|bases para parar|rejilla|parrilla|cuerpo1|borde_parrilla|caja|marco|diapason|acorderon|bajp/.test(n))
    return { ratio: 0.45, error: 0.01 }
  return null // proteger: cara/cuerpo (manos), ojos, dientes, lengua, pestañas, botones, pines, tornillos
}

for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const mat = prim.getMaterial()?.getName() || ''
    const plan = planFor(mesh.getName(), mat)
    if (!plan) continue
    simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: plan.ratio, error: plan.error, lockBorder: true })
  }
}

await doc.transform(prune())
await doc.transform(textureCompress({
  encoder: sharp, targetFormat: 'webp', resize: [512, 512], quality: 80,
}))
await doc.transform(draco())
await io.write(OUT, doc)

console.log(JSON.stringify({
  trisAntes: Math.round(trisAntes), trisDespues: Math.round(tris()),
  morphsQuitados, nMeshes: root.listMeshes().length, nTextures: root.listTextures().length,
}, null, 2))
