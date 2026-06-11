import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})
for (const f of process.argv.slice(2)) {
  const doc = await io.read(f)
  const root = doc.getRoot()
  const exts = doc.getRoot().listExtensionsUsed().map(e => e.extensionName)
  let tex = 0; for (const t of root.listTextures()) tex += t.getImage()?.byteLength || 0
  let acc = 0; for (const a of root.listAccessors()) acc += a.getArray()?.byteLength || 0
  // separar accesores de morph
  let morphBytes = 0, morphVerts = 0
  for (const m of root.listMeshes()) for (const p of m.listPrimitives())
    for (const t of p.listTargets()) for (const a of t.listAttributes()? t.listAttributes():[]) {}
  console.log(f, JSON.stringify({
    exts,
    texturasMB: +(tex/1048576).toFixed(2),
    accesoresMB: +(acc/1048576).toFixed(2),
    nAccesores: root.listAccessors().length,
  }))
}
