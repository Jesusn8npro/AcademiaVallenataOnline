// Extrae las imágenes de un GLB a archivos para inspección visual.
// Uso: node scripts/extraer-texturas.mjs <ruta.glb> <carpeta-salida>
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'
import fs from 'node:fs'
import path from 'node:path'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
})
const doc = await io.read(process.argv[2])
const out = process.argv[3]
fs.mkdirSync(out, { recursive: true })
for (const t of doc.getRoot().listTextures()) {
  const ext = t.getMimeType() === 'image/webp' ? 'webp' : 'png'
  const p = path.join(out, `${(t.getName() || 'sin-nombre').replace(/[^\w-]/g, '_')}.${ext}`)
  fs.writeFileSync(p, Buffer.from(t.getImage()))
  console.log(p, Math.round(t.getImage().byteLength / 1024) + 'KB')
}
