// Optimiza personaje-fino-v5 → v6 SIN romper nada:
//  - Mallas SKINNEADAS (cuerpo, ropa, pelo, dientes, ojos): NO se tocan (simplify corrompe pesos = rasga ropa).
//  - Mallas NO-skinneadas (fuelle + partes rígidas del acordeón): decimables sin riesgo de pesos.
//    · fuelle (Cube_004.002, 116k tris, morph 'Cerrar'): SUAVE (los pliegues son delicados).
//    · resto rígido: moderado.
//  - Quita morphs 'Key 2' de acc_axe (sin usar por el visor).
//  - Re-draco al final (el visor ya carga /draco/).
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, draco, simplifyPrimitive, textureCompress } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import draco3d from 'draco3dgltf'
import sharp from 'sharp'

const IN = 'public/modelos3d/personaje-fino-v5.glb'
const OUT = 'public/modelos3d/personaje-fino-v7.glb'
const FUELLE_RATIO = parseFloat(process.argv[2] || '0.42')  // tenía holgura visual a 0.5; 0.42 = un poco más.
const RIGIDO_RATIO = parseFloat(process.argv[3] || '0.4')   // partes rígidas no-skinneadas: más agresivo.
const QPOS = parseInt(process.argv[4] || '14')              // quantización posición Draco (14 = sin riesgo; 12 no rindió).
const TEX = parseInt(process.argv[5] || '384')              // redimensionar texturas 512→384 (invisible a cuerpo entero).

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

// Mallas usadas con skin (vía nodo) → protegidas.
const meshSkinned = new Set()
for (const n of root.listNodes()) if (n.getSkin() && n.getMesh()) meshSkinned.add(n.getMesh())

// 1) Quitar morphs 'Key 2' de acc_axe (Cube1.002 / Cube1.003) — sin usar.
let morphsQuitados = 0
for (const m of root.listMeshes()) {
  const names = m.getExtras()?.targetNames || []
  if (names.length === 1 && names[0] === 'Key 2') {
    for (const p of m.listPrimitives()) for (const t of p.listTargets()) { p.removeTarget(t); t.dispose(); morphsQuitados++ }
    m.setWeights([])
    const ex = { ...m.getExtras() }; delete ex.targetNames; m.setExtras(ex)
  }
}

// 2) Decimar SOLO no-skinneadas.
const decimadas = []
for (const m of root.listMeshes()) {
  if (meshSkinned.has(m)) continue
  const esFuelle = (m.getExtras()?.targetNames || []).includes('Cerrar')
  const ratio = esFuelle ? FUELLE_RATIO : RIGIDO_RATIO
  let antes = 0, despues = 0
  for (const p of m.listPrimitives()) {
    antes += (p.getIndices()?.getCount() || 0) / 3
    simplifyPrimitive(p, { simplifier: MeshoptSimplifier, ratio, error: esFuelle ? 0.001 : 0.01, lockBorder: true })
    despues += (p.getIndices()?.getCount() || 0) / 3
  }
  decimadas.push(`${m.getName()}: ${Math.round(antes)}→${Math.round(despues)}`)
}

await doc.transform(dedup(), prune())
await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [TEX, TEX], quality: 82 }))
await doc.transform(draco({ method: 'edgebreaker', quantizePosition: QPOS, quantizeNormal: 10, quantizeTexcoord: 12, quantizeGeneric: 12 }))
await io.write(OUT, doc)

console.log(JSON.stringify({
  trisAntes: Math.round(trisAntes), trisDespues: Math.round(tris()),
  morphsQuitados,
  skinIntacto: root.listSkins().map((s) => s.listJoints().length + ' joints'),
  anims: root.listAnimations().map((a) => a.getName()),
  morphsVivos: root.listMeshes().filter((m) => m.listPrimitives()[0]?.listTargets().length)
    .map((m) => `${m.getName()}: ${(m.getExtras()?.targetNames || []).join(',')}`),
  decimadas,
}, null, 2))
