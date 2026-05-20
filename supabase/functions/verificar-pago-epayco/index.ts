// @ts-nocheck
// Fallback: si el webhook de ePayco no llegó, el frontend envía los mismos
// params que ePayco pone en la URL de respuesta. Esta función verifica la
// firma y procesa el pago igual que el webhook.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = Deno.env.get("SITE_URL") || "https://academiavallenataonline.com"
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": SITE_URL,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STATUS_MAP: Record<string, string> = {
  "1": "aceptada", "2": "rechazada", "3": "pendiente",
  "4": "fallida",  "6": "rechazada", "9": "pendiente",
  "10": "cancelada", "11": "expirada",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function crearInscripcion(supabase: any, usuarioId: string, campo: string, valor: string) {
  const { data: existente } = await supabase
    .from("inscripciones").select("id")
    .eq("usuario_id", usuarioId).eq(campo, valor).maybeSingle();
  if (existente) return;
  await supabase.from("inscripciones").insert({
    usuario_id: usuarioId, [campo]: valor,
    fecha_inscripcion: new Date().toISOString(),
    estado: "activo", porcentaje_completado: 0, completado: false, progreso: 0,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  const epaycoCustomerId = Deno.env.get("EPAYCO_CUSTOMER_ID");
  const epaycoPKey = Deno.env.get("EPAYCO_P_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!epaycoCustomerId || !epaycoPKey) return json({ error: "Credenciales ePayco no configuradas" }, 500);

  try {
    const body = await req.json();
    const xRefPayco      = String(body.x_ref_payco   || "").trim();
    const xCodResponse   = String(body.x_cod_response || "").trim();
    const xTransactionId = String(body.x_transaction_id || "").trim();
    const xAmount        = String(body.x_amount       || "").trim();
    const xCurrencyCode  = String(body.x_currency_code || "").trim();
    const xSignature     = String(body.x_signature    || "").trim().toLowerCase();

    if (!xRefPayco || !xCodResponse || !xTransactionId || !xAmount || !xCurrencyCode || !xSignature) {
      return json({ error: "Parámetros de ePayco incompletos" }, 400);
    }

    // Verificar firma
    const signSrc = [epaycoCustomerId, epaycoPKey, xRefPayco, xTransactionId, xAmount, xCurrencyCode].join("^");
    const expected = await sha256Hex(signSrc);
    if (expected.toLowerCase() !== xSignature) {
      console.error("❌ Firma inválida en verificar-pago-epayco");
      return json({ error: "Firma inválida" }, 401);
    }

    const estado = STATUS_MAP[xCodResponse];
    if (!estado) return json({ error: "x_cod_response no soportado" }, 400);

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verificar si ya fue procesado
    const { data: pagoActual } = await supabase
      .from("pagos_epayco").select("id, estado").eq("ref_payco", xRefPayco).maybeSingle();

    if (!pagoActual) return json({ error: "Pago no encontrado", ref: xRefPayco }, 404);
    if (pagoActual.estado !== "pendiente") {
      // Ya fue procesado por el webhook, no hacer nada
      return json({ ok: true, estado: pagoActual.estado, yaProcessado: true });
    }

    // Actualizar pago
    const { data, error } = await supabase
      .from("pagos_epayco")
      .update({ estado, cod_respuesta: xCodResponse, fecha_transaccion: new Date().toISOString() })
      .eq("ref_payco", xRefPayco)
      .select("id, estado, email, nombre, nombre_producto, valor, usuario_id, curso_id, tutorial_id, paquete_id, membresia_id")
      .maybeSingle();

    if (error || !data) return json({ error: "Error actualizando pago" }, 500);

    console.log(`✅ Pago ${xRefPayco} actualizado a estado=${estado} vía verificación forzada`);

    if (estado === "aceptada" && data.usuario_id) {
      // Inscripciones
      if (data.curso_id)    await crearInscripcion(supabase, data.usuario_id, "curso_id", data.curso_id);
      if (data.tutorial_id) await crearInscripcion(supabase, data.usuario_id, "tutorial_id", data.tutorial_id);
      if (data.paquete_id)  await crearInscripcion(supabase, data.usuario_id, "paquete_id", data.paquete_id);
      if (data.membresia_id) await crearInscripcion(supabase, data.usuario_id, "membresia_id", data.membresia_id);

      // Notificación en plataforma
      await supabase.from("notificaciones").insert({
        usuario_id: data.usuario_id,
        tipo: "pago_confirmado",
        titulo: "¡Pago confirmado!",
        mensaje: `Tu compra de "${data.nombre_producto || 'contenido'}" fue procesada exitosamente.`,
        icono: "💳", categoria: "pago", prioridad: "alta",
        url_accion: "/panel-estudiante", entidad_id: data.id, entidad_tipo: "pago",
      });

      // Email confirmación
      const emailDest = data.email;
      if (emailDest) {
        fetch(`${supabaseUrl}/functions/v1/enviar-email`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${serviceKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "pago_exitoso", destinatario: emailDest,
            nombre: data.nombre || "Estudiante",
            extra: {
              curso: data.nombre_producto || "",
              monto: data.valor ? `$${Number(data.valor).toLocaleString("es-CO")} COP` : "",
            },
          }),
        }).catch(() => {});
      }
    }

    return json({ ok: true, estado, procesado: true });
  } catch (err: unknown) {
    console.error("❌ Error en verificar-pago-epayco:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
