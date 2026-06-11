import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})
const doc = await io.read(process.argv[2]); const root = doc.getRoot()
const skin = root.listSkins()[0]
const joints = skin.listJoints().map(j=>j.getName())
const arm = joints.filter(n=>/R_(Upperarm|UpperArm|Forearm|ForeArm|Elbow|Hand|Shoulder|Clavicle)/.test(n))
const fingersR = joints.filter(n=>/R_(Index|Mid|Ring|Pinky|Thumb)/.test(n))
console.log('BRAZO DERECHO:', JSON.stringify(arm,null,1))
console.log('DEDOS DERECHA:', JSON.stringify(fingersR,null,1))
