// @ts-nocheck
// Detecta pagos en estado 'pendiente' más viejos de X horas y envía email de recuperación.
// Se puede llamar manualmente desde el panel admin o programar como cron en Supabase Dashboard.
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
    const horasMin    = Number(body.horas_min ?? 1);          // default: 1h
    const codigoCupon = String(body.codigo_cupon ?? "").trim(); // opcional

    const corte = new Date(Date.now() - horasMin * 3600 * 1000).toISOString();

    // Pagos pendientes creados antes del corte, que tengan email en datos_adicionales
    const { data: pagos, error } = await supabase
      .from("pagos_epayco")
      .select("id, ref_payco, nombre_producto, valor, datos_adicionales, created_at")
      .eq("estado", "pendiente")
      .lt("created_at", corte)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return json({ error: error.message }, 500);
    if (!pagos?.length) return json({ ok: true, enviados: 0, mensaje: "Sin pagos abandonados" });

    let enviados = 0;
    let sinEmail = 0;

    for (const pago of pagos) {
      const dp = pago.datos_adicionales?.datos_personales || {};
      const email  = dp.email;
      const nombre = dp.nombre || "Estudiante";

      if (!email) { sinEmail++; continue; }

      const extra: Record<string, string> = {
        producto: pago.nombre_producto || "Contenido",
        monto: pago.valor ? `$${Number(pago.valor).toLocaleString("es-CO")} COP` : "",
        ref: pago.ref_payco,
      };
      if (codigoCupon) extra.cupon = codigoCupon;

      fetch(`${supabaseUrl}/functions/v1/enviar-email`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${serviceKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "pago_abandonado", destinatario: email, nombre, extra }),
      }).catch(() => {});

      enviados++;
    }

    console.log(`📧 Recuperación: ${enviados} emails enviados, ${sinEmail} sin email`);
    return json({ ok: true, enviados, sin_email: sinEmail, total_encontrados: pagos.length });
  } catch (err: unknown) {
    console.error("❌ Error en recuperar-pagos-abandonados:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
