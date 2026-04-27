// 🧹 UTILIDAD PARA LIMPIAR DATOS CORRUPTOS DE TIEMPO
// Este script resetea valores imposibles en sesiones_usuario.tiempo_total_minutos

import { supabase } from './clienteSupabase';

export class LimpiadorDatosCorruptos {
  
  /**
   * 🧹 LIMPIAR DATOS CORRUPTOS DE TIEMPO
   * Resetea valores imposibles (> 1000 minutos = 16.6 horas) a 0
   */
  static async limpiarTiempoCorrupto(): Promise<{ limpiados: number; errores: number }> {
    try {
      
      // 🔍 IDENTIFICAR REGISTROS CON TIEMPO IMPOSIBLE (> 1000 minutos)
      const { data: registrosCorruptos, error: selectError } = await supabase
        .from('sesiones_usuario')
        .select('id, usuario_id, tiempo_total_minutos, fecha')
        .gt('tiempo_total_minutos', 1000); // Más de 16.6 horas = IMPOSIBLE
      
      if (selectError) {
        return { limpiados: 0, errores: 1 };
      }
      
      if (!registrosCorruptos || registrosCorruptos.length === 0) {
        return { limpiados: 0, errores: 0 };
      }
      
      
      // 📊 MOSTRAR EJEMPLOS DE DATOS CORRUPTOS
      const ejemplos = registrosCorruptos.slice(0, 5);
        id: r.id,
        usuario_id: r.usuario_id,
        tiempo_total_minutos: r.tiempo_total_minutos,
        fecha: r.fecha
      })));
      
      // 🧹 RESETEAR VALORES CORRUPTOS A 0
      const { error: updateError } = await supabase
        .from('sesiones_usuario')
        .update({ 
          tiempo_total_minutos: 0,
          updated_at: new Date().toISOString()
        })
        .gt('tiempo_total_minutos', 1000);
      
      if (updateError) {
        return { limpiados: 0, errores: 1 };
      }
      
      
      return { 
        limpiados: registrosCorruptos.length, 
        errores: 0 
      };
      
    } catch (error) {
      return { limpiados: 0, errores: 1 };
    }
  }
  
  /**
   * 🔍 VERIFICAR ESTADO DE LIMPIEZA
   * Muestra estadísticas antes y después de la limpieza
   */
  static async verificarEstadoLimpieza(): Promise<void> {
    try {
      
      // 📊 ANTES DE LIMPIEZA
      const { data: antes, error: errorAntes } = await supabase
        .from('sesiones_usuario')
        .select('tiempo_total_minutos')
        .gt('tiempo_total_minutos', 1000);
      
      if (errorAntes) {
        return;
      }
      
      const registrosCorruptos = antes?.length || 0;
      
      if (registrosCorruptos === 0) {
      } else {
      }
      
    } catch (error) {
    }
  }
  
  /**
   * 🚀 EJECUTAR LIMPIEZA COMPLETA
   * Función principal para ejecutar desde el panel admin
   */
  static async ejecutarLimpiezaCompleta(): Promise<{ exito: boolean; mensaje: string }> {
    try {
      
      // 1️⃣ LIMPIAR DATOS CORRUPTOS
      const resultado = await this.limpiarTiempoCorrupto();
      
      if (resultado.errores > 0) {
        return {
          exito: false,
          mensaje: `❌ Error durante la limpieza: ${resultado.errores} errores`
        };
      }
      
      // 2️⃣ VERIFICAR ESTADO
      await this.verificarEstadoLimpieza();
      
      return {
        exito: true,
        mensaje: `✅ Limpieza completada: ${resultado.limpiados} registros reseteados`
      };
      
    } catch (error) {
      return {
        exito: false,
        mensaje: `❌ Error inesperado: ${error}`
      };
    }
  }
} 
