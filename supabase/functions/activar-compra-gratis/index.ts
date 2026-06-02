// @ts-nocheck
// Activa una compra cuyo total quedó en $0 por un cupón de descuento.
//
// El frontend NO puede simplemente marcar "pago exitoso" para una compra gratis:
// hay que registrar el pago, crear la inscripción / activar la membresía y consumir
// el cupón, igual que haría ePayco en una compra pagada. Esta función hace todo eso
// server-side y, sobre todo, RE-VALIDA el precio y el cupón con service_role para que
// nadie pueda llamarla directamente y obtener contenido gratis sin un cupón válido.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ACAO '*' : endpoint protegido por JWT (verify_jwt) y sin cookies → seguro y
// permite localhost + ambos dominios de producción.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

const TABLA_POR_TIPO: Record<string, { tabla: string; campo: string; tituloCol: string }> = {
  tutorial: { tabla: "tutoriales", campo: "tutorial_id", tituloCol: "titulo" },
  curso: { tabla: "cursos", campo: "curso_id", tituloCol: "titulo" },
  paquete: { tabla: "paquetes", campo: "paquete_id", tituloCol: "titulo" },
  membresia: { tabla: "membresias", campo: "membresia_id", tituloCol: "nombre" },
};

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

async function activarMembresia(supabase: any, membresiaId: string, usuarioId: string, valor: number, refPayco: string) {
  const { data: m } = await supabase
    .from("membresias").select("nombre, precio_mensual, precio_anual, permisos")
    .eq("id", membresiaId).maybeSingle();
  if (!m) return;

  const esVitalicio = m.permisos?.facturacion === "unica";
  const ahora = new Date();
  let periodo = "mensual";
  let fechaVenc = new Date(ahora);
  if (esVitalicio) { periodo = "vitalicio"; fechaVenc = new Date("2999-12-31T00:00:00Z"); }
  else { fechaVenc.setMonth(fechaVenc.getMonth() + 1); }

  const hoyStr = ahora.toISOString().slice(0, 10);
  const vencStr = fechaVenc.toISOString().slice(0, 10);

  await supabase.from("suscripciones_usuario")
    .update({ estado: "vencida", updated_at: new Date().toISOString() })
    .eq("usuario_id", usuarioId).eq("estado", "activa");

  await supabase.from("suscripciones_usuario").insert({
    usuario_id: usuarioId, membresia_id: membresiaId,
    estado: "activa", fecha_inicio: hoyStr, fecha_vencimiento: vencStr,
    precio_pagado: valor, periodo, metodo_pago: "cupon",
    ref_payco: refPayco, origen_suscripcion: "web",
  });

  await supabase.from("perfiles").update({
    membresia_activa_id: membresiaId,
    fecha_vencimiento_membresia: vencStr,
  }).eq("id", usuarioId);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    // 1. Identificar al usuario desde su JWT.
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "No autenticado" }, 401);

    const body = await req.json().catch(() => ({}));
    const tipo = String(body.tipo || "").trim();
    const contenidoId = String(body.contenido_id || "").trim();
    const cuponCodigo = String(body.cupon_codigo || "").toUpperCase().trim();
    const datos = body.datos || {};

    const cfg = TABLA_POR_TIPO[tipo];
    if (!cfg || !contenidoId) return json({ error: "Datos de contenido inválidos" }, 400);

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 2. Precio real del contenido (autoritativo, server-side).
    const { data: contenido } = await supabase
      .from(cfg.tabla)
      .select(`id, ${cfg.tituloCol}, ${tipo === "membresia" ? "precio_mensual, precio_anual" : "precio_normal, precio_rebajado"}`)
      .eq("id", contenidoId).maybeSingle();
    if (!contenido) return json({ error: "Contenido no encontrado" }, 404);

    const precio = tipo === "membresia"
      ? Number(contenido.precio_mensual || 0)
      : Number(contenido.precio_rebajado || contenido.precio_normal || 0);
    const titulo = contenido[cfg.tituloCol] || "Contenido";

    // 3. Validar el cupón. Si el contenido ya es gratis (precio 0) no se exige cupón;
    //    si tiene precio, el cupón es obligatorio y debe cubrir el total.
    let cupon: any = null;
    let descuento = 0;
    if (precio > 0) {
      if (!cuponCodigo) return json({ error: "Falta el cupón" }, 400);
      const { data: c } = await supabase
        .from("cupones").select("*").eq("codigo", cuponCodigo).eq("activo", true).maybeSingle();
      if (!c) return json({ error: "Cupón no encontrado o inactivo" }, 400);
      if (c.fecha_expiracion && new Date(c.fecha_expiracion) < new Date()) {
        return json({ error: "Cupón expirado" }, 400);
      }
      if (c.usos_maximos !== null && c.usos_actuales >= c.usos_maximos) {
        return json({ error: "Cupón sin usos disponibles" }, 400);
      }
      const { data: usoPrevio } = await supabase
        .from("cupones_uso").select("id").eq("cupon_id", c.id).eq("usuario_id", user.id).maybeSingle();
      if (usoPrevio) return json({ error: "Ya usaste este cupón" }, 400);
      if (c.valor_minimo && precio < Number(c.valor_minimo)) {
        return json({ error: "El monto no alcanza el mínimo del cupón" }, 400);
      }
      descuento = c.tipo === "porcentaje"
        ? Math.round(precio * (Number(c.valor) / 100))
        : Math.min(Number(c.valor), precio);
      cupon = c;
    }

    const precioFinal = Math.max(0, precio - descuento);

    // 4. Esta función SOLO activa compras gratis. Si queda saldo, va por ePayco.
    if (precioFinal > 0) {
      return json({ error: "El cupón no cubre el total; usa el pago normal", precio_final: precioFinal }, 400);
    }

    // 5. Idempotencia: si ya tiene acceso, no duplicar.
    const { data: yaInscrito } = await supabase
      .from("inscripciones").select("id")
      .eq("usuario_id", user.id).eq(cfg.campo, contenidoId).maybeSingle();
    const { data: yaSuscrito } = tipo === "membresia"
      ? await supabase.from("suscripciones_usuario").select("id")
          .eq("usuario_id", user.id).eq("membresia_id", contenidoId).eq("estado", "activa").maybeSingle()
      : { data: null };
    if (yaInscrito || yaSuscrito) return json({ ok: true, ya_activo: true });

    const refPayco = `FREE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // 6. Guardar facturación en el perfil.
    const perfilUpd: Record<string, string> = {};
    if (datos.nombre) perfilUpd.nombre = datos.nombre;
    if (datos.apellido) perfilUpd.apellido = datos.apellido;
    if (datos.telefono) perfilUpd.whatsapp = datos.telefono;
    if (datos.tipo_documento) perfilUpd.documento_tipo = datos.tipo_documento;
    if (datos.numero_documento) perfilUpd.documento_numero = datos.numero_documento;
    if (datos.direccion) perfilUpd.direccion_completa = datos.direccion;
    if (datos.ciudad) perfilUpd.ciudad = datos.ciudad;
    if (datos.pais) perfilUpd.pais = datos.pais;
    if (datos.codigo_postal) perfilUpd.codigo_postal = datos.codigo_postal;
    if (Object.keys(perfilUpd).length) await supabase.from("perfiles").update(perfilUpd).eq("id", user.id);

    // 7. Registrar el pago (estado aceptada, valor 0) para trazabilidad.
    const { error: errPago } = await supabase.from("pagos_epayco").insert({
      usuario_id: user.id,
      [cfg.campo]: contenidoId,
      nombre_producto: titulo,
      descripcion: `${tipo}: ${titulo} (cupón ${cuponCodigo})`,
      valor: 0, iva: 0, base_iva: 0, moneda: "COP",
      ref_payco: refPayco, factura: refPayco,
      estado: "aceptada", cod_respuesta: "1", metodo_pago: cupon ? "cupon" : "gratis",
      cupon_codigo: cupon ? cuponCodigo : null,
      fecha_transaccion: new Date().toISOString(),
      apellido: datos.apellido || null,
      telefono: datos.telefono || null, whatsapp: datos.telefono || null,
      documento_tipo: datos.tipo_documento || null, documento_numero: datos.numero_documento || null,
      direccion_completa: datos.direccion || null, ciudad: datos.ciudad || null,
      pais: datos.pais || null, codigo_postal: datos.codigo_postal || null,
    });
    if (errPago) console.error("❌ pago insert:", errPago.message);

    // 8. Dar acceso.
    if (tipo === "membresia") {
      await activarMembresia(supabase, contenidoId, user.id, 0, refPayco);
    } else if (tipo === "paquete") {
      await crearInscripcion(supabase, user.id, "paquete_id", contenidoId);
      await inscribirTutorialesDelPaquete(supabase, user.id, contenidoId);
    } else {
      await crearInscripcion(supabase, user.id, cfg.campo, contenidoId);
    }

    // 9. Consumir el cupón (idempotente por usuario). Solo si hubo cupón.
    if (cupon) {
      await supabase.from("cupones_uso").insert({
        cupon_id: cupon.id, usuario_id: user.id,
        descuento_aplicado: descuento, referencia: refPayco,
      });
      await supabase.from("cupones").update({ usos_actuales: (cupon.usos_actuales || 0) + 1 }).eq("id", cupon.id);
    }

    // 10. Notificar.
    await supabase.from("notificaciones").insert({
      usuario_id: user.id,
      tipo: "pago_confirmado",
      titulo: "¡Compra confirmada!",
      mensaje: `Tu compra de "${titulo}" con cupón fue procesada. ¡Ya tienes acceso completo!`,
      icono: "🎟️", categoria: "pago", prioridad: "alta",
      url_accion: "/mis-cursos", entidad_tipo: "pago",
    });

    return json({ ok: true, ref_payco: refPayco });
  } catch (err: unknown) {
    console.error("❌ activar-compra-gratis:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
