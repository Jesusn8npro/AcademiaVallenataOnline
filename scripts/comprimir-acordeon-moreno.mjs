// Optimiza el acordeon moreno (.007) para web. El export ya redujo Subsurf (aros ~270t) y el fuelle
// es liviano (2134t) → NO se decima nada (decimar el fuelle/aros con simplify+lockBorder COLAPSA los
// pliegues y deforma el morph 'Cerrar'). Solo: dedup + prune + texturas webp 1024 + draco.
// Uso: node scripts/comprimir-acordeon-moreno.mjs <in.glb> <out.glb>
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, draco, textureCompress } from '@gltf-transform/functions'
import draco3d from 'draco3dgltf'
import sharp from 'sharp'
import fs from 'node:fs'

const IN = process.argv[2], OUT = process.argv[3]
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})
const doc = await io.read(IN)
const root = doc.getRoot()
const tris = () => root.listMeshes().reduce((a, m) => a + m.listPrimitives().reduce((b, p) => b + (p.getIndices()?.getCount() || 0) / 3, 0), 0)
const trisAntes = tris()

await doc.transform(dedup(), prune({ keepLeaves: true }))
await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 82 }))
await doc.transform(draco({ method: 'edgebreaker', quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12, quantizeGeneric: 12 }))
await io.write(OUT, doc)

console.log(JSON.stringify({
  out: OUT, mb: +(fs.statSync(OUT).size / 1e6).toFixed(2),
  tris: Math.round(tris()), trisAntes: Math.round(trisAntes),
  parrilla: root.listNodes().some((n) => n.getName() === 'parrilla'),
  caja: root.listMeshes().some((m) => /Caja de los bajos/.test(m.getName() || '')),
  morphMeshes: root.listMeshes().filter((m) => (m.getExtras()?.targetNames || []).includes('Cerrar')).length,
}, null, 2))
