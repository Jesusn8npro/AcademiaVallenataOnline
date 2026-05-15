// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const HERRAMIENTAS = [
  {
    type: "function",
    function: {
      name: "actualizar_lead",
      description: "Guarda datos del visitante cuando los mencione voluntariamente. Llama esta funcion en cuanto obtengas cualquier dato nuevo, incluyendo objeciones o dudas que expresen.",
      parameters: {
        type: "object",
        properties: {
          nombre:                { type: "string" },
          email:                 { type: "string" },
          whatsapp:              { type: "string" },
          ciudad:                { type: "string" },
          tipo_consulta:         { type: "string", enum: ["compra", "soporte", "informacion", "tecnico", "otro"] },
          nivel_interes:         { type: "number", description: "Interes de compra del 1 al 10" },
          productos_consultados: { type: "array", items: { type: "string" }, description: "Tutoriales o paquetes que consulto" },
          notas_adicionales:     { type: "string", description: "Objeciones expresadas (precio alto, no tiene tiempo, duda si puede aprender, etc), preguntas frecuentes, interes especifico. Toda info util para remarketing." },
          nivel_acordeon:        { type: "string", enum: ["nunca_toco", "principiante", "intermedio", "avanzado"] },
          tiene_acordeon:        { type: "string", enum: ["si", "no", "cual"] },
          que_quiere_aprender:   { type: "string" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "buscar_tutorial",
      description: "Busca tutoriales en toda la base de datos por nombre de cancion, artista o tema. Usa esta herramienta SIEMPRE que el usuario pregunte por una cancion o artista especifico.",
      parameters: {
        type: "object",
        properties: {
          busqueda: { type: "string", description: "Nombre de la cancion, artista o tema" },
          nivel:    { type: "string", enum: ["principiante", "intermedio", "avanzado"], description: "Filtrar por nivel (opcional)" }
        },
        required: ["busqueda"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "listar_tutoriales",
      description: "Lista tutoriales disponibles. Usa cuando el usuario quiere explorar o ver que canciones hay disponibles.",
      parameters: {
        type: "object",
        properties: {
          nivel:    { type: "string", enum: ["principiante", "intermedio", "avanzado"], description: "Filtrar por nivel" },
          artista:  { type: "string", description: "Filtrar por artista o banda" },
          limite:   { type: "number", description: "Cuantos mostrar, maximo 8" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "buscar_paquete",
      description: "Busca paquetes de tutoriales disponibles. Usa cuando el usuario pregunte por paquetes, bundles o descuentos.",
      parameters: {
        type: "object",
        properties: {
          busqueda: { type: "string", description: "Termino de busqueda (artista, tipo de paquete, etc.)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "ver_progreso_estudiante",
      description: "Obtiene el progreso detallado del estudiante autenticado: que ha visto, que le falta, en que clase va. Solo funciona si hay usuario_id.",
      parameters: {
        type: "object",
        properties: {
          detalle: { type: "string", enum: ["resumen", "completo"], description: "Nivel de detalle requerido" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "buscar_blog",
      description: "Busca articulos del blog por tema. Usa cuando el usuario pregunte sobre tecnicas, historia del vallenato, consejos, etc.",
      parameters: {
        type: "object",
        properties: {
          busqueda: { type: "string", description: "Tema o palabra clave" }
        },
        required: ["busqueda"]
      }
    }
  }
]

const PROMPT_DEFAULT = "Eres un asistente de ventas especializado en Academia Vallenata Online. Tu objetivo es guiar al usuario hacia el tutorial o paquete que mas le convenga segun su nivel y lo que quiere aprender. Captura siempre nombre y WhatsApp. Se amigable y motivador."

const TONO_DESC: Record<string, string> = {
  calido_motivador:   "Calido, cercano y motivador. Usa frases de aliento.",
  profesional_formal: "Profesional y formal. Usa usted, lenguaje estructurado.",
  jovial_energico:    "Jovial, energico y entusiasta. Usa emojis con moderacion.",
  experto_tecnico:    "Experto tecnico. Da detalles precisos sobre musica y acordeon."
}

// ── Helpers de formato ────────────────────────────────────────────────────────
function labelTutorial(titulo: string): string {
  // Recorta prefijos comunes para que el boton sea mas limpio
  let label = titulo
    .replace(/^Tutorial\s+de\s+acorde[oó]n[:\s\-–]+/i, '')
    .replace(/^Aprende\s+(a\s+tocar\s+)?["']?/i, '')
    .replace(/^Cómo\s+tocar\s+["']?/i, '')
    .trim()
  return label.length > 50 ? label.slice(0, 47) + '...' : label
}

function formatTutorial(t: any): string {
  const precio = t.precio_rebajado ?? t.precio_normal
  const precioStr = precio ? "$" + Number(precio).toLocaleString("es-CO") + " COP" : "Gratis"
  const artista = t.artista?.trim() ? ` - ${t.artista.trim()}` : ""
  const label = labelTutorial(t.titulo)
  return `${t.titulo}${artista} (${t.nivel || "todos"}) - ${precioStr} -> [${label}](/tutoriales/${t.id})`
}

function formatPaquete(p: any): string {
  const precio = p.precio_rebajado ?? p.precio_normal
  const precioStr = precio ? "$" + Number(precio).toLocaleString("es-CO") + " COP" : ""
  const ahorro = p.descuento_porcentaje ? ` - ${p.descuento_porcentaje}% descuento` : ""
  const tuts = p.total_tutoriales ? ` (${p.total_tutoriales} tutoriales)` : ""
  return `${p.titulo}${tuts}${ahorro} - ${precioStr} -> [${p.titulo}](/paquetes/${p.slug})`
}

// Divide la búsqueda en palabras clave y devuelve filtro OR para Supabase
function orBusqueda(termino: string, campos: string[]): string {
  const palabras = termino
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quitar tildes para matching
    .split(/\s+/)
    .filter(p => p.length > 2)
    .slice(0, 5)

  // Si no hay palabras válidas, usar el termino completo
  if (!palabras.length) {
    return campos.map(c => `${c}.ilike.%${termino}%`).join(',')
  }

  return palabras.flatMap(p => campos.map(c => `${c}.ilike.%${p}%`)).join(',')
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )
    const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY")!
    const MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini"

    const { chat_id, mensaje, usuario_id, pagina_origen = "web" } = await req.json()

    if (!chat_id || !mensaje?.trim()) {
      return new Response(JSON.stringify({ error: "chat_id y mensaje requeridos" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" }
      })
    }

    // ── Config + Historial + Lead (en paralelo) ───────────────────────────
    const [
      { data: configAgente },
      { data: histDB },
      { data: lead }
    ] = await Promise.all([
      sb.from("agente_chat_config").select("nombre, tono, prompt_adicional").limit(1).single(),
      sb.from("chats_envivo_academia").select("message").eq("session_id", chat_id).order("id", { ascending: true }).limit(30),
      sb.from("leads_chat_anonimos").select("nombre, email, whatsapp, nivel_acordeon, tiene_acordeon, que_quiere_aprender").eq("chat_id", chat_id).maybeSingle()
    ])

    const nombreAgente = configAgente?.nombre || "Juancho"
    const tono = configAgente?.tono || "calido_motivador"
    const promptExtra = configAgente?.prompt_adicional || PROMPT_DEFAULT

    const historial = (histDB || []).flatMap((r: any) => {
      const m = r.message
      if (!m?.content) return []
      const role = m.role || (m.type === "human" ? "user" : "assistant")
      return [{ role, content: String(m.content) }]
    })

    // ── Contexto del visitante conocido ───────────────────────────────────
    let bloqueVisitante = ""
    if (lead && Object.values(lead).some(Boolean)) {
      const lineas = [
        lead.nombre       && `Nombre: ${lead.nombre}`,
        lead.email        && `Email: ${lead.email}`,
        lead.whatsapp     && `WhatsApp: ${lead.whatsapp}`,
        lead.nivel_acordeon && `Nivel: ${lead.nivel_acordeon}`,
        lead.tiene_acordeon && `Tiene acordeon: ${lead.tiene_acordeon}`,
        lead.que_quiere_aprender && `Quiere aprender: ${lead.que_quiere_aprender}`,
      ].filter(Boolean)
      if (lineas.length) {
        bloqueVisitante = "\n=== YA SE SABE DE ESTE VISITANTE (NO volver a preguntar) ===\n" + lineas.join("\n") + "\n==="
      }
    }

    // ── Contexto estudiante autenticado (resumen ligero) ──────────────────
    let bloqueEstudiante = ""
    if (usuario_id) {
      const { data: perfil } = await sb.from("perfiles")
        .select("nombre, apellido, correo_electronico, nivel_habilidad, suscripcion")
        .eq("id", usuario_id).single()
      if (perfil) {
        const nombre = [perfil.nombre, perfil.apellido].filter(Boolean).join(" ") || "Estudiante"
        bloqueEstudiante =
          `\n=== ESTUDIANTE AUTENTICADO ===\nNombre: ${nombre}\nEmail: ${perfil.correo_electronico || ""}\nNivel: ${perfil.nivel_habilidad || "principiante"}\nSuscripcion: ${perfil.suscripcion || "gratuita"}\nPara ver su progreso detallado usa la herramienta ver_progreso_estudiante.\n===`
      }
    }

    // ── System prompt ─────────────────────────────────────────────────────
    const hoy = new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })

    const SISTEMA = [
      `Eres ${nombreAgente}, asistente virtual de Academia Vallenata Online. Experto en acordeon vallenato y toda la plataforma.`,
      `TONO: ${TONO_DESC[tono] || TONO_DESC["calido_motivador"]}`,
      "",
      "=== RUTAS DE LA PLATAFORMA ===",
      "Usa SIEMPRE links relativos [Texto](/ruta). JAMAS escribas https:// ni URLs completas.",
      "- Todos los tutoriales: [Ver tutoriales](/tutoriales-de-acordeon)",
      "- Paquetes con descuento: [Ver paquetes](/paquetes)",
      "- Simulador GRATIS: [Abrir simulador](/simulador)",
      "- Comunidad: [Ir a comunidad](/comunidad)",
      "- Eventos: [Ver eventos](/eventos)",
      "- Blog: [Leer blog](/blog)",
      "- Crear cuenta (registro): [Crear cuenta gratis](/registro)",
      "- Iniciar sesion: [Iniciar sesion](/login)",
      "",
      bloqueEstudiante,
      bloqueVisitante,
      "",
      `HOY: ${hoy} | PAGINA: ${pagina_origen}`,
      "",
      "=== INSTRUCCIONES ===",
      promptExtra,
      "",
      "=== REGLAS CRITICAS (violarlas es un error grave) ===",
      "1. FORMATO: texto limpio, sin asteriscos (*), sin guiones como bullet, sin markdown de ningun tipo. Solo texto plano y links.",
      "2. LINKS: SOLO [Texto del boton](/ruta). JAMAS escribas https:// ni URLs completas. El texto del boton debe ser descriptivo (el titulo del tutorial, no 'Ver tutorial').",
      "3. BUSQUEDA OBLIGATORIA: cuando el usuario mencione una cancion o artista, llama buscar_tutorial ANTES de responder. Si no encuentra resultados, dilo honestamente y sugiere [Ver todos los tutoriales](/tutoriales-de-acordeon). NUNCA digas que no existe si no has buscado primero.",
      "4. COHERENCIA: si ya buscaste y encontraste un tutorial, NO digas que no lo tienes. Si no lo encontraste, dilo una vez y ofrece alternativas.",
      "5. Para listar tutoriales por nivel usa listar_tutoriales. Para paquetes usa buscar_paquete. Para blog usa buscar_blog. Para progreso del estudiante usa ver_progreso_estudiante.",
      "6. NO puedes crear cuentas. Para registro diriges a [Crear cuenta gratis](/registro).",
      "7. NO repitas preguntas sobre datos que ya estan en 'YA SE SABE DE ESTE VISITANTE'.",
      "8. OBJECIONES: cuando el usuario exprese una duda, objecion o preocupacion ('es caro', 'no tengo tiempo', 'no se si puedo', 'tengo X problema'), guardala en notas_adicionales via actualizar_lead. Esto es CLAVE para el seguimiento.",
      "9. Nunca inventes precios. Usa solo los que retornen las herramientas.",
      "10. Termina siempre con una pregunta o accion concreta para seguir la conversion."
    ].filter(s => s !== null && s !== undefined).join("\n")

    // ── Bucle OpenAI ──────────────────────────────────────────────────────
    const msgOpenAI: any[] = [
      { role: "system", content: SISTEMA },
      ...historial,
      { role: "user", content: mensaje.trim() }
    ]

    let respuestaFinal = ""

    for (let intento = 0; intento < 8; intento++) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + OPENAI_KEY },
        body: JSON.stringify({
          model: MODEL,
          messages: msgOpenAI,
          tools: HERRAMIENTAS,
          tool_choice: "auto",
          max_tokens: 600,
          temperature: 0.7
        })
      })

      const openaiData = await res.json()
      const choice = openaiData.choices?.[0]
      if (!choice) break

      const msg = choice.message
      msgOpenAI.push(msg)

      if (msg.tool_calls?.length) {
        for (const tc of msg.tool_calls) {

          // ── actualizar_lead ───────────────────────────────────────────
          if (tc.function.name === "actualizar_lead") {
            try {
              const args = JSON.parse(tc.function.arguments)
              const { data: existente } = await sb.from("leads_chat_anonimos").select("id").eq("chat_id", chat_id).maybeSingle()
              if (existente) {
                await sb.from("leads_chat_anonimos").update({ ...args, updated_at: new Date().toISOString() }).eq("chat_id", chat_id)
              } else {
                await sb.from("leads_chat_anonimos").insert({
                  chat_id, source: "web", pagina_origen, usuario_id: usuario_id || null,
                  estado: "activo", converted: false, nivel_interes: args.nivel_interes || 5,
                  probabilidad_compra: 50, ...args,
                  created_at: new Date().toISOString(), updated_at: new Date().toISOString()
                })
              }
              msgOpenAI.push({ role: "tool", tool_call_id: tc.id, content: "Lead actualizado." })
            } catch (e) {
              console.error("actualizar_lead:", e)
              msgOpenAI.push({ role: "tool", tool_call_id: tc.id, content: "Error al guardar." })
            }
          }

          // ── buscar_tutorial ───────────────────────────────────────────
          if (tc.function.name === "buscar_tutorial") {
            try {
              const { busqueda, nivel } = JSON.parse(tc.function.arguments)
              // Busqueda multi-palabra: cada palabra clave se busca en titulo Y artista
              const filtroOr = orBusqueda(busqueda, ["titulo", "artista"])
              let query = sb.from("tutoriales")
                .select("id, titulo, artista, nivel, precio_normal, precio_rebajado, descripcion_corta")
                .eq("estado", "publicado")
                .or(filtroOr)
                .order("created_at", { ascending: false })

              if (nivel) query = query.eq("nivel", nivel)
              const { data: res } = await query.limit(6)

              const contenido = res?.length
                ? `Tutoriales encontrados para "${busqueda}":\n` + res.map(formatTutorial).join("\n")
                : `No hay tutorial especifico de "${busqueda}" disponible aun. Informale honestamente y sugiere explorar [todos los tutoriales](/tutoriales-de-acordeon) o preguntar por otra cancion.`
              msgOpenAI.push({ role: "tool", tool_call_id: tc.id, content: contenido })
            } catch (e) {
              console.error("buscar_tutorial:", e)
              msgOpenAI.push({ role: "tool", tool_call_id: tc.id, content: "Error en busqueda de tutoriales." })
            }
          }

          // ── listar_tutoriales ─────────────────────────────────────────
          if (tc.function.name === "listar_tutoriales") {
            try {
              const { nivel, artista, limite = 5 } = JSON.parse(tc.function.arguments)
              let query = sb.from("tutoriales")
                .select("id, titulo, artista, nivel, precio_normal, precio_rebajado")
                .eq("estado", "publicado")
                .order("created_at", { ascending: false }) // mas recientes primero

              if (nivel) query = query.eq("nivel", nivel)
              if (artista) query = query.ilike("artista", `%${artista}%`)
              const { data: res } = await query.limit(Math.min(limite, 8))

              const contenido = res?.length
                ? `Ultimos tutoriales${nivel ? " de nivel " + nivel : ""}:\n` + res.map(formatTutorial).join("\n") + `\n[Ver todos los tutoriales](/tutoriales-de-acordeon)`
                : "No se encontraron tutoriales con ese filtro. [Ver todos los tutoriales](/tutoriales-de-acordeon)"
              msgOpenAI.push({ role: "tool", tool_call_id: tc.id, content: contenido })
            } catch (e) {
              console.error("listar_tutoriales:", e)
              msgOpenAI.push({ role: "tool", tool_call_id: tc.id, content: "Error al listar tutoriales." })
            }
          }

          // ── buscar_paquete ────────────────────────────────────────────
          if (tc.function.name === "buscar_paquete") {
            try {
              const { busqueda } = JSON.parse(tc.function.arguments)
              let query = sb.from("paquetes_tutoriales")
                .select("titulo, slug, precio_normal, precio_rebajado, descuento_porcentaje, total_tutoriales, descripcion_corta")
                .eq("estado", "publicado")
                .eq("visible", true)

              if (busqueda?.trim()) {
                query = query.ilike("titulo", `%${busqueda}%`)
              }
              const { data: res } = await query.order("orden_mostrar").limit(5)

              const contenido = res?.length
                ? "Paquetes encontrados:\n" + res.map(formatPaquete).join("\n") + "\n[Ver todos los paquetes](/paquetes)"
                : "No se encontraron paquetes con ese criterio. [Ver todos los paquetes](/paquetes)"
              msgOpenAI.push({ role: "tool", tool_call_id: tc.id, content: contenido })
            } catch (e) {
              console.error("buscar_paquete:", e)
              msgOpenAI.push({ role: "tool", tool_call_id: tc.id, content: "Error al buscar paquetes." })
            }
          }

          // ── ver_progreso_estudiante ───────────────────────────────────
          if (tc.function.name === "ver_progreso_estudiante") {
            if (!usuario_id) {
              msgOpenAI.push({ role: "tool", tool_call_id: tc.id, content: "No hay estudiante autenticado en esta sesion." })
              continue
            }
            try {
              const { detalle = "resumen" } = JSON.parse(tc.function.arguments)

              const [{ data: insc }, { data: progresoTut }, { data: progresoLec }] = await Promise.all([
                sb.from("inscripciones")
                  .select("progreso, estado, cursos(titulo, nivel, slug), tutoriales(id, titulo)")
                  .eq("usuario_id", usuario_id)
                  .in("estado", ["activo", "completado"]),
                sb.from("progreso_tutorial")
                  .select("tutorial_id, completado, ultimo_acceso, tutoriales(titulo)")
                  .eq("usuario_id", usuario_id)
                  .order("ultimo_acceso", { ascending: false })
                  .limit(10),
                detalle === "completo"
                  ? sb.from("progreso_lecciones")
                      .select("estado, porcentaje_completado, lecciones(titulo, modulos(titulo))")
                      .eq("usuario_id", usuario_id)
                      .order("ultima_actividad", { ascending: false })
                      .limit(15)
                  : Promise.resolve({ data: null })
              ])

              const activos = (insc || []).filter((i: any) => i.estado === "activo")
              const completados = (insc || []).filter((i: any) => i.estado === "completado")
              const tutPendientes = (progresoTut || []).filter((p: any) => !p.completado)
              const tutCompletados = (progresoTut || []).filter((p: any) => p.completado)

              let texto = "=== PROGRESO DEL ESTUDIANTE ===\n"
              texto += `EN PROGRESO (${activos.length}):\n`
              activos.forEach((i: any) => {
                const titulo = i.cursos?.titulo || i.tutoriales?.titulo || "Curso"
                const pct = i.progreso ? ` ${i.progreso}% completado` : ""
                const link = i.tutoriales?.id
                  ? ` -> [Continuar](/tutoriales/${i.tutoriales.id}/contenido)`
                  : i.cursos?.slug ? ` -> [Continuar](/cursos/${i.cursos.slug}/contenido)` : ""
                texto += `* ${titulo}${pct}${link}\n`
              })

              texto += `\nTUTORIALES PENDIENTES (${tutPendientes.length}):\n`
              tutPendientes.slice(0, 5).forEach((p: any) => {
                texto += `* ${p.tutoriales?.titulo || "Tutorial"} -> [Continuar](/tutoriales/${p.tutorial_id}/contenido)\n`
              })

              texto += `\nCOMPLETADOS: ${completados.length + tutCompletados.length} items\n`

              if (detalle === "completo" && progresoLec?.length) {
                texto += "\nULTIMAS LECCIONES VISTAS:\n"
                progresoLec.slice(0, 8).forEach((l: any) => {
                  const mod = l.lecciones?.modulos?.titulo || ""
                  const lec = l.lecciones?.titulo || "Leccion"
                  texto += `* [${mod}] ${lec} - ${l.porcentaje_completado || 0}%\n`
                })
              }

              msgOpenAI.push({ role: "tool", tool_call_id: tc.id, content: texto })
            } catch (e) {
              console.error("ver_progreso:", e)
              msgOpenAI.push({ role: "tool", tool_call_id: tc.id, content: "Error al cargar progreso del estudiante." })
            }
          }

          // ── buscar_blog ───────────────────────────────────────────────
          if (tc.function.name === "buscar_blog") {
            try {
              const { busqueda } = JSON.parse(tc.function.arguments)
              const { data: res } = await sb.from("blog_articulos")
                .select("titulo, slug, resumen_breve, lectura_min")
                .eq("estado_publicacion", "publicado")
                .or(`titulo.ilike.%${busqueda}%,resumen_breve.ilike.%${busqueda}%`)
                .limit(4)

              const contenido = res?.length
                ? "Articulos del blog:\n" + res.map((a: any) =>
                    `* "${a.titulo}" (${a.lectura_min || 5} min) -> [Leer](/blog/${a.slug})`
                  ).join("\n")
                : `No hay articulos sobre "${busqueda}" aun. [Ver blog](/blog)`
              msgOpenAI.push({ role: "tool", tool_call_id: tc.id, content: contenido })
            } catch (e) {
              console.error("buscar_blog:", e)
              msgOpenAI.push({ role: "tool", tool_call_id: tc.id, content: "Error al buscar en el blog." })
            }
          }
        }
        continue
      }

      if (msg.content) { respuestaFinal = msg.content; break }
      break
    }

    if (!respuestaFinal) {
      respuestaFinal = "Disculpa, no pude procesar tu mensaje. Puedes intentarlo de nuevo?"
    }

    // ── Guardar mensajes ──────────────────────────────────────────────────
    await sb.from("chats_envivo_academia").insert([
      { session_id: chat_id, chat_id, message: { role: "user",      content: mensaje.trim(), type: "human", timestamp: new Date().toISOString() } },
      { session_id: chat_id, chat_id, message: { role: "assistant", content: respuestaFinal,  type: "ai",   timestamp: new Date().toISOString() } }
    ])

    return new Response(JSON.stringify({ respuesta: respuestaFinal }), {
      headers: { ...CORS, "Content-Type": "application/json" }
    })

  } catch (err) {
    console.error("chat-academia:", err)
    return new Response(
      JSON.stringify({ respuesta: "Lo siento, hubo un problema tecnico. Por favor intenta de nuevo." }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    )
  }
})
