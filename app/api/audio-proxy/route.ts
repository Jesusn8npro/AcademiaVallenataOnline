import { NextRequest } from 'next/server'
import { Readable } from 'stream'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new Response('Falta parámetro url', { status: 400 })

  let ytdl: any
  try {
    ytdl = (await import('@distube/ytdl-core')).default
  } catch {
    return new Response('Módulo ytdl no disponible', { status: 500 })
  }

  if (!ytdl.validateURL(url)) {
    return new Response('URL de YouTube inválida', { status: 400 })
  }

  try {
    const stream = ytdl(url, {
      quality: 'highestaudio',
      filter: 'audioonly',
    })

    const webStream = Readable.toWeb(stream) as ReadableStream

    return new Response(webStream, {
      headers: {
        'Content-Type': 'audio/webm',
        'Cache-Control': 'public, max-age=3600',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (err: any) {
    return new Response(`Error al obtener audio: ${err.message}`, { status: 500 })
  }
}
