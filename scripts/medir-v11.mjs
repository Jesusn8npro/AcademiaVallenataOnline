// Mide el morph 'Cerrar' en v11: traslado de la caja de bajos, rango del fuelle,
// y si el cierre (influencia=1) colapsa de verdad el ancho del fuelle.
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'
import { MeshoptDecoder } from 'meshoptimizer'
await MeshoptDecoder.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'meshopt.decoder': MeshoptDecoder,
})
const m3 = (m) => [m[0],m[1],m[2],m[4],m[5],m[6],m[8],m[9],m[10]]
const tpoint = (m,p) => [m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12], m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13], m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]]
const tvec3 = (a,v) => [a[0]*v[0]+a[3]*v[1]+a[6]*v[2], a[1]*v[0]+a[4]*v[1]+a[7]*v[2], a[2]*v[0]+a[5]*v[1]+a[8]*v[2]]

const doc = await io.read('public/modelos3d/personaje-2026-v11.glb')
const root = doc.getRoot()

// Bounding box mundial de TODO (referencia de tamaño).
let gminx=1e9,gmaxx=-1e9
for (const node of root.listNodes()) {
  const mesh=node.getMesh(); if(!mesh) continue
  const wm=node.getWorldMatrix(), a=[0,0,0]
  for(const prim of mesh.listPrimitives()){const pos=prim.getAttribute('POSITION')
    for(let i=0;i<pos.getCount();i++){pos.getElement(i,a);const w=tpoint(wm,a);if(w[0]<gminx)gminx=w[0];if(w[0]>gmaxx)gmaxx=w[0]}}
}
console.log('Ancho mundial total X:', (gmaxx-gminx).toFixed(3))

for (const node of root.listNodes()) {
  const mesh=node.getMesh(); if(!mesh) continue
  const names=mesh.getExtras()?.targetNames||[]
  const ci=names.indexOf('Cerrar'); if(ci<0) continue
  const mat=mesh.listPrimitives()[0]?.getMaterial()?.getName()||''
  // Interesan: caja bajos (acc_cuerpo), fuelle (acc_fuelle), marcos (acc_pack)
  if(!/acc_cuerpo|acc_fuelle|acc_pack/.test(mat)) continue
  const wm=node.getWorldMatrix(), wm3=m3(wm)
  let sx=0,sy=0,sz=0,n=0
  let xmin=1e9,xmax=-1e9            // extent base en X (mundo)
  let cxmin=1e9,cxmax=-1e9          // extent tras cierre (base + delta) en X (mundo)
  const a=[0,0,0],d=[0,0,0]
  for(const prim of mesh.listPrimitives()){
    const pos=prim.getAttribute('POSITION'), tg=prim.listTargets()[ci]?.getAttribute('POSITION'); if(!tg) continue
    for(let i=0;i<pos.getCount();i++){
      pos.getElement(i,a); tg.getElement(i,d)
      const wd=tvec3(wm3,d); sx+=wd[0];sy+=wd[1];sz+=wd[2];n++
      const wp=tpoint(wm,a)
      if(wp[0]<xmin)xmin=wp[0]; if(wp[0]>xmax)xmax=wp[0]
      const cw=wp[0]+wd[0]
      if(cw<cxmin)cxmin=cw; if(cw>cxmax)cxmax=cw
    }
  }
  if(!n) continue
  console.log(JSON.stringify({
    node:node.getName(), mat, verts:n,
    meanDeltaWorld:[+(sx/n).toFixed(4),+(sy/n).toFixed(4),+(sz/n).toFixed(4)],
    anchoX_base:+(xmax-xmin).toFixed(3),
    anchoX_cerrado:+(cxmax-cxmin).toFixed(3),
    reduccionX:+(((xmax-xmin)-(cxmax-cxmin)).toFixed(3)),
  }))
}
