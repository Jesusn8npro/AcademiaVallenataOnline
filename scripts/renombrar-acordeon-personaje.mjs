// Renombra las mallas del acordeón del PERSONAJE (acordeon-personaje-v12) para que se llamen IGUAL que
// las del acordeón del TAB (acordeon-fino-nuevo-v2). Así el diseño que el usuario pinta en el tab
// (guardado por nombre de malla) transfiere 100% idéntico al personaje/mundo. SOLO toca los nombres de
// nodo/malla en el JSON del GLB — la geometría (Draco) y los morphs quedan intactos (la mano de bajos
// sigue calzando, dist cajas 9.31). Mapeo: base de nombre ÚNICA → por nombre; anillos/duplicados → por
// orden dentro del material (bijección, sin duplicados). Salida: acordeon-personaje-v13.glb.
// Correr tras re-exportar el acordeón del tab: `node scripts/renombrar-acordeon-personaje.mjs`.
import fs from 'fs';
const FINO='C:/PROGRAMACION/AcademiaNext/public/modelos3d/acordeon-fino-nuevo-v2.glb';
const PER ='C:/PROGRAMACION/AcademiaNext/public/modelos3d/acordeon-personaje-v12.glb';
const OUT ='C:/PROGRAMACION/AcademiaNext/public/modelos3d/acordeon-personaje-v13.glb';
function parse(p){const b=fs.readFileSync(p);const jl=b.readUInt32LE(12);const json=JSON.parse(b.slice(20,20+jl).toString('utf8'));const rest=b.slice(20+jl);return{json,rest};}
const SUF=/\d{3}$/;
const sanitBase=(s)=>s.replace(/^ACC_/i,'').replace(/\s/g,'_').replace(/[[\].:/]/g,'').replace(SUF,'');
function nodos(json){const mats=(json.materials||[]).map(m=>(m.name||'').toLowerCase());
  return (json.nodes||[]).map((n,i)=>{let mat='';if(n.mesh!=null){const prim=(json.meshes[n.mesh].primitives||[])[0]||{};if(prim.material!=null)mat=mats[prim.material];}return{i,name:n.name||'',mat,esMalla:n.mesh!=null,mesh:n.mesh};});}
const fino=parse(FINO), per=parse(PER);
const fn=nodos(fino.json).filter(x=>x.esMalla), pn=nodos(per.json).filter(x=>x.esMalla);
// agrupar por material en orden de nodo
const byMat=(list)=>{const m={};for(const x of list)(m[x.mat]=m[x.mat]||[]).push(x);return m;};
const F=byMat(fn), P=byMat(pn);
const asign={}; // per node index -> fino name
let porNombre=0, porOrden=0;
for(const mat of Object.keys(P)){
  const fList=(F[mat]||[]).slice(); // {name,...}
  const pList=P[mat];
  // conteo de base en fino para este material
  const fBaseCount={}; for(const f of fList){const b=sanitBase(f.name); fBaseCount[b]=(fBaseCount[b]||0)+1;}
  const usados=new Set();
  // pass 1: base única
  for(const p of pList){
    const b=sanitBase(p.name);
    if(fBaseCount[b]===1){ const f=fList.find(x=>!usados.has(x.name)&&sanitBase(x.name)===b); if(f){asign[p.i]=f.name; usados.add(f.name); porNombre++; } }
  }
  // pass 2: resto por orden
  const restoF=fList.filter(x=>!usados.has(x.name));
  const restoP=pList.filter(p=>asign[p.i]==null);
  for(let k=0;k<restoP.length && k<restoF.length;k++){ asign[restoP[k].i]=restoF[k].name; usados.add(restoF[k].name); porOrden++; }
}
let cambios=0;
for(const p of pn){ const nuevo=asign[p.i]; if(nuevo){ per.json.nodes[p.i].name=nuevo; if(p.mesh!=null)per.json.meshes[p.mesh].name=nuevo; cambios++; } }
// verificar duplicados
const finalNames=per.json.nodes.filter(n=>n.mesh!=null).map(n=>n.name);
const dup=finalNames.filter((x,i)=>finalNames.indexOf(x)!==i);
// reescribir
const jsonStr=JSON.stringify(per.json); let jsonBuf=Buffer.from(jsonStr,'utf8');
const pad=(4-(jsonBuf.length%4))%4; if(pad)jsonBuf=Buffer.concat([jsonBuf,Buffer.from(' '.repeat(pad))]);
const total=12+8+jsonBuf.length+per.rest.length;
const head=Buffer.alloc(12);head.write('glTF',0);head.writeUInt32LE(2,4);head.writeUInt32LE(total,8);
const jhead=Buffer.alloc(8);jhead.writeUInt32LE(jsonBuf.length,0);jhead.writeUInt32LE(0x4E4F534A,4);
fs.writeFileSync(OUT,Buffer.concat([head,jhead,jsonBuf,per.rest]));
console.log(`renombrados: ${cambios} (porNombre:${porNombre} porOrden:${porOrden})  duplicados:${dup.length}`);
console.log(`size: ${(fs.statSync(OUT).size/1024/1024).toFixed(2)}MB`);
