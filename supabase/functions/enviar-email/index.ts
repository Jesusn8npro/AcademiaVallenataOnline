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
  } catch (_e) {}
}

async function yaSeEnvioBienvenida(destinatario) {
  if (!sbLog) return false;
  const { data } = await sbLog.from("emails_enviados").select("id").eq("tipo", "bienvenida").eq("destinatario", destinatario).limit(1).maybeSingle();
  return !!data;
}

const EMAIL_CONTACTO = "Contacto@academiavallenataonline.com";
const GRAD = "linear-gradient(135deg,#2e1065 0%,#7c3aed 40%,#db2777 78%,#f59e0b 128%)";

function formatearFecha(iso) {
  try {
    const [y, m, d] = iso.split("-").map(Number);
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    return `${d} de ${meses[m - 1]} de ${y}`;
  } catch { return iso; }
}

const LOGO_URL = "https://academiavallenataonline.com/logo-175.webp";

// Wrapper de LUJO compartido: logo, prueba social, divisores dorados y footer completo.
function emailLujo({ emoji, titulo, cuerpoHtml, ctaText, ctaHref, headerGradient }) {
  const cta = ctaText
    ? `<div style="text-align:center;margin:30px 0 6px"><a href="${ctaHref}" style="background:linear-gradient(135deg,#fde68a,#f59e0b);color:#1a1205;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:800;font-size:16px;display:inline-block;box-shadow:0 10px 26px rgba(245,158,11,0.35)">${ctaText}</a></div>`
    : "";
  return `<div style="background:#060410;padding:26px 12px;font-family:'Segoe UI',Arial,sans-serif">
    <div style="max-width:600px;margin:0 auto;background:#0d0820;border-radius:22px;overflow:hidden;border:1px solid rgba(252,211,77,0.20);box-shadow:0 24px 70px rgba(0,0,0,0.55)">
      <div style="background:${headerGradient || GRAD};padding:38px 32px 32px;text-align:center">
        <img src="${LOGO_URL}" alt="Academia Vallenata Online" width="62" style="width:62px;height:auto;margin:0 auto 10px;display:block;border-radius:12px">
        <div style="color:#fde68a;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:10px">Academia Vallenata Online</div>
        <div style="font-size:34px;line-height:1;margin-bottom:6px">${emoji}</div>
        <h1 style="margin:6px 0 0;font-size:26px;color:#ffffff;font-weight:800;line-height:1.2">${titulo}</h1>
      </div>
      <div style="height:4px;background:linear-gradient(90deg,#f59e0b,#fcd34d,#db2777,#7c3aed)"></div>
      <div style="padding:34px 30px 10px">${cuerpoHtml}${cta}</div>
      <div style="margin-top:22px;padding:18px 24px;background:#130a28;border-top:1px solid rgba(252,211,77,0.14);text-align:center">
        <span style="color:#fcd34d;font-size:13px;font-weight:700">⭐ 4.9/5</span>
        <span style="color:#4a3a6a;font-size:13px">&nbsp;&nbsp;•&nbsp;&nbsp;</span>
        <span style="color:#e9d5ff;font-size:13px;font-weight:600">5.000+ estudiantes</span>
        <span style="color:#4a3a6a;font-size:13px">&nbsp;&nbsp;•&nbsp;&nbsp;</span>
        <span style="color:#c4b5fd;font-size:13px;font-weight:600">Academia #1 de acordeón vallenato</span>
      </div>
      <div style="padding:24px 30px 28px;text-align:center;background:#0d0820">
        <p style="color:#a78bfa;font-size:13px;margin:0 0 4px">¿Necesitas ayuda? Escríbenos a</p>
        <a href="mailto:${EMAIL_CONTACTO}" style="color:#fcd34d;font-size:15px;font-weight:700;text-decoration:none">${EMAIL_CONTACTO}</a>
        <div style="margin:16px 0 0">
          <a href="https://academiavallenataonline.com" style="color:#a78bfa;font-size:12px;text-decoration:none;margin:0 7px">Inicio</a><span style="color:#3a2a5a">•</span>
          <a href="https://academiavallenataonline.com/tutoriales-de-acordeon" style="color:#a78bfa;font-size:12px;text-decoration:none;margin:0 7px">Tutoriales</a><span style="color:#3a2a5a">•</span>
          <a href="https://academiavallenataonline.com/membresias" style="color:#a78bfa;font-size:12px;text-decoration:none;margin:0 7px">Planes</a>
        </div>
        <p style="color:#4a3a6a;font-size:11px;margin:16px 0 0">© Academia Vallenata Online · academiavallenataonline.com</p>
      </div>
    </div>
  </div>`;
}

function cardLujo(inner) {
  return `<div style="background:linear-gradient(135deg,#1a0f33,#241247);border:1px solid #4c1d95;border-radius:14px;padding:20px;margin:16px 0">${inner}</div>`;
}

function plantillaBienvenida(nombre) {
  const cuerpo = `<p style="color:#e9d5ff;font-size:16px;line-height:1.6;margin:0 0 18px">¡Qué alegría tenerte aquí, <strong style="color:#fff">${nombre}</strong>! Ya eres parte de la academia #1 de acordeón vallenato online. 🎉</p>${cardLujo(`<div style="color:#c4b5fd;font-size:15px;font-weight:700;margin-bottom:10px">Esto puedes hacer ahora:</div><table style="width:100%;border-collapse:collapse"><tr><td style="padding:5px 0;color:#34d399;font-size:15px;width:26px;vertical-align:top">✓</td><td style="padding:5px 0;color:#e9d5ff;font-size:14px;line-height:1.5">Practicar en el simulador de acordeón</td></tr><tr><td style="padding:5px 0;color:#34d399;font-size:15px;width:26px;vertical-align:top">✓</td><td style="padding:5px 0;color:#e9d5ff;font-size:14px;line-height:1.5">Explorar tutoriales y cursos de acordeón vallenato</td></tr><tr><td style="padding:5px 0;color:#34d399;font-size:15px;width:26px;vertical-align:top">✓</td><td style="padding:5px 0;color:#e9d5ff;font-size:14px;line-height:1.5">Unirte a la comunidad de estudiantes</td></tr></table>`)}`;
  return { subject: "🎻 ¡Bienvenido a la Academia Vallenata Online!", html: emailLujo({ emoji: "🎻", titulo: `¡Bienvenido, ${nombre}! 👋`, cuerpoHtml: cuerpo, ctaText: "Empezar a aprender →", ctaHref: "https://academiavallenataonline.com/mis-cursos" }) };
}

function plantillaPagoExitoso(nombre, extra = {}) {
  if (extra.tipo_compra === "membresia") {
    let beneficios = [];
    try { beneficios = JSON.parse(extra.beneficios || "[]"); } catch { beneficios = []; }
    const esVitalicio = extra.periodo === "vitalicio";
    const vencTexto = esVitalicio ? "Acceso de por vida ♾️" : (extra.vencimiento ? `Activa hasta el ${formatearFecha(extra.vencimiento)}` : "Activa");
    const lista = beneficios.map((b) => `<tr><td style="padding:5px 0;color:#34d399;font-size:15px;vertical-align:top;width:26px">✓</td><td style="padding:5px 0;color:#e9d5ff;font-size:15px;line-height:1.5">${b}</td></tr>`).join("");
    const cuerpo = `<p style="color:#e9d5ff;font-size:16px;line-height:1.6;margin:0 0 18px">¡Hola, <strong style="color:#fff">${nombre}</strong>! Tu pago fue confirmado y <strong style="color:#fcd34d">ya tienes acceso</strong>.</p>${cardLujo(`<div style="color:#a78bfa;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Tu plan</div><div style="color:#fcd34d;font-size:24px;font-weight:800">${extra.plan || "Premium"}</div><div style="margin-top:12px;padding-top:12px;border-top:1px solid #3a2360"><span style="color:#a78bfa;font-size:13px">Vigencia: </span><span style="color:#fff;font-size:14px;font-weight:600">${vencTexto}</span></div>${extra.monto ? `<div style="margin-top:6px"><span style="color:#a78bfa;font-size:13px">Pagado: </span><span style="color:#34d399;font-size:14px;font-weight:600">${extra.monto}</span></div>` : ""}`)}${beneficios.length ? `<div style="margin:0 0 8px"><div style="color:#c4b5fd;font-size:15px;font-weight:700;margin-bottom:8px">Esto incluye tu plan:</div><table style="width:100%;border-collapse:collapse">${lista}</table></div>` : ""}${extra.email_usuario ? `<p style="color:#a78bfa;font-size:13px;text-align:center;margin:20px 0 0">Inicia sesión con tu correo <strong style="color:#c4b5fd">${extra.email_usuario}</strong></p>` : ""}`;
    return { subject: `🎉 ¡Bienvenido al plan ${extra.plan || "Premium"}! — Academia Vallenata`, html: emailLujo({ emoji: "🎻", titulo: "¡Tu membresía está activa! 🎉", cuerpoHtml: cuerpo, ctaText: "Entrar a la plataforma →", ctaHref: "https://academiavallenataonline.com/mis-cursos" }) };
  }
  const cuerpo = `<p style="color:#e9d5ff;font-size:16px;line-height:1.6;margin:0 0 16px">¡Gracias, <strong style="color:#fff">${nombre}</strong>! Tu pago fue procesado y ya tienes acceso a tu contenido.</p>${extra.curso ? cardLujo(`<div style="color:#a78bfa;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Tu compra</div><div style="color:#fcd34d;font-size:18px;font-weight:700">${extra.curso}</div>${extra.monto ? `<div style="margin-top:8px"><span style="color:#a78bfa;font-size:13px">Pagado: </span><span style="color:#34d399;font-size:14px;font-weight:600">${extra.monto}</span></div>` : ""}`) : ""}`;
  return { subject: "✅ Pago confirmado — Academia Vallenata Online", html: emailLujo({ emoji: "✅", titulo: "¡Pago confirmado!", cuerpoHtml: cuerpo, ctaText: "Empezar ahora →", ctaHref: "https://academiavallenataonline.com/mis-cursos" }) };
}

function plantillaTutorialCompletado(nombre, extra = {}) {
  const esCurso = extra.tipo_contenido === "curso";
  const emoji = esCurso ? "🎓" : "🏆";
  const enlace = esCurso ? "https://academiavallenataonline.com/mis-cursos" : "https://academiavallenataonline.com/tutoriales-de-acordeon";
  const titulo = extra.tutorial || extra.curso || "";
  const cuerpo = `<p style="color:#e9d5ff;font-size:16px;line-height:1.6;margin:0 0 16px">¡Lo lograste, <strong style="color:#fff">${nombre}</strong>! 🎉</p>${titulo ? cardLujo(`<div style="color:#a78bfa;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Completaste</div><div style="color:#fcd34d;font-size:18px;font-weight:700">${titulo}</div>`) : ""}<p style="color:#cbb8e6;font-size:14px;line-height:1.6;margin:0">Sigue practicando y pronto estarás tocando como un verdadero vallenatero. 🎻</p>`;
  return { subject: `${emoji} ¡Completaste un ${esCurso ? "curso" : "tutorial"}! — Academia Vallenata`, html: emailLujo({ emoji, titulo: "¡Felicitaciones!", cuerpoHtml: cuerpo, ctaText: esCurso ? "Ver mis cursos →" : "Ver más tutoriales →", ctaHref: enlace }) };
}

function plantillaRecordatorio(nombre, extra = {}) {
  const tipo = extra.tipo_recordatorio || "inactividad";
  const cfg = {
    inactividad: { emoji: "👋", titulo: "¡Te echamos de menos!", msg: `Hace <strong style="color:#fcd34d">${extra.dias_inactivo || "varios"} días</strong> que no nos visitas. ¡Tu acordeón te espera para seguir aprendiendo! 🎻`, cta: "Volver a practicar →" },
    curso_incompleto: { emoji: "📚", titulo: "Tienes un curso por terminar", msg: `Llevas un <strong style="color:#fcd34d">${extra.progreso || "0"}%</strong> en <strong style="color:#c4b5fd">${extra.curso || "tu curso"}</strong>. ¡Estás muy cerca de completarlo! 💪`, cta: "Continuar el curso →" },
    reto_pendiente: { emoji: "🎯", titulo: "Tienes un reto pendiente", msg: `El reto <strong style="color:#c4b5fd">${extra.reto || ""}</strong> te espera. ¡Demuestra lo que sabes! 🔥`, cta: "Ir al reto →" },
  };
  const c = cfg[tipo] || cfg.inactividad;
  const cuerpo = `<p style="color:#e9d5ff;font-size:16px;line-height:1.6;margin:0 0 4px">¡Hola, <strong style="color:#fff">${nombre}</strong>!</p>${cardLujo(`<p style="color:#e9d5ff;font-size:15px;line-height:1.6;margin:0">${c.msg}</p>${extra.mensaje_extra ? `<p style="color:#cbb8e6;font-size:14px;line-height:1.5;margin:10px 0 0">${extra.mensaje_extra}</p>` : ""}`)}`;
  return { subject: `${c.emoji} ${c.titulo} — Academia Vallenata`, html: emailLujo({ emoji: c.emoji, titulo: c.titulo, cuerpoHtml: cuerpo, ctaText: c.cta, ctaHref: "https://academiavallenataonline.com/mis-cursos" }) };
}

function cuerpoEvento(extra) {
  const fila = (label, val) => val ? `<tr><td style="color:#a78bfa;padding:5px 0;font-size:13px;width:38%">${label}</td><td style="color:#e9d5ff;font-size:13px">${val}</td></tr>` : "";
  return `${cardLujo(`<h3 style="color:#fcd34d;margin:0 0 14px;font-size:18px">${extra.titulo_evento || ""}</h3><table style="width:100%;border-collapse:collapse">${fila("📅 Fecha", extra.fecha)}${fila("⏰ Hora", extra.hora ? extra.hora + " (Colombia)" : "")}${fila("📍 Modalidad", extra.modalidad)}${fila("👨‍🏫 Instructor", extra.instructor)}</table>`)}${extra.enlace_transmision ? `<div style="background:#140a26;border-radius:10px;padding:14px 18px;margin:0 0 8px"><p style="color:#a78bfa;margin:0 0 6px;font-size:12px">🔗 ENLACE</p><a href="${extra.enlace_transmision}" style="color:#fcd34d;font-size:13px;word-break:break-all">${extra.enlace_transmision}</a></div>` : ""}`;
}

function plantillaInscripcionEvento(nombre, extra = {}) {
  const cuerpo = `<p style="color:#e9d5ff;font-size:16px;line-height:1.6;margin:0 0 4px">¡Hola, <strong style="color:#fff">${nombre}</strong>! Tu inscripción quedó confirmada:</p>${cuerpoEvento(extra)}`;
  return { subject: `✅ Inscripción confirmada: ${extra.titulo_evento || "Evento"}`, html: emailLujo({ emoji: "🎉", titulo: "¡Inscripción confirmada!", cuerpoHtml: cuerpo, ctaText: "Ver el evento →", ctaHref: extra.enlace_evento || "https://academiavallenataonline.com/eventos" }) };
}

function plantillaRecordatorioEvento(nombre, extra = {}) {
  const cuerpo = `<p style="color:#e9d5ff;font-size:16px;line-height:1.6;margin:0 0 4px">¡Hola, <strong style="color:#fff">${nombre}</strong>! Tu evento está por comenzar:</p>${cuerpoEvento(extra)}`;
  return { subject: `📅 Recordatorio: "${extra.titulo_evento || "Evento"}" comienza pronto`, html: emailLujo({ emoji: "📅", titulo: "¡Tu evento está por comenzar!", cuerpoHtml: cuerpo, ctaText: "Ir al evento →", ctaHref: extra.enlace_evento || "https://academiavallenataonline.com/eventos", headerGradient: "linear-gradient(135deg,#0a1733 0%,#2563eb 70%,#06b6d4 140%)" }) };
}

function plantillaPagoAbandonado(nombre, extra = {}) {
  const cuerpo = `<p style="color:#e9d5ff;font-size:16px;line-height:1.6;margin:0 0 14px">¡Hola, <strong style="color:#fff">${nombre}</strong>! Vimos que estabas a punto de adquirir <strong style="color:#fcd34d">${extra.producto || "contenido de la academia"}</strong>${extra.monto ? ` por <strong style="color:#fcd34d">${extra.monto}</strong>` : ""}, pero no completaste el pago.</p>${extra.cupon ? `<div style="background:#1a0f33;border:2px dashed #f59e0b;border-radius:12px;padding:20px;text-align:center;margin:0 0 16px"><p style="color:#a78bfa;margin:0 0 8px;font-size:13px">🎁 CUPÓN ESPECIAL PARA TI</p><div style="font-size:26px;font-weight:900;color:#fcd34d;letter-spacing:4px">${extra.cupon}</div><p style="color:#cbb8e6;margin:8px 0 0;font-size:12px">Úsalo al finalizar tu compra</p></div>` : ""}<p style="color:#cbb8e6;font-size:14px;line-height:1.6;margin:0">Solo toma unos segundos terminar. ¡Tu progreso musical te espera! 🎻</p>`;
  return { subject: "⏳ ¿Olvidaste completar tu compra? — Academia Vallenata", html: emailLujo({ emoji: "⏳", titulo: "¡Casi lo tienes!", cuerpoHtml: cuerpo, ctaText: "Completar mi compra →", ctaHref: "https://academiavallenataonline.com/membresias" }) };
}

// ¿el llamador es admin o un servicio (service-role)? Solo ellos pueden mandar correos 'personalizado'
// (asunto + cuerpo ARBITRARIOS) → cierra el relay de phishing/spam desde el dominio. Los correos con
// PLANTILLA fija (bienvenida, pago, etc.) siguen abiertos para no romper el envío del registro (anon key).
async function esAdminOServicio(req) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (token && token === serviceKey) return true; // llamada server-to-server
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!url || !token || token === anonKey) return false; // anon key no basta
  try {
    const sbUser = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
    const { data: { user } } = await sbUser.auth.getUser();
    if (!user) return false;
    const sbAdmin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: perfil } = await sbAdmin.from("perfiles").select("rol").eq("id", user.id).single();
    return perfil?.rol === "admin";
  } catch { return false; }
}

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (!RESEND_API_KEY) return J({ error: "RESEND_API_KEY no configurada" }, 500);

  try {
    const { tipo, destinatario, nombre, extra = {} } = await req.json();
    if (!destinatario || !tipo) return J({ error: "destinatario y tipo son requeridos" }, 400);

    if (tipo === "bienvenida" && await yaSeEnvioBienvenida(destinatario)) return J({ ok: true, deduplicado: true });

    let plantilla;
    if (tipo === "bienvenida") plantilla = plantillaBienvenida(nombre || "");
    else if (tipo === "pago_exitoso") plantilla = plantillaPagoExitoso(nombre || "", extra);
    else if (tipo === "tutorial_completado") plantilla = plantillaTutorialCompletado(nombre || "", extra);
    else if (tipo === "recordatorio") plantilla = plantillaRecordatorio(nombre || "", extra);
    else if (tipo === "pago_abandonado") plantilla = plantillaPagoAbandonado(nombre || "", extra);
    else if (tipo === "inscripcion_evento") plantilla = plantillaInscripcionEvento(nombre || "", extra);
    else if (tipo === "recordatorio_evento") plantilla = plantillaRecordatorioEvento(nombre || "", extra);
    else if (tipo === "personalizado") {
      if (!(await esAdminOServicio(req))) return J({ error: "No autorizado: solo admin" }, 403);
      if (!extra.asunto || !extra.mensaje) return J({ error: "asunto y mensaje son requeridos" }, 400);
      plantilla = { subject: extra.asunto, html: emailLujo({ emoji: "💌", titulo: nombre ? `¡Hola, ${nombre}!` : "Academia Vallenata Online", cuerpoHtml: `<div style="color:#e9d5ff;line-height:1.8;font-size:15px;white-space:pre-line">${extra.mensaje}</div>` }) };
    } else return J({ error: `tipo invalido: ${tipo}` }, 400);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to: [destinatario], subject: plantilla.subject, html: plantilla.html }),
    });
    const data = await res.json();

    if (!res.ok) {
      const detalle = data.message || data.name || `Resend HTTP ${res.status}`;
      await registrarEmail(tipo, destinatario, plantilla.subject, "error", null, detalle, extra.usuario_id);
      throw new Error(detalle);
    }
    await registrarEmail(tipo, destinatario, plantilla.subject, "enviado", data.id, null, extra.usuario_id);
    return J({ ok: true, id: data.id });
  } catch (err) {
    return J({ error: err.message || "Error desconocido" }, 500);
  }
});
