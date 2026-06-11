// Extrae el ACORDEÓN del GLB del personaje, piel roja horneada, para el tab 3D.
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { draco } from '@gltf-transform/functions'
import draco3d from 'draco3dgltf'
import fs from 'node:fs'

const SKIN = 'public/texturas-acordeon/1'
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})
const doc = await io.read('public/modelos3d/personaje-acordeon.glb')
const root = doc.getRoot()
const ES_PERSONAJE = /^(Std_|Hair_|Scalp_|Female_|Fit_|Slim_|Sport_|CC_)/i

const cuentaMorphs = (etiqueta) => {
  const n = root.listMeshes().filter((m) => {
    const tn = m.getExtras()?.targetNames || []
    return tn.includes('Cerrar') || tn.includes('Cerr_uniforme')
  }).length
  console.log(`[${etiqueta}] meshes con morph cierre:`, n, '/', root.listMeshes().length)
}
cuentaMorphs('inicio')

// 1) Borrar mallas del personaje (por material) + sus accesores huérfanos manualmente
const accesoresAntes = new Set(root.listAccessors())
for (const node of root.listNodes()) {
  const mesh = node.getMesh()
  if (!mesh) continue
  const mat = mesh.listPrimitives()[0]?.getMaterial()?.getName() || ''
  if (ES_PERSONAJE.test(mat)) {
    for (const prim of mesh.listPrimitives()) prim.dispose()
    mesh.dispose(); node.dispose()
  }
}
cuentaMorphs('tras quitar personaje')

// 2) Renombrar morph 'Cerrar' -> 'Cerr_uniforme'
for (const mesh of root.listMeshes()) {
  const ex = mesh.getExtras()
  if (ex?.targetNames) {
    mesh.setExtras({ ...ex, targetNames: ex.targetNames.map((n) => (n === 'Cerrar' ? 'Cerr_uniforme' : n)) })
  }
}
cuentaMorphs('tras renombrar')

// 3) Quitar sufijos de nodos (Boton_*_m / .00N -> Boton_*)
for (const node of root.listNodes()) {
  const n = node.getName()
  if (n) node.setName(n.replace(/_m$/i, '').replace(/\.\d+$/, ''))
}

// 4) Materiales huérfanos del personaje: borrarlos manualmente (no prune, que mata morphs)
for (const mat of root.listMaterials()) {
  if (ES_PERSONAJE.test(mat.getName()) && mat.listParents().filter((p) => p.propertyType === 'Primitive').length === 0) {
    mat.dispose()
  }
}
// Accesores huérfanos (sin padres) -> dispose
for (const acc of root.listAccessors()) {
  if (acc.listParents().filter((p) => p.propertyType !== 'Root').length === 0) acc.dispose()
}
// Texturas huérfanas
for (const t of root.listTextures()) {
  if (t.listParents().filter((p) => p.propertyType !== 'Root').length === 0) t.dispose()
}

// 5) Piel roja a materiales acc_
const parteDeMat = (m) => ({ cuerpo: 'cuerpo', fuelle: 'fuelle', botones: 'botones', pack: 'pack', 'parte botones': 'parte-botones' }[(m || '').replace(/^acc_/, '').trim()] || null)
const tex = (file) => fs.existsSync(file) ? doc.createTexture(file.split('/').pop()).setMimeType('image/webp').setImage(fs.readFileSync(file)) : null
for (const mat of root.listMaterials()) {
  const part = parteDeMat(mat.getName())
  if (!part) continue
  const base = tex(`${SKIN}/${part}_base.webp`); const mr = tex(`${SKIN}/${part}_mr.webp`); const nor = tex(`${SKIN}/${part}_normal.webp`)
  if (base) { mat.setBaseColorTexture(base); mat.setBaseColorFactor([1, 1, 1, 1]) }
  if (mr) { mat.setMetallicRoughnessTexture(mr); mat.setRoughnessFactor(1); mat.setMetallicFactor(1) }
  if (nor) mat.setNormalTexture(nor)
}
cuentaMorphs('tras texturas')

await doc.transform(draco())
cuentaMorphs('tras draco')
await io.write('public/modelos3d/acordeon-solo-v1.glb', doc)

console.log(JSON.stringify({
  meshes: root.listMeshes().length,
  materials: root.listMaterials().map((m) => m.getName()),
  nodesConMesh: root.listNodes().filter((n) => n.getMesh()).length,
}, null, 2))
