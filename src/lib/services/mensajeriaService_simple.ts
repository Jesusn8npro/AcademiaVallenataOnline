import { supabase } from '$lib/supabase';

// VERSION SIMPLIFICADA PARA DEBUGGING
export const mensajeriaSimple = {
  
  // Obtener chats básicos
  async obtenerChats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { chats: [], error: 'No autenticado' };

      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .limit(10);

      if (error) {
        console.error('Error obteniendo chats:', error);
        return { chats: [], error: error.message };
      }

      return { chats: data || [], error: null };
    } catch (err) {
      console.error('Error:', err);
      return { chats: [], error: 'Error inesperado' };
    }
  },

  // Obtener mensajes básicos
  async obtenerMensajes(chatId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { mensajes: [], error: 'No autenticado' };

      const { data, error } = await supabase
        .from('mensajes')
        .select(`
          *,
          usuario:perfiles(nombre_completo, url_foto_perfil, nombre_usuario)
        `)
        .eq('chat_id', chatId)
        .order('creado_en', { ascending: true })
        .limit(20);

      if (error) {
        console.error('Error obteniendo mensajes:', error);
        return { mensajes: [], error: error.message };
      }

      return { mensajes: data || [], error: null };
    } catch (err) {
      console.error('Error:', err);
      return { mensajes: [], error: 'Error inesperado' };
    }
  },

  // Crear chat básico
  async crearChat(nombre: string, miembros: string[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { chat: null, error: 'No autenticado' };

      // Crear chat
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
          nombre,
          es_grupal: miembros.length > 1,
          creado_por: user.id
        })
        .select()
        .single();

      if (chatError) {
        console.error('Error creando chat:', chatError);
        return { chat: null, error: chatError.message };
      }

      // Agregar miembros
      const miembrosData = [
        { chat_id: chat.id, usuario_id: user.id, es_admin: true },
        ...miembros.map(id => ({ chat_id: chat.id, usuario_id: id, es_admin: false }))
      ];

      const { error: miembrosError } = await supabase
        .from('miembros_chat')
        .insert(miembrosData);

      if (miembrosError) {
        console.error('Error agregando miembros:', miembrosError);
        return { chat: null, error: miembrosError.message };
      }

      return { chat, error: null };
    } catch (err) {
      console.error('Error:', err);
      return { chat: null, error: 'Error inesperado' };
    }
  },

  // Enviar mensaje básico
  async enviarMensaje(chatId: string, contenido: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { mensaje: null, error: 'No autenticado' };

      const { data, error } = await supabase
        .from('mensajes')
        .insert({
          chat_id: chatId,
          usuario_id: user.id,
          contenido,
          tipo: 'texto'
        })
        .select(`
          *,
          usuario:perfiles(nombre_completo, url_foto_perfil, nombre_usuario)
        `)
        .single();

      if (error) {
        console.error('Error enviando mensaje:', error);
        return { mensaje: null, error: error.message };
      }

      return { mensaje: data, error: null };
    } catch (err) {
      console.error('Error:', err);
      return { mensaje: null, error: 'Error inesperado' };
    }
  }
}; 