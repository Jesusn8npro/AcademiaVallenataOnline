// @ts-nocheck
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
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const auth = await verificarAdmin(req, supabaseUrl, serviceKey);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { tipo, contenido_id, titulo, descripcion_cambio, enviar_email } = await req.json();

    if (!tipo || !contenido_id || !titulo) {
      return json({ error: "tipo, contenido_id y titulo son requeridos" }, 400);
    }

    const campo = tipo === "tutorial" ? "tutorial_id" : "curso_id";
    const urlAccion = tipo === "tutorial"
      ? `/tutoriales-de-acordeon/${contenido_id}`
      : `/cursos/${contenido_id}`;

    const { data: inscritos, error } = await supabase
      .from("inscripciones")
      .select("usuario_id, perfiles:usuario_id (nombre, correo_electronico)")
      .eq(campo, contenido_id)
      .eq("estado", "activo");

    if (error) {
      console.error("❌ Error obteniendo inscritos:", error.message);
      return json({ error: error.message }, 500);
    }

    if (!inscritos?.length) {
      return json({ ok: true, count: 0, message: "Sin inscritos activos" });
    }

    const mensajeTexto = descripcion_cambio ||
      `El ${tipo} "${titulo}" que estás tomando fue actualizado con contenido nuevo.`;

    const notificaciones = inscritos.map((i: any) => ({
      usuario_id: i.usuario_id,
      tipo: "actualizacion_contenido",
      titulo: `📢 Actualización: ${titulo}`,
      mensaje: mensajeTexto,
      icono: "📢",
      categoria: "contenido",
      prioridad: "normal",
      url_accion: urlAccion,
      entidad_id: contenido_id,
      entidad_tipo: tipo,
    }));

    const { error: errNotif } = await supabase.from("notificaciones").insert(notificaciones);
    if (errNotif) console.error("⚠️ Error insertando notificaciones:", errNotif.message);

    console.log(`✅ ${notificaciones.length} notificaciones insertadas para actualización de ${tipo} "${titulo}"`);

    if (enviar_email) {
      for (const i of inscritos) {
        const perfil = (i as any).perfiles;
        if (!perfil?.correo_electronico) continue;
        fetch(`${supabaseUrl}/functions/v1/enviar-email`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tipo: "personalizado",
            destinatario: perfil.correo_electronico,
            nombre: perfil.nombre || "",
            extra: {
              asunto: `📢 Actualización en tu ${tipo}: ${titulo}`,
              mensaje: mensajeTexto + `\n\n¡Entra a la plataforma para ver las novedades!`,
            },
          }),
        }).catch(() => {});
      }
    }

    return json({ ok: true, count: inscritos.length });
  } catch (err: unknown) {
    console.error("❌ Error en notificar-actualizacion:", err);
    return json({ error: (err as Error).message || "Error interno" }, 500);
  }
});
