import * as THREE from 'three'

// Textura de ANILLOS concéntricos azules (efecto "pisada" sobre el botón). Aditiva = glow.
export function crearTexturaAnillo(): THREE.Texture {
  const s = 128
  const cv = document.createElement('canvas'); cv.width = cv.height = s
  const ctx = cv.getContext('2d')!
  const cx = s / 2, cy = s / 2
  ctx.shadowColor = 'rgba(110,190,255,1)'
  for (const rg of [{ r: 0.17, w: 9, a: 1.0 }, { r: 0.31, w: 7, a: 0.85 }, { r: 0.45, w: 5, a: 0.55 }]) {
    ctx.beginPath()
    ctx.arc(cx, cy, rg.r * s, 0, Math.PI * 2)
    ctx.lineWidth = rg.w
    ctx.strokeStyle = `rgba(150,215,255,${rg.a})`
    ctx.shadowBlur = 14
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
