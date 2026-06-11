// Vuelca la definición completa de materiales de un GLB (factores, texturas, extensiones).
// Uso: node scripts/dump-materiales.mjs <ruta.glb>
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
})
const doc = await io.read(process.argv[2])
for (const m of doc.getRoot().listMaterials()) {
  console.log(JSON.stringify({
    name: m.getName(),
    baseColorFactor: m.getBaseColorFactor(),
    baseColorTexture: m.getBaseColorTexture()?.getName() || null,
    metallic: m.getMetallicFactor(),
    roughness: m.getRoughnessFactor(),
    mrTexture: m.getMetallicRoughnessTexture()?.getName() || null,
    normalTexture: m.getNormalTexture()?.getName() || null,
    alphaMode: m.getAlphaMode(),
    doubleSided: m.getDoubleSided(),
    extensions: m.listExtensions().map((e) => e.extensionName),
  }))
}
