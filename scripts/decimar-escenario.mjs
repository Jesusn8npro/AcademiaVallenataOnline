// Decima (reduce triángulos) un escenario .glb del Mundo 3D SIN tocar Blender.
// Lee el .glb (aunque venga en Draco), suelda vértices, simplifica con meshoptimizer
// (preserva nombres de nodo → siguen valiendo las puertas Cube008/009 y los sofás por coords),
// limpia y re-escribe en Draco. Las texturas NO se tocan (ya están en WebP optimizado).
// Uso: node scripts/decimar-escenario.mjs <in.glb> <out.glb> [ratio=0.35] [error=0.005]
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from '@gltf-transform/extensions'
import { weld, dedup, prune, simplify } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import draco3d from 'draco3dgltf'
import fs from 'node:fs'

const IN = process.argv[2]
const OUT = process.argv[3]
const RATIO = +(process.argv[4] || 0.35) // fracción de triángulos objetivo (0.35 = quedarte con ~35%)
const ERROR = +(process.argv[5] || 0.005) // error máx. relativo al tamaño de la malla (tope de distorsión)

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})

await MeshoptSimplifier.ready
const doc = await io.read(IN)
const root = doc.getRoot()
const contar = () => root.listMeshes().reduce((n, m) => n + m.listPrimitives().reduce((a, p) => a + (p.getIndices()?.getCount() || 0) / 3, 0), 0)
const trisAntes = contar()

await doc.transform(
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: ERROR }),
  dedup(),
  prune({ keepLeaves: false }),
)

doc.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({
  method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
  encodeSpeed: 5,
  decodeSpeed: 5,
})

await io.write(OUT, doc)
const trisDespues = contar()

console.log(JSON.stringify({
  in: IN,
  out: OUT,
  mb_in: +(fs.statSync(IN).size / 1e6).toFixed(2),
  mb_out: +(fs.statSync(OUT).size / 1e6).toFixed(2),
  tris_antes: Math.round(trisAntes),
  tris_despues: Math.round(trisDespues),
  reduccion_pct: Math.round((1 - trisDespues / trisAntes) * 100),
  ratio: RATIO,
  error: ERROR,
}, null, 2))
