import React, { useEffect, useState } from 'react';
import { supabase } from '../../../servicios/clienteSupabase';
import { useUsuario } from '../../../contextos/UsuarioContext';
import './ValidacionesAdmin.css';

interface Validacion {
  id: string;
  usuario_id: string;
  tutorial_id: string;
  video_url: string;
  estado: string;
  monedas_fase1: number;
  monedas_fase2: number;
  fase1_otorgada: boolean;
  fase2_otorgada: boolean;
  comentario_profesor: string;
  created_at: string;
  tutoriales?: {
    titulo: string;
  };
  perfiles?: {
    nombre: string;
    apellido: string;
    email: string;
  };
}

export default function ValidacionesAdmin() {
  const { usuario } = useUsuario();
  const [validaciones, setValidaciones] = useState<Validacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('pendiente');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [validacionActual, setValidacionActual] = useState<Validacion | null>(null);
  
  const [nuevoEstado, setNuevoEstado] = useState('aprobado');
  const [comentario, setComentario] = useState('');
  const [otorgarFase1, setOtorgarFase1] = useState(false);
  const [otorgarFase2, setOtorgarFase2] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeAccion, setMensajeAccion] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    cargarValidaciones();
  }, [filtroEstado]);

  const cargarValidaciones = async () => {
    setCargando(true);
    try {
      let query = supabase
        .from('validaciones_tutorial')
        .select(`
          *,
          tutoriales ( titulo )
        `)
        .order('created_at', { ascending: false });

      if (filtroEstado !== 'todas') {
        query = query.eq('estado', filtroEstado);
      }

      const { data, error } = await query;
      if (error) throw error;

      const usuarioIds = Array.from(new Set(((data || []) as any[]).map((v: any) => v.usuario_id).filter(Boolean)));
      let perfilesMap: Record<string, any> = {};
      if (usuarioIds.length > 0) {
        const { data: perfiles } = await supabase.rpc('admin_listar_perfiles_con_pii', { p_ids: usuarioIds });
        if (Array.isArray(perfiles)) {
          perfilesMap = Object.fromEntries(perfiles.map((p: any) => [p.id, { nombre: p.nombre, apellido: p.apellido, email: p.correo_electronico }]));
        }
      }

      const enriquecidas = ((data || []) as any[]).map((v: any) => ({ ...v, perfiles: perfilesMap[v.usuario_id] || null }));
      setValidaciones((enriquecidas as unknown) as Validacion[]);
    } catch {
      // error no fatal — tabla vacía
    } finally {
      setCargando(false);
    }
  };

  const abrirRevision = (val: Validacion) => {
    setValidacionActual(val);
    setNuevoEstado(val.estado === 'pendiente' ? 'aprobado' : val.estado);
    setComentario(val.comentario_profesor || '');
    setOtorgarFase1(val.fase1_otorgada);
    setOtorgarFase2(val.fase2_otorgada);
    setModalAbierto(true);
  };

  const cerrarRevision = () => {
    setModalAbierto(false);
    setValidacionActual(null);
  };

  const guardarRevision = async () => {
    if (!validacionActual || !usuario?.id) return;
    setGuardando(true);
    
    try {
      const table = supabase.from('validaciones_tutorial') as any;
      const { error } = await table.update({
          estado: nuevoEstado,
          comentario_profesor: comentario,
          fase1_otorgada: otorgarFase1,
          fase2_otorgada: otorgarFase2,
          profesor_id: usuario.id
        })
        .eq('id', validacionActual.id);
        
      if (error) throw error;
      
      setValidaciones(prev => prev.map(v =>
        v.id === validacionActual.id
          ? { ...v, estado: nuevoEstado, comentario_profesor: comentario, fase1_otorgada: otorgarFase1, fase2_otorgada: otorgarFase2, profesor_id: usuario.id }
          : v
      ));
      cerrarRevision();
      setMensajeAccion({ tipo: 'exito', texto: 'Revisión guardada exitosamente.' });
      setTimeout(() => setMensajeAccion(null), 3000);
    } catch {
      setMensajeAccion({ tipo: 'error', texto: 'Error al guardar la revisión.' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="admin-validaciones-container">
      {mensajeAccion && (
        <div style={{ background: mensajeAccion.tipo === 'exito' ? '#f0fff4' : '#fff5f5', color: mensajeAccion.tipo === 'exito' ? '#276749' : '#c53030', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          {mensajeAccion.texto}
        </div>
      )}
      <div className="admin-header">
        <h2>Panel de Validaciones (Profesor)</h2>
        <div className="filtros">
          <label>Filtrar por estado: </label>
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="select-filtro"
          >
            <option value="todas">Todas</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_revision">En Revisión</option>
            <option value="aprobado">Aprobadas</option>
            <option value="rechazado">Rechazadas</option>
          </select>
        </div>
      </div>

      {cargando ? (
        <div className="cargando-admin">Cargando validaciones...</div>
      ) : validaciones.length === 0 ? (
        <div className="sin-resultados-admin">No hay validaciones en este estado.</div>
      ) : (
        <div className="validaciones-tabla-container">
          <table className="validaciones-tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Alumno</th>
                <th>Tutorial</th>
                <th>Estado</th>
                <th>Recompensas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {validaciones.map(val => (
                <tr key={val.id}>
                  <td>{new Date(val.created_at).toLocaleDateString('es-CO')}</td>
                  <td>
                    {val.perfiles?.nombre || 'Alumno'} {val.perfiles?.apellido || ''}
                    <div className="td-subtexto">{val.perfiles?.email}</div>
                  </td>
                  <td>{val.tutoriales?.titulo}</td>
                  <td>
                    <span className={`badge-estado ${val.estado}`}>{val.estado.toUpperCase()}</span>
                  </td>
                  <td>
                    {val.fase1_otorgada ? '🪙 F1 ' : ''}
                    {val.fase2_otorgada ? '🪙 F2' : ''}
                    {!val.fase1_otorgada && !val.fase2_otorgada && '-'}
                  </td>
                  <td>
                    <button 
                      className="btn-revisar" 
                      onClick={() => abrirRevision(val)}
                    >
                      {val.estado === 'pendiente' ? 'Evaluar' : 'Editar'}
                    </button>
                    <a 
                      href={val.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-ver-video"
                    >
                      Ver Video
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && validacionActual && (
        <div className="modal-revision-backdrop">
          <div className="modal-revision-content">
            <div className="modal-revision-header">
              <h3>Evaluar Ejecución</h3>
              <button className="btn-close-modal" onClick={cerrarRevision}>✕</button>
            </div>
            
            <div className="modal-revision-body">
              <div className="info-alumno-modal">
                <strong>Alumno:</strong> {validacionActual.perfiles?.nombre} {validacionActual.perfiles?.apellido} <br/>
                <strong>Tutorial:</strong> {validacionActual.tutoriales?.titulo}
              </div>

              <div className="video-player-container">
                <a href={validacionActual.video_url} target="_blank" rel="noopener noreferrer" className="btn-link-video">
                  📺 Abrir video en otra pestaña
                </a>
              </div>

              <div className="revision-form">
                <div className="form-group">
                  <label>Decisión (Estado)</label>
                  <select 
                    value={nuevoEstado} 
                    onChange={(e) => setNuevoEstado(e.target.value)}
                  >
                    <option value="en_revision">En Revisión (Necesita correcciones leves)</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="rechazado">Rechazado (No superado)</option>
                  </select>
                </div>

                <div className="form-group-checkboxes">
                  <label>Otorgar Recompensas</label>
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={otorgarFase1} 
                      onChange={(e) => setOtorgarFase1(e.target.checked)}
                    />
                    Fase 1 (+ {validacionActual.monedas_fase1} 🪙)
                  </label>
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={otorgarFase2} 
                      onChange={(e) => setOtorgarFase2(e.target.checked)}
                    />
                    Fase 2 (+ {validacionActual.monedas_fase2} 🪙)
                  </label>
                </div>

                <div className="form-group">
                  <label>Comentario / Feedback al Alumno</label>
                  <textarea 
                    rows={4} 
                    value={comentario} 
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Escribe tu retroalimentación detallada..."
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="modal-revision-footer">
              <button className="btn-cancelar" onClick={cerrarRevision} disabled={guardando}>Cancelar</button>
              <button className="btn-guardar" onClick={guardarRevision} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar Evaluación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
