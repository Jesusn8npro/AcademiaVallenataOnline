<!-- Provider centralizado para Supabase - Evita 50+ imports duplicados -->
<script lang="ts">
  import { setContext, onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { supabase } from '../clienteSupabase';
  import { usuario, setUsuario, limpiarUsuario } from '../../UsuarioActivo/usuario';
  
  // 🎯 CONTEXTO GLOBAL DE SUPABASE
  const supabaseContext = {
    client: supabase,
    usuario,
    setUsuario,
    limpiarUsuario
  };
  
  // Proporcionar contexto a toda la app
  setContext('supabase', supabaseContext);
  
  // 🔄 Auto-inicialización del usuario
  onMount(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Usuario ya autenticado - cargar perfil
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (perfil) {
          setUsuario(perfil);
        }
      }
    } catch (error) {
      // Silencioso - no romper la app
      console.warn('Error inicializando usuario:', error);
    }
  });
</script>

<!-- Slot para contenido hijo -->
<slot /> 