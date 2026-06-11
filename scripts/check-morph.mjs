import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})
for (const f of process.argv.slice(2)) {
  const doc = await io.read(f); const root = doc.getRoot()
  const bad=[]
  for (const m of root.listMeshes()) for (const p of m.listPrimitives()) {
    const baseN = p.getAttribute('POSITION')?.getCount()
    for (const t of p.listTargets()) {
      const tp = t.getAttribute('POSITION')
      if (tp && tp.getCount() !== baseN) bad.push(`${m.getName()}: base=${baseN} morph=${tp.getCount()}`)
      // NaN check
      if (tp) { const arr=tp.getArray(); for(let i=0;i<arr.length;i++) if(!Number.isFinite(arr[i])){bad.push(`${m.getName()}: NaN en morph`); break} }
    }
    const bp=p.getAttribute('POSITION')?.getArray()
    if(bp) for(let i=0;i<bp.length;i++) if(!Number.isFinite(bp[i])){bad.push(`${m.getName()}: NaN en base`);break}
  }
  console.log(f, bad.length? 'PROBLEMAS:\n  '+bad.join('\n  ') : 'OK (morphs coinciden, sin NaN)')
}
