// Compone el render del diapasón (scripts/_renders-diapason/diapason.png, transparente) sobre un
// lienzo oscuro al MISMO aspect del canvas del simulador (1550x550) usando `cover` → llena el ancho
// sin deformar (el CSS hace background-size:100% 100%, así que el aspect debe coincidir). Salida JPG.
import sharp from 'sharp'

const SRC = 'scripts/_renders-diapason/diapason.png'
const OUT = 'public/acordeones/rojo/diapason-3d.jpg'
const W = 1550, H = 550

// El render ya viene a 1550x550 con el diapasón llenando el canvas (cover en Blender). Solo
// aplanamos el transparente sobre fondo oscuro y guardamos JPG (sin recortar/redimensionar).
await sharp({ create: { width: W, height: H, channels: 4, background: { r: 10, g: 12, b: 22, alpha: 1 } } })
  .composite([{ input: await sharp(SRC).resize(W, H, { fit: 'fill' }).toBuffer() }])
  .jpeg({ quality: 90 })
  .toFile(OUT)
console.log('OK', OUT)
