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

      let datosContenido: any = null;
      let errorConsulta: any = null;

      if (tipo === 'curso') {
        if (esUUID || esNumerico) {
          const { data, error } = await supabase
            .from('cursos')
            .select('*')
            .eq('id', slugContenido)
            .single();
          datosContenido = data; errorConsulta = error;
        } else {
          const { data, error } = await supabase
            .from('cursos')
            .select('*')
            .eq('slug', slugContenido)
            .single();
          datosContenido = data; errorConsulta = error;

          if (errorConsulta || !datosContenido) {
            const tituloDesdeSlug = slugContenido.replace(/-/g, ' ');
            const { data: dataTitulo } = await supabase
              .from('cursos')
              .select('*')
              .ilike('titulo', `%${tituloDesdeSlug}%`);
            if (Array.isArray(dataTitulo) && dataTitulo.length > 0) {
              datosContenido = dataTitulo[0];
              errorConsulta = null;
            }
          }
        }
      } else {
        if (esUUID) {
          const { data, error } = await supabase
            .from('tutoriales')
            .select('*')
            .eq('id', slugContenido)
            .single();
          datosContenido = data; errorConsulta = error;
        } else {
          const tituloDesdeSlug = slugContenido.replace(/-/g, ' ');
          const { data, error } = await supabase
            .from('tutoriales')
            .select('*')
            .ilike('titulo', `%${tituloDesdeSlug}%`);
          errorConsulta = error;
          if (Array.isArray(data) && data.length > 0) {
            datosContenido = data[0];
          }
        }
      }

      if (errorConsulta || !datosContenido) throw new Error(`${tipo === 'curso' ? 'Curso' : 'Tutorial'} no encontrado`);

      setDatosIniciales(datosContenido);
      await cargarEstructuraContenido(datosContenido.id, tipo);
    } catch (error: any) {
      setErrorCarga(error.message || 'Error al cargar los datos');
    } finally {
      setCargandoDatos(false);
    }
  };

  const cargarEstructuraContenido = async (idContenido: string | number, tipo: 'curso' | 'tutorial') => {
    try {
      if (tipo === 'curso') {
        const { data: modulos, error: errorModulos } = await supabase
          .from('modulos')
          .select('*')
          .eq('curso_id', idContenido)
          .order('orden', { ascending: true });

        if (!errorModulos && modulos && modulos.length > 0) {
          const moduloIds = modulos.map((m: any) => m.id);
          const { data: lecciones } = await supabase
            .from('lecciones')
            .select('*')
            .in('modulo_id', moduloIds)
            .order('orden', { ascending: true });

          const estructura = modulos.map((modulo: any) => ({
            ...modulo,
            lecciones: (lecciones || [])
              .filter((l: any) => l.modulo_id === modulo.id)
              .sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0))
          }));
          setEstructuraInicial(estructura);
        } else {
          setEstructuraInicial([]);
        }
      } else {
        const { data: partes, error: errorPartes } = await supabase
          .from('partes_tutorial')
          .select('*')
          .eq('tutorial_id', idContenido)
          .order('orden', { ascending: true });
        if (!errorPartes && partes) setEstructuraInicial(partes || []);
      }
    } catch (e) {
      console.error('❌ [ESTRUCTURA] Error:', e);
    }
  };

  const volverAlPanel = () => navigate('/administrador/panel-contenido');

  const reintentar = () => {
    setErrorCarga('');
    const urlParams = new URLSearchParams(window.location.search);
    const editar = urlParams.get('editar') || '';
    if (editar) cargarDatosParaEdicion(editar, tipoContenido);
  };

  return (
    <div className="crear-contenido-pagina">
      <main className="crear-contenido-main">
        {cargandoDatos ? (
          <div className="crear-contenido-estado-carga">
            <div className="crear-contenido-contenedor-carga">
              <div className="crear-contenido-spinner-futurista"><div className="crear-contenido-anillo crear-contenido-anillo-1"></div><div className="crear-contenido-anillo crear-contenido-anillo-2"></div><div className="crear-contenido-anillo crear-contenido-anillo-3"></div><div className="crear-contenido-icono-central">{tipoContenido === 'curso' ? '📚' : '🎥'}</div></div>
              <h2 className="crear-contenido-titulo-carga">Cargando {tipoContenido}...</h2>
              <p className="crear-contenido-descripcion-carga">Preparando el contenido para edición</p>
            </div>
          </div>
        ) : errorCarga ? (
          <div className="crear-contenido-estado-error">
            <div className="crear-contenido-contenedor-error">
              <div className="crear-contenido-icono-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg></div>
              <h2 className="crear-contenido-titulo-error">¡Ups! Algo salió mal</h2>
              <p className="crear-contenido-descripcion-error">{errorCarga}</p>
              <div className="crear-contenido-acciones-error">
                <button className="crear-contenido-boton-reintentar" onClick={reintentar}>Reintentar</button>
                <button className="crear-contenido-boton-panel" onClick={volverAlPanel}>Ir al Panel</button>
              </div>
            </div>
          </div>
        ) : (
          <WizardContenido
            tipo={tipoContenido}
            datosIniciales={datosIniciales}
            estructuraInicial={estructuraInicial}
            onBack={volverAlPanel}
            tituloEdicion={tituloPrincipal}
            modoEdicion={modoEdicion}
          />
        )}
      </main>
    </div>
  );
};

export default CrearContenido;
