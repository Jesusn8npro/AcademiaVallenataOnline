import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})
const doc = await io.read('./public/modelos3d/personaje-acordeon.glb')
const root = doc.getRoot()
for (const node of root.listNodes()) {
  const mesh=node.getMesh(); if(!mesh)continue
  const prim=mesh.listPrimitives()[0]
  const matN=prim.getMaterial()?.getName()||''
  if(!/fuelle/i.test(matN))continue   // malla del fuelle
  const names=mesh.getExtras()?.targetNames||[]
  const ci=names.indexOf('Cerrar'); if(ci<0)continue
  const tgt=prim.listTargets()[ci]
  const pos=tgt?.getAttribute('POSITION'); if(!pos)continue
  const basePos=prim.getAttribute('POSITION')
  const n=pos.getCount();const a=[0,0,0],b=[0,0,0]
  let sx=0,sy=0,sz=0
  let bminx=1e9,bmaxx=-1e9
  const all=[]
  for(let i=0;i<n;i++){pos.getElement(i,a);sx+=a[0];sy+=a[1];sz+=a[2];all.push([...a]);basePos.getElement(i,b);bminx=Math.min(bminx,b[0]);bmaxx=Math.max(bmaxx,b[0])}
  const mean=[sx/n,sy/n,sz/n]
  let varSum=0;for(const m of all)varSum+=(m[0]-mean[0])**2+(m[1]-mean[1])**2+(m[2]-mean[2])**2
  const std=Math.sqrt(varSum/n)
  // correlación delta.x vs base.x (¿gradiente lineal?)
  let cov=0,vbx=0;const bmean=(bminx+bmaxx)/2
  for(let i=0;i<n;i++){basePos.getElement(i,b);cov+=(b[0]-bmean)*(all[i][0]-mean[0]);vbx+=(b[0]-bmean)**2}
  const slope=cov/vbx
  console.log(JSON.stringify({node:node.getName(),mat:matN,verts:n,meanDelta:mean.map(v=>+v.toFixed(4)),stdDev:+std.toFixed(4),tipo:std<Math.hypot(...mean)*0.15?'RIGIDO':'DEFORMA/GRADIENTE',baseX:[+bminx.toFixed(3),+bmaxx.toFixed(3)],slope_dxVSx:+slope.toFixed(3)},null,2))
}
