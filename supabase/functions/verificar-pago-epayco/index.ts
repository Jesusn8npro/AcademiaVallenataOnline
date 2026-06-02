// @ts-nocheck
// Verificación de pago desde el frontend (página /pago-exitoso).
//
// La página de éxito recibe en la URL el `ref_payco` HEXADECIMAL de ePayco
// (ej. 6a1b7e33616a532388bf1f35). Con ese ref consultamos la API PÚBLICA de
// validación de ePayco para conocer el estado REAL de la transacción, sin
// depender del P_KEY ni de la firma. Luego actualizamos el pago en nuestra BD
// (clave = invoice, ej. MEM-A7503CD42-...) y, si fue aceptado, activamos las
// inscripciones / la membresía.
//
// Este es el camino PRINCIPAL de activación. El webhook server-to-server queda
// como respaldo (depende del P_KEY).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ACAO '*' : endpoint protegido por JWT (verify_jwt) y sin cookies → seguro y
// permite localhost + ambos dominios de producción.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EPAYCO_VALIDATION_URL = "https://secure.epayco.co/validation/v1/reference";

const STATUS_MAP: Record<string, string> = {
  "1": "aceptada", "2": "rechazada", "3": "pendiente",
  "4": "fallida", "6": "rechazada", "9": "pendiente",
  "10": "cancelada", "11": "expirada",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
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

async function inscribirTutorialesDelPaquete(supabase: any, usuarioId: string, paqueteId: string) {
  const { data: items } = await supabase
    .from("paquetes_tutoriales_items").select("tutorial_id")
    .eq("paquete_id", paqueteId).eq("incluido", true);
  for (const item of items || []) {
    if (item.tutorial_id) await crearInscripcion(supabase, usuarioId, "tutorial_id", item.tutorial_id);
  }
}

// Activa la membresía: historial en suscripciones_usuario + plan en el perfil.
async function activarMembresia(supabase: any, data: any, refPayco: string) {
  const { data: yaExiste } = await supabase
    .from("suscripciones_usuario").select("id").eq("ref_payco", refPayco).maybeSingle();
  if (yaExiste) return null;

  const { data: m } = await supabase
    .from("membresias")
    .select("nombre, beneficios, precio_mensual, precio_anual, permisos")
    .eq("id", data.membresia_id).maybeSingle();
  if (!m) return null;

  const valor = Number(data.valor) || 0;
  const esVitalicio = m.permisos?.facturacion === "unica";
  const precioAnual = Number(m.precio_anual) || 0;
  const precioMensual = Number(m.precio_mensual) || 0;
  const esAnual = !esVitalicio && precioAnual > 0 &&
    Math.abs(valor - precioAnual) < Math.abs(valor - precioMensual);

  const ahora = new Date();
  let periodo = "mensual";
  let fechaVenc: Date;
  if (esVitalicio) { periodo = "vitalicio"; fechaVenc = new Date("2999-12-31T00:00:00Z"); }
  else if (esAnual) { periodo = "anual"; fechaVenc = new Date(ahora); fechaVenc.setFullYear(fechaVenc.getFullYear() + 1); }
  else { periodo = "mensual"; fechaVenc = new Date(ahora); fechaVenc.setMonth(fechaVenc.getMonth() + 1); }

  const hoyStr = ahora.toISOString().slice(0, 10);
  const vencStr = fechaVenc.toISOString().slice(0, 10);

  await supabase.from("suscripciones_usuario")
    .update({ estado: "vencida", updated_at: new Date().toISOString() })
    .eq("usuario_id", data.usuario_id).eq("estado", "activa");

  await supabase.from("suscripciones_usuario").insert({
    usuario_id: data.usuario_id, membresia_id: data.membresia_id,
    estado: "activa", fecha_inicio: hoyStr, fecha_vencimiento: vencStr,
    precio_pagado: valor, periodo, metodo_pago: "epayco",
    ref_payco: refPayco, origen_suscripcion: "web",
  });

  await supabase.from("perfiles").update({
    membresia_activa_id: data.membresia_id,
    fecha_vencimiento_membresia: vencStr,
  }).eq("id", data.usuario_id);

  return { nombre: m.nombre, beneficios: m.beneficios, vencStr, periodo };
}

// Consume el cupón usado en la compra: lo marca como usado por este usuario
// (una vez por usuario) e incrementa el contador global. Idempotente.
async function consumirCupon(supabase: any, codigo: string | null, usuarioId: string, refPayco: string) {
  if (!codigo) return;
  const { data: cupon } = await supabase
    .from("cupones").select("id, usos_actuales").eq("codigo", codigo.toUpperCase().trim()).maybeSingle();
  if (!cupon) return;
  const { data: yaUsado } = await supabase
    .from("cupones_uso").select("id").eq("cupon_id", cupon.id).eq("usuario_id", usuarioId).maybeSingle();
  if (yaUsado) return;
  await supabase.from("cupones_uso").insert({
    cupon_id: cupon.id, usuario_id: usuarioId, descuento_aplicado: 0, referencia: refPayco,
  });
  await supabase.from("cupones").update({ usos_actuales: (cupon.usos_actuales || 0) + 1 }).eq("id", cupon.id);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const body = await req.json().catch(() => ({}));
    // El frontend envía el ref hexadecimal de ePayco (param `ref_payco` de la URL).
    const refHex = String(body.ref_payco || body.ref || body.x_ref_payco || "").trim();
    if (!refHex) return json({ error: "Falta ref_payco" }, 400);

    // Consulta autoritativa a ePayco (pública, sin P_KEY).
    const resp = await fetch(`${EPAYCO_VALIDATION_URL}/${encodeURIComponent(refHex)}`);
    if (!resp.ok) return json({ error: `Validación ePayco HTTP ${resp.status}` }, 502);
    const vjson = await resp.json();
    if (vjson?.success === false || !vjson?.data) {
      return json({ error: "ePayco no devolvió datos para ese ref", detalle: vjson?.text_response || null }, 404);
    }
    const v = vjson.data;

    const codResponse = String(v.x_cod_response ?? v.x_cod_respuesta ?? "").trim();
    const estado = STATUS_MAP[codResponse];
    if (!estado) return json({ error: "x_cod_response no soportado", cod: codResponse }, 400);

    const invoice = String(v.x_id_invoice || v.x_id_factura || "").trim();
    if (!invoice) return json({ error: "ePayco no devolvió invoice" }, 422);

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: pagoActual } = await supabase
      .from("pagos_epayco").select("id, estado").eq("ref_payco", invoice).maybeSingle();
    if (!pagoActual) return json({ error: "Pago no encontrado", invoice }, 404);

    const yaEstabaAceptada = pagoActual.estado === "aceptada";

    const { data, error } = await supabase
      .from("pagos_epayco")
      .update({
        estado,
        cod_respuesta: codResponse,
        respuesta: String(v.x_response_reason_text || v.x_response || "").trim(),
        fecha_transaccion: new Date().toISOString(),
      })
      .eq("ref_payco", invoice)
      .select("id, ref_payco, estado, nombre_producto, valor, usuario_id, curso_id, tutorial_id, paquete_id, membresia_id, cupon_codigo")
      .maybeSingle();

    if (error || !data) return json({ error: "Error actualizando pago", detalle: error?.message }, 500);

    if (estado === "aceptada" && !yaEstabaAceptada && data.usuario_id) {
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

      // Consumir el cupón solo ahora que el pago está confirmado.
      await consumirCupon(supabase, data.cupon_codigo, data.usuario_id, data.ref_payco);

      await supabase.from("notificaciones").insert({
        usuario_id: data.usuario_id,
        tipo: "pago_confirmado",
        titulo: "¡Pago confirmado!",
        mensaje: `Tu compra de "${data.nombre_producto || 'contenido'}" fue procesada exitosamente. ¡Ya tienes acceso completo!`,
        icono: "💳", categoria: "pago", prioridad: "alta",
        url_accion: "/mis-cursos", entidad_id: data.id, entidad_tipo: "pago",
      });

      if (emailUsuario) {
        const montoTxt = data.valor ? `$${Number(data.valor).toLocaleString("es-CO")} COP` : "";
        const extra = datosMembresia
          ? {
              tipo_compra: "membresia",
              plan: datosMembresia.nombre || "",
              beneficios: JSON.stringify(datosMembresia.beneficios || []),
              vencimiento: datosMembresia.vencStr || "",
              periodo: datosMembresia.periodo || "",
              monto: montoTxt,
              email_usuario: emailUsuario,
            }
          : { curso: data.nombre_producto || "", monto: montoTxt };
        fetch(`${supabaseUrl}/functions/v1/enviar-email`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${serviceKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ tipo: "pago_exitoso", destinatario: emailUsuario, nombre: nombreUsuario, extra }),
        }).catch(() => {});
      }
    }

    return json({ ok: true, estado, invoice, procesado: estado === "aceptada" && !yaEstabaAceptada });
  } catch (err: unknown) {
    console.error("❌ Error en verificar-pago-epayco:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
