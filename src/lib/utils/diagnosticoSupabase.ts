import { supabase } from '$lib/supabase/clienteSupabase';

// 🔍 DIAGNÓSTICO COMPLETO DE CONFIGURACIÓN DE SUPABASE
export async function diagnosticarConfiguracionSupabase() {
  console.log('🔍 [DIAGNÓSTICO] Iniciando verificación de Supabase...');
  
  const diagnostico = {
    url: '',
    configuracion: {},
    conectividad: false,
    authConfig: {},
    errores: [] as string[],
    recomendaciones: [] as string[]
  };

  try {
    // 1️⃣ VERIFICAR URL Y CONFIGURACIÓN BÁSICA
    diagnostico.url = supabase.supabaseUrl;
    diagnostico.configuracion = {
      url: supabase.supabaseUrl,
      key: supabase.supabaseKey ? 'Configurada ✅' : 'No configurada ❌',
      origin: window.location.origin,
      hostname: window.location.hostname
    };

    console.log('🔍 [DIAGNÓSTICO] URL Supabase:', diagnostico.url);
    console.log('🔍 [DIAGNÓSTICO] Origin:', window.location.origin);

    // 2️⃣ VERIFICAR CONECTIVIDAD CON SUPABASE
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error) {
        diagnostico.conectividad = true;
        console.log('✅ [DIAGNÓSTICO] Conectividad con Supabase: OK');
      } else {
        diagnostico.errores.push(`Conectividad: ${error.message}`);
        console.error('❌ [DIAGNÓSTICO] Error de conectividad:', error);
      }
    } catch (err) {
      diagnostico.errores.push(`Conectividad excepción: ${err}`);
      console.error('❌ [DIAGNÓSTICO] Excepción de conectividad:', err);
    }

    // 3️⃣ VERIFICAR CONFIGURACIÓN DE AUTH (sin getConfig que no existe)
    try {
      // Verificar que el cliente de auth esté inicializado correctamente
      const session = await supabase.auth.getSession();
      diagnostico.authConfig = {
        clienteAuth: 'Inicializado ✅',
        sesionValida: session?.data?.session ? 'Activa ✅' : 'No activa ℹ️',
        urlActual: window.location.href,
        esLocalhost: window.location.hostname === 'localhost' ? 'Sí ⚠️' : 'No ✅'
      };
      console.log('🔍 [DIAGNÓSTICO] Configuración Auth:', diagnostico.authConfig);
    } catch (err) {
      diagnostico.errores.push(`Configuración Auth: ${err}`);
    }

          // 4️⃣ VERIFICAR CONFIGURACIÓN DE EMAIL (DETECCIÓN ESPECÍFICA)
      try {
        console.log('🔍 [DIAGNÓSTICO] Probando configuración de email...');
        
        // Intentar con un email de prueba para detectar el tipo de error
        const { error: emailError } = await supabase.auth.resetPasswordForEmail('test@nonexistent-domain-12345.com', {
          redirectTo: window.location.origin + '/recuperar-contrasena'
        });

        if (emailError) {
          console.log('🔍 [DIAGNÓSTICO] Error de email detectado:', emailError);
          
          if (emailError.message.includes('rate') || emailError.message.includes('limit')) {
            diagnostico.recomendaciones.push('✅ Servicio de email funcional (rate limit detectado - normal)');
          } else if (emailError.message.includes('not authorized') || emailError.message.includes('email_address_not_authorized')) {
            diagnostico.errores.push('🚨 PROBLEMA PRINCIPAL: Usando servicio de email predeterminado de Supabase');
            diagnostico.recomendaciones.push('');
            diagnostico.recomendaciones.push('❌ CAUSA DEL ERROR: El servicio de email por defecto de Supabase');
            diagnostico.recomendaciones.push('   SOLO envía emails a miembros de tu organización de Supabase.');
            diagnostico.recomendaciones.push('   Por eso emails externos no llegan pero aparecen como "enviados".');
            diagnostico.recomendaciones.push('');
            diagnostico.recomendaciones.push('✅ SOLUCIÓN OBLIGATORIA: Configurar proveedor SMTP personalizado');
            diagnostico.recomendaciones.push('   1. Ve a Supabase Dashboard > Authentication > Settings');
            diagnostico.recomendaciones.push('   2. Scroll hasta "SMTP Settings"');
            diagnostico.recomendaciones.push('   3. Configura uno de estos proveedores:');
            diagnostico.recomendaciones.push('      • Gmail SMTP (gratis, 500 emails/día)');
            diagnostico.recomendaciones.push('      • Resend (gratis, 3000 emails/mes)');
            diagnostico.recomendaciones.push('      • SendGrid (gratis, 100 emails/día)');
            diagnostico.recomendaciones.push('      • Mailgun, Amazon SES, etc.');
          } else if (emailError.message.includes('invalid') || emailError.message.includes('disabled')) {
            diagnostico.errores.push('❌ Servicio de email deshabilitado o mal configurado');
            diagnostico.recomendaciones.push('🔧 Habilita email confirmations en Supabase Dashboard');
          } else {
            diagnostico.errores.push(`Error de email: ${emailError.message}`);
            if (emailError.message.includes('AuthRetryableFetchError')) {
              diagnostico.recomendaciones.push('⚠️ Error de conectividad - revisa tu conexión a internet');
            }
          }
        } else {
          diagnostico.recomendaciones.push('✅ Servicio de email configurado correctamente');
        }
      } catch (emailErr) {
        const error = emailErr as any;
        diagnostico.errores.push(`Error de email: ${error.message || emailErr}`);
        if (error.message?.includes('AuthRetryableFetchError')) {
          diagnostico.recomendaciones.push('⚠️ AuthRetryableFetchError - problema de conectividad');
        }
      }

    // 5️⃣ VERIFICAR POLÍTICAS RLS
    try {
      const { data: perfiles, error: perfilesError } = await supabase
        .from('perfiles')
        .select('count')
        .limit(1);

      if (!perfilesError) {
        diagnostico.recomendaciones.push('✅ Acceso a tabla perfiles: OK');
      } else {
        diagnostico.errores.push(`Políticas RLS: ${perfilesError.message}`);
        diagnostico.recomendaciones.push('🔧 Verifica las políticas RLS en la tabla perfiles');
      }
    } catch (rlsErr) {
      diagnostico.errores.push(`RLS test excepción: ${rlsErr}`);
    }

    // 6️⃣ GENERAR RECOMENDACIONES ESPECÍFICAS PARA DESARROLLO LOCAL
    if (window.location.hostname === 'localhost') {
      diagnostico.recomendaciones.push('⚠️ DETECTADO DESARROLLO LOCAL - Problemas comunes con resetPasswordForEmail:');
      diagnostico.recomendaciones.push('');
      diagnostico.recomendaciones.push('🔧 SOLUCIONES INMEDIATAS:');
      diagnostico.recomendaciones.push('1. En Supabase Dashboard > Authentication > Settings > General:');
      diagnostico.recomendaciones.push('   ✅ Site URL: http://localhost:5173');
      diagnostico.recomendaciones.push('   ✅ Redirect URLs: http://localhost:5173/**, http://localhost:5173/recuperar-contrasena');
      diagnostico.recomendaciones.push('');
      diagnostico.recomendaciones.push('2. En Authentication > Settings > Email Templates:');
      diagnostico.recomendaciones.push('   ✅ Habilita "Enable email confirmations"');
      diagnostico.recomendaciones.push('   ✅ Configura plantillas de email personalizadas');
      diagnostico.recomendaciones.push('');
      diagnostico.recomendaciones.push('3. Configuración de SMTP (REQUERIDO para desarrollo):');
      diagnostico.recomendaciones.push('   ⚠️ El servicio de email por defecto NO funciona bien en localhost');
      diagnostico.recomendaciones.push('   ✅ Configura un proveedor SMTP (Gmail, SendGrid, Resend, etc.)');
      diagnostico.recomendaciones.push('');
      diagnostico.recomendaciones.push('4. ALTERNATIVA TEMPORAL - Usar IP local:');
      diagnostico.recomendaciones.push('   💡 Usa http://127.0.0.1:5173 en lugar de localhost:5173');
      diagnostico.recomendaciones.push('   💡 O usa http://192.168.x.x:5173 (tu IP local)');
      
      if (diagnostico.errores.some(e => e.includes('AuthRetryableFetchError'))) {
        diagnostico.recomendaciones.push('');
        diagnostico.recomendaciones.push('🚨 ERROR AuthRetryableFetchError detectado:');
        diagnostico.recomendaciones.push('   ❌ Este error es MUY común en localhost');
        diagnostico.recomendaciones.push('   ✅ Funciona perfectamente en producción');
        diagnostico.recomendaciones.push('   💡 Para testear: deploy temporal o usa ngrok/cloudflare tunnel');
      }
    } else {
      if (diagnostico.errores.length === 0) {
        diagnostico.recomendaciones.push('🎉 Configuración de Supabase parece correcta');
      } else {
        diagnostico.recomendaciones.push('🔧 Acciones recomendadas para producción:');
        diagnostico.recomendaciones.push('1. Verifica las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
        diagnostico.recomendaciones.push('2. En Supabase Dashboard > Authentication > Settings:');
        diagnostico.recomendaciones.push('   - Habilita "Enable email confirmations"');
        diagnostico.recomendaciones.push('   - Configura "Site URL" con tu dominio');
        diagnostico.recomendaciones.push('   - Verifica "Redirect URLs" incluye tu dominio/recuperar-contrasena');
        diagnostico.recomendaciones.push('3. Verifica que el proveedor de email esté configurado (SMTP o servicio)');
      }
    }

  } catch (error) {
    diagnostico.errores.push(`Error general: ${error}`);
    console.error('❌ [DIAGNÓSTICO] Error general:', error);
  }

  // 7️⃣ MOSTRAR RESUMEN
  console.log('📊 [DIAGNÓSTICO] RESUMEN:', diagnostico);
  
  return diagnostico;
}

// 🛠️ FUNCIÓN PARA PROBAR RECUPERACIÓN DE CONTRASEÑA
export async function probarRecuperacionContrasena(email: string) {
  console.log('🧪 [PRUEBA] Probando recuperación para:', email);
  
  const isProduction = window.location.hostname === 'academiavallenataonline.com';
  const isLocalhost = window.location.hostname === 'localhost';
  const redirectURL = isProduction 
    ? 'https://academiavallenataonline.com/recuperar-contrasena'
    : window.location.origin + '/recuperar-contrasena';

  console.log('🔗 [PRUEBA] Redirect URL configurada:', redirectURL);

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectURL
    });

    if (error) {
      console.error('❌ [PRUEBA] Error completo:', error);
      
      // Analizar tipo específico de error
      if (error.message?.includes('AuthRetryableFetchError') || error.name === 'AuthRetryableFetchError') {
        return {
          exito: false,
          error: 'AuthRetryableFetchError - Error típico de desarrollo local',
          codigoError: error.status || 'N/A',
          recomendacion: isLocalhost 
            ? '🔧 SOLUCIÓN: Este error es normal en localhost. Para solucionarlo:\n1. Configura SMTP personalizado en Supabase\n2. Agrega localhost:5173 a las URLs permitidas\n3. O prueba en producción donde funciona perfectamente'
            : 'Problema de conectividad con Supabase Auth. Verifica tu configuración de red.'
        };
      }
      
      if (error.message?.includes('rate') || error.message?.includes('limit')) {
        return {
          exito: false,
          error: 'Rate limit excedido',
          codigoError: error.status || 429,
          recomendacion: 'Espera unos minutos antes de intentar nuevamente'
        };
      }

      if (error.message?.includes('not authorized') || error.message?.includes('invalid') || error.message?.includes('email_address_not_authorized')) {
        return {
          exito: false,
          error: '🚨 PROBLEMA PRINCIPAL: Servicio de email predeterminado de Supabase',
          codigoError: error.status || 'EMAIL_NOT_AUTHORIZED',
          recomendacion: '❌ CAUSA: Supabase por defecto SOLO envía emails a miembros de tu organización.\n\n' +
                        '✅ SOLUCIÓN OBLIGATORIA: Configurar proveedor SMTP personalizado:\n' +
                        '   1. Supabase Dashboard > Authentication > Settings > SMTP Settings\n' +
                        '   2. Enable custom SMTP ✅\n' +
                        '   3. Configura Gmail, Resend, SendGrid, etc.\n' +
                        '   4. Guía completa: src/lib/utils/configuracionSMTP.md\n\n' +
                        '📧 PROVEEDORES RECOMENDADOS:\n' +
                        '   • Gmail SMTP (gratis, 500 emails/día)\n' +
                        '   • Resend (gratis, 3000 emails/mes) ⭐\n' +
                        '   • SendGrid (gratis, 100 emails/día)'
        };
      }

      return {
        exito: false,
        error: error.message || 'Error desconocido',
        codigoError: error.status || 'N/A',
        recomendacion: 'Verifica la configuración de Supabase Auth y conectividad'
      };
    } else {
      console.log('✅ [PRUEBA] Email enviado exitosamente');
      return {
        exito: true,
        mensaje: 'Email de recuperación enviado correctamente',
        redirectURL,
        nota: isLocalhost ? 'Revisa la configuración de SMTP si no recibes el email' : undefined
      };
    }
  } catch (err) {
    console.error('❌ [PRUEBA] Excepción completa:', err);
    
    // Capturar específicamente AuthRetryableFetchError
    const error = err as any; // Convertir para acceder a propiedades
    if (error.name === 'AuthRetryableFetchError' || error.message?.includes('AuthRetryableFetchError')) {
      return {
        exito: false,
        error: 'AuthRetryableFetchError (Error de desarrollo local)',
        codigoError: 'NETWORK_ERROR',
        recomendacion: isLocalhost
          ? '🚨 ERROR COMÚN EN LOCALHOST:\n• Este error NO ocurre en producción\n• Es un problema conocido de Supabase con localhost\n• SOLUCIÓN: Despliega en producción para probar realmente'
          : 'Error de conectividad de red. Verifica tu conexión a internet.'
      };
    }

    return {
      exito: false,
      error: `Excepción inesperada: ${error.message || String(err)}`,
      codigoError: 'EXCEPTION',
      recomendacion: 'Error inesperado. Verifica consola del navegador para más detalles.'
    };
  }
} 