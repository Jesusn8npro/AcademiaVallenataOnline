import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../servicios/clienteSupabase';
import { useUsuario } from '../../contextos/UsuarioContext';
import './MisValidaciones.css';

interface Validacion {
  id: string;
  tutorial_id: string;
  parte_tutorial_id?: string;
  video_url: string;
  estado: string;
  monedas_fase1: number;
  monedas_fase2: number;
  fase1_otorgada: boolean;
  fase2_otorgada: boolean;
  comentario_profesor: string;
  created_at: string;
  tutoriales?: { titulo: string };
  partes_tutorial?: { titulo: string };
}

type ModoEnvio = 'archivo' | 'url';
const MAX_BYTES = 200 * 1024 * 1024;

export default function MisValidaciones() {
  const { usuario } = useUsuario();
  const [validaciones, setValidaciones] = useState<Validacion[]>([]);
  const [tutorialesActivos, setTutorialesActivos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [tutorialSeleccionado, setTutorialSeleccionado] = useState('');
  const [modoEnvio, setModoEnvio] = useState<ModoEnvio>('archivo');
  const [videoUrl, setVideoUrl] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendoPct, setSubiendoPct] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const cargarDatos = useCallback(async () => {
    if (!usuario?.id) return;
    try {
      const { data: valData, error: valErr } = await (supabase
        .from('validaciones_tutorial') as any)
        .select('*, tutoriales(titulo), partes_tutorial:parte_tutorial_id(titulo)')
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

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  function onSeleccionarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setErrorEnvio('');
    if (f && f.size > MAX_BYTES) {
      setErrorEnvio(`El archivo pesa ${(f.size / 1024 / 1024).toFixed(0)} MB. El máximo es 200 MB.`);
      setArchivo(null);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setArchivo(f);
  }

  async function uploadArchivoAStorage(file: File, uid: string): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const path = `${uid}/manual-${tutorialSeleccionado.slice(0, 8)}-${Date.now()}.${ext}`;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Debes iniciar sesión para subir archivos.');

    return new Promise((resolve, reject) => {
      const supabaseUrl = (supabase as any).supabaseUrl;
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${supabaseUrl}/storage/v1/object/evaluaciones-videos/${path}`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('x-upsert', 'true');
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) setSubiendoPct(Math.round((ev.loaded / ev.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(`${supabaseUrl}/storage/v1/object/public/evaluaciones-videos/${path}`);
        } else {
          reject(new Error(`Error ${xhr.status}: ${xhr.responseText}`));
        }
      };
      xhr.onerror = () => reject(new Error('Error de red al subir el video.'));
      const form = new FormData();
      form.append('', file);
      xhr.send(form);
    });
  }

  const enviarValidacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario?.id || !tutorialSeleccionado) return;
    setEnviando(true); setErrorEnvio(''); setSubiendoPct(null);
    try {
      let urlFinal = '';
      if (modoEnvio === 'archivo') {
        if (!archivo) { setErrorEnvio('Selecciona un archivo de video.'); setEnviando(false); return; }
        urlFinal = await uploadArchivoAStorage(archivo, usuario.id);
      } else {
        if (!videoUrl.trim()) { setErrorEnvio('Ingresa la URL del video.'); setEnviando(false); return; }
        urlFinal = videoUrl.trim();
      }

      const table = supabase.from('validaciones_tutorial') as any;
      const { data, error } = await table
        .insert({ usuario_id: usuario.id, tutorial_id: tutorialSeleccionado, video_url: urlFinal, estado: 'pendiente' })
        .select('*, tutoriales(titulo), partes_tutorial:parte_tutorial_id(titulo)');

      if (error) throw error;
      if (data && data.length > 0) {
        setValidaciones([data[0] as unknown as Validacion, ...validaciones]);
      } else {
        await cargarDatos();
      }
      setModalAbierto(false);
      setVideoUrl(''); setArchivo(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch {
      setErrorEnvio('Hubo un error al enviar tu video. Verifica e intenta de nuevo.');
    } finally {
      setEnviando(false); setSubiendoPct(null);
    }
  };

  if (cargando) {
    return (
      <div className="validaciones-estado">
        <div className="spinner-carga"></div>
        <p>Cargando tus evaluaciones...</p>
      </div>
    );
  }

  return (
    <div className="mis-validaciones-container">
      <div className="validaciones-header">
        <div className="validaciones-header-info">
          <h2 className="validaciones-titulo">Mis Evaluaciones</h2>
          <p className="validaciones-descripcion">
            Haz seguimiento al estado de tus evaluaciones. Los profesores calificarán tus ejecuciones y otorgarán monedas según tu avance.
          </p>
        </div>
        <button className="btn-nueva-validacion" onClick={() => setModalAbierto(true)}>
          + Enviar Ejecución
        </button>
      </div>

      {validaciones.length === 0 ? (
        <div className="validaciones-vacio">
          <div className="validaciones-vacio-icono">📹</div>
          <h3>Aún no tienes evaluaciones</h3>
          <p>Al llegar a la evaluación final de un tutorial podrás enviar tu video para que el profesor lo califique.</p>
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
                <span className="validacion-fecha">{new Date(val.created_at).toLocaleDateString('es-CO')}</span>
              </div>
              <h3 className="validacion-tutorial-titulo">{val.tutoriales?.titulo || 'Tutorial no encontrado'}</h3>
              {val.partes_tutorial?.titulo && (
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', color: '#7c3aed', fontWeight: 500 }}>
                  🎯 {val.partes_tutorial.titulo}
                </p>
              )}
              <a href={val.video_url} target="_blank" rel="noopener noreferrer" className="validacion-link">
                🔗 Ver Video Enviado
              </a>
              {(val.fase1_otorgada || val.fase2_otorgada) && (
                <div className="validacion-recompensas">
                  <span className="recompensas-label">Recompensas Obtenidas:</span>
                  <div className="recompensas-list">
                    {val.fase1_otorgada && <span className="recompensa-item">+ {val.monedas_fase1} 🪙 (Recompensa)</span>}
                    {val.fase2_otorgada && <span className="recompensa-item">+ {val.monedas_fase2} 🪙 (Bonus)</span>}
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
              <h3>Enviar Evaluación Manual</h3>
              <button className="btn-close-modal" onClick={() => setModalAbierto(false)}>✕</button>
            </div>
            <form className="modal-envio-body" onSubmit={enviarValidacion}>
              <div className="form-group">
                <label>¿Qué tutorial estás validando?</label>
                <select value={tutorialSeleccionado} onChange={(e) => setTutorialSeleccionado(e.target.value)} required>
                  {tutorialesActivos.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
                </select>
              </div>

              {/* Tabs modo de envío */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: '#f1f5f9', borderRadius: 10, padding: 4 }}>
                {(['archivo', 'url'] as ModoEnvio[]).map(m => (
                  <button key={m} type="button"
                    onClick={() => { setModoEnvio(m); setErrorEnvio(''); }}
                    style={{ flex: 1, padding: '0.45rem', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: modoEnvio === m ? 700 : 500, background: modoEnvio === m ? '#fff' : 'transparent', color: modoEnvio === m ? '#7c3aed' : '#64748b', boxShadow: modoEnvio === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}
                  >
                    {m === 'archivo' ? '📁 Subir Video' : '🔗 YouTube / Drive'}
                  </button>
                ))}
              </div>

              {modoEnvio === 'archivo' ? (
                <div
                  className="form-group"
                  style={{ border: '2px dashed #c4b5fd', borderRadius: 10, padding: '1.25rem', textAlign: 'center', cursor: 'pointer', background: '#faf5ff' }}
                  onClick={() => inputRef.current?.click()}
                >
                  <input ref={inputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={onSeleccionarArchivo} />
                  {archivo ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1.5rem' }}>🎬</span>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{archivo.name}</p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>{(archivo.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                      <button type="button" onClick={(ev) => { ev.stopPropagation(); setArchivo(null); if (inputRef.current) inputRef.current.value = ''; }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: '0 0 0.25rem', fontSize: '2rem' }}>📹</p>
                      <p style={{ margin: 0, color: '#374151', fontWeight: 500, fontSize: '0.875rem' }}>Haz clic o arrastra tu video aquí</p>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>MP4, WebM, MOV — máximo 200 MB</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label>Enlace de tu video (YouTube o Google Drive)</label>
                  <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                </div>
              )}

              {subiendoPct !== null && (
                <div style={{ background: '#e2e8f0', borderRadius: 999, height: 8, margin: '0.5rem 0', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg,#7c3aed,#a855f7)', width: `${subiendoPct}%`, transition: 'width 0.2s', borderRadius: 999 }} />
                </div>
              )}

              {errorEnvio && <p className="error-envio">{errorEnvio}</p>}

              <div className="modal-envio-footer">
                <button type="button" className="btn-cancelar" onClick={() => setModalAbierto(false)} disabled={enviando || subiendoPct !== null}>Cancelar</button>
                <button type="submit" className="btn-enviar" disabled={enviando || subiendoPct !== null}>
                  {subiendoPct !== null ? `Subiendo ${subiendoPct}%...` : enviando ? 'Enviando...' : 'Enviar para Revisión'}
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
