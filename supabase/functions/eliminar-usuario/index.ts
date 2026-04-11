// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { usuarioId } = await request.json();

    if (!usuarioId) {
      return new Response(JSON.stringify({ error: "usuarioId requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("🗑️ Eliminando usuario:", usuarioId);

    // Intentar eliminar de auth.users
    // Si no existe en auth (perfil huérfano), no es error — continuar igual
    const { error: authError } = await supabase.auth.admin.deleteUser(usuarioId);

    if (authError) {
      const esUsuarioNoEncontrado =
        authError.message?.toLowerCase().includes("not found") ||
        authError.message?.toLowerCase().includes("no encontrado");

      if (!esUsuarioNoEncontrado) {
        // Error real de auth, reportar
        console.error("❌ Error real en auth:", authError);
        return new Response(JSON.stringify({ error: authError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Si es "not found" → era perfil huérfano, continuar a eliminar de perfiles
      console.log("⚠️ Usuario no estaba en auth (perfil huérfano), eliminando solo de perfiles");
    }

    // Siempre eliminar de perfiles
    const { error: perfilError } = await supabase
      .from("perfiles")
      .delete()
      .eq("id", usuarioId);

    if (perfilError) {
      console.error("❌ Error eliminando perfil:", perfilError);
      return new Response(JSON.stringify({ error: perfilError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Usuario eliminado exitosamente:", usuarioId);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("❌ Error interno:", err);
    return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
