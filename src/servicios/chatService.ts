// =====================================================
// 💬 ACADEMIA VALLENATA ONLINE - CHAT SERVICE
// =====================================================
// Servicio para gestión de conversaciones del chat en vivo
// ACTUALIZADO para estructura real de tabla
// =====================================================

import { supabase } from '$servicios/clienteSupabase';

export interface ConversacionChat {
  id?: number;
  session_id: string;
  chat_id?: string;
  message: {
    texto: string;
    tipo: 'usuario' | 'bot' | 'agente';
    usuario_id?: string;
    lead_id?: string;
    es_usuario_registrado?: boolean;
    metadata?: any;
  };
  created_at?: string;
  fecha_creacion?: string;
}

class ChatService {
  private tabla = 'chats_envivo_academia';

  /**
   * 💾 Guardar mensaje de conversación
   */
  async guardarMensaje(datos: {
    chat_id: string;
    usuario_id?: string;
    lead_id?: string;
    es_usuario_registrado: boolean;
    mensaje: string;
    tipo_mensaje?: 'usuario' | 'bot' | 'agente';
    metadata?: any;
  }): Promise<ConversacionChat | null> {
    try {
      const messageData = {
        texto: datos.mensaje,
        tipo: datos.tipo_mensaje || 'usuario',
        usuario_id: datos.usuario_id,
        lead_id: datos.lead_id,
        es_usuario_registrado: datos.es_usuario_registrado,
        metadata: datos.metadata,
        timestamp: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(this.tabla)
        .insert([{
          session_id: datos.chat_id,
          chat_id: datos.chat_id,
          message: messageData
        }])
        .select()
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * 📜 Obtener conversación por chat_id
   */
  async obtenerConversacion(chatId: string): Promise<ConversacionChat[]> {
    try {
      // Buscar por session_id Y por chat_id para mayor compatibilidad
      const { data, error } = await supabase
        .from(this.tabla)
        .select('*')
        .or(`session_id.eq.${chatId},chat_id.eq.${chatId}`)
        .order('created_at', { ascending: true });

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * 📊 Obtener todas las conversaciones con información de lead/usuario
   */
  async obtenerTodasConversaciones(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(this.tabla)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * 🔍 Buscar conversaciones por término
   */
  async buscarConversaciones(termino: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(this.tabla)
        .select('*')
        .or(`session_id.ilike.%${termino}%,chat_id.ilike.%${termino}%,message->>texto.ilike.%${termino}%`)
        .order('created_at', { ascending: false });

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }
}

export const chatService = new ChatService(); 
