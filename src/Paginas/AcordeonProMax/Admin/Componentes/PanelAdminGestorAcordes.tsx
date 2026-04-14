import React from 'react';
import { Plus, ListMusic } from 'lucide-react';
import './PanelAdminGestorAcordes.css';

interface PanelAdminGestorAcordesProps {
  onCrearNuevo: () => void;
  onVerTodos: () => void;
  totalAcordes?: number;
}

const PanelAdminGestorAcordes: React.FC<PanelAdminGestorAcordesProps> = ({
  onCrearNuevo,
  onVerTodos,
  totalAcordes = 0,
}) => {
  return (
    <div className="panel-admin-gestor-acordes">
      {/* Header info */}
      <div className="panel-admin-gestor-acordes-bloque">
        <div className="panel-admin-gestor-acordes-bloque-title">Administrador de Acordes</div>
        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            border: '2px solid rgba(59, 130, 246, 0.3)',
          }}
        >
          <div style={{ fontSize: '13px', color: '#999' }}>
            <p style={{ margin: '0 0 8px 0' }}>
              📚 <strong>{totalAcordes}</strong> acordes guardados en la biblioteca
            </p>
            <p style={{ margin: '0', fontSize: '11px', color: '#666' }}>
              Crea, edita y gestiona acordes personalizados para tus tonalidades
            </p>
          </div>
        </div>
      </div>

      {/* Acciones principales */}
      <div className="panel-admin-gestor-acordes-bloque">
        <div className="panel-admin-gestor-acordes-bloque-title">Acciones</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          <button
            onClick={onCrearNuevo}
            className="panel-admin-gestor-acordes-btn"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '13px',
            }}
          >
            <Plus size={18} /> Nuevo Acorde
          </button>

          <button
            onClick={onVerTodos}
            className="panel-admin-gestor-acordes-btn"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '13px',
            }}
          >
            <ListMusic size={18} /> Ver Todos ({totalAcordes})
          </button>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="panel-admin-gestor-acordes-bloque">
        <div className="panel-admin-gestor-acordes-bloque-title">¿Cómo funciona?</div>
        <div style={{ fontSize: '12px', color: '#999', lineHeight: '1.6' }}>
          <ol style={{ paddingLeft: '20px', margin: '0' }}>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#ccc' }}>Presiona botones</strong> en el acordeón para capturar una combinación
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#ccc' }}>Clic en "Nuevo Acorde"</strong> para nombrar y guardar
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#ccc' }}>Define:</strong> nombre, grado (I-VII), tipo (Mayor/Menor), inversión
            </li>
            <li>
              <strong style={{ color: '#ccc' }}>Guarda</strong> en la biblioteca para reutilizar
            </li>
          </ol>
        </div>
      </div>

      {/* Info importante */}
      <div className="panel-admin-gestor-acordes-info">
        <strong>⚡ Solo para Admins</strong>
        <p>Los acordes que crees se guardan en Supabase y aparecen en la biblioteca compartida para todos los estudiantes.</p>
      </div>
    </div>
  );
};

export default PanelAdminGestorAcordes;
