// Lista TODOS los huesos que keyea la animación de cierre de un personaje GLB
// (para decidir cómo conviven baile + cierre en el mixer por capas).
// Uso: node scripts/diag-tracks-cierre.mjs public/modelos3d/personaje-pelao.glb
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
})
const doc = await io.read(process.argv[2])
const root = doc.getRoot()
for (const anim of root.listAnimations()) {
  const porHueso = {}
  for (const ch of anim.listChannels()) {
    const nombre = ch.getTargetNode()?.getName() || '?'
    ;(porHueso[nombre] ||= []).push(ch.getTargetPath())
  }
  const nombres = Object.keys(porHueso)
  console.log(JSON.stringify({
    animacion: anim.getName(),
    nHuesos: nombres.length,
    nCanales: anim.listChannels().length,
    huesos: nombres.sort(),
  }, null, 2))
}
