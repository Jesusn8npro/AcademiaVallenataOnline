import React, { useMemo } from 'react';
import './Avatar.css';

interface AvatarProps {
    src?: string | null;
    alt?: string;
    nombreCompleto?: string;
    size?: 'small' | 'medium' | 'large';
    onClick?: () => void;
}

const Avatar: React.FC<AvatarProps> = ({
    src,
    alt = 'Avatar',
    nombreCompleto = '',
    size = 'medium',
    onClick
}) => {

    const mostrarIniciales = useMemo(() => {
        return (!src || src.trim() === '') && nombreCompleto && nombreCompleto.trim() !== '';
    }, [src, nombreCompleto]);

    const iniciales = useMemo(() => {
        if (!mostrarIniciales || !nombreCompleto) return '';
        const partes = nombreCompleto.trim().split(' ');
        if (partes.length === 0) return '';
        if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
        return (partes[0][0] + partes[1][0]).toUpperCase();
    }, [mostrarIniciales, nombreCompleto]);

    const manejarClick = (e: React.MouseEvent | React.KeyboardEvent) => {
        if (onClick) {
            if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') return;
            onClick();
        }
    };

    const obtenerAvatarPorDefecto = () => {
        return 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (nombreCompleto || 'user');
    };

    return (
        <div
            className={`academia-avatar academia-avatar-${size} ${onClick ? 'academia-avatar-clickeable' : ''}`}
            onClick={onClick ? manejarClick : undefined}
            onKeyDown={onClick ? (e) => manejarClick(e) : undefined}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {mostrarIniciales ? (
                <div className="academia-avatar-iniciales">
                    {iniciales}
                </div>
            ) : (
                <img
                    src={src || obtenerAvatarPorDefecto()}
                    alt={alt}
                    className="academia-avatar-imagen"
                    onError={(e) => {
                        // Fallback a iniciales o default si falla la imagen
                        const target = e.target as HTMLImageElement;
                        target.src = obtenerAvatarPorDefecto();
                    }}
                />
            )}
        </div>
    );
};

export default Avatar;
