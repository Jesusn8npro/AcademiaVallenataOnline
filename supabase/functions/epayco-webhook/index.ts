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
    headers: {
      "Content-Type": "application/json",
    },
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
    return jsonResponse(
      { success: false, error: "Variables de ePayco no configuradas" },
      500,
    );
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return jsonResponse(
      { success: false, error: "Variables de Supabase no configuradas" },
      500,
    );
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

    if (
      !xRefPayco ||
      !xCodResponse ||
      !xTransactionId ||
      !xAmount ||
      !xCurrencyCode ||
      !xSignature
    ) {
      return jsonResponse(
        { success: false, error: "Payload incompleto" },
        400,
      );
    }

    const estado = STATUS_BY_RESPONSE_CODE[xCodResponse];
    if (!estado) {
      return jsonResponse(
        { success: false, error: "x_cod_response no soportado" },
        400,
      );
    }

    const signatureSource = [
      epaycoCustomerId,
      epaycoPKey,
      xRefPayco,
      xTransactionId,
      xAmount,
      xCurrencyCode,
    ].join("^");

    const expectedSignature = await sha256Hex(signatureSource);

    if (expectedSignature.toLowerCase() !== xSignature) {
      return jsonResponse({ success: false, error: "Firma invalida" }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
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
      .select("id, ref_payco, estado")
      .maybeSingle();

    if (error) {
      console.error("❌ Error actualizando pago ePayco:", error);
      return jsonResponse(
        { success: false, error: "No se pudo actualizar el pago" },
        500,
      );
    }

    if (!data) {
      console.warn("⚠️ Pago no encontrado con ref_payco:", xRefPayco);
      return jsonResponse(
        { success: false, error: "Pago no encontrado" },
        404,
      );
    }

    return jsonResponse({ success: true }, 200);
  } catch (error) {
    console.error("Error procesando webhook de ePayco:", error);
    return jsonResponse(
      { success: false, error: "Error interno del webhook" },
      500,
    );
  }
});
