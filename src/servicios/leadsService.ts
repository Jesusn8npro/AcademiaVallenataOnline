// =====================================================
// 💬 ACADEMIA VALLENATA ONLINE - LEADS SERVICE
// =====================================================
// Servicio para gestión de leads de chat anónimos
// Integrado con sistema de conversión a usuarios
// =====================================================

import { supabase } from '$servicios/clienteSupabase';

export interface LeadChatAnonimo {
  id?: string;
  chat_id: string;
  nombre: string;
  email: string;
  whatsapp?: string;
  tipo_consulta: string;
  primer_mensaje?: string;
  convertido_a_usuario: boolean;
  usuario_id?: string;
  created_at?: string;
  updated_at?: string;
}

class LeadsService {
  private tabla = 'leads_chat_anonimos';

  /**
   * 💾 Crear un nuevo lead de chat anónimo
   */
  async crearLead(leadData: Omit<LeadChatAnonimo, 'id' | 'created_at' | 'updated_at' | 'convertido_a_usuario'>): Promise<LeadChatAnonimo | null> {
    try {
      
      const { data, error } = await supabase
        .from(this.tabla)
        .insert([{
          ...leadData,
          convertido_a_usuario: false
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * 🔍 Obtener lead por chat_id
   */
  async obtenerPorChatId(chatId: string): Promise<LeadChatAnonimo | null> {
    try {
      const { data, error } = await supabase
        .from(this.tabla)
        .select('*')
        .eq('chat_id', chatId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * 📋 Obtener todos los leads
   */
  async obtenerTodos(): Promise<LeadChatAnonimo[]> {
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
   * 🔍 Obtener lead por email
   */
  async obtenerPorEmail(email: string): Promise<LeadChatAnonimo | null> {
    try {
      const { data, error } = await supabase
        .from(this.tabla)
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * 🔄 Marcar lead como convertido a usuario (por chatId o email)
   */
  async marcarComoConvertido(identifier: string, usuarioId: string, porEmail: boolean = false): Promise<boolean> {
    try {
      
      const query = supabase
        .from(this.tabla)
        .update({
          convertido_a_usuario: true,
          usuario_id: usuarioId,
          updated_at: new Date().toISOString()
        });

      // Decidir si buscar por email o chat_id
      if (porEmail) {
        query.eq('email', identifier.toLowerCase())
             .eq('convertido_a_usuario', false);
      } else {
        query.eq('chat_id', identifier);
      }

      const { error } = await query;

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      return false;
    }
  }



  /**
   * 🔄 Verificar y convertir leads automáticamente
   */
  async verificarConversiones(): Promise<number> {
    try {
      // Obtener todos los leads no convertidos
      const { data: leadsNoConvertidos, error: errorLeads } = await supabase
        .from(this.tabla)
        .select('email, chat_id')
        .eq('convertido_a_usuario', false);

      if (errorLeads) {
        return 0;
      }

      if (!leadsNoConvertidos || leadsNoConvertidos.length === 0) {
        return 0;
      }

      // Verificar cuáles emails ya tienen cuenta
      const emails = leadsNoConvertidos.map((lead: any) => lead.email.toLowerCase());
      const { data: perfilesExistentes, error: errorPerfiles } = await supabase
        .from('perfiles')
        .select('id, correo_electronico')
        .in('correo_electronico', emails);

      if (errorPerfiles) {
        return 0;
      }

      if (!perfilesExistentes || perfilesExistentes.length === 0) {
        return 0;
      }

             // Marcar conversiones
       let conversiones = 0;
       for (const perfil of perfilesExistentes) {
         const convertido = await this.marcarComoConvertido(perfil.correo_electronico, perfil.id, true);
         if (convertido) conversiones++;
       }

      return conversiones;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 📊 Obtener estadísticas de leads
   */
  async obtenerEstadisticas() {
    try {
      const { data, error } = await supabase
        .from(this.tabla)
        .select('convertido_a_usuario, tipo_consulta, created_at');

      if (error) {
        throw error;
      }

      const total = data.length;
      const convertidos = data.filter((lead: any) => lead.convertido_a_usuario).length;
      const porTipo = data.reduce((acc: Record<string, number>, lead: any) => {
        acc[lead.tipo_consulta] = (acc[lead.tipo_consulta] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total,
        convertidos,
        tasa_conversion: total > 0 ? (convertidos / total) * 100 : 0,
        por_tipo: porTipo
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 📋 Listar todos los leads (solo para admins)
   */
  async listarTodos(limite = 50, offset = 0): Promise<LeadChatAnonimo[]> {
    try {
      const { data, error } = await supabase
        .from(this.tabla)
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limite - 1);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * 🗑️ Eliminar lead por ID (solo para admins)
   */
  async eliminar(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tabla)
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}

export const leadsService = new LeadsService(); 
