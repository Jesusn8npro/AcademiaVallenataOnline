import { Navigate, useLocation } from 'react-router-dom';
import { useUsuario } from '../contextos/UsuarioContext';
import ProximamentePage from '../Paginas/ProximamentePage/ProximamentePage';

interface Props {
    children: React.ReactNode;
}

/**
 * Componente protector para las rutas de Acordeón Pro Max
 * - Admins: acceso normal a todas las rutas
 * - /acordeon-pro-max/lista: acceso permitido para todos
 * - Otras rutas de /acordeon-pro-max: mostrar página "Próximamente"
 */
const ProtectorAcordeonProMax: React.FC<Props> = ({ children }) => {
    const { esAdmin } = useUsuario();
    const location = useLocation();
    const pathname = location.pathname;

    // Si es admin, permitir acceso normal
    if (esAdmin) {
        return <>{children}</>;
    }

    // Si es la ruta /acordeon-pro-max/lista, permitir acceso
    if (pathname === '/acordeon-pro-max/lista') {
        return <>{children}</>;
    }

    // Para cualquier otra ruta de /acordeon-pro-max, mostrar próximamente
    if (pathname.startsWith('/acordeon-pro-max')) {
        return <ProximamentePage />;
    }

    // Por defecto, mostrar el contenido
    return <>{children}</>;
};

export default ProtectorAcordeonProMax;
