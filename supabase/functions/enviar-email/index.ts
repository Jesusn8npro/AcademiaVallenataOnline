// @ts-nocheck
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = "Academia Vallenata <no-reply@academiavallenataonline.com>";

function plantillaBienvenida(nombre: string) {
  return {
    subject: "¡Bienvenido a Academia Vallenata Online! 🎵",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0520;color:white;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#2d1264,#6d28d9);padding:40px 32px;text-align:center">
          <div style="font-size:48px;margin-bottom:8px">🎵</div>
          <h1 style="margin:0;font-size:28px;color:white">Academia Vallenata Online</h1>
        </div>
        <div style="padding:32px">
          <h2 style="color:#c4b5fd">¡Hola, ${nombre}! 👋</h2>
          <p style="color:#e9d5ff;line-height:1.6">Bienvenido a la Academia Vallenata Online. Estamos emocionados de tenerte aquí.</p>
          <p style="color:#e9d5ff;line-height:1.6">Tienes acceso a nuestros tutoriales gratuitos y puedes explorar todos los cursos disponibles.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="https://academiavallenataonline.com/panel-estudiante"
               style="background:#7c3aed;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
              Ir a mi panel →
            </a>
          </div>
          <p style="color:#a78bfa;font-size:14px;text-align:center">academiavallenataonline.com</p>
        </div>
      </div>`,
  };
}

function plantillaPagoExitoso(nombre: string, extra: Record<string, string> = {}) {
  return {
    subject: "✅ Pago confirmado — Academia Vallenata Online",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0520;color:white;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#2d1264,#6d28d9);padding:40px 32px;text-align:center">
          <div style="font-size:48px;margin-bottom:8px">✅</div>
          <h1 style="margin:0;font-size:28px;color:white">Pago Confirmado</h1>
        </div>
        <div style="padding:32px">
          <h2 style="color:#c4b5fd">¡Gracias, ${nombre}!</h2>
          <p style="color:#e9d5ff;line-height:1.6">Tu pago fue procesado exitosamente. Ya tienes acceso completo a tu curso.</p>
          ${extra.curso ? `<p style="color:#c4b5fd;font-weight:600">📚 Curso: ${extra.curso}</p>` : ""}
          ${extra.monto ? `<p style="color:#e9d5ff">💰 Monto pagado: <strong>${extra.monto}</strong></p>` : ""}
          <div style="text-align:center;margin:32px 0">
            <a href="https://academiavallenataonline.com/panel-estudiante"
               style="background:#7c3aed;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
              Empezar ahora →
            </a>
          </div>
          <p style="color:#a78bfa;font-size:13px;text-align:center">¿Preguntas? soporte@academiavallenataonline.com</p>
        </div>
      </div>`,
  };
}

function plantillaTutorialCompletado(nombre: string, extra: Record<string, string> = {}) {
  const esCurso = extra.tipo_contenido === "curso";
  const tipoTexto = esCurso ? "curso" : "tutorial";
  const emoji = esCurso ? "🎓" : "🏆";
  const enlace = esCurso
    ? "https://academiavallenataonline.com/mis-cursos"
    : "https://academiavallenataonline.com/tutoriales-de-acordeon";
  const textoCTA = esCurso ? "Ver mis cursos →" : "Ver más tutoriales →";
  const tituloContenido = extra.tutorial || extra.curso || "";

  return {
    subject: `${emoji} ¡Completaste un ${tipoTexto}! — Academia Vallenata`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0520;color:white;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#2d1264,#6d28d9);padding:40px 32px;text-align:center">
          <div style="font-size:48px;margin-bottom:8px">${emoji}</div>
          <h1 style="margin:0;font-size:28px;color:white">¡Felicitaciones!</h1>
        </div>
        <div style="padding:32px">
          <h2 style="color:#c4b5fd">¡Lo lograste, ${nombre}!</h2>
          ${tituloContenido ? `<p style="color:#e9d5ff;line-height:1.6">Completaste el ${tipoTexto}: <strong style="color:#c4b5fd">${tituloContenido}</strong></p>` : ""}
          <p style="color:#e9d5ff;line-height:1.6">Sigue practicando y pronto estarás tocando como un verdadero vallenatero. 🎵</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${enlace}"
               style="background:#7c3aed;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
              ${textoCTA}
            </a>
          </div>
        </div>
      </div>`,
  };
}

function plantillaRecordatorio(nombre: string, extra: Record<string, string> = {}) {
  const tipo = extra.tipo_recordatorio || "inactividad";
  const emojis: Record<string, string> = { inactividad: "👋", curso_incompleto: "📚", reto_pendiente: "🎯" };
  const titulos: Record<string, string> = {
    inactividad: "¡Te echamos de menos!",
    curso_incompleto: "Tienes un curso por completar",
    reto_pendiente: "Tienes un reto pendiente",
  };
  const mensajes: Record<string, string> = {
    inactividad: `Hace ${extra.dias_inactivo || "varios"} días que no nos visitas. ¡Tu acordeón te espera!`,
    curso_incompleto: `Llevas un <strong style="color:#c4b5fd">${extra.progreso || "0"}%</strong> completado en <strong style="color:#c4b5fd">${extra.curso || "tu curso"}</strong>. ¡Estás muy cerca!`,
    reto_pendiente: `Tienes el reto <strong style="color:#c4b5fd">${extra.reto || ""}</strong> pendiente. ¡Demuestra lo que sabes!`,
  };

  return {
    subject: `${emojis[tipo] || "👋"} ${titulos[tipo] || "Recordatorio"} — Academia Vallenata`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0520;color:white;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#2d1264,#6d28d9);padding:40px 32px;text-align:center">
          <div style="font-size:48px;margin-bottom:8px">${emojis[tipo] || "👋"}</div>
          <h1 style="margin:0;font-size:28px;color:white">Academia Vallenata Online</h1>
        </div>
        <div style="padding:32px">
          <h2 style="color:#c4b5fd">¡Hola, ${nombre}!</h2>
          <p style="color:#e9d5ff;line-height:1.6;font-size:16px">${mensajes[tipo] || ""}</p>
          ${extra.mensaje_extra ? `<p style="color:#e9d5ff;line-height:1.6">${extra.mensaje_extra}</p>` : ""}
          <div style="text-align:center;margin:32px 0">
            <a href="https://academiavallenataonline.com/panel-estudiante"
               style="background:#7c3aed;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
              Continuar aprendiendo →
            </a>
          </div>
          <p style="color:#6d28d9;font-size:12px;text-align:center">
            Si no deseas recibir estos recordatorios, ignora este correo.<br>
            academiavallenataonline.com
          </p>
        </div>
      </div>`,
  };
}

function plantillaInscripcionEvento(nombre: string, extra: Record<string, string> = {}) {
  return {
    subject: `✅ Inscripción confirmada: ${extra.titulo_evento || "Evento"}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0520;color:white;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#2d1264,#6d28d9);padding:40px 32px;text-align:center">
          <div style="font-size:48px;margin-bottom:8px">🎉</div>
          <h1 style="margin:0;font-size:26px;color:white">¡Inscripción Confirmada!</h1>
        </div>
        <div style="padding:32px">
          <h2 style="color:#c4b5fd">¡Hola, ${nombre}!</h2>
          <p style="color:#e9d5ff;line-height:1.6">Tu inscripción al siguiente evento ha sido confirmada:</p>
          <div style="background:#1a0a2e;border:1px solid #4c1d95;border-radius:12px;padding:20px;margin:20px 0">
            <h3 style="color:#c4b5fd;margin:0 0 16px;font-size:18px">${extra.titulo_evento || ""}</h3>
            <table style="width:100%;border-collapse:collapse">
              ${extra.tipo_evento ? `<tr><td style="color:#a78bfa;padding:6px 0;font-size:13px;width:40%">Tipo</td><td style="color:#e9d5ff;font-size:13px;text-transform:capitalize">${extra.tipo_evento}</td></tr>` : ""}
              <tr><td style="color:#a78bfa;padding:6px 0;font-size:13px">📅 Fecha</td><td style="color:#e9d5ff;font-size:13px">${extra.fecha || ""}</td></tr>
              <tr><td style="color:#a78bfa;padding:6px 0;font-size:13px">⏰ Hora</td><td style="color:#e9d5ff;font-size:13px">${extra.hora || ""} (Colombia)</td></tr>
              <tr><td style="color:#a78bfa;padding:6px 0;font-size:13px">📍 Modalidad</td><td style="color:#e9d5ff;font-size:13px">${extra.modalidad || ""}</td></tr>
              ${extra.instructor ? `<tr><td style="color:#a78bfa;padding:6px 0;font-size:13px">👨‍🏫 Instructor</td><td style="color:#e9d5ff;font-size:13px">${extra.instructor}</td></tr>` : ""}
            </table>
          </div>
          ${extra.enlace_transmision ? `<div style="background:#2d1264;border-radius:8px;padding:14px 18px;margin:16px 0"><p style="color:#a78bfa;margin:0 0 6px;font-size:12px">🔗 ENLACE DE TRANSMISIÓN</p><a href="${extra.enlace_transmision}" style="color:#c4b5fd;font-size:14px;word-break:break-all">${extra.enlace_transmision}</a></div>` : ""}
          <div style="text-align:center;margin:28px 0">
            <a href="${extra.enlace_evento || "https://academiavallenataonline.com/eventos"}"
               style="background:#7c3aed;color:white;padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
              Ver detalles del evento →
            </a>
          </div>
          <p style="color:#6d28d9;font-size:12px;text-align:center">Te enviaremos un recordatorio antes del evento.<br>academiavallenataonline.com</p>
        </div>
      </div>`,
  };
}

function plantillaRecordatorioEvento(nombre: string, extra: Record<string, string> = {}) {
  return {
    subject: `📅 Recordatorio: "${extra.titulo_evento || "Evento"}" comienza pronto`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0520;color:white;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:40px 32px;text-align:center">
          <div style="font-size:48px;margin-bottom:8px">📅</div>
          <h1 style="margin:0;font-size:26px;color:white">¡Tu evento está por comenzar!</h1>
        </div>
        <div style="padding:32px">
          <h2 style="color:#93c5fd">¡Hola, ${nombre}!</h2>
          <p style="color:#e9d5ff;line-height:1.6">Este es un recordatorio de que tienes un evento próximo al que te inscribiste:</p>
          <div style="background:#1a0a2e;border:1px solid #1e3a5f;border-radius:12px;padding:20px;margin:20px 0">
            <h3 style="color:#93c5fd;margin:0 0 16px;font-size:18px">${extra.titulo_evento || ""}</h3>
            <table style="width:100%;border-collapse:collapse">
              ${extra.tipo_evento ? `<tr><td style="color:#60a5fa;padding:6px 0;font-size:13px;width:40%">Tipo</td><td style="color:#e9d5ff;font-size:13px;text-transform:capitalize">${extra.tipo_evento}</td></tr>` : ""}
              <tr><td style="color:#60a5fa;padding:6px 0;font-size:13px">📅 Fecha</td><td style="color:#e9d5ff;font-size:13px">${extra.fecha || ""}</td></tr>
              <tr><td style="color:#60a5fa;padding:6px 0;font-size:13px">⏰ Hora</td><td style="color:#e9d5ff;font-size:13px">${extra.hora || ""} (Colombia)</td></tr>
              <tr><td style="color:#60a5fa;padding:6px 0;font-size:13px">📍 Modalidad</td><td style="color:#e9d5ff;font-size:13px">${extra.modalidad || ""}</td></tr>
              ${extra.instructor ? `<tr><td style="color:#60a5fa;padding:6px 0;font-size:13px">👨‍🏫 Instructor</td><td style="color:#e9d5ff;font-size:13px">${extra.instructor}</td></tr>` : ""}
            </table>
          </div>
          ${extra.enlace_transmision ? `<div style="background:#1e3a5f;border-radius:8px;padding:14px 18px;margin:16px 0"><p style="color:#60a5fa;margin:0 0 6px;font-size:12px">🔗 ENLACE PARA UNIRTE</p><a href="${extra.enlace_transmision}" style="color:#93c5fd;font-size:14px;word-break:break-all">${extra.enlace_transmision}</a></div>` : ""}
          <div style="text-align:center;margin:28px 0">
            <a href="${extra.enlace_evento || "https://academiavallenataonline.com/eventos"}"
               style="background:#2563eb;color:white;padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
              Ir al evento →
            </a>
          </div>
          <p style="color:#1e3a5f;font-size:12px;text-align:center">academiavallenataonline.com</p>
        </div>
      </div>`,
  };
}

function plantillaPagoAbandonado(nombre: string, extra: Record<string, string> = {}) {
  const tieneCupon = !!extra.cupon;
  return {
    subject: "⏳ ¿Olvidaste completar tu compra? — Academia Vallenata",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0520;color:white;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#2d1264,#6d28d9);padding:40px 32px;text-align:center">
          <div style="font-size:48px;margin-bottom:8px">⏳</div>
          <h1 style="margin:0;font-size:28px;color:white">¡Casi lo tienes!</h1>
        </div>
        <div style="padding:32px">
          <h2 style="color:#c4b5fd">Hola, ${nombre}</h2>
          <p style="color:#e9d5ff;line-height:1.6">
            Vimos que estabas a punto de adquirir
            <strong style="color:#c4b5fd">${extra.producto || "contenido de la academia"}</strong>
            ${extra.monto ? `por <strong style="color:#c4b5fd">${extra.monto}</strong>` : ""}
            pero no completaste el proceso.
          </p>
          <p style="color:#e9d5ff;line-height:1.6">
            Tu progreso musical te espera — solo toma unos segundos finalizar el pago.
          </p>
          ${tieneCupon ? `
          <div style="background:#2d1264;border:2px dashed #7c3aed;border-radius:12px;padding:20px;text-align:center;margin:24px 0">
            <p style="color:#a78bfa;margin:0 0 8px;font-size:13px">🎁 CUPÓN ESPECIAL PARA TI</p>
            <div style="font-size:24px;font-weight:900;color:#c4b5fd;letter-spacing:4px">${extra.cupon}</div>
            <p style="color:#6d28d9;margin:8px 0 0;font-size:12px">Úsalo al finalizar tu compra</p>
          </div>` : ""}
          <div style="text-align:center;margin:32px 0">
            <a href="https://academiavallenataonline.com/cursos"
               style="background:#7c3aed;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
              Completar mi compra →
            </a>
          </div>
          <p style="color:#6d28d9;font-size:12px;text-align:center">
            Si ya no te interesa, ignora este mensaje.<br>
            academiavallenataonline.com
          </p>
        </div>
      </div>`,
  };
}

const SITE_URL = Deno.env.get("SITE_URL") || "https://academiavallenataonline.com"
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": SITE_URL,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (!RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY no configurada");
    return new Response(JSON.stringify({ error: "RESEND_API_KEY no configurada" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.json();
    const { tipo, destinatario, nombre, extra = {} } = payload;

    if (!destinatario || !tipo) {
      return new Response(JSON.stringify({ error: "destinatario y tipo son requeridos" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let plantilla: { subject: string; html: string };

    if (tipo === "bienvenida") plantilla = plantillaBienvenida(nombre || "");
    else if (tipo === "pago_exitoso") plantilla = plantillaPagoExitoso(nombre || "", extra);
    else if (tipo === "tutorial_completado") plantilla = plantillaTutorialCompletado(nombre || "", extra);
    else if (tipo === "recordatorio") plantilla = plantillaRecordatorio(nombre || "", extra);
    else if (tipo === "pago_abandonado") plantilla = plantillaPagoAbandonado(nombre || "", extra);
    else if (tipo === "inscripcion_evento") plantilla = plantillaInscripcionEvento(nombre || "", extra);
    else if (tipo === "recordatorio_evento") plantilla = plantillaRecordatorioEvento(nombre || "", extra);
    else if (tipo === "personalizado") {
      if (!extra.asunto || !extra.mensaje) {
        return new Response(JSON.stringify({ error: "asunto y mensaje son requeridos para tipo personalizado" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      plantilla = {
        subject: extra.asunto,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0520;color:white;border-radius:16px;overflow:hidden">
            <div style="background:linear-gradient(135deg,#2d1264,#6d28d9);padding:40px 32px;text-align:center">
              <h1 style="margin:0;font-size:28px;color:white">Academia Vallenata Online</h1>
            </div>
            <div style="padding:32px">
              ${nombre ? `<h2 style="color:#c4b5fd">¡Hola, ${nombre}!</h2>` : ""}
              <div style="color:#e9d5ff;line-height:1.8;font-size:15px;white-space:pre-line">${extra.mensaje}</div>
              <p style="color:#a78bfa;font-size:13px;text-align:center;margin-top:32px">academiavallenataonline.com</p>
            </div>
          </div>`,
      };
    } else {
      return new Response(JSON.stringify({ error: `tipo inválido: ${tipo}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`📧 Enviando email tipo=${tipo} a=${destinatario}`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [destinatario],
        subject: plantilla.subject,
        html: plantilla.html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(`❌ Resend error (${res.status}):`, JSON.stringify(data));
      throw new Error(data.message || data.name || `Resend HTTP ${res.status}`);
    }

    console.log(`✅ Email enviado id=${data.id} a=${destinatario}`);

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("❌ Error en enviar-email:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Error desconocido" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});
