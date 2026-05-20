// @ts-nocheck
// Envía un email a todos los suscriptores activos del boletín.
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
  // Aceptar service role key (cron jobs de Supabase)
  if (token === serviceKey) return { ok: true };
  // Verificar JWT de usuario admin
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

  const auth = await verificarAdmin(req, supabaseUrl, serviceKey);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const { asunto, mensaje } = body;

    if (!asunto || !mensaje) {
      return json({ error: "asunto y mensaje son requeridos" }, 400);
    }

    const { data: suscriptores, error } = await supabase
      .from("suscriptores_boletin")
      .select("email, nombre")
      .eq("activo", true);

    if (error) return json({ error: error.message }, 500);
    if (!suscriptores?.length) return json({ ok: true, enviados: 0, mensaje: "Sin suscriptores activos" });

    let enviados = 0;
    for (const s of suscriptores) {
      fetch(`${supabaseUrl}/functions/v1/enviar-email`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${serviceKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "personalizado",
          destinatario: s.email,
          nombre: s.nombre || "",
          extra: { asunto, mensaje },
        }),
      }).catch(() => {});
      enviados++;
    }

    console.log(`📧 Boletín: ${enviados} emails enviados`);
    return json({ ok: true, enviados, total_suscriptores: suscriptores.length });
  } catch (err: unknown) {
    console.error("❌ Error en notificar-suscriptores:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
