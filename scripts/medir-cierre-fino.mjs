// Mide en acordeon-fino-v1.glb el desplazamiento (morph 'Cerrar') de la caja de bajos
// y los transforms de parrilla/caja — para hornear el seguimiento del brazo izquierdo
// de cada personaje en Blender con el MISMO recorrido.
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
})
const doc = await io.read('public/modelos3d/acordeon-fino-v1.glb')
const root = doc.getRoot()

const nodo = (nm) => root.listNodes().find((n) => n.getName() === nm)

// Delta medio del morph 'Cerrar' de un nodo (la caja desliza rígida → media = recorrido).
function deltaMorph(n) {
  const mesh = n.getMesh()
  const names = mesh.getExtras()?.targetNames || []
  const idx = names.indexOf('Cerrar')
  if (idx < 0) return null
  const prim = mesh.listPrimitives()[0]
  const tgt = prim.listTargets()[idx]
  const pos = tgt.getAttribute('POSITION')
  const acc = [0, 0, 0]
  const el = []
  for (let i = 0; i < pos.getCount(); i++) {
    pos.getElement(i, el)
    acc[0] += el[0]; acc[1] += el[1]; acc[2] += el[2]
  }
  return acc.map((v) => v / pos.getCount())
}

const parrilla = nodo('parrilla')
const caja = nodo('Caja de los bajos, izquierda')
const fuelle = nodo('fuelle')

console.log(JSON.stringify({
  parrilla: { t: parrilla.getTranslation(), r: parrilla.getRotation(), s: parrilla.getScale() },
  caja: { t: caja.getTranslation(), r: caja.getRotation(), s: caja.getScale(), deltaCerrarLocal: deltaMorph(caja) },
  fuelleDeltaCerrarLocal: deltaMorph(fuelle),
  morphCerrarEn: root.listMeshes()
    .filter((m) => (m.getExtras()?.targetNames || []).includes('Cerrar')).length,
}, null, 2))
