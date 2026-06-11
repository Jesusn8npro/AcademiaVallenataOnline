// Inspecciona un GLB y reporta nodos, mallas (con morphs), skins y materiales.
// Uso: node scripts/inspect-glb.mjs <ruta.glb>
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'

const path = process.argv[2]
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})
const doc = await io.read(path)
const root = doc.getRoot()

const meshes = root.listMeshes().map((m) => {
  const prims = m.listPrimitives()
  const morphNames = m.getExtras()?.targetNames || null
  const tris = prims.reduce((a, p) => {
    const idx = p.getIndices()
    return a + (idx ? idx.getCount() / 3 : (p.getAttribute('POSITION')?.getCount() || 0) / 3)
  }, 0)
  return {
    name: m.getName(),
    prims: prims.length,
    tris,
    morphTargets: prims[0]?.listTargets().length || 0,
    morphNames,
    mats: prims.map((p) => p.getMaterial()?.getName()).filter(Boolean),
  }
})

const nodes = root.listNodes().map((n) => ({
  name: n.getName(),
  mesh: n.getMesh()?.getName() || null,
  skin: n.getSkin() ? n.getSkin().listJoints().length + ' joints' : null,
}))

const mats = root.listMaterials().map((m) => m.getName())
const skins = root.listSkins().map((s) => ({ name: s.getName(), joints: s.listJoints().length }))
const anims = root.listAnimations().map((a) => a.getName())
const textures = root.listTextures().map((t) => ({
  name: t.getName(), mime: t.getMimeType(), size: t.getImage()?.byteLength,
}))

console.log(JSON.stringify({
  file: path,
  totalTris: meshes.reduce((a, m) => a + m.tris, 0),
  nMeshes: meshes.length,
  nNodes: nodes.length,
  skins, anims,
  materials: mats,
  textures: textures.map((t) => `${t.name || '(sin nombre)'} ${t.mime} ${(t.size/1024).toFixed(0)}KB`),
  meshesConMorphs: meshes.filter((m) => m.morphTargets > 0),
  nodeNames: nodes.map((n) => n.name),
  meshNames: meshes.map((m) => `${m.name} [${m.tris}t, ${m.mats.join('/')}]`),
}, null, 2))
