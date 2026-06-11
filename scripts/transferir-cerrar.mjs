// Cierre del fuelle COORDINADO y FIEL al original. El morph 'Cerrar' del personaje viejo
// (personaje-acordeon.glb) movía TODO junto —cuerpo/manos, las dos cajas, botones, parrilla y
// fuelle— de forma realista (manos pegadas a sus cajas, fuelle parejo). El GLB optimizado solo
// lo conservaba en el fuelle, por eso las cajas y manos se despegaban al cerrar.
// Aquí se transfiere ese campo de cierre COMPLETO al GLB nuevo por vecino más cercano,
// PRESERVANDO los demás morphs existentes (p.ej. los dedos del cuerpo). Las mallas que no se
// mueven (jeans, zapatos, pelo, ojos) quedan sin morph.
// Arregla además: correa vieja, transparencia de botones, nombres en español (Boton_D/I se mantienen).
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
const CELL = 0.012, key=(x,y,z)=>`${Math.floor(x/CELL)},${Math.floor(y/CELL)},${Math.floor(z/CELL)}`
const S = 1 // 1.0 = cierre EXACTO del original (coordinado: manos y cajas pegadas, sin volteo).

// ===== Nube GLOBAL del personaje VIEJO (world pos + world delta de 'Cerrar', TODAS las mallas) =====
const viejo = await io.read('public/modelos3d/personaje-acordeon.glb')
const P=[],D=[]
for (const node of viejo.getRoot().listNodes()) {
  const mesh=node.getMesh(); if(!mesh) continue
  const ci=(mesh.getExtras()?.targetNames||[]).indexOf('Cerrar'); if(ci<0) continue
  const wm=node.getWorldMatrix(),wm3=m3(wm)
  for(const prim of mesh.listPrimitives()){const pos=prim.getAttribute('POSITION'),tg=prim.listTargets()[ci]?.getAttribute('POSITION');if(!tg)continue
    const a=[0,0,0],d=[0,0,0]
    for(let i=0;i<pos.getCount();i++){pos.getElement(i,a);tg.getElement(i,d);const wp=tpoint(wm,a),wd=tvec3(wm3,d);P.push(wp[0],wp[1],wp[2]);D.push(wd[0],wd[1],wd[2])}}
}
const Nv=P.length/3, grid=new Map()
for(let i=0;i<Nv;i++){const k=key(P[i*3],P[i*3+1],P[i*3+2]);let ar=grid.get(k);if(!ar)grid.set(k,ar=[]);ar.push(i)}
function nearest(x,y,z,R=3){let best=-1,bd=Infinity;const cx=Math.floor(x/CELL),cy=Math.floor(y/CELL),cz=Math.floor(z/CELL);
  for(let dx=-R;dx<=R;dx++)for(let dy=-R;dy<=R;dy++)for(let dz=-R;dz<=R;dz++){const ar=grid.get(`${cx+dx},${cy+dy},${cz+dz}`);if(!ar)continue;
    for(const i of ar){const ax=P[i*3]-x,ay=P[i*3+1]-y,az=P[i*3+2]-z,e=ax*ax+ay*ay+az*az;if(e<bd){bd=e;best=i}}}
  return best}
console.log('Nube de cierre del viejo (global):', Nv, 'puntos')

// ===== GLB nuevo: transferir el cierre coordinado a TODAS las mallas que se mueven =====
const doc = await io.read('public/modelos3d/personaje-2026.glb')
const root = doc.getRoot()
const buffer = root.listBuffers()[0]
let nMallas=0
for (const node of root.listNodes()) {
  const mesh=node.getMesh(); if(!mesh) continue
  const wm=node.getWorldMatrix(), inv=inv3(m3(wm))
  // Quitar SOLO un 'Cerrar' previo, preservando los demás morphs (dedos, etc.)
  const names=[...(mesh.getExtras()?.targetNames||[])]
  const prev=names.indexOf('Cerrar')
  if(prev>=0){ for(const prim of mesh.listPrimitives()){const t=prim.listTargets()[prev];if(t){prim.removeTarget(t);t.dispose()}} names.splice(prev,1) }
  // Delta de cierre por vértice (vecino más cercano) para cada primitiva
  const primDeltas=[]; let meshMax=0
  for(const prim of mesh.listPrimitives()){
    const pos=prim.getAttribute('POSITION'); const n=pos.getCount()
    const deltas=new Float32Array(n*3); const a=[0,0,0]
    for(let i=0;i<n;i++){pos.getElement(i,a);const wp=tpoint(wm,a);const b=nearest(wp[0],wp[1],wp[2]);if(b<0)continue;
      const ld=tvec3(inv,[D[b*3]*S,D[b*3+1]*S,D[b*3+2]*S]);
      deltas[i*3]=ld[0];deltas[i*3+1]=ld[1];deltas[i*3+2]=ld[2];
      const mm=ld[0]*ld[0]+ld[1]*ld[1]+ld[2]*ld[2]; if(mm>meshMax)meshMax=mm}
    primDeltas.push(deltas)
  }
  if(meshMax < 1e-8){ // malla que no se mueve → sin morph 'Cerrar'
    if(prev>=0) mesh.setExtras({...(mesh.getExtras()||{}),targetNames:names})
    continue
  }
  // Añadir 'Cerrar' a TODAS las primitivas (mismo nº de targets en cada una)
  mesh.listPrimitives().forEach((prim,pi)=>{
    const acc=doc.createAccessor().setType('VEC3').setArray(primDeltas[pi]).setBuffer(buffer)
    prim.addTarget(doc.createPrimitiveTarget('Cerrar').setAttribute('POSITION',acc))
  })
  names.push('Cerrar')
  mesh.setExtras({...(mesh.getExtras()||{}),targetNames:names})
  mesh.setWeights(names.map(()=>0))
  nMallas++
}
console.log('Mallas con cierre coordinado:', nMallas)

// ===== Arreglos =====
for (const node of root.listNodes()) if (/^metal_correa/i.test(node.getName())) { const m=node.getMesh(); node.dispose(); if(m)m.dispose() }
for (const mat of root.listMaterials()) if (/^botones/i.test(mat.getName())) { mat.setAlphaMode('OPAQUE'); const c=mat.getBaseColorFactor(); mat.setBaseColorFactor([c[0],c[1],c[2],1]) }
const RENAME = {
  'fuelle':'fuelle','Marco fuelle 1':'marco_fuelle_melodia','Marco de fuelle bajos 2':'marco_fuelle_bajos',
  'Caja de los bajos, izquierda':'caja_bajos','Caja de parrilla, derecha':'caja_parrilla','cuerpo':'caja_acordeon',
  'Diapason Acrden':'diapason','parrilla':'parrilla','borde_parrilla':'borde_parrilla','rejilla':'rejilla',
  'Bases para parar el acordeon.':'base_acordeon','Botono broche bajos':'broche_boton_bajos',
  'Broche Superior':'broche_superior','Broche Inferior':'broche_inferior','tornillos_parrilla':'tornillo_parrilla',
  'Pin 1 traseroo':'pin_trasero_1','Pin 2 trasero':'pin_trasero_2','Pin 1':'pin_1','Pin 2':'pin_2',
  'cuerpo1_1':'correa_1','cuerpo1_2':'correa_2','Forma cabeza':'cuerpo','Pelo':'pelo','Camiza Larga':'camisa',
  'Jean':'pantalon','Zapatos':'zapatos','Base ojos forma':'lagrimal','Base ojos':'ojos','Forma del ojo':'oclusion_ojo',
  'Pestañas':'pestanas','Forma boca labio derecho':'lengua','Forma boca':'dientes',
}
const usados=new Map()
for (const node of root.listNodes()) { if(!node.getMesh())continue; const nm=node.getName(); if(/^Boton_[DI]_\d+/i.test(nm))continue
  const base=nm.replace(/\.\d+$/,''); let nuevo=RENAME[base]||RENAME[Object.keys(RENAME).find(k=>base.startsWith(k))]||base
  const c=(usados.get(nuevo)||0)+1; usados.set(nuevo,c); if(c>1)nuevo=nuevo+'_'+c; node.setName(nuevo); node.getMesh().setName(nuevo) }

await doc.transform(prune())
await io.write('public/modelos3d/personaje-2026.glb', doc)
console.log('Escrito (cierre coordinado: manos y cajas pegadas al fuelle).')
