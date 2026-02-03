import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../../servicios/supabaseCliente';
import type { UsuarioAdmin } from '../../../../../servicios/usuariosAdminService';
import './PestanaActividad.css';

interface PestanaActividadProps {
  usuario: UsuarioAdmin;
}

// ðŸ“Š Interfaces para los datos de actividad - EXACTAS del Svelte
interface DatosActividad {
  // Métricas principales
  tiempoTotal: number;
  sesionesHoy: number;
  ultimaActividad: string | null;
  diasActivos: number;
  promedioSesionDiaria: number;

  // ðŸ“± Sesiones recientes
  sesionesRecientes: any[];

  // Páginas más visitadas  
  paginasFavoritas: Array<{ pagina: string; visitas: number; tiempo_total: number }>;

  // ðŸ“ˆ Tendencias
  actividadPorDia: Array<{ fecha: string; tiempo: number; sesiones: number; fecha_formateada: string }>;

  // Métricas avanzadas
  cursosProgreso: any[];
  logrosObtenidos: any[];
  racha: number;
}

const PestanaActividad: React.FC<PestanaActividadProps> = ({ usuario }) => {
  // ðŸ“Š Estado del componente - EXACTO del Svelte
  const [cargandoActividad, setCargandoActividad] = useState(false);
  const [datosActividad, setDatosActividad] = useState<DatosActividad>({
    // Métricas principales
    tiempoTotal: 0,
    sesionesHoy: 0,
    ultimaActividad: null,
    diasActivos: 0,
    promedioSesionDiaria: 0,

    // ðŸ“± Sesiones recientes
    sesionesRecientes: [],

    // Páginas más visitadas  
    paginasFavoritas: [],

    // ðŸ“ˆ Tendencias
    actividadPorDia: [],

    // Métricas avanzadas
    cursosProgreso: [],
    logrosObtenidos: [],
    racha: 0
  });

  useEffect(() => {
    cargarDatosActividadReal();
  }, [usuario.id]);

  // ðŸ”¥ CARGAR DATOS REALES DE ACTIVIDAD - EXACTA del Svelte
  const cargarDatosActividadReal = async () => {
    if (!usuario?.id) return;

    try {
      setCargandoActividad(true);
      console.log('ðŸ“Š [ACTIVIDAD] Cargando datos reales para usuario:', usuario.nombre);

      // 1ï¸âƒ£ OBTENER RESUMEN DE SESIONES_USUARIO
      const { data: resumenSesiones } = await supabase
        .from('sesiones_usuario')
        .select('*')
        .eq('usuario_id', usuario.id)
        .order('fecha', { ascending: false })
        .limit(30); // Últimos 30 días

      // 2ï¸âƒ£ OBTENER EVENTOS DE ACTIVIDAD DETALLADOS
      const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: eventosActividad } = await supabase
        .from('eventos_actividad')
        .select('*')
        .eq('usuario_id', usuario.id)
        .gte('created_at', hace30Dias)
        .order('created_at', { ascending: false })
        .limit(100);

      // 3ï¸âƒ£ OBTENER PROGRESO EN CURSOS
      const { data: progresoInscripciones } = await supabase
        .from('inscripciones')
        .select(`
          *,
          cursos:curso_id (titulo, imagen_url),
          paquetes_tutoriales:paquete_id (titulo, imagen_url)
        `)
        .eq('usuario_id', usuario.id);

      // PROCESAR Y CALCULAR MÉTRICAS
      await procesarDatosActividad(resumenSesiones || [], eventosActividad || [], progresoInscripciones || []);

      console.log('âœ… [ACTIVIDAD] Datos cargados:', datosActividad);

    } catch (error) {
      console.error('âŒ [ACTIVIDAD] Error cargando datos:', error);

      // Datos de fallback seguros
      setDatosActividad(prev => ({
        ...prev,
        tiempoTotal: 0,
        sesionesHoy: 0,
        ultimaActividad: null
      }));
    } finally {
      setCargandoActividad(false);
    }
  };

  // PROCESAR DATOS Y CALCULAR MÉTRICAS - EXACTA del Svelte
  const procesarDatosActividad = async (sesiones: any[], eventos: any[], inscripciones: any[]) => {
    const ahora = new Date();
    const hoyISO = ahora.toISOString().split('T')[0];

    // â° CALCULAR TIEMPO TOTAL Y SESIONES
    const tiempoTotal = sesiones?.reduce((total, sesion) => total + (sesion.tiempo_total_minutos || 0), 0) || 0;
    const sesionesHoy = sesiones?.filter(s => s.fecha === hoyISO)?.length || 0;
    const ultimaActividad = sesiones?.[0]?.ultima_actividad || null;
    const diasActivos = sesiones?.length || 0;
    const promedioSesionDiaria = diasActivos > 0 ? Math.round(tiempoTotal / diasActivos) : 0;

    // OBTENER SESIONES RECIENTES (últimas 10)
    const sesionesRecientes = (sesiones || []).slice(0, 10).map(sesion => ({
      ...sesion,
      tiempo_formateado: formatearTiempo(sesion.tiempo_total_minutos || 0),
      hace: formatearTiempoRelativo(sesion.ultima_actividad)
    }));

    // CALCULAR PÁGINAS MÁS VISITADAS
    const contadorPaginas = new Map();
    eventos?.forEach(evento => {
      const pagina = evento.pagina || 'Desconocida';
      const tiempoEvento = evento.duracion_minutos || 1;

      if (contadorPaginas.has(pagina)) {
        const actual = contadorPaginas.get(pagina);
        contadorPaginas.set(pagina, {
          visitas: actual.visitas + 1,
          tiempo_total: actual.tiempo_total + tiempoEvento
        });
      } else {
        contadorPaginas.set(pagina, { visitas: 1, tiempo_total: tiempoEvento });
      }
    });

    const paginasFavoritas = Array.from(contadorPaginas.entries())
      .map(([pagina, datos]: [string, any]) => ({
        pagina: formatearNombrePagina(pagina),
        visitas: datos.visitas,
        tiempo_total: datos.tiempo_total
      }))
      .sort((a, b) => b.visitas - a.visitas)
      .slice(0, 8);

    // ACTIVIDAD POR DÍA (últimos 14 días)
    const actividadPorDia = [];
    for (let i = 13; i >= 0; i--) {
      const fecha = new Date(ahora.getTime() - i * 24 * 60 * 60 * 1000);
      const fechaISO = fecha.toISOString().split('T')[0];

      const sesionDia = sesiones?.find(s => s.fecha === fechaISO);
      const eventosDia = eventos?.filter(e => e.created_at?.startsWith(fechaISO)) || [];

      actividadPorDia.push({
        fecha: fechaISO,
        tiempo: sesionDia?.tiempo_total_minutos || 0,
        sesiones: eventosDia.length,
        fecha_formateada: fecha.toLocaleDateString('es', { weekday: 'short', day: 'numeric' })
      });
    }

    // ðŸ“š PROGRESO EN CURSOS
    const cursosProgreso = (inscripciones || []).map(inscripcion => ({
      ...inscripcion,
      nombre: inscripcion.cursos?.titulo || inscripcion.paquetes_tutoriales?.titulo || 'Curso',
      imagen: inscripcion.cursos?.imagen_url || inscripcion.paquetes_tutoriales?.imagen_url || '/images/default-course.jpg',
      progreso_texto: `${inscripcion.porcentaje_completado || 0}%`,
      estado: inscripcion.completado ? 'Completado' : 'En progreso'
    }));

    // CALCULAR RACHA (días consecutivos con actividad)
    let racha = 0;
    for (let i = 0; i < sesiones.length; i++) {
      const fechaSesion = new Date(sesiones[i].fecha);
      const fechaEsperada = new Date(ahora.getTime() - i * 24 * 60 * 60 * 1000);

      if (fechaSesion.toDateString() === fechaEsperada.toDateString()) {
        racha++;
      } else {
        break;
      }
    }

    // ðŸŽ¯ ASIGNAR TODOS LOS DATOS
    setDatosActividad({
      tiempoTotal,
      sesionesHoy,
      ultimaActividad,
      diasActivos,
      promedioSesionDiaria,
      sesionesRecientes,
      paginasFavoritas,
      actividadPorDia,
      cursosProgreso,
      logrosObtenidos: [], // Por implementar
      racha
    });
  };

  // ðŸŽ¨ UTILIDADES DE FORMATO - EXACTAS del Svelte
  const formatearTiempo = (minutos: number): string => {
    if (minutos < 60) return `${minutos}m`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };

  const formatearTiempoRelativo = (fecha: string | null): string => {
    if (!fecha) return 'Nunca';

    const ahora = new Date();
    const fechaActividad = new Date(fecha);
    const diferencia = Math.floor((ahora.getTime() - fechaActividad.getTime()) / (1000 * 60));

    if (diferencia < 1) return 'Ahora mismo';
    if (diferencia < 60) return `Hace ${diferencia}m`;
    if (diferencia < 1440) return `Hace ${Math.floor(diferencia / 60)}h`;
    return `Hace ${Math.floor(diferencia / 1440)}d`;
  };

  const formatearNombrePagina = (pagina: string): string => {
    const mapaPaginas: { [key: string]: string } = {
      '/': 'ðŸ  Inicio',
      '/panel-estudiante': 'ðŸ“š Panel Estudiante',
      '/cursos': 'ðŸ“– Cursos',
      '/simulador-gaming': 'ðŸŽ® Simulador',
      '/ranking': 'ðŸ† Ranking',
      '/eventos': 'ðŸ“… Eventos',
      '/mensajes': 'ðŸ’¬ Mensajes'
    };

    return mapaPaginas[pagina] || pagina.replace('/', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatearFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="pestana-actividad">
      {cargandoActividad ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando actividad real del usuario...</p>
        </div>
      ) : (
        <>
          {/* MÉTRICAS PRINCIPALES */}
          <div className="metricas-principales">
            <div className="metrica-card tiempo-total">
              <div className="metrica-valor">{formatearTiempo(datosActividad.tiempoTotal)}</div>
              <div className="metrica-label">Tiempo Total</div>
              <div className="metrica-detalle">{datosActividad.diasActivos} días activos</div>
            </div>

            <div className="metrica-card sesiones-hoy">
              <div className="metrica-valor">{datosActividad.sesionesHoy}</div>
              <div className="metrica-label">Sesiones Hoy</div>
              <div className="metrica-detalle">Promedio: {formatearTiempo(datosActividad.promedioSesionDiaria)}/día</div>
            </div>

            <div className="metrica-card ultima-actividad">
              <div className="metrica-valor">
                {datosActividad.ultimaActividad ? formatearTiempoRelativo(datosActividad.ultimaActividad) : 'Nunca'}
              </div>
              <div className="metrica-label">Última Actividad</div>
              <div className="metrica-detalle">Racha: {datosActividad.racha} días</div>
            </div>
          </div>

          {/* GRÁFICO DE ACTIVIDAD */}
          <div className="actividad-chart">
            <h4>Actividad Últimos 14 Días</h4>
            <div className="chart-bars">
              {datosActividad.actividadPorDia.map((dia, index) => (
                <div key={index} className="chart-day">
                  <div
                    className="chart-bar"
                    style={{ height: `${Math.max(4, (dia.tiempo / 120) * 100)}px` }}
                    title={`${dia.fecha_formateada}: ${formatearTiempo(dia.tiempo)}`}
                  ></div>
                  <span className="chart-label">{dia.fecha_formateada}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ðŸ“± SESIONES RECIENTES */}
          <div className="sesiones-recientes">
            <h4> Sesiones Recientes</h4>
            <div className="sesiones-lista">
              {datosActividad.sesionesRecientes.map((sesion, index) => (
                <div key={index} className="sesion-item">
                  <div className="sesion-fecha">{formatearFecha(sesion.ultima_actividad)}</div>
                  <div className="sesion-tiempo">{sesion.tiempo_formateado}</div>
                  <div className="sesion-pagina">{sesion.pagina_actual || 'N/A'}</div>
                  <div className={`sesion-estado ${sesion.esta_activo ? 'activo' : ''}`}>
                    {sesion.esta_activo ? 'Activo' : 'Finalizada'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PÁGINAS MÁS VISITADAS */}
          <div className="paginas-favoritas">
            <h4>Páginas Más Visitadas</h4>
            <div className="paginas-lista">
              {datosActividad.paginasFavoritas.map((pagina, index) => (
                <div key={index} className="pagina-item">
                  <span className="pagina-nombre">{pagina.pagina}</span>
                  <div className="pagina-stats">
                    <span className="pagina-visitas">{pagina.visitas} visitas</span>
                    <span className="pagina-tiempo">{formatearTiempo(pagina.tiempo_total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ðŸ“š PROGRESO EN CURSOS */}
          {datosActividad.cursosProgreso.length > 0 && (
            <div className="cursos-progreso">
              <h4>ðŸ“š Progreso en Cursos</h4>
              <div className="cursos-grid">
                {datosActividad.cursosProgreso.map((curso, index) => (
                  <div key={index} className="curso-card">
                    <img src={curso.imagen} alt={curso.nombre} className="curso-imagen" />
                    <div className="curso-info">
                      <h5>{curso.nombre}</h5>
                      <div className="progreso-bar">
                        <div
                          className="progreso-fill"
                          style={{ width: `${curso.porcentaje_completado || 0}%` }}
                        ></div>
                      </div>
                      <span className="progreso-texto">{curso.progreso_texto}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PestanaActividad; 
