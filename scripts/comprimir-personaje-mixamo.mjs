// Comprime un personaje mixamo exportado de Blender (raw ~58MB) para el visor web.
//  - NO decima nada: todas las mallas son skinneadas (simplify corrompe pesos = rasga ropa).
//  - Texturas → webp (diffuse 512, resto 512) — el grueso del peso son los PNG 4096.
//  - prune con keepLeaves: el nodo vacío 'AnclaAcordeon' es el ancla del acordeón compartido.
//  - Draco al final (el visor ya carga /draco/).
// Uso: node scripts/comprimir-personaje-mixamo.mjs <in.glb> <out.glb> [tex=512]
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, draco, textureCompress } from '@gltf-transform/functions'
import draco3d from 'draco3dgltf'
import sharp from 'sharp'
import fs from 'node:fs'

const IN = process.argv[2]
const OUT = process.argv[3]
const TEX = parseInt(process.argv[4] || '512')

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})

const doc = await io.read(IN)
const root = doc.getRoot()

await doc.transform(dedup(), prune({ keepLeaves: true }))
await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [TEX, TEX], quality: 82 }))
await doc.transform(draco({ method: 'edgebreaker', quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12, quantizeGeneric: 12 }))
await io.write(OUT, doc)

console.log(JSON.stringify({
  in: IN, out: OUT,
  mb: +(fs.statSync(OUT).size / 1e6).toFixed(2),
  anims: root.listAnimations().map((a) => a.getName()),
  skins: root.listSkins().map((s) => s.listJoints().length + ' joints'),
  ancla: root.listNodes().some((n) => n.getName() === 'AnclaAcordeon'),
  nodos: root.listNodes().length,
  texturas: root.listTextures().map((t) => `${t.getName() || '?'} ${(t.getImage().byteLength / 1024).toFixed(0)}KB`),
}, null, 2))
