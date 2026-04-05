import React, { useEffect, useState } from 'react';
import ProteccionAutenticacion from '../../guards/ProteccionAutenticacion';
import ContinuarAprendiendo from './Componentes/ContinuarAprendiendo';
import LogrosDesafios from './Componentes/LogrosDesafios';
import RecomendacionesCursos from './Componentes/RecomendacionesCursos';
import SimuladorEstadisticas from './Componentes/SimuladorEstadisticas';
import SidebarDerecho from './Componentes/SidebarDerecho';
import './PanelEstudiante.css';

const PanelEstudiante: React.FC = () => {
    const [cargandoDatos, setCargandoDatos] = useState(false);

    useEffect(() => {
        document.title = 'Panel Estudiante - Academia Vallenata';

        // ⚡ SIMULAR CARGA EN SEGUNDO PLANO (Como en Svelte)
        console.log('🚀 [PANEL] Panel estudiante cargado');

        const cargarDatosBackground = async () => {
            try {
                // console.log('📊 [PANEL] Cargando datos en segundo plano...');
                setCargandoDatos(true);
                await new Promise(resolve => setTimeout(resolve, 500));
                setCargandoDatos(false);
                // console.log('✅ [PANEL] Datos cargados en segundo plano');
            } catch (error) {
                console.warn('⚠️ [PANEL] Error cargando datos en segundo plano:', error);
                setCargandoDatos(false);
            }
        };

        const timeout = setTimeout(cargarDatosBackground, 100);
        return () => clearTimeout(timeout);
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
