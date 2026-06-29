// Mide DELTA_CERRADO del cuerpo: q0^-1 * qN por hueso del brazo izq. en la animación (agarre→cerrado).
// Uso: node scripts/_medir-delta-cerrado.mjs public/modelos3d/personaje-pelao.glb
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'

const IN = process.argv[2]
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})
const doc = await io.read(IN)
const root = doc.getRoot()
const anim = root.listAnimations()[0]

const BONES = ['LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand']
const mul = (a, b) => ({
  w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
  y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
  z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
})
const inv = (q) => ({ x: -q.x, y: -q.y, z: -q.z, w: q.w }) // unit → conjugada
const r4 = (v) => +v.toFixed(5)

const out = {}
for (const ch of anim.listChannels()) {
  if (ch.getTargetPath() !== 'rotation') continue
  const node = ch.getTargetNode()
  const name = node.getName() || ''
  const suf = BONES.find((b) => name.endsWith(b))
  if (!suf) continue
  const arr = ch.getSampler().getOutput().getArray() // [x,y,z,w, ...] por keyframe
  const n = arr.length / 4
  const q0 = { x: arr[0], y: arr[1], z: arr[2], w: arr[3] }
  const i = (n - 1) * 4
  const qN = { x: arr[i], y: arr[i + 1], z: arr[i + 2], w: arr[i + 3] }
  const d = mul(inv(q0), qN)
  out[suf] = [r4(d.x), r4(d.y), r4(d.z), r4(d.w)]
}
// imprimir en el orden Shoulder, Arm, ForeArm, Hand
console.log('anim:', anim.getName(), 'keyframes detectados por canal')
for (const b of BONES) console.log(`${b}: new THREE.Quaternion(${(out[b] || ['?']).join(', ')}),`)
