// Aplana el render del lado de bajos (fuelle + caja, transparente) sobre fondo oscuro al aspect
// de la franja de bajos del simulador (1550x305). El render ya viene a ese tamaño (cover en Blender).
import sharp from 'sharp'

const SRC = 'scripts/_renders-diapason/bajos.png'
const OUT = 'public/acordeones/rojo/bajos-3d-cerrado.jpg'
const W = 1550, H = 305

// SIN flip: respetamos la disposición real del acordeón (fuelle pegado al lado del diapasón).
await sharp({ create: { width: W, height: H, channels: 4, background: { r: 10, g: 12, b: 22, alpha: 1 } } })
  .composite([{ input: await sharp(SRC).resize(W, H, { fit: 'fill' }).toBuffer() }])
  .jpeg({ quality: 90 })
  .toFile(OUT)
console.log('OK', OUT)
