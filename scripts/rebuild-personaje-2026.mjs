// Reconstruye el GLB del personaje desde TU export de Blender (personaje-blender-actual.glb):
//  1) Renombra materiales del acordeón a acc_*.
//  2) Transfiere el cierre 'Cerrar' del modelo original (personaje-acordeon-opt.glb) usando su
//     movimiento NATURAL (sin escalar ni anclar), para que mano + caja + botones + correa queden
//     PEGADOS. Clasificación por dirección: lo que en el original se mueve hacia el lado BAJOS
//     (delta·Db > 0) se anima; el lado PITOS queda FIJO.
//       - Cajas/botones/marcos/pines/tornillos/parrilla → traslación RÍGIDA (no deforman).
//       - Fuelle y correas → por VÉRTICE (se pliegan / siguen la caja por cercanía).
//       - Cuerpo (skinned): solo la mano del lado bajos (X local > 0), movimiento natural.
//  3) Botones opacos.
// Salida: personaje-rebuild-tmp.glb. Uso: node scripts/rebuild-personaje-2026.mjs
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { prune } from '@gltf-transform/functions'
import draco3d from 'draco3dgltf'
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer'

await MeshoptDecoder.ready
await MeshoptEncoder.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'meshopt.decoder': MeshoptDecoder,
  'meshopt.encoder': MeshoptEncoder,
})
const m3 = (m) => [m[0],m[1],m[2],m[4],m[5],m[6],m[8],m[9],m[10]]
const tpoint = (m,p) => [m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12], m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13], m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]]
const tvec3 = (a,v) => [a[0]*v[0]+a[3]*v[1]+a[6]*v[2], a[1]*v[0]+a[4]*v[1]+a[7]*v[2], a[2]*v[0]+a[5]*v[1]+a[8]*v[2]]
function inv3(a){const[a0,a1,a2,a3,a4,a5,a6,a7,a8]=a;const det=a0*(a4*a8-a5*a7)-a3*(a1*a8-a2*a7)+a6*(a1*a5-a2*a4);const id=1/det;
  return[(a4*a8-a5*a7)*id,(a2*a7-a1*a8)*id,(a1*a5-a2*a4)*id,(a5*a6-a3*a8)*id,(a0*a8-a2*a6)*id,(a2*a3-a0*a5)*id,(a3*a7-a4*a6)*id,(a1*a6-a0*a7)*id,(a0*a4-a1*a3)*id]}
const median = (arr) => { const s=[...arr].sort((a,b)=>a-b); const m=s.length>>1; return s.length%2?s[m]:(s[m-1]+s[m])/2 }
const CELL = 0.012, key=(x,y,z)=>`${Math.floor(x/CELL)},${Math.floor(y/CELL)},${Math.floor(z/CELL)}`
const ES_PERSONAJE = (mat) => /Std_|Fit_shirts|Slim_Jeans|Sport_sneakers|Hair|Scalp|Female_Angled|CC_Base/i.test(mat||'')
const kCierre = 1.4 // cuánto cierra el acordeón (1.0 = natural del original). Subir = cierra más.

function buildGrid(P){ const g=new Map(),N=P.length/3; for(let i=0;i<N;i++){const k=key(P[i*3],P[i*3+1],P[i*3+2]);let a=g.get(k);if(!a)g.set(k,a=[]);a.push(i)} return g }
function nearestIn(grid,P,x,y,z,R=3){let best=-1,bd=Infinity;const cx=Math.floor(x/CELL),cy=Math.floor(y/CELL),cz=Math.floor(z/CELL)
  for(let dx=-R;dx<=R;dx++)for(let dy=-R;dy<=R;dy++)for(let dz=-R;dz<=R;dz++){const a=grid.get(`${cx+dx},${cy+dy},${cz+dz}`);if(!a)continue
    for(const i of a){const ax=P[i*3]-x,ay=P[i*3+1]-y,az=P[i*3+2]-z,e=ax*ax+ay*ay+az*az;if(e<bd){bd=e;best=i}}}
  return best}

// ===== Nubes del OPT: personaje (local) y acordeón (mundo) =====
const opt = await io.read('public/modelos3d/personaje-acordeon-opt.glb')
const Pp=[],Dp=[], Pa=[],Da=[]
for (const node of opt.getRoot().listNodes()) {
  const mesh=node.getMesh(); if(!mesh) continue
  const ci=(mesh.getExtras()?.targetNames||[]).indexOf('Cerrar'); if(ci<0) continue
  const wm=node.getWorldMatrix(), wm3=m3(wm)
  for(const prim of mesh.listPrimitives()){
    const mat=prim.getMaterial()?.getName()||''
    const pos=prim.getAttribute('POSITION'), tg=prim.listTargets()[ci]?.getAttribute('POSITION'); if(!tg) continue
    const a=[0,0,0], d=[0,0,0]; const persona=ES_PERSONAJE(mat)
    for(let i=0;i<pos.getCount();i++){
      pos.getElement(i,a); tg.getElement(i,d)
      if(persona){ Pp.push(a[0],a[1],a[2]); Dp.push(d[0],d[1],d[2]) }
      else { const wp=tpoint(wm,a), wd=tvec3(wm3,d); Pa.push(wp[0],wp[1],wp[2]); Da.push(wd[0],wd[1],wd[2]) }
    }
  }
}
const gridP=buildGrid(Pp), gridA=buildGrid(Pa)
console.log('Nube OPT — personaje(local):', Pp.length/3, '| acordeon(mundo):', Pa.length/3)

// ===== Tu export =====
const doc = await io.read('public/modelos3d/personaje-blender-actual.glb')
const root = doc.getRoot()
const buffer = root.listBuffers()[0]

// Renombrar materiales del acordeón a acc_*
const MAP = { 'fuelle':'acc_fuelle','pack':'acc_pack','cuerpo':'acc_cuerpo','botones':'acc_botones','parte botones':'acc_parte botones' }
let renombrados=0
for (const mat of root.listMaterials()) { const base=mat.getName().replace(/\.\d+$/,''); if(MAP[base]){mat.setName(MAP[base]);renombrados++} }
console.log('Materiales renombrados a acc_*:', renombrados)

// Db = movimiento (mundo) de la caja de los BAJOS. Lado bajos = delta·Db > 0.
let Db=[0,0,0]
{
  const bajos = root.listNodes().find(n => n.getMesh() && /Caja de los bajos/i.test(n.getName()))
  if (bajos) { const wm=bajos.getWorldMatrix(); const mx=[],my=[],mz=[]; const a=[0,0,0]
    for(const prim of bajos.getMesh().listPrimitives()){const pos=prim.getAttribute('POSITION')
      for(let i=0;i<pos.getCount();i++){pos.getElement(i,a);const wp=tpoint(wm,a);const b=nearestIn(gridA,Pa,wp[0],wp[1],wp[2],4);if(b<0)continue;mx.push(Da[b*3]);my.push(Da[b*3+1]);mz.push(Da[b*3+2])}}
    if(mx.length) Db=[median(mx),median(my),median(mz)] }
}
const dotDb = (x,y,z)=> x*Db[0]+y*Db[1]+z*Db[2]
console.log('Caja bajos Db:', Db.map(v=>+v.toFixed(4)))

// ===== Transferir cierre =====
let nMallas=0
for (const node of root.listNodes()) {
  const mesh=node.getMesh(); if(!mesh) continue
  const wm=node.getWorldMatrix(), inv=inv3(m3(wm))
  for(const prim of mesh.listPrimitives()) for(const t of prim.listTargets()){prim.removeTarget(t);t.dispose()}
  const mat0 = mesh.listPrimitives()[0]?.getMaterial()?.getName()||''
  const persona = ES_PERSONAJE(mat0)
  const esFuelle = mat0 === 'acc_fuelle'
  const esCorrea = /correa/i.test(mat0)
  // CORREAS = rígidas (bloque con la caja → pegadas). CUERPO/manos = FIJO (no se deforma; el brazo
  // queda en su pose inicial). Solo el acordeón cierra, escalado por kCierre para cerrar un poco más.
  const rigido = !persona && !esFuelle
  if (persona) { mesh.setExtras({...(mesh.getExtras()||{}),targetNames:[]}); mesh.setWeights([]); continue }
  const primDeltas=[]; let meshMax=0

  if (rigido) {
    // Traslación rígida; solo si la malla pertenece al lado BAJOS (mediana·Db > 0).
    const mx=[],my=[],mz=[]; const a=[0,0,0]
    for(const prim of mesh.listPrimitives()){const pos=prim.getAttribute('POSITION')
      for(let i=0;i<pos.getCount();i++){pos.getElement(i,a);const wp=tpoint(wm,a);const b=nearestIn(gridA,Pa,wp[0],wp[1],wp[2],4);if(b<0)continue;mx.push(Da[b*3]);my.push(Da[b*3+1]);mz.push(Da[b*3+2])}}
    let ld=[0,0,0]
    if(mx.length){ const dm=[median(mx),median(my),median(mz)]; if(dotDb(dm[0],dm[1],dm[2])>0){ ld=tvec3(inv,[dm[0]*kCierre,dm[1]*kCierre,dm[2]*kCierre]); meshMax=ld[0]*ld[0]+ld[1]*ld[1]+ld[2]*ld[2] } }
    for(const prim of mesh.listPrimitives()){const n=prim.getAttribute('POSITION').getCount();const d=new Float32Array(n*3)
      for(let i=0;i<n;i++){d[i*3]=ld[0];d[i*3+1]=ld[1];d[i*3+2]=ld[2]} primDeltas.push(d)}
  } else {
    // Fuelle: por vértice; solo el lado BAJOS (delta·Db > 0) se pliega, escalado por kCierre.
    for(const prim of mesh.listPrimitives()){
      const pos=prim.getAttribute('POSITION'); const n=pos.getCount(); const deltas=new Float32Array(n*3); const a=[0,0,0]
      for(let i=0;i<n;i++){ pos.getElement(i,a); const wp=tpoint(wm,a); const b=nearestIn(gridA,Pa,wp[0],wp[1],wp[2]); if(b<0) continue
        const dW=[Da[b*3],Da[b*3+1],Da[b*3+2]]; if(dotDb(dW[0],dW[1],dW[2])<=0) continue
        const ld=tvec3(inv,[dW[0]*kCierre,dW[1]*kCierre,dW[2]*kCierre]); deltas[i*3]=ld[0];deltas[i*3+1]=ld[1];deltas[i*3+2]=ld[2]
        const mm=ld[0]*ld[0]+ld[1]*ld[1]+ld[2]*ld[2]; if(mm>meshMax)meshMax=mm }
      primDeltas.push(deltas)
    }
  }

  if(meshMax < 1e-8){ mesh.setExtras({...(mesh.getExtras()||{}),targetNames:[]}); mesh.setWeights([]); continue }
  mesh.listPrimitives().forEach((prim,pi)=>{
    const acc=doc.createAccessor().setType('VEC3').setArray(primDeltas[pi]).setBuffer(buffer)
    prim.addTarget(doc.createPrimitiveTarget('Cerrar').setAttribute('POSITION',acc))
  })
  mesh.setExtras({...(mesh.getExtras()||{}),targetNames:['Cerrar']}); mesh.setWeights([0]); nMallas++
}
console.log('Mallas con cierre:', nMallas)

// Botones opacos
for (const mat of root.listMaterials()) if (/acc_botones|^botones/i.test(mat.getName())) {
  mat.setAlphaMode('OPAQUE'); const c=mat.getBaseColorFactor(); mat.setBaseColorFactor([c[0],c[1],c[2],1])
}

await doc.transform(prune())
await io.write('public/modelos3d/personaje-rebuild-tmp.glb', doc)
console.log('Escrito personaje-rebuild-tmp.glb')
