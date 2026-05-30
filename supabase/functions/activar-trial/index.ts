// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Activa una prueba gratis de 3 días del plan "Pro" para el usuario autenticado.
// Reglas: solo una prueba por usuario (origen_suscripcion='promocion') y solo si
// no tiene ya una membresía activa. El acceso lo da perfiles.membresia_activa_id.
const PLAN_PRO = "c9529121-1afd-437b-b714-192b2f09995c";
const DIAS_TRIAL = 3;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: "Configuración del servidor incompleta" }, 500);
  }

  // Identificar al usuario por su JWT (auth = la sesión del navegador).
  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "Debes iniciar sesión para activar tu prueba" }, 401);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ¿Ya usó su prueba alguna vez?
  const { data: trialPrevio } = await admin
    .from("suscripciones_usuario")
    .select("id")
    .eq("usuario_id", user.id)
    .eq("origen_suscripcion", "promocion")
    .maybeSingle();
  if (trialPrevio) return json({ error: "Ya usaste tu prueba gratis" }, 409);

  // ¿Ya tiene una membresía activa? (no degradar a trial)
  const hoyStr = new Date().toISOString().slice(0, 10);
  const { data: perfil } = await admin
    .from("perfiles")
    .select("membresia_activa_id, fecha_vencimiento_membresia")
    .eq("id", user.id)
    .maybeSingle();
  if (perfil?.membresia_activa_id &&
      (!perfil.fecha_vencimiento_membresia || perfil.fecha_vencimiento_membresia >= hoyStr)) {
    return json({ error: "Ya tienes una membresía activa" }, 409);
  }

  const ahora = new Date();
  const venc = new Date(ahora);
  venc.setDate(venc.getDate() + DIAS_TRIAL);
  const vencStr = venc.toISOString().slice(0, 10);

  // Desactivar cualquier activa previa (por seguridad: índice único de 1 activa/usuario).
  await admin.from("suscripciones_usuario")
    .update({ estado: "vencida", updated_at: new Date().toISOString() })
    .eq("usuario_id", user.id)
    .eq("estado", "activa");

  const { error: errSus } = await admin.from("suscripciones_usuario").insert({
    usuario_id: user.id,
    membresia_id: PLAN_PRO,
    estado: "activa",
    fecha_inicio: hoyStr,
    fecha_vencimiento: vencStr,
    precio_pagado: 0,
    periodo: "mensual",
    metodo_pago: "trial",
    origen_suscripcion: "promocion",
  });
  if (errSus) return json({ error: "No se pudo crear la prueba: " + errSus.message }, 500);

  const { error: errPerfil } = await admin.from("perfiles").update({
    membresia_activa_id: PLAN_PRO,
    fecha_vencimiento_membresia: vencStr,
  }).eq("id", user.id);
  if (errPerfil) return json({ error: "No se pudo activar la prueba" }, 500);

  return json({ success: true, vence: vencStr });
});
