import { useState, useEffect } from 'react';

export interface DatosGuardadoHero {
    titulo: string;
    autor: string;
    descripcion: string;
    youtube_id: string;
    tipo: 'secuencia' | 'cancion' | 'ejercicio';
    dificultad: 'basico' | 'intermedio' | 'profesional';
}

export function extraerYouTubeId(valor: string): string {
    const limpio = valor.trim();
    if (!limpio) return '';
    const match = limpio.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (match?.[1]) return match[1];
    return /^[a-zA-Z0-9_-]{11}$/.test(limpio) ? limpio : '';
}

export function useModalGuardarHero(
    visible: boolean,
    sugerenciaTipo: 'secuencia' | 'cancion' | 'ejercicio',
    onGuardar: (datos: DatosGuardadoHero) => void
) {
    const [titulo, setTitulo] = useState('Pase Nuevo');
    const [autor, setAutor] = useState('Jesus Gonzalez');
    const [descripcion, setDescripcion] = useState('');
    const [youtubeInput, setYoutubeInput] = useState('');
    const [tipo, setTipo] = useState<'secuencia' | 'cancion' | 'ejercicio'>(sugerenciaTipo);
    const [dificultad, setDificultad] = useState<'basico' | 'intermedio' | 'profesional'>('basico');
    const [errorFormulario, setErrorFormulario] = useState('');

    useEffect(() => {
        if (visible) {
            setTipo(sugerenciaTipo);
            setErrorFormulario('');
        }
    }, [visible, sugerenciaTipo]);

    const guardar = () => {
        const tituloLimpio = titulo.trim();
        const autorLimpio = autor.trim() || 'Jesus Gonzalez';
        const youtube_id = extraerYouTubeId(youtubeInput);

        if (!tituloLimpio) {
            setErrorFormulario('Debes escribir un titulo para la grabacion.');
            return;
        }

        if (youtubeInput.trim() && !youtube_id) {
            setErrorFormulario('El ID o enlace de YouTube no es valido.');
            return;
        }

        setErrorFormulario('');
        onGuardar({ titulo: tituloLimpio, autor: autorLimpio, descripcion: descripcion.trim(), youtube_id, tipo, dificultad });
    };

    return {
        titulo, setTitulo,
        autor, setAutor,
        descripcion, setDescripcion,
        youtubeInput, setYoutubeInput,
        tipo, setTipo,
        dificultad, setDificultad,
        errorFormulario,
        guardar
    };
}
