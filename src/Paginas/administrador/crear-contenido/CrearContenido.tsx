'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from '@/compat/router';
import WizardContenido from '../../../componentes/CrearContenido/WizardContenido';
import { supabase } from '../../../servicios/clienteSupabase';
import './CrearContenido.css';

const CrearContenido = () => {
  const navigate = useNavigate();
  const [tipoContenido, setTipoContenido] = useState<'curso' | 'tutorial'>('curso');
  const [datosIniciales, setDatosIniciales] = useState<any>(null);
  const [estructuraInicial, setEstructuraInicial] = useState<any[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);


  const tituloPrincipal = modoEdicion
    ? `?? Editar ${tipoContenido === 'curso' ? 'Curso' : 'Tutorial'}${datosIniciales?.titulo || datosIniciales?.nombre ? `: ${datosIniciales?.titulo || datosIniciales?.nombre}` : ''}`
    : `${tipoContenido === 'curso' ? '?? Crear Nuevo Curso' : '?? Crear Nuevo Tutorial'}`;

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

      const esUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugContenido);
      const esNumerico = /^\d+$/.test(slugContenido);

      let datosContenido: any = null;
      let errorConsulta: any = null;

      // Cuando el identificador ya es un UUID (o numérico para cursos), podemos
      // disparar la query del contenido y la de su estructura EN PARALELO porque
      // ambas usan el mismo ID. Antes eran secuenciales (1 query + await + otra),
      // duplicando el tiempo de carga del wizard de edición.
      const puedeParalelizar = esUUID || (tipo === 'curso' && esNumerico);
      if (puedeParalelizar) {
        const tabla = tipo === 'curso' ? 'cursos' : 'tutoriales';
        const [contenidoRes] = await Promise.all([
          supabase.from(tabla).select('*').eq('id', slugContenido).single(),
          cargarEstructuraContenido(slugContenido, tipo),
        ]);
        datosContenido = contenidoRes.data;
        errorConsulta = contenidoRes.error;
        if (errorConsulta || !datosContenido) throw new Error(`${tipo === 'curso' ? 'Curso' : 'Tutorial'} no encontrado`);
        // Merge: cargarEstructuraContenido pudo haber seteado los campos
        // tiene_evaluacion/monedas_evaluacion (para tutoriales con eval).
        // Los preservamos al setear los datos del contenido.
        setDatosIniciales((prev: any) => prev
          ? { ...datosContenido,
              tiene_evaluacion: prev.tiene_evaluacion,
              monedas_evaluacion: prev.monedas_evaluacion,
              parte_evaluacion_id: prev.parte_evaluacion_id }
          : datosContenido);
        return;
      }

      // Fallback: búsqueda por slug/título — secuencial porque no conocemos el ID.
      if (tipo === 'curso') {
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
          .eq('curso_id', String(idContenido))
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
          .eq('tutorial_id', String(idContenido))
          .order('orden', { ascending: true });
        if (!errorPartes && partes) {
          // Separar la parte de evaluación (si existe) de las partes normales.
          // El toggle de "tiene evaluación" en Paso 1 gestiona esa parte aparte;
          // si la dejáramos en estructuraInicial el usuario la vería como una
          // parte editable más, lo cual rompe el flujo.
          const parteEval = (partes as any[]).find((p: any) => p.tipo_contenido === 'evaluacion');
          const partesNormales = (partes as any[]).filter((p: any) => p.tipo_contenido !== 'evaluacion');
          setEstructuraInicial(partesNormales);
          if (parteEval) {
            setDatosIniciales((prev: any) => ({
              ...prev,
              tiene_evaluacion: true,
              monedas_evaluacion: parteEval.monedas_recompensa ?? 10,
              parte_evaluacion_id: parteEval.id,
            }));
          }
        }
      }
    } catch (e) {
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
              <div className="crear-contenido-spinner-futurista"><div className="crear-contenido-anillo crear-contenido-anillo-1"></div><div className="crear-contenido-anillo crear-contenido-anillo-2"></div><div className="crear-contenido-anillo crear-contenido-anillo-3"></div><div className="crear-contenido-icono-central">{tipoContenido === 'curso' ? '??' : '??'}</div></div>
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
