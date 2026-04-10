import { useUsuario } from '../../../contextos/UsuarioContext';
import VistaGrabacionesHero from './VistaGrabacionesHero';

export default function MisGrabaciones() {
    const { usuario } = useUsuario();

    return (
        <VistaGrabacionesHero
            usuarioId={usuario?.id}
            tipoVista="propia"
            nombreUsuario={usuario?.nombre}
        />
    );
}
