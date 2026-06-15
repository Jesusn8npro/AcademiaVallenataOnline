// Comprime el pack de bailes (GLB solo-esqueleto) para el visor web.
// El export NLA de Blender muestrea TODOS los huesos (TRS x65) — aquí se restaura la
// firma original de los bailes del pack:
//  - FUERA canales de brazos/manos/hombros (el rig los muestreó en T-pose; al sonar en
//    runtime los brazos soltarían el acordeón — la capa de brazos la pone la closeAction).
//  - FUERA translation de todo hueso menos Hips (posiciones constantes del AnimRig que
//    pisarían las proporciones de cada personaje) y FUERA scale (constante 1).
//  - resample para colapsar keys redundantes; se elimina la malla dummy (_DUMMY_SKIN).
// Uso: node scripts/comprimir-bailes.mjs <in.glb> <out.glb>
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, resample } from '@gltf-transform/functions'
import fs from 'node:fs'

const IN = process.argv[2]
const OUT = process.argv[3]
const RE_BRAZOS = /(Shoulder|Arm|Hand)/
// Clips EN SITIO: se les quita TODA la traslación de la cadera (incluida la vertical). En el MUNDO 3D el
// vertical lo maneja el CÓDIGO (gravedad del salto / detección de piso al subir escaleras) → si el clip
// también moviera la cadera hacia arriba, se SUMARÍA y el personaje "se elevaría" el doble (perdía realismo).
const EN_SITIO = new Set(['Salto vacano', 'Subiendo escaleras', 'Corriendo'])

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const doc = await io.read(IN)
const root = doc.getRoot()

for (const anim of root.listAnimations()) {
  const enSitio = EN_SITIO.has(anim.getName())
  for (const ch of anim.listChannels()) {
    const nombre = ch.getTargetNode()?.getName() || ''
    const path = ch.getTargetPath()
    const esHips = /Hips$/.test(nombre)
    const fuera =
      RE_BRAZOS.test(nombre) ||
      path === 'scale' ||
      (path === 'translation' && !esHips) ||
      (path === 'translation' && esHips && enSitio) // clip en sitio → fuera también la cadera (el código pone el alto)
    if (fuera) ch.dispose()
  }
}

for (const mesh of root.listMeshes()) if (mesh.getName() === '_DUMMY_SKIN') mesh.dispose()
for (const skin of root.listSkins()) skin.dispose()
for (const nodo of root.listNodes()) if (nodo.getName() === '_DUMMY_SKIN') nodo.dispose()

await doc.transform(resample(), dedup(), prune({ keepLeaves: true }))
await io.write(OUT, doc)

console.log(JSON.stringify({
  in: IN, out: OUT,
  mb: +(fs.statSync(OUT).size / 1e6).toFixed(2),
  anims: root.listAnimations().map((a) => ({
    nombre: a.getName(),
    canales: a.listChannels().length,
    huesosBrazo: a.listChannels().filter((c) => RE_BRAZOS.test(c.getTargetNode()?.getName() || '')).length,
    translations: a.listChannels().filter((c) => c.getTargetPath() === 'translation').map((c) => c.getTargetNode()?.getName()),
  })),
  nodos: root.listNodes().length,
}, null, 2))
