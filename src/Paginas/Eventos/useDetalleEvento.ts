import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUsuario } from '../../contextos/UsuarioContext';
import { eventosService } from '../../servicios/eventosService';

function calcularEstadoEvento(evento: any): string {
  if (!evento) return 'programado';
  const ahora = new Date();
  const inicio = new Date(evento.fecha_inicio);
  const fin = evento.fecha_fin ? new Date(evento.fecha_fin) : null;
  if (evento.estado === 'cancelado') return 'cancelado';
  if (evento.estado === 'pospuesto') return 'pospuesto';
  if (ahora > inicio && (!fin || ahora < fin)) return 'en_vivo';
  if (fin && ahora > fin) return 'finalizado';
  if (ahora < inicio) return 'programado';
  return evento.estado || 'programado';
}

export function useDetalleEvento() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { usuario } = useUsuario();

  const [evento, setEvento] = useState<any>(null);
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [materiales, setMateriales] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [inscrito, setInscrito] = useState(false);
  const [procesandoInscripcion, setProcesandoInscripcion] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [tabActivo, setTabActivo] = useState<'descripcion' | 'comentarios' | 'materiales'>('descripcion');
  const [mensajeInscripcion, setMensajeInscripcion] = useState('');
  const [mensajeComentario, setMensajeComentario] = useState('');
  const [confirmandoCancelacion, setConfirmandoCancelacion] = useState(false);

  useEffect(() => { if (slug) cargarEvento(); }, [slug]);
  useEffect(() => { if (usuario && evento) verificarInscripcion(); }, [usuario, evento]);

  const cargarComentarios = async (eventoId: string) => {
    try {
      // @ts-ignore
      const resultado = await eventosService.obtenerComentariosEvento(eventoId);
      if (!resultado.error) setComentarios(resultado.comentarios || []);
    } catch { }
  };

  const cargarMateriales = async (eventoId: string) => {
    try {
      // @ts-ignore
      const resultado = await eventosService.obtenerMaterialesEvento(eventoId);
      if (!resultado.error) setMateriales(resultado.materiales || []);
    } catch { }
  };

  const cargarEvento = async () => {
    try {
      setCargando(true);
      setError('');
      // @ts-ignore
      const resultado = await eventosService.obtenerEventoPorSlug(slug);
      if (resultado.error) { setError(resultado.error); return; }
      if (!resultado.evento) { setError('Evento no encontrado'); return; }
      setEvento(resultado.evento);
      await Promise.all([cargarComentarios(resultado.evento.id), cargarMateriales(resultado.evento.id)]);
    } catch { setError('Error al cargar el evento'); }
    finally { setCargando(false); }
  };

  const verificarInscripcion = async () => {
    try {
      if (!usuario || !evento) return;
      // @ts-ignore
      const resultado = await eventosService.verificarInscripcion(evento.id, usuario.id);
      if (!resultado.error) setInscrito(resultado.inscrito || false);
    } catch { }
  };

  const inscribirseEvento = async () => {
    if (!usuario) { navigate('/login'); return; }
    try {
      setProcesandoInscripcion(true);
      setError('');
      // @ts-ignore
      const resultado = await eventosService.inscribirseEvento(evento.id, usuario.id);
      if (resultado.inscripcion) {
        setInscrito(true);
        setEvento((prev: any) => ({ ...prev, participantes_inscritos: (prev.participantes_inscritos || 0) + 1 }));
        setMensajeInscripcion('¡Te has inscrito exitosamente al evento!');
      } else {
        setError(resultado.error || 'Error al inscribirse al evento');
      }
    } catch { setError('Error al procesar la inscripción'); }
    finally { setProcesandoInscripcion(false); }
  };

  const iniciarCancelacion = () => setConfirmandoCancelacion(true);

  const confirmarCancelacion = async () => {
    if (!usuario || !inscrito) return;
    setConfirmandoCancelacion(false);
    try {
      setProcesandoInscripcion(true);
      setError('');
      // @ts-ignore
      const resultado = await eventosService.cancelarInscripcion(evento.id, usuario.id);
      if (resultado.success) {
        setInscrito(false);
        setEvento((prev: any) => ({ ...prev, participantes_inscritos: Math.max((prev.participantes_inscritos || 0) - 1, 0) }));
        setMensajeInscripcion('Tu inscripción ha sido cancelada');
      } else {
        setError(resultado.error || 'Error al cancelar la inscripción');
      }
    } catch { setError('Error al cancelar la inscripción'); }
    finally { setProcesandoInscripcion(false); }
  };

  const enviarComentario = async () => {
    if (!nuevoComentario.trim() || !usuario) return;
    try {
      setEnviandoComentario(true);
      // @ts-ignore
      const resultado = await eventosService.agregarComentario(evento.id, usuario.id, nuevoComentario.trim());
      if (resultado.error) { setMensajeComentario('Error al enviar el comentario: ' + resultado.error); return; }
      await cargarComentarios(evento.id);
      setNuevoComentario('');
      setMensajeComentario('Comentario enviado correctamente');
    } catch (err: any) {
      setMensajeComentario('Error al enviar el comentario: ' + err.message);
    } finally {
      setEnviandoComentario(false);
    }
  };

  const estadoEvento = calcularEstadoEvento(evento);
  const puedeInscribirse = estadoEvento === 'programado' && evento?.requiere_inscripcion && !inscrito;

  return {
    usuario, navigate, evento, comentarios, materiales, cargando, error,
    inscrito, procesandoInscripcion, nuevoComentario, setNuevoComentario,
    enviandoComentario, tabActivo, setTabActivo, mensajeInscripcion, mensajeComentario,
    confirmandoCancelacion, setConfirmandoCancelacion, estadoEvento, puedeInscribirse,
    inscribirseEvento, iniciarCancelacion, confirmarCancelacion, enviarComentario,
  };
}
