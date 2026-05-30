// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = "Academia Vallenata <no-reply@academiavallenataonline.com>";

// Cliente service-role para registrar el historial de correos (tabla emails_enviados).
const _SB_URL = Deno.env.get("SUPABASE_URL");
const _SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const sbLog = (_SB_URL && _SB_KEY) ? createClient(_SB_URL, _SB_KEY, { auth: { persistSession: false } }) : null;

async function registrarEmail(tipo, destinatario, asunto, estado, resendId, errMsg, usuarioId) {
  if (!sbLog) return;
  try {
    await sbLog.from("emails_enviados").insert({
      tipo, destinatario, asunto: asunto || null, estado,
      resend_id: resendId || null, error: errMsg || null, usuario_id: usuarioId || null,
    });
  } catch (_e) { /* el log no debe romper el envío */ }
}

// Evita correos de bienvenida duplicados (onAuthStateChange dispara SIGNED_IN varias veces).
async function yaSeEnvioBienvenida(destinatario) {
  if (!sbLog) return false;
  const { data } = await sbLog.from("emails_enviados")
    .select("id").eq("tipo", "bienvenida").eq("destinatario", destinatario).limit(1).maybeSingle();
  return !!data;
}

function plantillaBienvenida(nombre: string) {
  return {
    subject: "🎻 ¡Bienvenido a la Academia Vallenata Online!",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b0613;border-radius:18px;overflow:hidden;border:1px solid #2a1a4a">
        <div style="background:linear-gradient(135deg,#1a0a3a 0%,#6d28d9 60%,#f59e0b 140%);padding:46px 32px;text-align:center">
          <div style="font-size:42px;margin-bottom:6px">🎻</div>
          <div style="color:#fcd34d;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Academia Vallenata Online</div>
          <h1 style="margin:10px 0 0;font-size:26px;color:#fff;font-weight:800">¡Bienvenido, ${nombre}! 👋</h1>
        </div>
        <div style="padding:32px">
          <p style="color:#e9d5ff;font-size:16px;line-height:1.6;margin:0 0 18px">¡Qué alegría tenerte aquí! Ya eres parte de la academia #1 de acordeón vallenato online. 🎉</p>
          <div style="background:linear-gradient(135deg,#1a0f33,#241247);border:1px solid #4c1d95;border-radius:14px;padding:20px;margin:0 0 22px">
            <div style="color:#c4b5fd;font-size:15px;font-weight:700;margin-bottom:10px">Esto puedes hacer ahora:</div>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:5px 0;color:#34d399;font-size:15px;width:26px;vertical-align:top">✓</td><td style="padding:5px 0;color:#e9d5ff;font-size:14px;line-height:1.5">Practicar en el simulador de acordeón</td></tr>
              <tr><td style="padding:5px 0;color:#34d399;font-size:15px;width:26px;vertical-align:top">✓</td><td style="padding:5px 0;color:#e9d5ff;font-size:14px;line-height:1.5">Explorar tutoriales y cursos de acordeón vallenato</td></tr>
              <tr><td style="padding:5px 0;color:#34d399;font-size:15px;width:26px;vertical-align:top">✓</td><td style="padding:5px 0;color:#e9d5ff;font-size:14px;line-height:1.5">Unirte a la comunidad de estudiantes</td></tr>
            </table>
          </div>
          <div style="text-align:center;margin:28px 0 8px">
            <a href="https://academiavallenataonline.com/mis-cursos"
               style="background:linear-gradient(135deg,#fcd34d,#f59e0b);color:#1a1205;padding:15px 38px;border-radius:10px;text-decoration:none;font-weight:800;font-size:16px;display:inline-block">
              Empezar a aprender →
            </a>
          </div>
          <div style="border-top:1px solid #2a1a4a;margin-top:26px;padding-top:18px;text-align:center">
            <p style="color:#a78bfa;font-size:13px;margin:0 0 4px">¿Tienes alguna pregunta? Escríbenos a</p>
            <a href="mailto:Contacto@academiavallenataonline.com" style="color:#fcd34d;font-size:14px;font-weight:600;text-decoration:none">Contacto@academiavallenataonline.com</a>
            <p style="color:#5b4a7a;font-size:12px;margin:14px 0 0">academiavallenataonline.com</p>
          </div>
        </div>
      </div>`,
  };
}

function formatearFecha(iso: string): string {
  try {
    const [y, m, d] = iso.split("-").map(Number);
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    return `${d} de ${meses[m - 1]} de ${y}`;
  } catch { return iso; }
}

const EMAIL_CONTACTO = "Contacto@academiavallenataonline.com";

function plantillaPagoExitoso(nombre: string, extra: Record<string, string> = {}) {
  const esMembresia = extra.tipo_compra === "membresia";

  // ── Footer común (contacto de lujo) ──────────────────────────────────────
  const footer = `
    <div style="border-top:1px solid #2a1a4a;margin-top:26px;padding-top:18px;text-align:center">
      <p style="color:#a78bfa;font-size:13px;margin:0 0 4px">¿Necesitas ayuda? Escríbenos a</p>
      <a href="mailto:${EMAIL_CONTACTO}" style="color:#fcd34d;font-size:14px;font-weight:600;text-decoration:none">${EMAIL_CONTACTO}</a>
      <p style="color:#5b4a7a;font-size:12px;margin:14px 0 0">academiavallenataonline.com</p>
    </div>`;

  if (esMembresia) {
    let beneficios: string[] = [];
    try { beneficios = JSON.parse(extra.beneficios || "[]"); } catch { beneficios = []; }
    const esVitalicio = extra.periodo === "vitalicio";
    const vencTexto = esVitalicio
      ? "Acceso de por vida ♾️"
      : (extra.vencimiento ? `Activa hasta el ${formatearFecha(extra.vencimiento)}` : "Activa");
    const listaBeneficios = beneficios.map((b) =>
      `<tr><td style="padding:5px 0;color:#34d399;font-size:15px;vertical-align:top;width:26px">✓</td><td style="padding:5px 0;color:#e9d5ff;font-size:15px;line-height:1.5">${b}</td></tr>`
    ).join("");

    return {
      subject: `🎉 ¡Bienvenido al plan ${extra.plan || "Premium"}! — Academia Vallenata`,
      html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b0613;border-radius:18px;overflow:hidden;border:1px solid #2a1a4a">
        <div style="background:linear-gradient(135deg,#1a0a3a 0%,#6d28d9 60%,#f59e0b 140%);padding:44px 32px;text-align:center">
          <div style="font-size:40px;margin-bottom:6px">🎻</div>
          <div style="color:#fcd34d;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Academia Vallenata Online</div>
          <h1 style="margin:10px 0 0;font-size:26px;color:#fff;font-weight:800">¡Tu membresía está activa! 🎉</h1>
        </div>
        <div style="padding:32px">
          <p style="color:#e9d5ff;font-size:16px;line-height:1.6;margin:0 0 18px">¡Hola, <strong style="color:#fff">${nombre}</strong>! Gracias por unirte. Tu pago fue confirmado y <strong style="color:#fcd34d">ya tienes acceso</strong>.</p>

          <div style="background:linear-gradient(135deg,#1a0f33,#241247);border:1px solid #4c1d95;border-radius:14px;padding:22px;margin:0 0 22px">
            <div style="color:#a78bfa;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Tu plan</div>
            <div style="color:#fcd34d;font-size:24px;font-weight:800">${extra.plan || "Premium"}</div>
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid #3a2360">
              <span style="color:#a78bfa;font-size:13px">Vigencia: </span>
              <span style="color:#fff;font-size:14px;font-weight:600">${vencTexto}</span>
            </div>
            ${extra.monto ? `<div style="margin-top:6px"><span style="color:#a78bfa;font-size:13px">Pagado: </span><span style="color:#34d399;font-size:14px;font-weight:600">${extra.monto}</span></div>` : ""}
          </div>

          ${beneficios.length ? `
          <div style="margin:0 0 24px">
            <div style="color:#c4b5fd;font-size:15px;font-weight:700;margin-bottom:8px">Esto es lo que incluye tu plan:</div>
            <table style="width:100%;border-collapse:collapse">${listaBeneficios}</table>
          </div>` : ""}

          <div style="text-align:center;margin:28px 0 8px">
            <a href="https://academiavallenataonline.com/mis-cursos"
               style="background:linear-gradient(135deg,#fcd34d,#f59e0b);color:#1a1205;padding:15px 38px;border-radius:10px;text-decoration:none;font-weight:800;font-size:16px;display:inline-block">
              Entrar a la plataforma →
            </a>
          </div>
          ${extra.email_usuario ? `<p style="color:#a78bfa;font-size:13px;text-align:center;margin:6px 0 0">Inicia sesión con tu correo <strong style="color:#c4b5fd">${extra.email_usuario}</strong></p>` : ""}

          <div style="background:#140a26;border-radius:12px;padding:18px;margin:24px 0 0">
            <div style="color:#c4b5fd;font-size:14px;font-weight:700;margin-bottom:6px">¿Qué sigue?</div>
            <p style="color:#cbb8e6;font-size:13px;line-height:1.6;margin:0">Entra, inicia sesión y empieza a aprender hoy mismo. ${esVitalicio ? "Tu acceso no vence: es de por vida." : "Te avisaremos antes de que venza tu membresía para que no pierdas tu progreso."}</p>
          </div>

          ${footer}
        </div>
      </div>`,
    };
  }

  // ── Compra individual (curso / tutorial / paquete) ───────────────────────
  return {
    subject: "✅ Pago confirmado — Academia Vallenata Online",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b0613;border-radius:18px;overflow:hidden;border:1px solid #2a1a4a">
        <div style="background:linear-gradient(135deg,#1a0a3a 0%,#6d28d9 60%,#f59e0b 140%);padding:44px 32px;text-align:center">
          <div style="font-size:40px;margin-bottom:6px">✅</div>
          <div style="color:#fcd34d;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Academia Vallenata Online</div>
          <h1 style="margin:10px 0 0;font-size:26px;color:#fff;font-weight:800">¡Pago confirmado!</h1>
        </div>
        <div style="padding:32px">
          <p style="color:#e9d5ff;font-size:16px;line-height:1.6;margin:0 0 18px">¡Gracias, <strong style="color:#fff">${nombre}</strong>! Tu pago fue procesado y ya tienes acceso a tu contenido.</p>
          ${extra.curso ? `<div style="background:linear-gradient(135deg,#1a0f33,#241247);border:1px solid #4c1d95;border-radius:14px;padding:20px;margin:0 0 20px"><div style="color:#a78bfa;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Tu compra</div><div style="color:#fcd34d;font-size:18px;font-weight:700">${extra.curso}</div>${extra.monto ? `<div style="margin-top:8px"><span style="color:#a78bfa;font-size:13px">Pagado: </span><span style="color:#34d399;font-size:14px;font-weight:600">${extra.monto}</span></div>` : ""}</div>` : ""}
          <div style="text-align:center;margin:28px 0 8px">
            <a href="https://academiavallenataonline.com/mis-cursos"
               style="background:linear-gradient(135deg,#fcd34d,#f59e0b);color:#1a1205;padding:15px 38px;border-radius:10px;text-decoration:none;font-weight:800;font-size:16px;display:inline-block">
              Empezar ahora →
            </a>
          </div>
          ${footer}
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

// CORS abierto: la función se llama desde el navegador (bienvenida, panel admin)
// en varios orígenes (localhost + dominios de producción) y desde el webhook
// (server-to-server). El control de acceso real no depende de CORS.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
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

    // Dedup: una sola bienvenida por correo (onAuthStateChange dispara SIGNED_IN varias veces).
    if (tipo === "bienvenida" && await yaSeEnvioBienvenida(destinatario)) {
      return new Response(JSON.stringify({ ok: true, deduplicado: true }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
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
      const detalle = data.message || data.name || `Resend HTTP ${res.status}`;
      console.error(`❌ Resend error (${res.status}):`, JSON.stringify(data));
      await registrarEmail(tipo, destinatario, plantilla.subject, "error", null, detalle, extra.usuario_id);
      throw new Error(detalle);
    }

    await registrarEmail(tipo, destinatario, plantilla.subject, "enviado", data.id, null, extra.usuario_id);
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
