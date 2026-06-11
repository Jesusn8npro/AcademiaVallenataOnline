import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})
const doc = await io.read(process.argv[2])
const root = doc.getRoot()
const targets = ['Boton_I_01','Caja botones principales','Caja izquierda','marco Fuelle 2','Fuelle','Diapason']
const out=[]
for (const node of root.listNodes()) {
  const mesh=node.getMesh(); if(!mesh)continue
  const nm=node.getName()
  if(!targets.some(t=>nm.includes(t)))continue
  const prim=mesh.listPrimitives()[0]
  const names=mesh.getExtras()?.targetNames||[]
  const ci=names.indexOf('Cerr_uniforme'); if(ci<0)continue
  const tgt=prim.listTargets()[ci]
  const pos=tgt?.getAttribute('POSITION'); if(!pos)continue
  const n=pos.getCount();let sx=0,sy=0,sz=0;const a=[0,0,0];const all=[]
  for(let i=0;i<n;i++){pos.getElement(i,a);sx+=a[0];sy+=a[1];sz+=a[2];all.push([...a])}
  const mean=[sx/n,sy/n,sz/n]
  let varSum=0;for(const m of all)varSum+=(m[0]-mean[0])**2+(m[1]-mean[1])**2+(m[2]-mean[2])**2
  const std=Math.sqrt(varSum/n)
  out.push({node:nm,verts:n,meanMag:+Math.hypot(...mean).toFixed(4),stdDev:+std.toFixed(4),tipo:std<Math.hypot(...mean)*0.15?'RIGIDO':'DEFORMA'})
}
console.log(JSON.stringify(out,null,2))
