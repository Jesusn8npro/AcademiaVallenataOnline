// Compara el espacio del hueso Hips entre el pack de bailes y un personaje:
// translation local de Hips, y TRS del padre (el nodo armature) en ambos GLBs.
// Uso: node scripts/diag-hips-escala.mjs <a.glb> <b.glb>
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
})
const ver = async (ruta) => {
  const doc = await io.read(ruta)
  const root = doc.getRoot()
  const nodos = root.listNodes()
  const hips = nodos.find((n) => /Hips$/.test(n.getName()))
  const padre = nodos.find((n) => n.listChildren().includes(hips))
  const anim = root.listAnimations()[0]
  let hipsTrack = null
  if (anim) {
    const ch = anim.listChannels().find((c) => c.getTargetNode() === hips && c.getTargetPath() === 'translation')
    if (ch) {
      const v = ch.getSampler().getOutput().getArray()
      hipsTrack = { primera: [...v.slice(0, 3)].map((x) => +x.toFixed(3)), n: v.length / 3 }
    }
  }
  return {
    ruta,
    hips: { nombre: hips?.getName(), t: hips?.getTranslation().map((v) => +v.toFixed(4)) },
    padre: padre ? { nombre: padre.getName(), t: padre.getTranslation().map((v) => +v.toFixed(4)), s: padre.getScale().map((v) => +v.toFixed(5)), r: padre.getRotation().map((v) => +v.toFixed(4)) } : null,
    trackHips: hipsTrack,
  }
}
console.log(JSON.stringify([await ver(process.argv[2]), await ver(process.argv[3])], null, 2))
