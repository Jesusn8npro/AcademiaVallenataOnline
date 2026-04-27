import React from 'react'

interface Props {
  texto: string
  onImageClick: (url: string) => void
  onImageLoad: () => void
}

const esUrlImagen = (url: string) => {
  if (!url || typeof url !== 'string') return false
  const patronesImagen = [
    /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i,
    /\/image\//i,
    /cloudinary\.com/i,
    /imgur\.com/i,
    /unsplash\.com/i,
    /supabase\.co.*storage/i
  ]
  return patronesImagen.some(patron => patron.test(url))
}

const extraerUrls = (texto: string) => {
  if (!texto) return []
  const urls = texto.match(/(https?:\/\/[^\s]+)/g) || []
  return urls.map(url => ({
    url: url.replace(/[.,;!?)\]}]+$/, ''),
    esImagen: esUrlImagen(url)
  }))
}

const limpiarTextoDescriptivo = (texto: string) => {
  if (!texto) return texto
  const patronesDescriptivos = [
    /\*\*Imagen Principal\*\*:?\s*/gi,
    /\*\*Imagen Secundaria \d+\*\*:?\s*/gi,
    /\d+\.\s*\*\*Imagen Secundaria \d+\*\*:?\s*/gi,
    /¡Detalle\s*/gi,
    /Te muestro las fotos:?\s*/gi,
    /Aquí tienes las imágenes:?\s*/gi,
    /\)\s*$/g
  ]
  let textoLimpio = texto
  patronesDescriptivos.forEach(patron => { textoLimpio = textoLimpio.replace(patron, '') })
  return textoLimpio.trim()
}

export default function MensajeChat({ texto, onImageClick, onImageLoad }: Props) {
  if (!texto) return null

  const textoLimpio = limpiarTextoDescriptivo(texto)
  const urls = extraerUrls(textoLimpio)
  const urlsImagen = urls.filter(u => u.esImagen)

  if (urlsImagen.length === 0) return <span>{textoLimpio}</span>

  const soloImagenes = urlsImagen.length > 0 &&
    textoLimpio.split(/\s+/).every(palabra =>
      urlsImagen.some(u => palabra.includes(u.url)) || palabra.trim() === ''
    )

  if (soloImagenes) {
    return (
      <div>
        {urlsImagen.map((urlInfo, index) => (
          <div key={index} className="academia-chat-img-container">
            <img
              src={urlInfo.url}
              alt=""
              className="academia-chat-img"
              onClick={() => onImageClick(urlInfo.url)}
              onError={(e: any) => e.target.style.display = 'none'}
              onLoad={onImageLoad}
            />
          </div>
        ))}
      </div>
    )
  }

  let contenido = textoLimpio
  const elementos: JSX.Element[] = []

  urlsImagen.forEach((urlInfo, index) => {
    contenido = contenido.replace(urlInfo.url, `__IMAGEN_${index}__`)
  })

  const partes = contenido.split(/(__IMAGEN_\d+__)/g)

  partes.forEach((parte, index) => {
    const matchImagen = parte.match(/^__IMAGEN_(\d+)__$/)
    if (matchImagen) {
      const indiceImagen = parseInt(matchImagen[1])
      const urlImagen = urlsImagen[indiceImagen]?.url
      if (urlImagen) {
        elementos.push(
          <div key={index} className="academia-chat-img-container">
            <img
              src={urlImagen}
              alt=""
              className="academia-chat-img"
              onClick={() => onImageClick(urlImagen)}
              onError={(e: any) => e.target.style.display = 'none'}
              onLoad={onImageLoad}
            />
          </div>
        )
      }
    } else if (parte.trim() && !urlsImagen.some(u => parte.includes(u.url))) {
      elementos.push(<span key={index}>{parte}</span>)
    }
  })

  return elementos.length > 0 ? <>{elementos}</> : <span>{textoLimpio}</span>
}
