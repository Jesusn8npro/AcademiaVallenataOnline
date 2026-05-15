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
// Captura [label](url) — url relativa (/ruta) o absoluta (https://...)
const REGEX_LINK = /\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)]+)\)/g

function parsear(texto: string): Segmento[] {
  const segs: Segmento[] = []
  let cursor = 0
  let m: RegExpExecArray | null
  REGEX_LINK.lastIndex = 0

  while ((m = REGEX_LINK.exec(texto)) !== null) {
    if (m.index > cursor) {
      segs.push({ tipo: 'texto', valor: texto.slice(cursor, m.index) })
    }
    const url = m[2]
    if (ES_IMAGEN.test(url)) {
      segs.push({ tipo: 'imagen', url })
    } else {
      segs.push({ tipo: 'link', label: m[1], url })
    }
    cursor = m.index + m[0].length
  }

  if (cursor < texto.length) {
    segs.push({ tipo: 'texto', valor: texto.slice(cursor) })
  }
  return segs
}

export default function MensajeChat({ texto, onImageClick, onImageLoad }: Props) {
  if (!texto) return null

  const segmentos = parsear(texto)

  // Sin links ni imágenes — render simple (limpiando asteriscos igual)
  if (segmentos.length === 1 && segmentos[0].tipo === 'texto') {
    const limpio = texto.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
    return <span>{limpio}</span>
  }

  return (
    <span>
      {segmentos.map((seg, i) => {
        if (seg.tipo === 'texto') {
          const limpio = seg.valor
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
          return <span key={i}>{limpio}</span>
        }

        if (seg.tipo === 'imagen') {
          return (
            <div key={i} className="academia-chat-img-container">
              <img
                src={seg.url}
                alt=""
                className="academia-chat-img"
                onClick={() => onImageClick(seg.url)}
                onError={(e: any) => { e.target.style.display = 'none' }}
                onLoad={onImageLoad}
              />
            </div>
          )
        }

        // Link → botón navegación
        const esExterno = seg.url.startsWith('http')
        return (
          <a
            key={i}
            href={seg.url}
            target={esExterno ? '_blank' : '_self'}
            rel={esExterno ? 'noopener noreferrer' : undefined}
            className="academia-link-btn"
          >
            {seg.label} →
          </a>
        )
      })}
    </span>
  )
}
