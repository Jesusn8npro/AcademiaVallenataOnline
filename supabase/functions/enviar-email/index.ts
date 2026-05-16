import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = 'Academia Vallenata <no-reply@academiavallenataonline.com>'

interface EmailPayload {
  tipo: 'bienvenida' | 'pago_exitoso' | 'tutorial_completado'
  destinatario: string
  nombre: string
  extra?: Record<string, string>
}

function plantillaBienvenida(nombre: string) {
  return {
    subject: '¡Bienvenido a Academia Vallenata Online! 🎵',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0520;color:white;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#2d1264,#6d28d9);padding:40px 32px;text-align:center">
          <div style="font-size:48px;margin-bottom:8px">🎵</div>
          <h1 style="margin:0;font-size:28px;color:white">Academia Vallenata Online</h1>
        </div>
        <div style="padding:32px">
          <h2 style="color:#c4b5fd">¡Hola, ${nombre}! 👋</h2>
          <p style="color:#e9d5ff;line-height:1.6">
            Bienvenido a la Academia Vallenata Online. Estamos emocionados de tenerte aquí.
          </p>
          <p style="color:#e9d5ff;line-height:1.6">
            Tienes acceso a nuestros tutoriales gratuitos y puedes explorar todos los cursos disponibles.
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="https://academiavallenataonline.com/panel-estudiante"
               style="background:#7c3aed;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
              Ir a mi panel →
            </a>
          </div>
          <p style="color:#a78bfa;font-size:14px;text-align:center">
            academiavallenataonline.com
          </p>
        </div>
      </div>
    `
  }
}

function plantillaPagoExitoso(nombre: string, extra: Record<string, string> = {}) {
  return {
    subject: '✅ Pago confirmado — Academia Vallenata Online',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0520;color:white;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#2d1264,#6d28d9);padding:40px 32px;text-align:center">
          <div style="font-size:48px;margin-bottom:8px">✅</div>
          <h1 style="margin:0;font-size:28px;color:white">Pago Confirmado</h1>
        </div>
        <div style="padding:32px">
          <h2 style="color:#c4b5fd">¡Gracias, ${nombre}!</h2>
          <p style="color:#e9d5ff;line-height:1.6">
            Tu pago fue procesado exitosamente. Ya tienes acceso completo a tu curso.
          </p>
          ${extra.curso ? `<p style="color:#c4b5fd;font-weight:600">Curso: ${extra.curso}</p>` : ''}
          ${extra.monto ? `<p style="color:#e9d5ff">Monto: ${extra.monto}</p>` : ''}
          <div style="text-align:center;margin:32px 0">
            <a href="https://academiavallenataonline.com/mis-cursos"
               style="background:#7c3aed;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
              Ver mis cursos →
            </a>
          </div>
        </div>
      </div>
    `
  }
}

function plantillaTutorialCompletado(nombre: string, extra: Record<string, string> = {}) {
  return {
    subject: '🏆 ¡Completaste un tutorial! — Academia Vallenata',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0520;color:white;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#2d1264,#6d28d9);padding:40px 32px;text-align:center">
          <div style="font-size:48px;margin-bottom:8px">🏆</div>
          <h1 style="margin:0;font-size:28px;color:white">¡Felicitaciones!</h1>
        </div>
        <div style="padding:32px">
          <h2 style="color:#c4b5fd">¡Lo lograste, ${nombre}!</h2>
          ${extra.tutorial ? `<p style="color:#e9d5ff;line-height:1.6">Completaste: <strong style="color:#c4b5fd">${extra.tutorial}</strong></p>` : ''}
          <p style="color:#e9d5ff;line-height:1.6">
            Sigue practicando y pronto estarás tocando como un verdadero vallenatero. 🎵
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="https://academiavallenataonline.com/tutoriales-de-acordeon"
               style="background:#7c3aed;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
              Ver más tutoriales →
            </a>
          </div>
        </div>
      </div>
    `
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY no configurada' }), { status: 500 })
  }

  try {
    const payload: EmailPayload = await req.json()
    const { tipo, destinatario, nombre, extra = {} } = payload

    let plantilla: { subject: string; html: string }
    if (tipo === 'bienvenida') plantilla = plantillaBienvenida(nombre)
    else if (tipo === 'pago_exitoso') plantilla = plantillaPagoExitoso(nombre, extra)
    else if (tipo === 'tutorial_completado') plantilla = plantillaTutorialCompletado(nombre, extra)
    else return new Response(JSON.stringify({ error: 'tipo inválido' }), { status: 400 })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [destinatario], subject: plantilla.subject, html: plantilla.html })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Error Resend')

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
