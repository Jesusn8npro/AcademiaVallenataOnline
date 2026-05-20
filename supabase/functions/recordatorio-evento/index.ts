// @ts-nocheck
// Envía email de confirmación (al inscribirse) o recordatorio (manual/cron) a inscritos de un evento.
// Body: { evento_id, tipo: 'confirmacion'|'recordatorio', usuario_id? }
// - tipo='confirmacion' + usuario_id → email solo a ese usuario (cualquier usuario autenticado)
// - tipo='recordatorio' sin usuario_id → email masivo a todos los inscritos (solo admin / service_role)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = Deno.env.get("SITE_URL") || "https://academiavallenataonline.com"
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": SITE_URL,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}
function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CO", {
    timeZone: "America/Bogota", hour: "2-digit", minute: "2-digit",
  });
}

async function verificarAdmin(req: Request, supabaseUrl: string, serviceKey: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return { ok: false, status: 401, error: "No autorizado" };
  const token = authHeader.slice(7);
  if (token === serviceKey) return { ok: true };
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const sbUser = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } }, auth: { autoRefreshToken: false, persistSession: false } });
  const { data: { user }, error } = await sbUser.auth.getUser();
  if (error || !user) return { ok: false, status: 401, error: "Token inválido" };
  const sbAdmin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: perfil } = await sbAdmin.from("perfiles").select("rol").eq("id", user.id).single();
  if (perfil?.rol !== "admin") return { ok: false, status: 403, error: "Acceso denegado: se requiere rol admin" };
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const body = await req.json().catch(() => ({}));
    const { evento_id, usuario_id, tipo = "recordatorio" } = body;

    if (!evento_id) return json({ error: "evento_id es requerido" }, 400);
    if (tipo !== "confirmacion" && tipo !== "recordatorio") {
      return json({ error: "tipo debe ser 'confirmacion' o 'recordatorio'" }, 400);
    }

    // Recordatorio masivo → solo admin o service_role
    // Confirmación individual → cualquier usuario autenticado
    const esMasivo = tipo === "recordatorio" && !usuario_id;
    if (esMasivo) {
      const auth = await verificarAdmin(req, supabaseUrl, serviceKey);
      if (!auth.ok) return json({ error: auth.error }, auth.status);
    } else {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) return json({ error: "No autorizado" }, 401);
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: evento, error: errEvento } = await supabase
      .from("eventos")
      .select("id, titulo, fecha_inicio, fecha_fin, tipo_evento, modalidad, instructor_nombre, slug, link_transmision")
      .eq("id", evento_id)
      .single();

    if (errEvento || !evento) return json({ error: "Evento no encontrado" }, 404);

    const fecha = formatFecha(evento.fecha_inicio);
    const hora  = formatHora(evento.fecha_inicio);
    const eventoUrl = `https://academiavallenataonline.com/eventos/${evento.slug}`;
    const modalidadLabel = evento.modalidad === "online" ? "En línea (virtual)"
      : evento.modalidad === "presencial" ? "Presencial"
      : "Híbrido";

    let query = supabase
      .from("eventos_inscripciones")
      .select("usuario_id, perfiles:usuario_id(nombre, apellido, correo_electronico)")
      .eq("evento_id", evento_id);

    if (usuario_id) query = query.eq("usuario_id", usuario_id);

    const { data: inscripciones, error: errInsc } = await query;
    if (errInsc) return json({ error: errInsc.message }, 500);
    if (!inscripciones?.length) return json({ ok: true, enviados: 0, mensaje: "Sin inscripciones" });

    let enviados = 0;
    let sinEmail = 0;

    for (const insc of inscripciones) {
      const perfil = (insc as any).perfiles;
      if (!perfil?.correo_electronico) { sinEmail++; continue; }

      fetch(`${supabaseUrl}/functions/v1/enviar-email`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${serviceKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: tipo === "confirmacion" ? "inscripcion_evento" : "recordatorio_evento",
          destinatario: perfil.correo_electronico,
          nombre: perfil.nombre || "Estudiante",
          extra: {
            titulo_evento: evento.titulo,
            fecha,
            hora,
            modalidad: modalidadLabel,
            instructor: evento.instructor_nombre || "",
            tipo_evento: evento.tipo_evento || "",
            enlace_evento: eventoUrl,
            enlace_transmision: evento.link_transmision || "",
          },
        }),
      }).catch(() => {});

      enviados++;
    }

    console.log(`📧 ${tipo}: ${enviados} emails enviados para evento "${evento.titulo}"`);
    return json({ ok: true, enviados, sin_email: sinEmail, total: inscripciones.length, tipo });
  } catch (err: unknown) {
    console.error("❌ Error en recordatorio-evento:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
