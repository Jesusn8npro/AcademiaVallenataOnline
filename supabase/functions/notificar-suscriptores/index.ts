// @ts-nocheck
// Envía un email a todos los suscriptores activos del boletín.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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
