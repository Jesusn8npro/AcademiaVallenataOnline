// Edge Function: obtener-video-firmado v12
// v12: acceso por MEMBRESÍA activa (perfiles.membresia_activa_id + vencimiento +
//      permisos del plan). Las inscripciones tipo 'membresia' NO dan acceso por
//      sí solas (caducan con el plan) → el acceso de membresía se decide por el
//      plan vigente. Las inscripciones pagadas/gratuitas siguen igual.
// v11: rate limiting 30 req/min por user_id (RPC bump_rate_limit)
// v10: CORS allowlist
// v9: acepta estado='activo'/'activa'/'completada'
// v8: agrega expires_at_iso

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const ALLOWED_ORIGINS = new Set([
  'https://academiavallenataonline.com',
  'https://www.academiavallenataonline.com',
  'https://academiavallenata.online',
  'https://academiavallenata.com',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
]);

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_SEC = 60;

function buildCors(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://academiavallenataonline.com';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  } as Record<string, string>;
}

const ESTADOS_VALIDOS = ['activo', 'activa', 'completada'];

function json(body: unknown, status: number, cors: Record<string,string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function firmarBunnyIframe(videoGuid: string, libraryId: string, authKey: string, expiresUnix: number): Promise<string> {
  const token = await sha256Hex(authKey + videoGuid + expiresUnix);
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoGuid}?token=${token}&expires=${expiresUnix}`;
}

function parseBunnyUrl(url: string): { libraryId: string; videoGuid: string } | null {
  const m = url.match(/mediadelivery\.net\/(?:play|embed)\/(\d+)\/([a-f0-9-]+)/i);
  if (!m) return null;
  return { libraryId: m[1], videoGuid: m[2] };
}

type ContextoAcceso = {
  videoUrl: string | null;
  recursoTipo: 'tutorial' | 'curso';
  recursoId: string;
  esGratis: boolean;
};

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const CORS = buildCors(origin);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'metodo_no_permitido' }, 405, CORS);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const BUNNY_KEY = Deno.env.get('BUNNY_TOKEN_AUTH_KEY');

  if (!BUNNY_KEY) {
    return json({ error: 'config_incompleta', detalle: 'falta BUNNY_TOKEN_AUTH_KEY' }, 500, CORS);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'no_autenticado' }, 401, CORS);

  const supabaseAuth = createClient(SUPABASE_URL, SERVICE_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userData, error: userErr } = await supabaseAuth.auth.getUser(jwt);
  if (userErr || !userData?.user) {
    return json({ error: 'jwt_invalido' }, 401, CORS);
  }
  const userId = userData.user.id;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Rate limit: 30 req/min por user_id. Si excede, 429.
  const { data: permitido, error: rlErr } = await admin.rpc('bump_rate_limit', {
    p_key: `video:${userId}`,
    p_max_requests: RATE_LIMIT_MAX,
    p_window_seconds: RATE_LIMIT_WINDOW_SEC,
  });
  if (rlErr) {
    console.error('rate limit error:', rlErr);
  } else if (permitido === false) {
    return json(
      { error: 'rate_limit_excedido', detalle: `Maximo ${RATE_LIMIT_MAX} solicitudes por minuto. Intenta de nuevo en unos segundos.` },
      429,
      { ...CORS, 'Retry-After': '60' },
    );
  }

  let body: { parte_id?: string; tutorial_id?: string; leccion_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'body_invalido' }, 400, CORS);
  }
  const { parte_id, tutorial_id, leccion_id } = body ?? {};
  if (!parte_id && !tutorial_id && !leccion_id) {
    return json({ error: 'identificador_requerido' }, 400, CORS);
  }

  const { data: perfil, error: perfilErr } = await admin
    .from('perfiles')
    .select('rol, eliminado, membresia_activa_id, fecha_vencimiento_membresia')
    .eq('id', userId)
    .maybeSingle();

  if (perfilErr) {
    return json({ error: 'error_perfil', detalle: perfilErr.message }, 500, CORS);
  }

  const esAdmin = perfil?.rol === 'admin' || perfil?.rol === 'editor';

  // Membresía activa del usuario (acceso por plan, respeta vencimiento).
  // El acceso por membresía se decide AQUÍ (plan vigente + permisos), NO por
  // la existencia de una inscripción 'membresia' (esas caducan con el plan).
  const hoyStr = new Date().toISOString().slice(0, 10);
  const memId = (perfil as any)?.membresia_activa_id ?? null;
  const venc = (perfil as any)?.fecha_vencimiento_membresia ?? null;
  const planActivo = !!memId && (!venc || String(venc) >= hoyStr);
  let permisosPlan: any = null;
  if (planActivo) {
    const { data: mem } = await admin.from('membresias').select('permisos').eq('id', memId).maybeSingle();
    permisosPlan = (mem as any)?.permisos ?? null;
  }

  let ctx: ContextoAcceso | null = null;

  if (parte_id) {
    const { data: parte } = await admin
      .from('partes_tutorial')
      .select('tutorial_id, video_url, visible')
      .eq('id', parte_id)
      .maybeSingle();
    if (!parte) return json({ error: 'parte_no_encontrada' }, 404, CORS);
    if (parte.visible === false && !esAdmin) return json({ error: 'parte_no_disponible' }, 403, CORS);
    const { data: tut } = await admin
      .from('tutoriales')
      .select('tipo_acceso, precio_normal')
      .eq('id', parte.tutorial_id)
      .maybeSingle();
    ctx = {
      videoUrl: parte.video_url,
      recursoTipo: 'tutorial',
      recursoId: parte.tutorial_id,
      esGratis: tut?.tipo_acceso === 'gratis' || tut?.tipo_acceso === 'libre' || Number(tut?.precio_normal ?? 0) === 0,
    };
  } else if (tutorial_id) {
    const { data: tut } = await admin
      .from('tutoriales')
      .select('id, video_url, tipo_acceso, precio_normal')
      .eq('id', tutorial_id)
      .maybeSingle();
    if (!tut) return json({ error: 'tutorial_no_encontrado' }, 404, CORS);
    ctx = {
      videoUrl: tut.video_url,
      recursoTipo: 'tutorial',
      recursoId: tut.id,
      esGratis: tut.tipo_acceso === 'gratis' || tut.tipo_acceso === 'libre' || Number(tut.precio_normal ?? 0) === 0,
    };
  } else if (leccion_id) {
    const { data: leccion } = await admin
      .from('lecciones')
      .select('curso_id, modulo_id, video_url, es_publicado')
      .eq('id', leccion_id)
      .maybeSingle();
    if (!leccion) return json({ error: 'leccion_no_encontrada' }, 404, CORS);
    if (leccion.es_publicado === false && !esAdmin) return json({ error: 'leccion_no_disponible' }, 403, CORS);

    let cursoId: string | null = leccion.curso_id;
    if (!cursoId && leccion.modulo_id) {
      const { data: modulo } = await admin
        .from('modulos')
        .select('curso_id')
        .eq('id', leccion.modulo_id)
        .maybeSingle();
      cursoId = modulo?.curso_id ?? null;
    }
    if (!cursoId) return json({ error: 'curso_no_resuelto' }, 500, CORS);

    const { data: curso } = await admin
      .from('cursos')
      .select('tipo_acceso, precio_normal')
      .eq('id', cursoId)
      .maybeSingle();
    ctx = {
      videoUrl: leccion.video_url,
      recursoTipo: 'curso',
      recursoId: cursoId,
      esGratis: curso?.tipo_acceso === 'gratis' || curso?.tipo_acceso === 'libre' || Number(curso?.precio_normal ?? 0) === 0,
    };
  }

  if (!ctx) return json({ error: 'contexto_no_resuelto' }, 500, CORS);
  if (!ctx.videoUrl) return json({ error: 'video_no_disponible' }, 404, CORS);

  let tieneAcceso = esAdmin || ctx.esGratis;

  // Acceso por MEMBRESÍA: plan vigente que cubre el tipo de contenido.
  if (!tieneAcceso && planActivo && permisosPlan) {
    const cubre = ctx.recursoTipo === 'tutorial'
      ? !!permisosPlan?.contenido?.tutoriales_video
      : !!permisosPlan?.contenido?.cursos;
    if (cubre) tieneAcceso = true;
  }

  // Acceso por inscripción individual (pagada/gratuita/regalo/promocional).
  // Se EXCLUYE tipo_acceso='membresia': esas dependen del plan vigente (arriba),
  // así caducan cuando el plan vence.
  if (!tieneAcceso && ctx.recursoTipo === 'tutorial') {
    const { data: insTut } = await admin
      .from('inscripciones')
      .select('id, estado, fecha_expiracion')
      .eq('usuario_id', userId)
      .eq('tutorial_id', ctx.recursoId)
      .neq('tipo_acceso', 'membresia')
      .maybeSingle();
    if (insTut && ESTADOS_VALIDOS.includes(insTut.estado) &&
        (!insTut.fecha_expiracion || new Date(insTut.fecha_expiracion) > new Date())) {
      tieneAcceso = true;
    }

    if (!tieneAcceso) {
      const { data: paquetes } = await admin
        .from('paquetes_tutoriales_items')
        .select('paquete_id')
        .eq('tutorial_id', ctx.recursoId);
      const paqueteIds = (paquetes ?? []).map((p: { paquete_id: string }) => p.paquete_id);
      if (paqueteIds.length > 0) {
        const { data: insPaq } = await admin
          .from('inscripciones')
          .select('id, estado, fecha_expiracion')
          .eq('usuario_id', userId)
          .in('paquete_id', paqueteIds)
          .in('estado', ESTADOS_VALIDOS)
          .limit(1);
        if (insPaq && insPaq.length > 0) {
          const ins = insPaq[0];
          if (!ins.fecha_expiracion || new Date(ins.fecha_expiracion) > new Date()) {
            tieneAcceso = true;
          }
        }
      }
    }
  }

  if (!tieneAcceso && ctx.recursoTipo === 'curso') {
    const { data: insCurso } = await admin
      .from('inscripciones')
      .select('id, estado, fecha_expiracion')
      .eq('usuario_id', userId)
      .eq('curso_id', ctx.recursoId)
      .neq('tipo_acceso', 'membresia')
      .maybeSingle();
    if (insCurso && ESTADOS_VALIDOS.includes(insCurso.estado) &&
        (!insCurso.fecha_expiracion || new Date(insCurso.fecha_expiracion) > new Date())) {
      tieneAcceso = true;
    }
  }

  if (!tieneAcceso) return json({ error: 'sin_acceso', detalle: 'no_inscrito' }, 403, CORS);

  const bunny = parseBunnyUrl(ctx.videoUrl);
  if (!bunny) {
    return json({ url: ctx.videoUrl, plataforma: 'externa', expires_in: null }, 200, CORS);
  }

  const expiresUnix = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
  const expiresIso = new Date(expiresUnix * 1000).toISOString();
  const signedUrl = await firmarBunnyIframe(bunny.videoGuid, bunny.libraryId, BUNNY_KEY, expiresUnix);

  return json({
    url: signedUrl,
    plataforma: 'bunny',
    video_guid: bunny.videoGuid,
    expires_at: expiresUnix,
    expires_at_iso: expiresIso,
    expires_in_seconds: 7200,
  }, 200, CORS);
});
