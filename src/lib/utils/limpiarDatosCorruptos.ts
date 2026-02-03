// 🧹 UTILIDAD PARA LIMPIAR DATOS CORRUPTOS DE TIEMPO
// Este script resetea valores imposibles en sesiones_usuario.tiempo_total_minutos

import { supabase } from '../supabase/clienteSupabase';

export class LimpiadorDatosCorruptos {
  
  /**
   * 🧹 LIMPIAR DATOS CORRUPTOS DE TIEMPO
   * Resetea valores imposibles (> 1000 minutos = 16.6 horas) a 0
   */
  static async limpiarTiempoCorrupto(): Promise<{ limpiados: number; errores: number }> {
    try {
      console.log('🧹 [LIMPIEZA] Iniciando limpieza de datos corruptos...');
      
      // 🔍 IDENTIFICAR REGISTROS CON TIEMPO IMPOSIBLE (> 1000 minutos)
      const { data: registrosCorruptos, error: selectError } = await supabase
        .from('sesiones_usuario')
        .select('id, usuario_id, tiempo_total_minutos, fecha')
        .gt('tiempo_total_minutos', 1000); // Más de 16.6 horas = IMPOSIBLE
      
      if (selectError) {
        console.error('❌ [LIMPIEZA] Error consultando registros corruptos:', selectError);
        return { limpiados: 0, errores: 1 };
      }
      
      if (!registrosCorruptos || registrosCorruptos.length === 0) {
        console.log('✅ [LIMPIEZA] No hay datos corruptos para limpiar');
        return { limpiados: 0, errores: 0 };
      }
      
      console.log(`🔍 [LIMPIEZA] Encontrados ${registrosCorruptos.length} registros corruptos`);
      
      // 📊 MOSTRAR EJEMPLOS DE DATOS CORRUPTOS
      const ejemplos = registrosCorruptos.slice(0, 5);
      console.log('📊 [LIMPIEZA] Ejemplos de datos corruptos:', ejemplos.map((r: any) => ({
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
        console.error('❌ [LIMPIEZA] Error actualizando registros corruptos:', updateError);
        return { limpiados: 0, errores: 1 };
      }
      
      console.log(`✅ [LIMPIEZA] Limpieza completada: ${registrosCorruptos.length} registros reseteados`);
      
      return { 
        limpiados: registrosCorruptos.length, 
        errores: 0 
      };
      
    } catch (error) {
      console.error('❌ [LIMPIEZA] Error general:', error);
      return { limpiados: 0, errores: 1 };
    }
  }
  
  /**
   * 🔍 VERIFICAR ESTADO DE LIMPIEZA
   * Muestra estadísticas antes y después de la limpieza
   */
  static async verificarEstadoLimpieza(): Promise<void> {
    try {
      console.log('🔍 [VERIFICACIÓN] Verificando estado de la base de datos...');
      
      // 📊 ANTES DE LIMPIEZA
      const { data: antes, error: errorAntes } = await supabase
        .from('sesiones_usuario')
        .select('tiempo_total_minutos')
        .gt('tiempo_total_minutos', 1000);
      
      if (errorAntes) {
        console.error('❌ [VERIFICACIÓN] Error consultando estado:', errorAntes);
        return;
      }
      
      const registrosCorruptos = antes?.length || 0;
      console.log(`📊 [VERIFICACIÓN] Registros corruptos restantes: ${registrosCorruptos}`);
      
      if (registrosCorruptos === 0) {
        console.log('✅ [VERIFICACIÓN] Base de datos limpia - No hay datos corruptos');
      } else {
        console.log(`⚠️ [VERIFICACIÓN] Aún hay ${registrosCorruptos} registros corruptos`);
      }
      
    } catch (error) {
      console.error('❌ [VERIFICACIÓN] Error verificando estado:', error);
    }
  }
  
  /**
   * 🚀 EJECUTAR LIMPIEZA COMPLETA
   * Función principal para ejecutar desde el panel admin
   */
  static async ejecutarLimpiezaCompleta(): Promise<{ exito: boolean; mensaje: string }> {
    try {
      console.log('🚀 [LIMPIEZA COMPLETA] Iniciando proceso...');
      
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
      console.error('❌ [LIMPIEZA COMPLETA] Error:', error);
      return {
        exito: false,
        mensaje: `❌ Error inesperado: ${error}`
      };
    }
  }
} 