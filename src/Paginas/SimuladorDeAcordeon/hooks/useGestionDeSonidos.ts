import { useState, useEffect } from 'react';
import { supabase } from '../../../servicios/supabaseCliente';
// import { procesarAudioMuestra } from '../utilidades/procesadorAudio'; // Archivo perdido en restore

/**
 * 🛠️ HOOK DE GESTIÓN DE SONIDOS (Español Latino)
 * Maneja la subida de muestras reales de acordeón procesadas.
 */

export interface Instrumento {
    id: string;
    nombre: string;
    afinacion: string;
}

export const useGestionDeSonidos = () => {
    const [instrumentos, setInstrumentos] = useState<Instrumento[]>([]);
    const [instrumentoSeleccionado, setInstrumentoSeleccionado] = useState<string | null>(null);
    const [estaProcesando, setEstaProcesando] = useState(false);
    const [mensajeEstado, setMensajeEstado] = useState('');
    const [muestrasCargadas, setMuestrasCargadas] = useState<Record<string, { buffer: AudioBuffer; nombre?: string }>>({});

    const cargarInstrumentos = async () => {
        const { data, error } = await supabase
            .from('instrumentos_simulador')
            .select('*')
            .eq('activo', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error cargando instrumentos:', error);
        } else {
            setInstrumentos(data || []);
            // Se eliminó la autoselección forzada que impedía volver al modo digital
        }
    };

    useEffect(() => {
        cargarInstrumentos();
    }, []);

    // 🚀 CARGAR MUESTRAS CUANDO CAMBIA EL INSTRUMENTO
    useEffect(() => {
        // Limpiar muestras anteriores siempre que cambie la selección
        setMuestrasCargadas({});

        if (instrumentoSeleccionado) {
            cargarMuestrasDeInstrumento(instrumentoSeleccionado);
        }
    }, [instrumentoSeleccionado]);

    const cargarMuestrasDeInstrumento = async (insId: string) => {
        try {
            setMensajeEstado('Cargando sonidos y etiquetas...');
            const { data, error } = await supabase
                .from('notas_musicales_simulador')
                .select('boton_id, fuelle, archivo_url, nota_nombre')
                .eq('instrumento_id', insId);

            if (error) throw error;

            const contextoAudio = new (window.AudioContext || (window as any).webkitAudioContext)();
            const nuevoMapa: Record<string, { buffer: AudioBuffer; nombre?: string }> = {};

            // Cargar y decodificar cada muestra
            const promesas = (data || []).map(async (nota) => {
                try {
                    const res = await fetch(nota.archivo_url);
                    const arrayBuffer = await res.arrayBuffer();
                    const audioBuffer = await contextoAudio.decodeAudioData(arrayBuffer);

                    // Llave única: botonId_fuelle
                    const claveFuelle = nota.fuelle === 'abriendo' ? 'halar' : 'empujar';
                    const key = `${nota.boton_id}_${claveFuelle}`;
                    nuevoMapa[key] = {
                        buffer: audioBuffer,
                        nombre: nota.nota_nombre
                    };
                } catch (e) {
                    console.error('Error cargando nota:', nota.boton_id, e);
                }
            });

            await Promise.all(promesas);
            setMuestrasCargadas(nuevoMapa);
        } catch (error) {
            console.error('Error al cargar muestras:', error);
        } finally {
            setMensajeEstado('');
        }
    };

    const crearInstrumento = async (nombre: string, afinacion: string, categoria: string = 'diatónico') => {
        try {
            setEstaProcesando(true);
            setMensajeEstado('Creando nuevo acordeón...');

            const { data, error } = await supabase
                .from('instrumentos_simulador')
                .insert([{ nombre, afinacion, categoria, activo: true }])
                .select();

            if (error) throw error;

            setMensajeEstado('✅ Acordeón creado con éxito');
            await cargarInstrumentos();
            if (data && data[0]) setInstrumentoSeleccionado(data[0].id);
            return data[0];
        } catch (error: any) {
            alert(`❌ Error al crear instrumento: ${error.message}`);
            return null;
        } finally {
            setEstaProcesando(false);
            setMensajeEstado('');
        }
    };

    const eliminarInstrumento = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este acordeón? Se borrarán todos sus sonidos permanentemente.')) return;

        try {
            setEstaProcesando(true);
            setMensajeEstado('Eliminando grabaciones del servidor...');

            // 1. ELIMINAR ARCHIVOS EN STORAGE (Opcional pero recomendado para ahorrar espacio)
            // Nota: Supabase storage.remove requiere una lista de archivos, no carpetas directamente.
            // Para simplicidad en este sprint, eliminamos el registro DB y el usuario puede limpiar el bucket luego,
            // o implementamos una lógica de listado -> borrado.

            // 2. ELIMINAR REGISTROS DE NOTAS
            await supabase.from('notas_musicales_simulador').delete().eq('instrumento_id', id);

            // 3. ELIMINAR INSTRUMENTO
            const { error } = await supabase.from('instrumentos_simulador').delete().eq('id', id);

            if (error) throw error;

            setMensajeEstado('✅ Acordeón eliminado');
            await cargarInstrumentos();
            if (instrumentoSeleccionado === id) setInstrumentoSeleccionado(null);
        } catch (error: any) {
            alert(`❌ Error al eliminar: ${error.message}`);
        } finally {
            setEstaProcesando(false);
            setMensajeEstado('');
        }
    };

    const subirMuestraReal = async (
        archivo: File | Blob,
        botonId: string,
        datosNota: { fuelle: string; hilera?: number; esBajo: boolean; nombreNota: string; octava: number }
    ) => {
        if (!instrumentoSeleccionado) {
            alert('❌ Selecciona primero un acordeón de la lista.');
            return;
        }

        try {
            setEstaProcesando(true);
            setMensajeEstado('Procesando audio (Recorte y Normalización)...');

            // 1. PROCESAMIENTO (Auto-Trim y Normalización) - BYPASS TEMPORAL
            // Comentado porque el archivo procesadorAudio se perdió en el restore
            // const audioProcesado = await procesarAudioMuestra(archivo as any);
            const audioProcesado = archivo;

            setMensajeEstado('Subiendo a la nube (Supabase Storage)...');

            // 2. STORAGE (Bucket: audios-simulador)
            const nombreArchivo = `${botonId}_${datosNota.fuelle}_${Date.now()}.wav`;
            const rutaStorage = `instrumentos/${instrumentoSeleccionado}/${datosNota.fuelle}/${nombreArchivo}`;

            const { data: storageData, error: storageError } = await supabase.storage
                .from('audios-simulador')
                .upload(rutaStorage, audioProcesado, {
                    contentType: 'audio/wav',
                    upsert: true
                });

            if (storageError) throw storageError;

            // Obtener URL pública
            const { data: urlData } = supabase.storage
                .from('audios-simulador')
                .getPublicUrl(rutaStorage);

            setMensajeEstado('Guardando registro en la base de datos...');

            // 3. BASE DE DATOS (Mapeo)
            const { error: dbError } = await supabase
                .from('notas_musicales_simulador')
                .upsert({
                    instrumento_id: instrumentoSeleccionado,
                    boton_id: botonId,
                    es_bajo: datosNota.esBajo,
                    hilera: datosNota.hilera,
                    fuelle: datosNota.fuelle === 'halar' ? 'abriendo' : 'cerrando',
                    nota_nombre: datosNota.nombreNota,
                    octava: datosNota.octava,
                    archivo_url: urlData.publicUrl,
                    volumen_ajuste: 1.0
                }, {
                    onConflict: 'instrumento_id,boton_id,fuelle'
                });

            if (dbError) throw dbError;

            setMensajeEstado('✅ ¡Muestra guardada con éxito!');
        } catch (error: any) {
            console.error('Fallo en la gestión de sonidos:', error);
            alert(`❌ Error: ${error.message || 'Algo salió mal'
                }`);
        } finally {
            setEstaProcesando(false);
            setMensajeEstado('');
        }
    };

    return {
        instrumentos,
        instrumentoSeleccionado,
        setInstrumentoSeleccionado,
        subirMuestraReal,
        crearInstrumento,
        eliminarInstrumento,
        estaProcesando,
        mensajeEstado,
        muestrasCargadas,
        recargarMuestras: () => instrumentoSeleccionado && cargarMuestrasDeInstrumento(instrumentoSeleccionado)
    };
};
