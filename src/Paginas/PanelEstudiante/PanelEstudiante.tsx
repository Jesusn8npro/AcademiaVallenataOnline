import React, { useEffect } from 'react';
import ProteccionAutenticacion from '../../guards/ProteccionAutenticacion';
import ContinuarAprendiendo from './Componentes/ContinuarAprendiendo';
import LogrosDesafios from './Componentes/LogrosDesafios';
import RecomendacionesCursos from './Componentes/RecomendacionesCursos';
import SimuladorEstadisticas from './Componentes/SimuladorEstadisticas';
import SidebarDerecho from './Componentes/SidebarDerecho';
import './PanelEstudiante.css';

const PanelEstudiante: React.FC = () => {
    useEffect(() => {
        document.title = 'Panel Estudiante - Academia Vallenata';
    }, []);

    return (
        <ProteccionAutenticacion
            titulo="🎓 PANEL DE ESTUDIANTE"
            mensajePrincipal="Tu panel personal requiere que inicies sesión como estudiante"
        >
            <div className="academia-panel-gaming-container">

                {/* 📊 CONTENIDO PRINCIPAL */}
                <main className="academia-contenido-principal">

                    {/* 🎵 CONTINUAR APRENDIENDO - Hero Principal */}
                    <ContinuarAprendiendo />

                    {/* 🏆 LOGROS Y DESAFÍOS */}
                    <LogrosDesafios />

                    {/* 🎮 RECOMENDACIONES + SIMULADOR PREVIEW */}
                    <section className="academia-simulador-stats">
                        <div className="academia-simulador-card">
                            <RecomendacionesCursos />
                        </div>

                        <div className="academia-estadisticas-card">
                            <SimuladorEstadisticas />
                        </div>
                    </section>
                </main>

                {/* 📚 SIDEBAR DERECHO - Componente Unificado */}
                <SidebarDerecho />

            </div>
        </ProteccionAutenticacion>
    );
};

export default PanelEstudiante;
