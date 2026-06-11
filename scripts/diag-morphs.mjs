import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})
const doc = await io.read('public/modelos3d/personaje-acordeon.glb')
const root = doc.getRoot()
// fuelle mesh
for (const m of root.listMeshes()) {
  const prim = m.listPrimitives()[0]
  const matN = prim?.getMaterial()?.getName() || ''
  if (!/acc_fuelle/i.test(matN)) continue
  console.log('MESH name:', m.getName())
  console.log('  extras:', JSON.stringify(m.getExtras()))
  console.log('  prim targets:', prim.listTargets().length)
  console.log('  target[0] attrs:', prim.listTargets()[0]?.listSemantics())
  // ¿dónde está el nombre? nodo vs mesh
}
// ¿targetNames en el root/mesh extras de todos?
const withTN = root.listMeshes().filter(m=>m.getExtras()?.targetNames).length
console.log('meshes con extras.targetNames:', withTN, '/', root.listMeshes().length)
