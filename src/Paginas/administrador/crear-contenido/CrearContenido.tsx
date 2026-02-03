import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardContenido from '../../../componentes/CrearContenido/WizardContenido';
import { supabase } from '../../../servicios/supabaseCliente';
import './CrearContenido.css';

const CrearContenido = () => {
  const navigate = useNavigate();
  const [tipoContenido, setTipoContenido] = useState<'curso' | 'tutorial'>('curso');
  const [datosIniciales, setDatosIniciales] = useState<any>(null);
  const [estructuraInicial, setEstructuraInicial] = useState<any[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);

  console.log('🔄 [CREAR CONTENIDO] Render:', { modoEdicion, tipoContenido, datosIniciales, titulo: datosIniciales?.titulo });

  const tituloPrincipal = modoEdicion
    ? `✏️ Editar ${tipoContenido === 'curso' ? 'Curso' : 'Tutorial'}${datosIniciales?.titulo || datosIniciales?.nombre ? `: ${datosIniciales?.titulo || datosIniciales?.nombre}` : ''}`
    : `${tipoContenido === 'curso' ? '🎓 Crear Nuevo Curso' : '🎥 Crear Nuevo Tutorial'}`;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tipo = (urlParams.get('tipo') as 'curso' | 'tutorial') || 'curso';
    const editar = urlParams.get('editar') || '';

    setTipoContenido(tipo);
    setModoEdicion(!!editar);

    if (editar) {
      cargarDatosParaEdicion(editar, tipo);
    }
  }, []);

  const cargarDatosParaEdicion = async (slugContenido: string, tipo: 'curso' | 'tutorial') => {
    setCargandoDatos(true);
    setErrorCarga('');

    try {
      console.log('🔍 [EDICIÓN] Cargando datos para:', { slugContenido, tipo });

      const esUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugContenido);
      const esNumerico = /^\d+$/.test(slugContenido);

      console.log('🔍 [EDICIÓN] Tipo de identificador:', { esUUID, esNumerico });

      let datosContenido: any = null;
      let errorConsulta: any = null;

      if (tipo === 'curso') {
        if (esUUID || esNumerico) {
          console.log('🔍 [EDICIÓN] Buscando curso por ID:', slugContenido);
          const { data, error } = await supabase
            .from('cursos')
            .select('*')
            .eq('id', slugContenido)
            .single();
          datosContenido = data; errorConsulta = error;
          console.log('📊 [EDICIÓN] Resultado búsqueda por ID:', { data, error });
        } else {
          console.log('🔍 [EDICIÓN] Buscando curso por slug:', slugContenido);
          const { data, error } = await supabase
            .from('cursos')
            .select('*')
            .eq('slug', slugContenido)
            .single();
          datosContenido = data; errorConsulta = error;
          console.log('📊 [EDICIÓN] Resultado búsqueda por slug:', { data, error });

          if (errorConsulta || !datosContenido) {
            const tituloDesdeSlug = slugContenido.replace(/-/g, ' ');
            console.log('🔍 [EDICIÓN] Buscando curso por título:', tituloDesdeSlug);
            const { data: dataTitulo } = await supabase
              .from('cursos')
              .select('*')
              .ilike('titulo', `%${tituloDesdeSlug}%`);
            console.log('📊 [EDICIÓN] Resultado búsqueda por título:', dataTitulo);
            if (Array.isArray(dataTitulo) && dataTitulo.length > 0) {
              datosContenido = dataTitulo[0];
              errorConsulta = null;
            }
          }
        }
      } else {
        if (esUUID) {
          console.log('🔍 [EDICIÓN] Buscando tutorial por ID:', slugContenido);
          const { data, error } = await supabase
            .from('tutoriales')
            .select('*')
            .eq('id', slugContenido)
            .single();
          datosContenido = data; errorConsulta = error;
          console.log('📊 [EDICIÓN] Resultado búsqueda por ID:', { data, error });
        } else {
          const tituloDesdeSlug = slugContenido.replace(/-/g, ' ');
          console.log('🔍 [EDICIÓN] Buscando tutorial por título:', tituloDesdeSlug);
          const { data, error } = await supabase
            .from('tutoriales')
            .select('*')
            .ilike('titulo', `%${tituloDesdeSlug}%`);
          errorConsulta = error;
          console.log('📊 [EDICIÓN] Resultado búsqueda por título:', { data, error });
          if (Array.isArray(data) && data.length > 0) {
            datosContenido = data[0];
          }
        }
      }

      if (errorConsulta || !datosContenido) {
        console.error('❌ [EDICIÓN] Error o datos no encontrados:', { errorConsulta, datosContenido });
        throw new Error(`${tipo === 'curso' ? 'Curso' : 'Tutorial'} no encontrado`);
      }

      console.log('✅ [EDICIÓN] Datos cargados correctamente:', datosContenido);
      console.log('🔑 [EDICIÓN] ID del contenido:', datosContenido.id, 'Tipo:', typeof datosContenido.id);

      setDatosIniciales(datosContenido);
      await cargarEstructuraContenido(datosContenido.id, tipo);
    } catch (error: any) {
      console.error('❌ [EDICIÓN] Error general:', error);
      setErrorCarga(error.message || 'Error al cargar los datos');
    } finally {
      setCargandoDatos(false);
    }
  };

  const cargarEstructuraContenido = async (idContenido: string | number, tipo: 'curso' | 'tutorial') => {
    try {
      console.log(`🔍 [ESTRUCTURA] Cargando estructura para ${tipo} con ID:`, idContenido);

      if (tipo === 'curso') {
        // 1. Obtener módulos
        const { data: modulos, error: errorModulos } = await supabase
          .from('modulos')
          .select('*')
          .eq('curso_id', idContenido)
          .order('orden', { ascending: true });

        console.log('📚 [ESTRUCTURA] Módulos encontrados:', modulos?.length, 'Error:', errorModulos);

        if (!errorModulos && modulos && modulos.length > 0) {
          const moduloIds = modulos.map((m: any) => m.id);

          // 2. Obtener lecciones
          const { data: lecciones, error: errorLecciones } = await supabase
            .from('lecciones')
            .select('*')
            .in('modulo_id', moduloIds)
            .order('orden', { ascending: true });

          console.log('📚 [ESTRUCTURA] Lecciones encontradas:', lecciones?.length);

          const estructura = modulos.map((modulo: any) => ({
            ...modulo,
            lecciones: (lecciones || [])
              .filter((l: any) => l.modulo_id === modulo.id)
              .sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0))
          }));

          setEstructuraInicial(estructura);
          console.log('✅ [ESTRUCTURA] Estructura de curso cargada:', estructura);
        } else if (!errorModulos) {
          setEstructuraInicial([]);
        }
      } else {
        const { data: partes, error: errorPartes } = await supabase
          .from('partes_tutorial')
          .select('*')
          .eq('tutorial_id', idContenido)
          .order('orden', { ascending: true });

        console.log('🎥 [ESTRUCTURA] Partes encontradas:', partes, 'Error:', errorPartes);

        if (!errorPartes && partes) {
          setEstructuraInicial(partes || []);
          console.log('✅ [ESTRUCTURA] Estructura de tutorial cargada:', partes);
        }
      }
    } catch (e) {
      console.error('❌ [ESTRUCTURA] Error cargando estructura:', e);
    }
  };

  const volverAlPanel = () => {
    navigate('/administrador/panel-contenido');
  };

  const reintentar = () => {
    setErrorCarga('');
    const urlParams = new URLSearchParams(window.location.search);
    const editar = urlParams.get('editar') || '';
    if (editar) {
      cargarDatosParaEdicion(editar, tipoContenido);
    }
  };

  return (
    <div className="crear-contenido-pagina">
      {/* Header */}
      <header className="crear-contenido-header">
        <div className="crear-contenido-header-container">
          <button className="crear-contenido-boton-volver" onClick={volverAlPanel} title="Volver al Panel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Panel</span>
          </button>

          <div className="crear-contenido-info-header">
            <h1 className="crear-contenido-titulo-principal">{tituloPrincipal}</h1>
            <div className="crear-contenido-indicador-modo">
              <span className={`crear-contenido-badge-tipo ${tipoContenido === 'curso' ? 'crear-contenido-tipo-curso' : 'crear-contenido-tipo-tutorial'}`}>
                {tipoContenido === 'curso' ? '📚 Curso' : '🎥 Tutorial'}
              </span>
              <span className="crear-contenido-badge-modo">
                {modoEdicion ? '✏️ Editando' : '✨ Creando'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="crear-contenido-main">
        {cargandoDatos ? (
          <div className="crear-contenido-estado-carga">
            <div className="crear-contenido-contenedor-carga">
              <div className="crear-contenido-spinner-futurista">
                <div className="crear-contenido-anillo crear-contenido-anillo-1"></div>
                <div className="crear-contenido-anillo crear-contenido-anillo-2"></div>
                <div className="crear-contenido-anillo crear-contenido-anillo-3"></div>
                <div className="crear-contenido-icono-central">
                  {tipoContenido === 'curso' ? '📚' : '🎥'}
                </div>
              </div>
              <h2 className="crear-contenido-titulo-carga">Cargando {tipoContenido}...</h2>
              <p className="crear-contenido-descripcion-carga">Preparando el contenido para edición</p>
            </div>
          </div>
        ) : errorCarga ? (
          <div className="crear-contenido-estado-error">
            <div className="crear-contenido-contenedor-error">
              <div className="crear-contenido-icono-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2 className="crear-contenido-titulo-error">¡Ups! Algo salió mal</h2>
              <p className="crear-contenido-descripcion-error">{errorCarga}</p>
              <div className="crear-contenido-acciones-error">
                <button className="crear-contenido-boton-reintentar" onClick={reintentar}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reintentar
                </button>
                <button className="crear-contenido-boton-panel" onClick={volverAlPanel}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  </svg>
                  Ir al Panel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <WizardContenido
            tipo={tipoContenido}
            datosIniciales={datosIniciales}
            estructuraInicial={estructuraInicial}
          />
        )}
      </main>
    </div>
  );
};

export default CrearContenido;
