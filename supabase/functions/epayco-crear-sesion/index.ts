// Edge Function: epayco-crear-sesion
// Crea una sesión server-side con la API REST de Epayco usando PRIVATE_KEY.
// El frontend llama a esta function ANTES de abrir el SDK checkout-v2.js.
// Devuelve { sessionId } que el SDK consume.
//
// Flujo:
//   1. POST /login con Basic Auth (PUBLIC_KEY:PRIVATE_KEY) -> JWT
//   2. POST /payment/session/create con Bearer JWT + datos del pago -> sessionId
//
// La PRIVATE_KEY NUNCA viaja al frontend. Vive solo aquí como secret de Supabase.

// @ts-nocheck

const EPAYCO_BASE = "https://apify.epayco.co";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CrearSesionPayload {
  refPayco: string;
  nombreProducto: string;
  descripcion?: string;
  total: number | string;
  base: number | string;
  iva: number | string;
  nombre: string;
  apellido?: string;
  email: string;
  telefono: string;
  direccion?: string;
  tipoDocumento: string;
  numeroDocumento: string;
  ciudad?: string;
  pais?: string;
  responseUrl: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function loginEpayco(
  publicKey: string,
  privateKey: string,
): Promise<string> {
  const credentials = btoa(`${publicKey}:${privateKey}`);
  const res = await fetch(`${EPAYCO_BASE}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login Epayco fallo (${res.status}): ${text}`);
  }
  const data = await res.json();
  if (!data?.token) {
    throw new Error(`Login Epayco no devolvio token: ${JSON.stringify(data)}`);
  }
  return data.token;
}

async function crearSesionEpayco(
  token: string,
  payload: Record<string, unknown>,
): Promise<string> {
  const res = await fetch(`${EPAYCO_BASE}/payment/session/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data?.success === false) {
    throw new Error(
      `Crear sesion Epayco fallo (${res.status}): ${JSON.stringify(data)}`,
    );
  }
  const sessionId = data?.data?.sessionId ?? data?.sessionId;
  if (!sessionId) {
    throw new Error(
      `Respuesta sin sessionId: ${JSON.stringify(data)}`,
    );
  }
  return sessionId;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Metodo no permitido" }, 405);
  }

  // Acepta tanto nombres con prefijo (EPAYCO_*) como sin prefijo (PUBLIC_KEY/PRIVATE_KEY)
  // para tolerar la convencion de naming actual del proyecto.
  const publicKey = Deno.env.get("EPAYCO_PUBLIC_KEY") ||
    Deno.env.get("PUBLIC_KEY");
  const privateKey = Deno.env.get("EPAYCO_PRIVATE_KEY") ||
    Deno.env.get("PRIVATE_KEY");
  const isTestMode = Deno.env.get("EPAYCO_TEST_MODE") === "true";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  if (!publicKey || !privateKey) {
    return jsonResponse(
      { error: "PUBLIC_KEY o PRIVATE_KEY no configuradas" },
      500,
    );
  }
  if (!supabaseUrl) {
    return jsonResponse({ error: "SUPABASE_URL no configurada" }, 500);
  }

  let body: CrearSesionPayload;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Body invalido" }, 400);
  }

  // Validacion minima
  const requeridos: (keyof CrearSesionPayload)[] = [
    "refPayco",
    "nombreProducto",
    "total",
    "base",
    "iva",
    "nombre",
    "email",
    "telefono",
    "tipoDocumento",
    "numeroDocumento",
    "responseUrl",
  ];
  for (const campo of requeridos) {
    if (body[campo] === undefined || body[campo] === null || body[campo] === "") {
      return jsonResponse({ error: `Campo requerido: ${campo}` }, 400);
    }
  }

  try {
    const token = await loginEpayco(publicKey, privateKey);

    const confirmationUrl = `${supabaseUrl}/functions/v1/epayco-webhook`;
    const nombreCompleto = `${body.nombre}${
      body.apellido ? ` ${body.apellido}` : ""
    }`.trim();

    // Epayco rechaza tipos string para amount/taxBase/tax y rechaza los campos
    // legacy *Billing (los considera "no deben existir"). Solo objeto billing.
    const sessionPayload = {
      test: isTestMode,
      checkout_version: "2",
      name: body.nombreProducto,
      description: body.descripcion || body.nombreProducto,
      currency: "COP",
      amount: Number(body.total),
      country: "CO",
      lang: "ES",
      invoice: body.refPayco,
      taxBase: Number(body.base),
      tax: Number(body.iva),
      response: body.responseUrl,
      confirmation: confirmationUrl,
      billing: {
        email: body.email,
        name: nombreCompleto,
        address: body.direccion || "",
        typeDoc: body.tipoDocumento,
        numberDoc: body.numeroDocumento,
        callingCode: "57",
        mobilePhone: body.telefono,
      },
    };

    const sessionId = await crearSesionEpayco(token, sessionPayload);
    return jsonResponse({ sessionId });
  } catch (error) {
    console.error("[epayco-crear-sesion]", error);
    return jsonResponse(
      { error: (error as Error).message || "Error interno" },
      500,
    );
  }
});
