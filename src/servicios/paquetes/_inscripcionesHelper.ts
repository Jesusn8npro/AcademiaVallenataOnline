import { supabase, supabaseAdmin } from './_cliente';
import { obtenerTutorialesPaquete } from './consultas';

export async function inscribirTutorialesDelPaquete(usuarioId: string, paqueteId: string): Promise<void> {
    try {
        const resultadoTutoriales = await obtenerTutorialesPaquete(paqueteId);

        if (!resultadoTutoriales.success || !resultadoTutoriales.data) {
            return;
        }

        const tutoriales = resultadoTutoriales.data;

        const tutorialesValidos = tutoriales.filter((item: any) => {
            return item.tutoriales?.id;
        });

        if (tutorialesValidos.length === 0) {
            return;
        }

        const { data: inscripcionesExistentes, error: errorExistentes } = await supabaseAdmin
            .from('inscripciones')
            .select('tutorial_id')
            .eq('usuario_id', usuarioId)
            .not('tutorial_id', 'is', null);

        if (errorExistentes) {
        }

        const tutorialesInscritos = inscripcionesExistentes?.map(i => i.tutorial_id) || [];

        const tutorialesParaInscribir = tutorialesValidos.filter((item: any) => {
            const tutorialId = item.tutoriales?.id;
            const yaInscrito = tutorialesInscritos.includes(tutorialId);
            return tutorialId && !yaInscrito;
        });

        if (tutorialesParaInscribir.length === 0) {
            return;
        }

        const inscripciones = tutorialesParaInscribir.map((item: any) => ({
            usuario_id: usuarioId,
            tutorial_id: item.tutoriales.id,
            fecha_inscripcion: new Date().toISOString(),
            porcentaje_completado: 0,
            completado: false,
            estado: 'activo',
            progreso: 0,
            ultima_actividad: new Date().toISOString()
        }));

        let exitosas = 0;
        let fallidas = 0;

        for (const inscripcion of inscripciones) {
            try {
                const { error } = await supabaseAdmin
                    .from('inscripciones')
                    .insert([inscripcion])
                    .select();

                if (error) {
                    fallidas++;
                } else {
                    exitosas++;
                }
            } catch (error) {
                fallidas++;
            }
        }

        if (fallidas > 0) {
            let fallidasRegular = 0;

            for (const inscripcion of inscripciones) {
                try {
                    const { error } = await supabase
                        .from('inscripciones')
                        .insert([inscripcion])
                        .select();

                    if (error) {
                        fallidasRegular++;
                    }
                } catch (error) {
                    fallidasRegular++;
                }
            }
        }

        if (inscripciones.length > 0) {
            try {
                await supabaseAdmin
                    .from('inscripciones')
                    .insert(inscripciones)
                    .select();
            } catch (error) {
            }
        }

        await supabaseAdmin
            .from('inscripciones')
            .select('*')
            .eq('usuario_id', usuarioId)
            .not('tutorial_id', 'is', null)
            .in('tutorial_id', tutorialesParaInscribir.map((item: any) => item.tutoriales.id));

    } catch (error) {
    }
}
