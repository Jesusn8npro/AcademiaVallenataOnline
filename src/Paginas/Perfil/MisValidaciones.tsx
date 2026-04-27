import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../servicios/clienteSupabase';
import { useUsuario } from '../../contextos/UsuarioContext';
import './MisValidaciones.css';

interface Validacion {
  id: string;
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
}

export default function MisValidaciones() {
  const { usuario } = useUsuario();
  const [validaciones, setValidaciones] = useState<Validacion[]>([]);
  const [tutorialesActivos, setTutorialesActivos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [tutorialSeleccionado, setTutorialSeleccionado] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');

  const cargarDatos = useCallback(async () => {
    if (!usuario?.id) return;
    try {
      const { data: valData, error: valErr } = await supabase
        .from('validaciones_tutorial')
        .select(`*, tutoriales ( titulo )`)
        .eq('usuario_id', usuario.id)
        .order('created_at', { ascending: false });

      if (valErr) throw valErr;
      setValidaciones((valData as unknown) as Validacion[]);

      const { data: tutData } = await supabase
        .from('tutoriales')
        .select('id, titulo')
        .eq('estado', 'publicado')
        .order('titulo', { ascending: true });

      if (tutData) {
        const tutorials = tutData as any[];
        setTutorialesActivos(tutorials);
        if (tutorials.length > 0) setTutorialSeleccionado(tutorials[0].id);
      }
    } catch {
      // silent
    } finally {
      setCargando(false);
    }
  }, [usuario?.id]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const enviarValidacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario?.id || !tutorialSeleccionado || !videoUrl) return;

    setEnviando(true);
    setErrorEnvio('');
    try {
      const table = supabase.from('validaciones_tutorial') as any;
      const { data, error } = await table
        .insert({
          usuario_id: usuario.id,
          tutorial_id: tutorialSeleccionado,
          video_url: videoUrl,
          estado: 'pendiente'
        })
        .select(`*, tutoriales(titulo)`);

      if (error) throw error;

      if (data && data.length > 0) {
        setValidaciones([data[0] as unknown as Validacion, ...validaciones]);
      } else {
        await cargarDatos();
      }
      setModalAbierto(false);
      setVideoUrl('');
    } catch {
      setErrorEnvio('Hubo un error al enviar tu video. Verifica la URL y reintenta.');
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <div className="validaciones-estado">
        <div className="spinner-carga"></div>
        <p>Cargando tus validaciones...</p>
      </div>
    );
  }

  return (
    <div className="mis-validaciones-container">
      <div className="validaciones-header">
        <div className="validaciones-header-info">
          <h2 className="validaciones-titulo">Mis Validaciones</h2>
          <p className="validaciones-descripcion">
            Haz seguimiento al estado de tus tareas enviadas. Tus profesores calificarán tus ejecuciones y otorgarán monedas según tu avance.
          </p>
        </div>
        <button className="btn-nueva-validacion" onClick={() => setModalAbierto(true)}>
          + Enviar Ejecución
        </button>
      </div>

      {validaciones.length === 0 ? (
        <div className="validaciones-vacio">
          <div className="validaciones-vacio-icono">📹</div>
          <h3>Aún no has enviado validaciones</h3>
          <p>
            Sube el enlace de tu video practicando dentro de las lecciones del tutorial para que un profesor evalúe tu progreso.
          </p>
          <button className="btn-nueva-validacion-secundario" onClick={() => setModalAbierto(true)}>
            Subir mi primer video
          </button>
        </div>
      ) : (
        <div className="validaciones-grid">
          {validaciones.map((val) => (
            <div key={val.id} className="validacion-card">
              <div className="validacion-card-header">
                <span className={`estado-badge estado-${val.estado.toLowerCase()}`}>
                  {val.estado.replace('_', ' ').toUpperCase()}
                </span>
                <span className="validacion-fecha">
                  {new Date(val.created_at).toLocaleDateString('es-CO')}
                </span>
              </div>

              <h3 className="validacion-tutorial-titulo">
                {val.tutoriales?.titulo || 'Tutorial no encontrado'}
              </h3>

              <a href={val.video_url} target="_blank" rel="noopener noreferrer" className="validacion-link">
                🔗 Ver Video Enviado
              </a>

              {(val.fase1_otorgada || val.fase2_otorgada) && (
                <div className="validacion-recompensas">
                  <span className="recompensas-label">Recompensas Obtenidas:</span>
                  <div className="recompensas-list">
                    {val.fase1_otorgada && (
                      <span className="recompensa-item">+ {val.monedas_fase1} 🪙 (Fase 1)</span>
                    )}
                    {val.fase2_otorgada && (
                      <span className="recompensa-item">+ {val.monedas_fase2} 🪙 (Fase 2)</span>
                    )}
                  </div>
                </div>
              )}

              {val.comentario_profesor && (
                <div className="validacion-comentario">
                  <h4>👨‍🏫 Comentario del Profesor:</h4>
                  <p>{val.comentario_profesor}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modalAbierto && createPortal(
        <div className="modal-envio-backdrop">
          <div className="modal-envio-content">
            <div className="modal-envio-header">
              <h3>Enviar Nueva Ejecución</h3>
              <button className="btn-close-modal" onClick={() => setModalAbierto(false)}>✕</button>
            </div>

            <form className="modal-envio-body" onSubmit={enviarValidacion}>
              <div className="form-group">
                <label>¿Qué tutorial estás validando?</label>
                <select
                  value={tutorialSeleccionado}
                  onChange={(e) => setTutorialSeleccionado(e.target.value)}
                  required
                >
                  {tutorialesActivos.map(t => (
                    <option key={t.id} value={t.id}>{t.titulo}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Enlace de tu video (YouTube o Google Drive)</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... o https://drive.google.com/..."
                  required
                />
              </div>

              <div className="modal-envio-instruccion">
                <strong>¿Cómo subir tu video?</strong>
                <ul>
                  <li><strong>Google Drive:</strong> Sube tu video a Drive, haz clic derecho, selecciona "Compartir" y cambia el acceso a <b>"Cualquier persona con el enlace"</b>. Copia el enlace y pégalo arriba.</li>
                  <li><strong>YouTube:</strong> Sube tu video y configúralo como <b>"Oculto"</b> (No listado) o "Público". Copia el enlace de compartir.</li>
                </ul>
                <span className="instruccion-alerta">⚠️ Si el enlace es Privado, el profesor no podrá evaluarlo.</span>
              </div>

              {errorEnvio && (
                <p className="error-envio">{errorEnvio}</p>
              )}

              <div className="modal-envio-footer">
                <button type="button" className="btn-cancelar" onClick={() => setModalAbierto(false)} disabled={enviando}>Cancelar</button>
                <button type="submit" className="btn-enviar" disabled={enviando}>
                  {enviando ? 'Enviando...' : 'Enviar para Revisión'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
