import React from 'react'
import { useNavigate } from 'react-router-dom'
import './BannerCompletarPerfil.css'

interface BannerCompletarPerfilProps {
    mostrar: boolean
}

export default function BannerCompletarPerfil({ mostrar }: BannerCompletarPerfilProps) {
    const navigate = useNavigate()

    if (!mostrar) return null

    const irAConfiguracion = () => {
        navigate('/configuracion')
    }

    return (
        <div className="bcp-banner">
            <div className="bcp-contenido">
                <span className="bcp-icono">⚠️</span>
                <span className="bcp-texto">Completa tu perfil para mayor seguridad</span>
            </div>
            <button className="bcp-boton" onClick={irAConfiguracion}>
                Ir a Configuración →
            </button>
        </div>
    )
}
