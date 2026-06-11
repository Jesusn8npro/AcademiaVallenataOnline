import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})
const doc = await io.read(process.argv[2])
const root = doc.getRoot()
let base=0, morph=0, skin=0, anim=0
const morphByMesh={}
for (const m of root.listMeshes()) {
  for (const p of m.listPrimitives()) {
    for (const [sem,a] of Object.entries({POSITION:p.getAttribute('POSITION'),NORMAL:p.getAttribute('NORMAL'),TEXCOORD_0:p.getAttribute('TEXCOORD_0'),TANGENT:p.getAttribute('TANGENT')})) {
      if(a) base += a.getArray().byteLength
    }
    const j=p.getAttribute('JOINTS_0'), w=p.getAttribute('WEIGHTS_0')
    if(j) skin+=j.getArray().byteLength; if(w) skin+=w.getArray().byteLength
    const idx=p.getIndices(); if(idx) base+=idx.getArray().byteLength
    for (const t of p.listTargets()) for (const a of t.listAttributes()) {
      morph += a.getArray().byteLength
      morphByMesh[m.getName()]=(morphByMesh[m.getName()]||0)+a.getArray().byteLength
    }
  }
}
for (const an of root.listAnimations()) for (const ch of an.listChannels()){
  const s=ch.getSampler(); if(s){anim+=(s.getInput()?.getArray().byteLength||0)+(s.getOutput()?.getArray().byteLength||0)}
}
const MB=x=>+(x/1048576).toFixed(2)
console.log(JSON.stringify({base_geom_MB:MB(base), morph_MB:MB(morph), skin_MB:MB(skin), anim_MB:MB(anim),
  morphPorMesh:Object.fromEntries(Object.entries(morphByMesh).map(([k,v])=>[k,MB(v)]))},null,2))
