import { supabase } from '../supabase/clienteSupabase';
import { generateSlug } from '../utilidades/utilidadesSlug';

/**
 * Script para actualizar los slugs de todos los paquetes existentes
 * Este script se ejecuta una sola vez para corregir los paquetes que no tienen slug
 */
export async function actualizarSlugsPaquetes() {
    console.log('🔄 Iniciando actualización de slugs de paquetes...');
    
    try {
        // 1. Obtener todos los paquetes
        const { data: paquetes, error: errorPaquetes } = await supabase
            .from('paquetes_tutoriales')
            .select('id, titulo, slug')
            .order('created_at', { ascending: false });

        if (errorPaquetes) {
            console.error('❌ Error obteniendo paquetes:', errorPaquetes);
            return { success: false, error: errorPaquetes.message };
        }

        if (!paquetes || paquetes.length === 0) {
            console.log('ℹ️ No hay paquetes para actualizar');
            return { success: true, message: 'No hay paquetes para actualizar' };
        }

        console.log(`📦 Encontrados ${paquetes.length} paquetes`);

        // 2. Actualizar paquetes que no tienen slug o tienen slug vacío
        const paquetesSinSlug = paquetes.filter((p: any) => !p.slug || p.slug.trim() === '');
        
        if (paquetesSinSlug.length === 0) {
            console.log('✅ Todos los paquetes ya tienen slug');
            return { success: true, message: 'Todos los paquetes ya tienen slug' };
        }

        console.log(`🔧 Actualizando ${paquetesSinSlug.length} paquetes sin slug...`);

        // 3. Actualizar cada paquete
        let actualizados = 0;
        let errores = 0;

        for (const paquete of paquetesSinSlug) {
            try {
                const nuevoSlug = generateSlug(paquete.titulo);
                
                const { error: errorActualizar } = await supabase
                    .from('paquetes_tutoriales')
                    .update({ 
                        slug: nuevoSlug,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', paquete.id);

                if (errorActualizar) {
                    console.error(`❌ Error actualizando paquete ${paquete.id}:`, errorActualizar);
                    errores++;
                } else {
                    console.log(`✅ Actualizado: "${paquete.titulo}" → "${nuevoSlug}"`);
                    actualizados++;
                }

                // Pequeña pausa para no saturar la base de datos
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`❌ Error procesando paquete ${paquete.id}:`, error);
                errores++;
            }
        }

        console.log(`🎉 Actualización completada:`);
        console.log(`   ✅ Actualizados: ${actualizados}`);
        console.log(`   ❌ Errores: ${errores}`);

        return { 
            success: true, 
            message: `Actualización completada: ${actualizados} actualizados, ${errores} errores`,
            data: { actualizados, errores }
        };

    } catch (error: any) {
        console.error('❌ Error en actualización de slugs:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Función para probar la generación de slugs
 */
export function probarGeneracionSlug() {
    const titulo = "10 EXITOS del BINOMIO de ORO (Mega-Paquete de TUTORIALES)";
    const slug = generateSlug(titulo);
    
    console.log('🧪 Prueba de generación de slug:');
    console.log('📝 Título original:', titulo);
    console.log('🔗 Slug generado:', slug);
    console.log('🌐 URL completa:', `/paquetes/${slug}`);
    console.log('📏 Longitud del slug:', slug.length);
    
    // Prueba con diferentes variaciones
    const pruebas = [
        "10 EXITOS del BINOMIO de ORO (Mega-Paquete de TUTORIALES)",
        "10 exitos del binomio de oro mega paquete de tutoriales",
        "Cómo Tócar Acordéon: Tutorial Básico",
        "Mi Paquete (Especial) - 2024"
    ];
    
    console.log('\n🔬 Pruebas adicionales:');
    pruebas.forEach((titulo, i) => {
        const slugGenerado = generateSlug(titulo);
        console.log(`${i + 1}. "${titulo}" → "${slugGenerado}"`);
    });
    
    return { titulo, slug, url: `/paquetes/${slug}` };
}

/**
 * Función para arreglar específicamente el paquete problemático
 */
export async function arreglarPaqueteEspecifico() {
    try {
        console.log('🔧 Arreglando paquete específico...');
        
        // Buscar el paquete por título
        const { data: paquetes, error } = await supabase
            .from('paquetes_tutoriales')
            .select('*')
            .ilike('titulo', '%10 EXITOS del BINOMIO de ORO%');
        
        if (error) {
            console.error('❌ Error buscando paquete:', error);
            return { success: false, error: error.message };
        }
        
        if (!paquetes || paquetes.length === 0) {
            console.log('❌ No se encontró el paquete');
            return { success: false, error: 'Paquete no encontrado' };
        }
        
        const paquete = paquetes[0];
        console.log('📦 Paquete encontrado:', paquete);
        
        // Generar slug correcto
        const slugCorrecto = generateSlug(paquete.titulo);
        console.log('🔗 Slug correcto:', slugCorrecto);
        
        // Actualizar en la base de datos
        const { error: errorUpdate } = await supabase
            .from('paquetes_tutoriales')
            .update({ 
                slug: slugCorrecto,
                updated_at: new Date().toISOString()
            })
            .eq('id', paquete.id);
        
        if (errorUpdate) {
            console.error('❌ Error actualizando paquete:', errorUpdate);
            return { success: false, error: errorUpdate.message };
        }
        
        console.log('✅ Paquete actualizado exitosamente');
        console.log('🌐 Nueva URL:', `/paquetes/${slugCorrecto}`);
        
        return { 
            success: true, 
            message: 'Paquete actualizado exitosamente',
            data: { titulo: paquete.titulo, slug: slugCorrecto, url: `/paquetes/${slugCorrecto}` }
        };
        
    } catch (error: any) {
        console.error('❌ Error arreglando paquete:', error);
        return { success: false, error: error.message };
    }
}

// Funciones para ejecutar desde la consola del navegador
if (typeof window !== 'undefined') {
    (window as any).actualizarSlugsPaquetes = actualizarSlugsPaquetes;
    (window as any).probarGeneracionSlug = probarGeneracionSlug;
    (window as any).generateSlug = generateSlug;
    (window as any).arreglarPaqueteEspecifico = arreglarPaqueteEspecifico;
} 