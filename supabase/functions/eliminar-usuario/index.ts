// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Orígenes permitidos para CORS (la plataforma vive en 2 dominios).
const ALLOWED_ORIGINS = [
  "https://academiavallenataonline.com",
  "https://academiavallenata.online",
  "http://localhost:3000",
];

function corsFor(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") || "";
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(body: Record<string, unknown>, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  const corsHeaders = corsFor(request);

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Método no permitido" }, 405, corsHeaders);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return json({ error: "Variables de entorno faltantes" }, 500, corsHeaders);
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "No autorizado" }, 401, corsHeaders);

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verificar que el token pertenece a un usuario admin
  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
  if (authErr || !user) return json({ error: "Token inválido" }, 401, corsHeaders);

  const { data: perfilAdmin } = await supabaseAdmin
    .from("perfiles").select("rol").eq("id", user.id).single();
  if (perfilAdmin?.rol !== "admin") {
    return json({ error: "Acceso denegado: se requiere rol admin" }, 403, corsHeaders);
  }

  try {
    const { usuarioId } = await request.json();
    if (!usuarioId) return json({ error: "usuarioId requerido" }, 400, corsHeaders);

    // 1) Borrar tablas que NO cascadean desde perfiles (FK a auth.users o sin FK).
    //    Errores aquí no son fatales (puede que el usuario no tenga filas).
    await supabaseAdmin.from("grabaciones_pista_usuario").delete().eq("user_id", usuarioId);
    await supabaseAdmin.from("pistas_usuario").delete().eq("user_id", usuarioId);
    await supabaseAdmin.from("suscripciones_usuario").delete().eq("usuario_id", usuarioId);

    // 2) Borrar el perfil → cascada al resto (inscripciones, pagos, monedas, xp, etc.)
    const { error: perfilError } = await supabaseAdmin
      .from("perfiles").delete().eq("id", usuarioId);
    if (perfilError) {
      console.error("❌ Error eliminando perfil:", perfilError);
      return json({ error: perfilError.message }, 500, corsHeaders);
    }

    // 3) Borrar la cuenta de auth (libera el email). "not found" = perfil huérfano, no es error.
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(usuarioId);
    if (authError) {
      const noEncontrado =
        authError.message?.toLowerCase().includes("not found") ||
        authError.message?.toLowerCase().includes("no encontrado");
      if (!noEncontrado) {
        console.error("⚠️ Perfil borrado, pero error al borrar de auth:", authError);
        // El acceso ya quedó revocado (perfil eliminado); reportamos éxito parcial.
        return json({ success: true, aviso: "Perfil eliminado; la cuenta auth requería limpieza manual" }, 200, corsHeaders);
      }
    }

    return json({ success: true }, 200, corsHeaders);
  } catch (err) {
    console.error("❌ Error interno:", err);
    return json({ error: "Error interno del servidor" }, 500, corsHeaders);
  }
});
