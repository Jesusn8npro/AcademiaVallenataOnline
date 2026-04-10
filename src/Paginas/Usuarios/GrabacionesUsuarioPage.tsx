import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import VistaGrabacionesHero from '../Perfil/MisGrabaciones/VistaGrabacionesHero';

interface PerfilPublico {
    id: string;
    nombre?: string | null;
    nombre_completo?: string | null;
}

export default function GrabacionesUsuarioPage() {
    const { usuarioPublico } = useOutletContext<{ usuarioPublico: PerfilPublico | null }>();

    const nombreUsuario = useMemo(() => {
        if (!usuarioPublico) return '';
        return usuarioPublico.nombre_completo || usuarioPublico.nombre || 'este estudiante';
    }, [usuarioPublico]);

    return (
        <VistaGrabacionesHero
            usuarioId={usuarioPublico?.id}
            tipoVista="publica"
            nombreUsuario={nombreUsuario}
        />
    );
}
