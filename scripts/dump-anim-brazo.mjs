// Inspecciona la animación de un personaje GLB: canales por hueso del brazo izquierdo
// y compara la rotación animada en t=0 contra la rotación de REST del nodo.
// Uso: node scripts/dump-anim-brazo.mjs <ruta.glb>
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
})
const doc = await io.read(process.argv[2])
const root = doc.getRoot()
const anim = root.listAnimations()[0]
const canales = anim.listChannels()

const interes = ['LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'Hips']
const out = { animacion: anim.getName(), nCanales: canales.length, huesos: {} }
for (const ch of canales) {
  const nodo = ch.getTargetNode()
  const nombre = nodo?.getName() || '?'
  const corto = interes.find((i) => nombre.endsWith(i))
  if (!corto) continue
  const path = ch.getTargetPath()
  const sampler = ch.getSampler()
  const valores = sampler.getOutput().getArray()
  const tiempos = sampler.getInput().getArray()
  const n = path === 'rotation' ? 4 : 3
  const primero = Array.from(valores.slice(0, n)).map((v) => +v.toFixed(4))
  const ultimo = Array.from(valores.slice(-n)).map((v) => +v.toFixed(4))
  const entry = (out.huesos[nombre] ||= { rest_rotation: nodo.getRotation().map((v) => +v.toFixed(4)) })
  entry[path] = { keys: tiempos.length, t0: primero, tFin: ultimo }
}
console.log(JSON.stringify(out, null, 2))
