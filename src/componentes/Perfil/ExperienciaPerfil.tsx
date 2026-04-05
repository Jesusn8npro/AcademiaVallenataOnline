import React, { useEffect, useState } from 'react';
import { scoresHeroService } from '../../servicios/scoresHeroService';
import { supabase } from '../../servicios/clienteSupabase';
import './ExperienciaPerfil.css';

interface Props {
  usuarioId: string;
}

const ExperienciaPerfil: React.FC<Props> = ({ usuarioId }) => {
  const [experiencia, setExperiencia] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let channel: any;

    const cargar = async () => {
      setCargando(true);
      const data = await scoresHeroService.obtenerExperienciaUsuario(usuarioId);
      setExperiencia(data);
      setCargando(false);

      // Suscribirse a cambios en tiempo real
      channel = supabase.channel('cambios-experiencia')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'experiencia_usuario',
            filter: `usuario_id=eq.${usuarioId}`
          },
          (payload) => {
            if (payload.new) {
              setExperiencia(payload.new);
            }
          }
        )
        .subscribe();
    };

    if (usuarioId) {
      cargar();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [usuarioId]);

  if (cargando) {
    return (
      <div className="experiencia-perfil-card">
        <div className="experiencia-loading">Cargando experiencia...</div>
      </div>
    );
  }

  if (!experiencia) return null;

  const xpActual = experiencia.xp_total || 0;
  const nivelActual = experiencia.nivel || 1;
  const xpParaSiguiente = nivelActual * 1000;
  const xpNivelBase = (nivelActual - 1) * 1000; // Assuming each level takes 1000 total cumulative XP
  
  // Calculate progress in current level
  const xpEnNivel = xpActual - xpNivelBase;
  const progresoPorcentaje = Math.min(100, Math.max(0, (xpEnNivel / 1000) * 100));
  const xpFaltante = xpParaSiguiente - xpActual;

  return (
    <div className="experiencia-perfil-card">
      <div className="experiencia-header">
        <h3>Tu Experiencia Total</h3>
      </div>
      
      <div className="experiencia-nivel-container">
        <div className="experiencia-nivel-info">
          <div className="experiencia-nivel-badge">
            <span className="nivel-label">NIVEL</span>
            <span className="nivel-numero">{nivelActual}</span>
          </div>
          <div className="experiencia-progreso-texto">
            <strong>{xpActual.toLocaleString('es-CO')} XP</strong> totales
            <span>{xpFaltante.toLocaleString('es-CO')} XP para nivel {nivelActual + 1}</span>
          </div>
        </div>
        
        <div className="experiencia-barra-bg">
          <div 
            className="experiencia-barra-fill" 
            style={{ width: `${progresoPorcentaje}%` }} 
          />
        </div>
      </div>

      <div className="experiencia-categorias">
        <div className="experiencia-categoria">
          <div className="cat-icon cat-simulador">🎮</div>
          <div className="cat-details">
            <span className="cat-label">Simulador</span>
            <span className="cat-value">{(experiencia.xp_simulador || 0).toLocaleString('es-CO')} XP</span>
          </div>
        </div>

        <div className="experiencia-categoria">
          <div className="cat-icon cat-cursos">📚</div>
          <div className="cat-details">
            <span className="cat-label">Cursos</span>
            <span className="cat-value">{(experiencia.xp_cursos || 0).toLocaleString('es-CO')} XP</span>
          </div>
        </div>

        <div className="experiencia-categoria">
          <div className="cat-icon cat-comunidad">👥</div>
          <div className="cat-details">
            <span className="cat-label">Comunidad</span>
            <span className="cat-value">{(experiencia.xp_comunidad || 0).toLocaleString('es-CO')} XP</span>
          </div>
        </div>

        <div className="experiencia-categoria">
          <div className="cat-icon cat-logros">🏆</div>
          <div className="cat-details">
            <span className="cat-label">Logros</span>
            <span className="cat-value">{(experiencia.xp_logros || 0).toLocaleString('es-CO')} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperienciaPerfil;
