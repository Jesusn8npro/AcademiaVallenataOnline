// Comprime un escenario .glb (estático, sin animación) para el Mundo 3D:
//  - weld + dedup + prune: limpia geometría y datos repetidos.
//  - textureCompress: redimensiona texturas grandes y las pasa a WebP (mucho más livianas).
//  - Draco: comprime la geometría (el loader del mundo decodifica Draco vía /draco/).
// Uso: node scripts/comprimir-escenario.mjs <in.glb> <out.glb> [maxTex=2048]
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from '@gltf-transform/extensions'
import { weld, dedup, prune, textureCompress } from '@gltf-transform/functions'
import draco3d from 'draco3dgltf'
import sharp from 'sharp'
import fs from 'node:fs'

const IN = process.argv[2]
const OUT = process.argv[3]
const MAXTEX = +(process.argv[4] || 2048)

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})

const doc = await io.read(IN)
const root = doc.getRoot()
const trisAntes = root.listMeshes().reduce((n, m) => n + m.listPrimitives().reduce((a, p) => a + (p.getIndices()?.getCount() || 0) / 3, 0), 0)

await doc.transform(
  dedup(),
  weld(),
  prune({ keepLeaves: false }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [MAXTEX, MAXTEX] }),
)

doc.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({
  method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
  encodeSpeed: 5,
  decodeSpeed: 5,
})

await io.write(OUT, doc)

console.log(JSON.stringify({
  in: IN,
  out: OUT,
  mb_in: +(fs.statSync(IN).size / 1e6).toFixed(2),
  mb_out: +(fs.statSync(OUT).size / 1e6).toFixed(2),
  tris: Math.round(trisAntes),
  texturas: root.listTextures().length,
  maxTex: MAXTEX,
}, null, 2))
