// Prepara el GLB del personaje para el visor a partir de TU modelo actual optimizado
// (personaje-acordeon-opt.glb), que YA trae el cierre coordinado completo (fuelle + cajas +
// botones + manos, todo con el morph 'Cerrar') y los morphs de dedos. NO toca geometría ni
// morphs: solo aplica los arreglos visuales (quitar correa metálica vieja, botones opacos) y
// escribe public/modelos3d/personaje-2026.glb (lo que carga el tab Personaje).
// Uso: node scripts/preparar-personaje-2026.mjs
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { prune } from '@gltf-transform/functions'
import draco3d from 'draco3dgltf'
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer'

await MeshoptDecoder.ready
await MeshoptEncoder.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'meshopt.decoder': MeshoptDecoder,
  'meshopt.encoder': MeshoptEncoder,
})

const IN = 'public/modelos3d/personaje-acordeon-opt.glb'
const OUT = 'public/modelos3d/personaje-2026-v2.glb'

const doc = await io.read(IN)
const root = doc.getRoot()

// Cuántas mallas traen el cierre coordinado (verificación rápida)
const conCerrar = root.listMeshes().filter((m) => (m.getExtras()?.targetNames || []).includes('Cerrar')).length
console.log('Mallas con morph Cerrar:', conCerrar, '/', root.listMeshes().length)

// Arreglo 1: quitar la correa metálica vieja, si existe
let correas = 0
for (const node of root.listNodes()) if (/^metal_correa/i.test(node.getName())) { const m = node.getMesh(); node.dispose(); if (m) m.dispose(); correas++ }

// Arreglo 2: botones opacos (evita que se vean translúcidos)
let botones = 0
for (const mat of root.listMaterials()) if (/^botones|acc_botones/i.test(mat.getName())) {
  mat.setAlphaMode('OPAQUE'); const c = mat.getBaseColorFactor(); mat.setBaseColorFactor([c[0], c[1], c[2], 1]); botones++
}

await doc.transform(prune())
await io.write(OUT, doc)
console.log(`Listo: correa quitada=${correas}, materiales botones opacos=${botones}. Escrito ${OUT}`)
