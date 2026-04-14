import React from 'react';
import { BookOpen } from 'lucide-react';
import './PanelAdminListaAcordes.css';

interface PanelAdminListaAcordesProps {
  onAbrirBiblioteca: () => void;
  totalAcordes?: number;
}

const PanelAdminListaAcordes: React.FC<PanelAdminListaAcordesProps> = ({
  onAbrirBiblioteca,
  totalAcordes = 0,
}) => {
  return (
    <div className="panel-admin-lista-acordes">
      {/* Header */}
      <div className="panel-admin-lista-acordes-bloque">
        <div className="panel-admin-lista-acordes-bloque-title">Biblioteca de Acordes</div>
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            border: '2px dashed rgba(168, 85, 247, 0.3)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <BookOpen size={32} color="#a855f7" />
          <div>
            <div style={{ fontSize: '13px', color: '#999' }}>
              <strong style={{ color: '#ccc' }}>{totalAcordes}</strong> acordes disponibles
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              Filtra por tonalidad, grado, tipo y modalidad
            </div>
          </div>
        </div>
      </div>

      {/* Botón principal */}
      <div className="panel-admin-lista-acordes-bloque">
        <button
          onClick={onAbrirBiblioteca}
          className="panel-admin-lista-acordes-btn"
          style={{
            background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
            color: 'white',
            border: 'none',
            padding: '16px',
            borderRadius: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '14px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <BookOpen size={18} />
          Abrir Biblioteca Completa
        </button>
      </div>

      {/* Características */}
      <div className="panel-admin-lista-acordes-bloque">
        <div className="panel-admin-lista-acordes-bloque-title">Características</div>
        <div style={{ fontSize: '12px', color: '#999', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>🎵</span>
            <div>
              <strong style={{ color: '#ccc' }}>Filtros avanzados</strong>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#666' }}>Por tonalidad, hilera, grado, tipo</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>🔊</span>
            <div>
              <strong style={{ color: '#ccc' }}>Escuchar acordes</strong>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#666' }}>Prueba cada acorde en tiempo real</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ color: '#ec4899', fontWeight: 'bold' }}>✏️</span>
            <div>
              <strong style={{ color: '#ccc' }}>Editar & Eliminar</strong>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#666' }}>Actualiza o borra acordes personalizados</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>🔄</span>
            <div>
              <strong style={{ color: '#ccc' }}>Drag & Drop</strong>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#666' }}>Reordena acordes en tu biblioteca</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="panel-admin-lista-acordes-info">
        <strong>📖 Biblioteca Interactiva</strong>
        <p>
          La misma biblioteca que usa SimuladorDeAcordeon. Todos los acordes aquí guardados son visibles para estudiantes en su pestaña "Teoría".
        </p>
      </div>
    </div>
  );
};

export default PanelAdminListaAcordes;
