import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})
const doc = await io.read('./public/modelos3d/personaje-acordeon.glb')
const root = doc.getRoot()
const nodes = root.listNodes()
const boneKw = /(hand|finger|index|mid|ring|pinky|thumb|forearm|arm|wrist|mano)/i
const bones = nodes.filter(n => !n.getMesh() && boneKw.test(n.getName())).map(n => n.getName())
const correa = nodes.filter(n => n.getMesh() && /(correa|strap|cuerda|banda)/i.test(n.getName())).map(n => n.getName())
const skins = root.listSkins().map(s => ({ joints: s.listJoints().length }))
console.log('TOTAL nodes:', nodes.length, '| skins:', JSON.stringify(skins))
console.log('BONES mano/dedos/brazo (' + bones.length + '):', bones.slice(0, 80).join(', '))
console.log('MALLAS correa/strap:', correa.join(', ') || 'NINGUNA')
