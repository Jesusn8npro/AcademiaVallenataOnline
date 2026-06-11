import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'
import sharp from 'sharp'
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})
const doc = await io.read(process.argv[2]); const root = doc.getRoot()
const rows=[]
for (const t of root.listTextures()) {
  const img=t.getImage(); let dim='?'
  try{ const m=await sharp(Buffer.from(img)).metadata(); dim=`${m.width}x${m.height}`}catch(e){}
  rows.push({name:t.getName(), kb:+(img.byteLength/1024).toFixed(0), dim})
}
rows.sort((a,b)=>b.kb-a.kb)
for(const r of rows.slice(0,15)) console.log(`${String(r.kb).padStart(4)}KB ${r.dim.padEnd(10)} ${r.name}`)
console.log('total KB:', rows.reduce((a,r)=>a+r.kb,0))
