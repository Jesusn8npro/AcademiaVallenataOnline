import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})
const doc = await io.read(process.argv[2])
const root = doc.getRoot()
// nodo->skin: una malla puede instanciarse por un nodo con skin
const meshSkinned = new Set()
for (const n of root.listNodes()) if (n.getSkin() && n.getMesh()) meshSkinned.add(n.getMesh())
const rows=[]
for (const m of root.listMeshes()){
  let tris=0; for(const p of m.listPrimitives()) tris+=(p.getIndices()?.getCount()||0)/3
  const morph=(m.getExtras()?.targetNames||[]).join(',')
  const mat=m.listPrimitives()[0]?.getMaterial()?.getName()||''
  rows.push({mesh:m.getName(),tris:Math.round(tris),skin:meshSkinned.has(m),morph,mat})
}
rows.sort((a,b)=>b.tris-a.tris)
for(const r of rows.slice(0,20)) console.log(`${String(r.tris).padStart(7)}  skin=${r.skin?'SI':'no'}  ${r.mat.padEnd(16)} ${r.mesh}${r.morph?'  morph:'+r.morph:''}`)
console.log('--- total mallas:', rows.length, 'skinneadas:', rows.filter(r=>r.skin).length)
console.log('--- tris skinneadas:', rows.filter(r=>r.skin).reduce((a,r)=>a+r.tris,0), '| no-skin:', rows.filter(r=>!r.skin).reduce((a,r)=>a+r.tris,0))
