import React from 'react'

interface Props {
  texto: string
  onImageClick: (url: string) => void
  onImageLoad: () => void
}

type Segmento =
  | { tipo: 'texto';  valor: string }
  | { tipo: 'link';   label: string; url: string }
  | { tipo: 'imagen'; url: string }

const ES_IMAGEN = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i
const REGEX_LINK = /\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)]+)\)/g

function parsear(texto: string): Segmento[] {
  const segs: Segmento[] = []
  let cursor = 0
  let m: RegExpExecArray | null
  REGEX_LINK.lastIndex = 0

  while ((m = REGEX_LINK.exec(texto)) !== null) {
    if (m.index > cursor) segs.push({ tipo: 'texto', valor: texto.slice(cursor, m.index) })
    const url = m[2]
    if (ES_IMAGEN.test(url)) {
      segs.push({ tipo: 'imagen', url })
    } else {
      segs.push({ tipo: 'link', label: m[1], url })
    }
    cursor = m.index + m[0].length
  }

  if (cursor < texto.length) segs.push({ tipo: 'texto', valor: texto.slice(cursor) })
  return segs
}

function limpiarTexto(t: string): string {
  return t
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function iconoBtn(url: string): string {
  if (url.includes('/tutoriales')) return '🎵'
  if (url.includes('/paquetes'))   return '📦'
  if (url.includes('/registro') || url.includes('/login')) return '🎓'
  if (url.includes('/blog'))       return '📖'
  if (url.includes('/simulador'))  return '🎹'
  if (url.includes('/comunidad'))  return '👥'
  if (url.includes('/eventos'))    return '🎤'
  if (url.includes('/cursos') || url.includes('/tutoriales-de-acordeon')) return '🎶'
  return '→'
}

export default function MensajeChat({ texto, onImageClick, onImageLoad }: Props) {
  if (!texto) return null

  const segmentos = parsear(texto)

  // Separar en tres grupos: texto, links, imágenes
  const textoParts: string[] = []
  const links: Array<{ label: string; url: string }> = []
  const imagenes: string[] = []

  for (const seg of segmentos) {
    if (seg.tipo === 'texto')  textoParts.push(seg.valor)
    if (seg.tipo === 'link')   links.push({ label: seg.label, url: seg.url })
    if (seg.tipo === 'imagen') imagenes.push(seg.url)
  }

  const textoFinal = limpiarTexto(textoParts.join(' '))

  return (
    <div className="academia-msg-inner">
      {textoFinal && <p className="academia-msg-text">{textoFinal}</p>}

      {imagenes.map((url, i) => (
        <div key={i} className="academia-chat-img-container">
          <img
            src={url}
            alt=""
            className="academia-chat-img"
            onClick={() => onImageClick(url)}
            onError={(e: any) => { e.target.style.display = 'none' }}
            onLoad={onImageLoad}
          />
        </div>
      ))}

      {links.length > 0 && (
        <div className="academia-btns-group">
          {links.map((link, i) => {
            const esExterno = link.url.startsWith('http')
            const icono = iconoBtn(link.url)
            return (
              <a
                key={i}
                href={link.url}
                target={esExterno ? '_blank' : '_self'}
                rel={esExterno ? 'noopener noreferrer' : undefined}
                className="academia-link-btn"
              >
                <span className="academia-btn-icono">{icono}</span>
                <span className="academia-btn-label">{link.label}</span>
                <span className="academia-btn-arrow">→</span>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
