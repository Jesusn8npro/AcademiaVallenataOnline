// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STATUS_BY_RESPONSE_CODE: Record<string, string> = {
  "1": "aceptada",
  "2": "rechazada",
  "3": "pendiente",
  "4": "fallida",
  "6": "rechazada",
  "9": "pendiente",
  "10": "cancelada",
  "11": "expirada",
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function normalizeValue(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

async function parsePayload(request: Request): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    return Object.fromEntries(
      Object.entries(body ?? {}).map(([key, value]) => [key, normalizeValue(value)]),
    );
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    return Object.fromEntries(
      Array.from(formData.entries()).map(([key, value]) => [key, normalizeValue(value)]),
    );
  }

  const rawBody = await request.text();
  const searchParams = new URLSearchParams(rawBody);
  return Object.fromEntries(
    Array.from(searchParams.entries()).map(([key, value]) => [key, normalizeValue(value)]),
  );
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// Crea la inscripción en la tabla inscripciones para el contenido comprado.
// Usa check-then-insert para ser idempotente (ePayco puede llamar el webhook varias veces).
async function crearInscripcion(
  supabase: ReturnType<typeof createClient>,
  usuarioId: string,
  campo: string,
  valor: string,
): Promise<void> {
  const { data: existente } = await supabase
    .from("inscripciones")
    .select("id")
    .eq("usuario_id", usuarioId)
    .eq(campo, valor)
    .maybeSingle();

  if (existente) return;

  const { error } = await supabase.from("inscripciones").insert({
    usuario_id: usuarioId,
    [campo]: valor,
    fecha_inscripcion: new Date().toISOString(),
    estado: "activo",
    porcentaje_completado: 0,
    completado: false,
    progreso: 0,
  });

  if (error) {
    console.error(`❌ Error inscribiendo ${campo}=${valor}:`, error.message);
  } else {
    console.log(`✅ Inscripción creada: ${campo}=${valor} para usuario=${usuarioId}`);
  }
}

// Para paquetes: inscribe al usuario en cada tutorial del paquete además del paquete mismo.
async function inscribirTutorialesDelPaquete(
  supabase: ReturnType<typeof createClient>,
  usuarioId: string,
  paqueteId: string,
): Promise<void> {
  const { data: items, error } = await supabase
    .from("paquetes_tutoriales_items")
    .select("tutorial_id")
    .eq("paquete_id", paqueteId)
    .eq("incluido", true);

  if (error || !items?.length) return;

  for (const item of items) {
    if (item.tutorial_id) {
      await crearInscripcion(supabase, usuarioId, "tutorial_id", item.tutorial_id);
    }
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (request.method !== "POST") {
    return jsonResponse({ success: false, error: "Metodo no permitido" }, 405);
  }

  const epaycoCustomerId = Deno.env.get("EPAYCO_CUSTOMER_ID");
  const epaycoPKey = Deno.env.get("EPAYCO_P_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!epaycoCustomerId || !epaycoPKey) {
    return jsonResponse({ success: false, error: "Variables de ePayco no configuradas" }, 500);
  }
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return jsonResponse({ success: false, error: "Variables de Supabase no configuradas" }, 500);
  }

  try {
    const payload = await parsePayload(request);

    const xRefPayco = normalizeValue(payload.x_ref_payco);
    const xCodResponse = normalizeValue(payload.x_cod_response);
    const xTransactionId = normalizeValue(payload.x_transaction_id);
    const xAmount = normalizeValue(payload.x_amount);
    const xCurrencyCode = normalizeValue(payload.x_currency_code);
    const xSignature = normalizeValue(payload.x_signature).toLowerCase();
    const xResponseReasonText = normalizeValue(payload.x_response_reason_text);

    if (!xRefPayco || !xCodResponse || !xTransactionId || !xAmount || !xCurrencyCode || !xSignature) {
      return jsonResponse({ success: false, error: "Payload incompleto" }, 400);
    }

    const estado = STATUS_BY_RESPONSE_CODE[xCodResponse];
    if (!estado) {
      return jsonResponse({ success: false, error: "x_cod_response no soportado" }, 400);
    }

    const signatureSource = [epaycoCustomerId, epaycoPKey, xRefPayco, xTransactionId, xAmount, xCurrencyCode].join("^");
    const expectedSignature = await sha256Hex(signatureSource);
    if (expectedSignature.toLowerCase() !== xSignature) {
      return jsonResponse({ success: false, error: "Firma invalida" }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase
      .from("pagos_epayco")
      .update({
        estado,
        cod_respuesta: xCodResponse,
        respuesta: xResponseReasonText,
        fecha_transaccion: new Date().toISOString(),
      })
      .eq("ref_payco", xRefPayco)
      .select("id, ref_payco, estado, email, nombre, nombre_producto, valor, usuario_id, curso_id, tutorial_id, paquete_id, membresia_id")
      .maybeSingle();

    if (error) {
      console.error("❌ Error actualizando pago ePayco:", error);
      return jsonResponse({ success: false, error: "No se pudo actualizar el pago" }, 500);
    }

    if (!data) {
      console.warn("⚠️ Pago no encontrado con ref_payco:", xRefPayco);
      return jsonResponse({ success: false, error: "Pago no encontrado" }, 404);
    }

    // ── Acciones post-pago solo cuando es ACEPTADA ──────────────────────────
    if (estado === "aceptada") {

      // 1. Email de confirmación (fire-and-forget)
      if (data.email) {
        fetch(`${supabaseUrl}/functions/v1/enviar-email`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseServiceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tipo: "pago_exitoso",
            destinatario: data.email,
            nombre: data.nombre || "Estudiante",
            extra: {
              curso: data.nombre_producto || "",
              monto: data.valor ? `$${Number(data.valor).toLocaleString("es-CO")} COP` : "",
            },
          }),
        }).catch(() => {});
      }

      // 2. Crear inscripción automática + notificación (fire-and-forget)
      if (data.usuario_id) {
        (async () => {
          try {
            // Inscripciones
            if (data.curso_id) {
              await crearInscripcion(supabase, data.usuario_id, "curso_id", data.curso_id);
            }
            if (data.tutorial_id) {
              await crearInscripcion(supabase, data.usuario_id, "tutorial_id", data.tutorial_id);
            }
            if (data.paquete_id) {
              await crearInscripcion(supabase, data.usuario_id, "paquete_id", data.paquete_id);
              await inscribirTutorialesDelPaquete(supabase, data.usuario_id, data.paquete_id);
            }
            if (data.membresia_id) {
              await crearInscripcion(supabase, data.usuario_id, "membresia_id", data.membresia_id);
            }

            // Notificación en la plataforma
            await supabase.from("notificaciones").insert({
              usuario_id: data.usuario_id,
              tipo: "pago_confirmado",
              titulo: "¡Pago confirmado!",
              mensaje: `Tu compra de "${data.nombre_producto || 'contenido'}" fue procesada exitosamente. ¡Ya tienes acceso completo!`,
              icono: "💳",
              categoria: "pago",
              prioridad: "alta",
              url_accion: "/panel-estudiante",
              entidad_id: data.id,
              entidad_tipo: "pago",
            });
          } catch (err) {
            console.error("❌ Error en post-pago:", err);
          }
        })();
      } else {
        console.warn("⚠️ Pago aceptado sin usuario_id — inscripción manual requerida:", xRefPayco);
      }
    }

    return jsonResponse({ success: true }, 200);
  } catch (error) {
    console.error("Error procesando webhook de ePayco:", error);
    return jsonResponse({ success: false, error: "Error interno del webhook" }, 500);
  }
});
