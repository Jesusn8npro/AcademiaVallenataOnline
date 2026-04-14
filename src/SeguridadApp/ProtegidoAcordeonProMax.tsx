import { useUsuario } from '../contextos/UsuarioContext';
import ProximamentePage from '../Paginas/ProximamentePage/ProximamentePage';

interface Props {
    children: React.ReactNode;
}

/**
 * Componente que envuelve una ruta de Acordeón Pro Max
 * - Admins: ven el contenido
 * - Usuarios normales: ven página "Próximamente"
 */
const ProtegidoAcordeonProMax: React.FC<Props> = ({ children }) => {
    const { esAdmin, usuario } = useUsuario();

    const emailAutorizado = usuario?.email?.toLowerCase().trim() === 'shalom@gmail.com';

    if (esAdmin || emailAutorizado) {
        return <>{children}</>;
    }

    return <ProximamentePage />;
};

export default ProtegidoAcordeonProMax;
