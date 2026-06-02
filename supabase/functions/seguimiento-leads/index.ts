// @ts-nocheck
// Seguimiento de leads abandonados → webhook al SaaS de WhatsApp.
//
// La llama pg_cron cada X minutos (con header x-cron-secret). Busca leads del chat
// que dejaron WhatsApp pero NO completaron una compra dentro de la ventana de
// `delay_min`, y por cada uno hace POST al webhook del SaaS (INYECTAIA) para que
// le envíe un mensaje de seguimiento por WhatsApp. Idempotente: marca
// seguimiento_wa_enviado para no reenviar.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: CORS });

// Normaliza a los últimos 10 dígitos (para comparar números aunque difiera el indicativo).
const ultimos10 = (tel: string) => (tel || "").replace(/\D/g, "").slice(-10);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { data: cfg } = await sb.from("integraciones_webhooks").select("*").eq("id", "seguimiento_lead_wa").maybeSingle();
    if (!cfg) return json({ skipped: "sin config" });
    if (!cfg.activo) return json({ skipped: "inactivo" });
    if (!cfg.url) return json({ skipped: "sin url" });

    // Auth del cron: el header debe coincidir con el cron_secret de la config.
    const cronHeader = req.headers.get("x-cron-secret") || "";
    if (cfg.cron_secret && cronHeader !== cfg.cron_secret) return json({ error: "no autorizado" }, 401);

    const cutoff = new Date(Date.now() - (cfg.delay_min || 60) * 60_000).toISOString();

    const { data: leads } = await sb
      .from("leads_chat_anonimos")
      .select("id, chat_id, nombre, email, whatsapp, ciudad, que_quiere_aprender, nivel_acordeon, productos_consultados, nivel_interes, pagina_origen, created_at, usuario_id")
      .not("whatsapp", "is", null)
      .eq("seguimiento_wa_enviado", false)
      .eq("converted", false)
      .eq("convertido_a_usuario", false)
      .lt("created_at", cutoff)
      .order("created_at", { ascending: true })
      .limit(25);

    if (!leads?.length) return json({ ok: true, revisados: 0, enviados: 0 });

    let enviados = 0;

    for (const lead of leads) {
      const tel10 = ultimos10(lead.whatsapp);
      if (tel10.length < 7) continue; // WhatsApp inválido, saltar

      // ── ¿Ya tiene un intento de compra? (por teléfono, usuario o email) ──
      let tieneCompra = false;

      const { data: porTel } = await sb
        .from("pagos_epayco").select("id")
        .or(`whatsapp.ilike.%${tel10}%,telefono.ilike.%${tel10}%`)
        .limit(1);
      if (porTel?.length) tieneCompra = true;

      if (!tieneCompra && lead.usuario_id) {
        const { data: porUser } = await sb.from("pagos_epayco").select("id").eq("usuario_id", lead.usuario_id).limit(1);
        if (porUser?.length) tieneCompra = true;
      }

      if (!tieneCompra && lead.email) {
        const { data: perfil } = await sb.from("perfiles").select("id").ilike("correo_electronico", lead.email).maybeSingle();
        if (perfil?.id) {
          const { data: porEmail } = await sb.from("pagos_epayco").select("id").eq("usuario_id", perfil.id).limit(1);
          if (porEmail?.length) tieneCompra = true;
        }
      }

      if (tieneCompra) {
        // Ya compró → no molestar; marcamos para no volver a evaluarlo.
        await sb.from("leads_chat_anonimos").update({ seguimiento_wa_enviado: true, seguimiento_wa_at: new Date().toISOString() }).eq("id", lead.id);
        continue;
      }

      // ── Abandono confirmado → avisar al SaaS para que mande el WhatsApp ──
      const nombre = (lead.nombre || "").trim().split(" ")[0] || "";
      const tema = lead.que_quiere_aprender || (Array.isArray(lead.productos_consultados) && lead.productos_consultados[0]) || "acordeón vallenato";
      const payload = {
        evento: "seguimiento_lead_abandonado",
        lead: {
          chat_id: lead.chat_id,
          nombre: lead.nombre || null,
          whatsapp: lead.whatsapp,
          email: lead.email || null,
          ciudad: lead.ciudad || null,
          que_quiere_aprender: lead.que_quiere_aprender || null,
          nivel_acordeon: lead.nivel_acordeon || null,
          productos_consultados: lead.productos_consultados || [],
          nivel_interes: lead.nivel_interes || null,
          pagina_origen: lead.pagina_origen || null,
          created_at: lead.created_at,
        },
        sugerencia_mensaje: `¡Hola${nombre ? " " + nombre : ""}! 👋 Soy Juancho de Academia Vallenata Online. Vi que te interesó ${tema}. ¿Quieres que te ayude a empezar hoy mismo? 🪗`,
      };

      try {
        const r = await fetch(cfg.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-webhook-secret": cfg.secret || "" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10_000),
        });
        if (r.ok) {
          await sb.from("leads_chat_anonimos").update({ seguimiento_wa_enviado: true, seguimiento_wa_at: new Date().toISOString() }).eq("id", lead.id);
          enviados++;
        } else {
          console.error("webhook SaaS respondió", r.status, "para lead", lead.id);
        }
      } catch (e) {
        console.error("error POST webhook lead", lead.id, (e as Error).message);
      }
    }

    return json({ ok: true, revisados: leads.length, enviados });
  } catch (err) {
    console.error("seguimiento-leads:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
