// Optimiza personaje-acordeon.glb → personaje-2026.glb SELECTIVAMENTE por pieza.
// Preserva morphs (Cerrar + dedos R/L) y materiales acc_ (pieles). Protege cara,
// ojos, dientes, lengua, pestañas, dedos (cuerpo) y botones (no se simplifican).
// Machaca el fuelle (47% de los polígonos) y aligera pelo/ropa/acordeón.
// Uso: node scripts/optimizar-personaje-2026.mjs
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, weld, prune, textureCompress, draco, simplifyPrimitive } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import draco3d from 'draco3dgltf'
import sharp from 'sharp'

const IN = process.argv[2] || 'public/modelos3d/personaje-acordeon.glb'
const OUT = process.argv[3] || 'public/modelos3d/personaje-2026.glb'

await MeshoptSimplifier.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})

const doc = await io.read(IN)
const root = doc.getRoot()
const tris = () => root.listMeshes().reduce((a, m) =>
  a + m.listPrimitives().reduce((b, p) => b + (p.getIndices()?.getCount() || 0) / 3, 0), 0)
const trisAntes = tris()

// dedup + weld (requisito para simplify; weld preserva morphs)
await doc.transform(dedup(), weld())

// ratio + error por pieza. ratio 1.0 = NO tocar (proteger).
function planFor(meshName, matName) {
  const n = (meshName + ' ' + matName).toLowerCase()
  // lockBorder mantiene los bordes (uniones). El fuelle DEBE conservarlos (se pega a los
  // marcos); el pelo NO (sus bordes son cantos de mechones, lockear impide reducirlo).
  if (matName === 'acc_fuelle') return { ratio: 0.18, error: 0.02, lockBorder: true }   // 116k → ~21k
  if (/afro|hair|scalp/.test(n)) return { ratio: 0.35, error: 0.03, lockBorder: false }  // pelo (cards)
  if (matName === 'acc_pack') return { ratio: 0.50, error: 0.01, lockBorder: true }      // cajas/parrilla acordeón
  if (matName === 'acc_cuerpo') return { ratio: 0.50, error: 0.01, lockBorder: true }
  if (/fit_shirts|slim_jeans|sport_sneakers/.test(n)) return { ratio: 0.50, error: 0.01, lockBorder: true } // ropa
  return null // proteger: body(dedos), eyes, teeth, tongue, eyelash, botones, parte botones
}

const reduccion = []
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const mat = prim.getMaterial()?.getName() || ''
    const plan = planFor(mesh.getName(), mat)
    if (!plan) continue
    const antes = (prim.getIndices()?.getCount() || 0) / 3
    simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: plan.ratio, error: plan.error, lockBorder: plan.lockBorder })
    const despues = (prim.getIndices()?.getCount() || 0) / 3
    reduccion.push(`${mesh.getName()} [${mat}] ${Math.round(antes)}→${Math.round(despues)}`)
  }
}

await doc.transform(prune())
// Texturas: normal/mr/specular a 512 q78 (toleran bajada y son las más pesadas);
// color/diffuse/opacity a 512 q82. El personaje se ve pequeño en el visor → 512 sobra.
await doc.transform(textureCompress({
  encoder: sharp, targetFormat: 'webp', resize: [512, 512], quality: 78,
  pattern: /(_n$|_mr$|normal|specular|reflection)/i,
}))
await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512], quality: 82 }))
// Draco: comprobado y funcionando en esta app (el tab 3D lo usa). Comprime la geometría
// base; los morph targets quedan sin comprimir (Draco no los toca) pero la animación es
// idéntica. Alternativa meshopt() bajaría a ~3.1MB pero no pude verificarla en vivo aún.
await doc.transform(draco())
await io.write(OUT, doc)

// Verificar CONTRATO (lo que el código de la pestaña necesita)
const mats = root.listMaterials().map((m) => m.getName())
const body = root.listMeshes().find((m) => (m.getExtras()?.targetNames || []).includes('R_Index'))
const fuelle = root.listMeshes().find((m) => m.listPrimitives()[0]?.getMaterial()?.getName() === 'acc_fuelle')
console.log(JSON.stringify({
  trisAntes: Math.round(trisAntes), trisDespues: Math.round(tris()),
  accMats: mats.filter((n) => n.startsWith('acc_')),
  bodyMorphs: body?.getExtras()?.targetNames || 'NO ENCONTRADO',
  fuelleTieneCerrar: (fuelle?.getExtras()?.targetNames || []).includes('Cerrar'),
  nMeshes: root.listMeshes().length, nTextures: root.listTextures().length,
  reduccion,
}, null, 2))
