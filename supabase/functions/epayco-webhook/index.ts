// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ⚠️ Este webhook (confirmación server-to-server de ePayco) valida la firma SHA256
// con EPAYCO_CUSTOMER_ID y EPAYCO_P_KEY. La firma SOLO coincide si EPAYCO_P_KEY es
// el "P_KEY" real de tu panel de ePayco (distinto del PRIVATE_KEY). Mientras eso no
// esté bien configurado, este webhook responde 401 y NO activa nada.
//
// El camino PRINCIPAL de activación es la verificación desde el frontend
// (Edge Function `verificar-pago-epayco`, llamada desde la página /pago-exitoso),
// que consulta la API pública de ePayco con el ref hexadecimal y NO depende del
// P_KEY. Este webhook queda como respaldo redundante.

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

// ePayco envía los parámetros en el query string y/o en el body. Mezclamos ambos.
async function parsePayload(request: Request): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  const url = new URL(request.url);
  for (const [key, value] of url.searchParams.entries()) {
    result[key] = normalizeValue(value);
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = await request.json();
      for (const [key, value] of Object.entries(body ?? {})) result[key] = normalizeValue(value);
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) result[key] = normalizeValue(value);
    } else {
      const rawBody = await request.text();
      if (rawBody) {
        for (const [key, value] of new URLSearchParams(rawBody).entries()) result[key] = normalizeValue(value);
      }
    }
  } catch {
    // body vacío/no parseable: usamos solo el query string
  }

  return result;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Crea la inscripción en la tabla inscripciones para el contenido comprado.
// Idempotente (ePayco puede llamar el webhook varias veces).
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

  if (error) console.error(`❌ Error inscribiendo ${campo}=${valor}:`, error.message);
}

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
    if (item.tutorial_id) await crearInscripcion(supabase, usuarioId, "tutorial_id", item.tutorial_id);
  }
}

// Activa la membresía: registra la suscripción (historial) y activa el plan en el
// perfil (perfiles.membresia_activa_id + fecha_vencimiento). Idempotente vía ref_payco.
async function activarMembresia(
  supabase: ReturnType<typeof createClient>,
  data: Record<string, any>,
  refPayco: string,
): Promise<void> {
  const { data: yaExiste } = await supabase
    .from("suscripciones_usuario")
    .select("id")
    .eq("ref_payco", refPayco)
    .maybeSingle();
  if (yaExiste) {
    console.log(`↩️ Suscripción ya registrada para ref ${refPayco}, omito`);
    return null;
  }

  const { data: m, error: errM } = await supabase
    .from("membresias")
    .select("nombre, beneficios, precio_mensual, precio_anual, permisos")
    .eq("id", data.membresia_id)
    .maybeSingle();
  if (errM || !m) {
    console.error("❌ Membresía no encontrada:", data.membresia_id);
    return null;
  }

  const valor = Number(data.valor) || 0;
  const esVitalicio = m.permisos?.facturacion === "unica";
  const precioAnual = Number(m.precio_anual) || 0;
  const precioMensual = Number(m.precio_mensual) || 0;
  const esAnual = !esVitalicio && precioAnual > 0 &&
    Math.abs(valor - precioAnual) < Math.abs(valor - precioMensual);

  const ahora = new Date();
  let periodo = "mensual";
  let fechaVenc: Date;
  if (esVitalicio) {
    periodo = "vitalicio";
    fechaVenc = new Date("2999-12-31T00:00:00Z");
  } else if (esAnual) {
    periodo = "anual";
    fechaVenc = new Date(ahora);
    fechaVenc.setFullYear(fechaVenc.getFullYear() + 1);
  } else {
    periodo = "mensual";
    fechaVenc = new Date(ahora);
    fechaVenc.setMonth(fechaVenc.getMonth() + 1);
  }

  const hoyStr = ahora.toISOString().slice(0, 10);
  const vencStr = fechaVenc.toISOString().slice(0, 10);

  // Solo una suscripción activa por usuario: vencer la anterior antes de insertar.
  await supabase.from("suscripciones_usuario")
    .update({ estado: "vencida", updated_at: new Date().toISOString() })
    .eq("usuario_id", data.usuario_id)
    .eq("estado", "activa");

  const { error: errSus } = await supabase.from("suscripciones_usuario").insert({
    usuario_id: data.usuario_id,
    membresia_id: data.membresia_id,
    estado: "activa",
    fecha_inicio: hoyStr,
    fecha_vencimiento: vencStr,
    precio_pagado: valor,
    periodo,
    metodo_pago: "epayco",
    ref_payco: refPayco,
    origen_suscripcion: "web",
  });
  if (errSus) console.error("❌ Error creando suscripción:", errSus.message);

  const { error: errPerfil } = await supabase.from("perfiles").update({
    membresia_activa_id: data.membresia_id,
    fecha_vencimiento_membresia: vencStr,
  }).eq("id", data.usuario_id);

  if (errPerfil) console.error("❌ Error activando membresía en perfil:", errPerfil.message);
  else console.log(`✅ Membresía ${data.membresia_id} activada (${periodo}) para usuario=${data.usuario_id}`);

  return { nombre: m.nombre, beneficios: m.beneficios, vencStr, periodo };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "POST") return jsonResponse({ success: false, error: "Metodo no permitido" }, 405);

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

    // Nuestro identificador interno = invoice (ej. MEM-A7503CD42-...). ePayco lo
    // devuelve como x_id_invoice / x_id_factura. Es la clave de pagos_epayco.
    // (El x_ref_payco numérico es la referencia interna de ePayco, NO nuestra clave.)
    const invoice = normalizeValue(payload.x_id_invoice) || normalizeValue(payload.x_id_factura);

    if (!xRefPayco || !xCodResponse || !xTransactionId || !xAmount || !xCurrencyCode || !xSignature || !invoice) {
      return jsonResponse({ success: false, error: "Payload incompleto" }, 400);
    }

    const estado = STATUS_BY_RESPONSE_CODE[xCodResponse];
    if (!estado) return jsonResponse({ success: false, error: "x_cod_response no soportado" }, 400);

    // Firma según ePayco: SHA256(cust_id ^ p_key ^ x_ref_payco ^ x_transaction_id ^ x_amount ^ x_currency_code)
    const signatureSource = [epaycoCustomerId, epaycoPKey, xRefPayco, xTransactionId, xAmount, xCurrencyCode].join("^");
    const expectedSignature = await sha256Hex(signatureSource);
    if (expectedSignature.toLowerCase() !== xSignature) {
      return jsonResponse({ success: false, error: "Firma invalida" }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Estado previo: evitar repetir efectos secundarios si ya estaba aceptada.
    const { data: pagoPrevio } = await supabase
      .from("pagos_epayco").select("estado").eq("ref_payco", invoice).maybeSingle();
    const yaEstabaAceptada = pagoPrevio?.estado === "aceptada";

    const { data, error } = await supabase
      .from("pagos_epayco")
      .update({
        estado,
        cod_respuesta: xCodResponse,
        respuesta: xResponseReasonText,
        fecha_transaccion: new Date().toISOString(),
      })
      .eq("ref_payco", invoice)
      .select("id, ref_payco, estado, nombre_producto, valor, usuario_id, curso_id, tutorial_id, paquete_id, membresia_id")
      .maybeSingle();

    if (error) {
      console.error("❌ Error actualizando pago ePayco:", error);
      return jsonResponse({ success: false, error: "No se pudo actualizar el pago" }, 500);
    }
    if (!data) {
      console.warn("⚠️ Pago no encontrado con invoice:", invoice);
      return jsonResponse({ success: false, error: "Pago no encontrado" }, 404);
    }

    if (estado === "aceptada" && !yaEstabaAceptada) {
      const montoTxt = data.valor ? `$${Number(data.valor).toLocaleString("es-CO")} COP` : "";

      const enviarCorreo = (email: string, nombre: string, extra: Record<string, any>) => {
        if (!email) return;
        fetch(`${supabaseUrl}/functions/v1/enviar-email`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${supabaseServiceRoleKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ tipo: "pago_exitoso", destinatario: email, nombre: nombre || "Estudiante", extra }),
        }).catch(() => {});
      };

      if (data.usuario_id) {
        (async () => {
          try {
            // El email/nombre del usuario viven en `perfiles` (no en pagos_epayco).
            const { data: perfil } = await supabase
              .from("perfiles").select("correo_electronico, nombre").eq("id", data.usuario_id).maybeSingle();
            const emailUsuario = perfil?.correo_electronico || "";
            const nombreUsuario = perfil?.nombre || "Estudiante";

            if (data.curso_id) await crearInscripcion(supabase, data.usuario_id, "curso_id", data.curso_id);
            if (data.tutorial_id) await crearInscripcion(supabase, data.usuario_id, "tutorial_id", data.tutorial_id);
            if (data.paquete_id) {
              await crearInscripcion(supabase, data.usuario_id, "paquete_id", data.paquete_id);
              await inscribirTutorialesDelPaquete(supabase, data.usuario_id, data.paquete_id);
            }
            let datosMembresia = null;
            if (data.membresia_id) datosMembresia = await activarMembresia(supabase, data, data.ref_payco);

            if (datosMembresia) {
              enviarCorreo(emailUsuario, nombreUsuario, {
                tipo_compra: "membresia",
                plan: datosMembresia.nombre || "",
                beneficios: JSON.stringify(datosMembresia.beneficios || []),
                vencimiento: datosMembresia.vencStr || "",
                periodo: datosMembresia.periodo || "",
                monto: montoTxt,
                email_usuario: emailUsuario,
              });
            } else {
              enviarCorreo(emailUsuario, nombreUsuario, { curso: data.nombre_producto || "", monto: montoTxt });
            }

            await supabase.from("notificaciones").insert({
              usuario_id: data.usuario_id,
              tipo: "pago_confirmado",
              titulo: "¡Pago confirmado!",
              mensaje: `Tu compra de "${data.nombre_producto || 'contenido'}" fue procesada exitosamente. ¡Ya tienes acceso completo!`,
              icono: "💳",
              categoria: "pago",
              prioridad: "alta",
              url_accion: "/mis-cursos",
              entidad_id: data.id,
              entidad_tipo: "pago",
            });
          } catch (err) {
            console.error("❌ Error en post-pago:", err);
          }
        })();
      } else {
        // Sin usuario_id no podemos obtener el correo (vive en perfiles).
        console.warn("⚠️ Pago aceptado sin usuario_id:", invoice);
      }
    }

    return jsonResponse({ success: true }, 200);
  } catch (error) {
    console.error("Error procesando webhook de ePayco:", error);
    return jsonResponse({ success: false, error: "Error interno del webhook" }, 500);
  }
});
