import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../../../servicios/clienteSupabase';
import { TONALIDADES } from '../../acordeon/notasAcordeonDiatonico';
import type { AjustesAcordeon, SonidoVirtual } from '../../acordeon/TiposAcordeon';

/**
 * useAcordeonPersistencia
 * -----------------------
 * Encapsula carga + guardado de ajustes en Supabase:
 *  - Auth + perfil de instrumento + lista de tonalidades + nombres custom
 *  - Carga del diseño visual + config musical por tonalidad seleccionada
 *  - Operaciones de guardado con debounce de lista de tonalidades
 *
 * Recibe el state `ajustes` y su setter del orquestador, ademas de la tonalidad
 * activa (cambia entre tonalidades dispara recarga). NO maneja audio ni samples.
 */
const DEFAULTS_AJUSTES: AjustesAcordeon = {
  tamano: '88vh', x: '50%', y: '50%',
  pitosBotonTamano: '4.4vh', pitosFuenteTamano: '1.6vh',
  bajosBotonTamano: '4.2vh', bajosFuenteTamano: '1.3vh',
  teclasLeft: '5.05%', teclasTop: '13%',
  bajosLeft: '82.5%', bajosTop: '28%',
  mapeoPersonalizado: {}, pitchPersonalizado: {}, pitchGlobal: 0,
  bancoId: 'acordeon'
};

interface Args {
  ajustes: AjustesAcordeon;
  setAjustes: React.Dispatch<React.SetStateAction<AjustesAcordeon>>;
  ajustesRef: React.MutableRefObject<AjustesAcordeon>;
  tonalidadSeleccionada: string;
  setTonalidadSeleccionada: (t: string) => void;
  instrumentoId: string;
  setInstrumentoId: (id: string) => void;
  setListaInstrumentos: (lista: any[]) => void;
  setCargandoCloud: (b: boolean) => void;
  setSonidosVirtuales: React.Dispatch<React.SetStateAction<SonidoVirtual[]>>;
  sonidosVirtuales: SonidoVirtual[];
}

export function useAcordeonPersistencia({
  ajustes, setAjustes, ajustesRef,
  tonalidadSeleccionada, setTonalidadSeleccionada,
  instrumentoId, setInstrumentoId,
  setListaInstrumentos, setCargandoCloud,
  setSonidosVirtuales, sonidosVirtuales,
}: Args) {
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [listaTonalidades, setListaTonalidades] = useState<string[]>([]);
  const [nombresTonalidades, setNombresTonalidades] = useState<Record<string, string>>({});
  const [disenoCargado, setDisenoCargado] = useState(false);
  const isInitialLoad = useRef(true);

  // Carga inicial: instrumentos + ajustes del usuario
  useEffect(() => {
    const checkUserAndLoad = async () => {
      setCargandoCloud(true);
      try {
        const { data: instData } = await (supabase.from('sim_instrumentos').select('*') as any);
        if (instData) setListaInstrumentos(instData);

        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (!user) { setListaTonalidades(Object.keys(TONALIDADES)); return; }

        setUsuarioId(user.id);
        const { data: ajustesData } = await (supabase
          .from('sim_ajustes_usuario')
          .select('*')
          .eq('usuario_id', user.id)
          .maybeSingle() as any);

        if (!ajustesData) { setListaTonalidades(Object.keys(TONALIDADES)); return; }

        if (ajustesData.instrumento_id) setInstrumentoId(ajustesData.instrumento_id as string);
        if (ajustesData.sonidos_personalizados) setSonidosVirtuales(ajustesData.sonidos_personalizados as SonidoVirtual[]);
        if (ajustesData.ajustes_visuales) setAjustes(prev => ({ ...prev, ...(ajustesData.ajustes_visuales as any) }));

        if (ajustesData.tonalidades_configuradas) {
          const configs = ajustesData.tonalidades_configuradas as any;
          const nombres: Record<string, string> = {};
          Object.entries(configs).forEach(([key, val]: [string, any]) => {
            if (val?.nombrePersonalizado) {
              const id = key.replace('ajustes_acordeon_vPRO_', '');
              nombres[id] = val.nombrePersonalizado;
            }
          });
          setNombresTonalidades(nombres);
        }

        if (ajustesData.lista_tonalidades_activa && Array.isArray(ajustesData.lista_tonalidades_activa) && ajustesData.lista_tonalidades_activa.length > 0) {
          setListaTonalidades(ajustesData.lista_tonalidades_activa as string[]);
        } else {
          setListaTonalidades(Object.keys(TONALIDADES));
        }

        if (ajustesData.tonalidad_activa) setTonalidadSeleccionada(ajustesData.tonalidad_activa as string);
      } catch (_) {
        setListaTonalidades(Object.keys(TONALIDADES));
      } finally {
        setCargandoCloud(false);
      }
    };
    checkUserAndLoad();
  }, []);

  // Recargar config musical al cambiar de tonalidad
  useEffect(() => {
    if (usuarioId === null) return;
    const mappingKey = `ajustes_acordeon_vPRO_${tonalidadSeleccionada}`;

    (async () => {
      try {
        const { data } = await supabase
          .from('sim_ajustes_usuario')
          .select('ajustes_visuales, tonalidades_configuradas, instrumento_id')
          .eq('usuario_id', usuarioId)
          .maybeSingle();

        const disenoGlobalNube = (data as any)?.ajustes_visuales || {};
        const rawConfigMusical = (data as any)?.tonalidades_configuradas?.[mappingKey] || {};
        const configMusical: Partial<AjustesAcordeon> = {
          mapeoPersonalizado: rawConfigMusical.mapeoPersonalizado,
          pitchPersonalizado: rawConfigMusical.pitchPersonalizado,
          pitchGlobal: rawConfigMusical.pitchGlobal,
          bancoId: rawConfigMusical.bancoId,
          timbre: rawConfigMusical.timbre,
        };

        // Solo aplicamos diseño global de la nube en carga inicial o si el acordeón está en su default;
        // evita "salto asqueroso" si el usuario ya lo movió.
        const ajustesFinales: AjustesAcordeon = { ...ajustesRef.current, ...configMusical };
        if (isInitialLoad.current || (ajustesRef.current.x === '50%' && ajustesRef.current.y === '50%')) {
          Object.assign(ajustesFinales, disenoGlobalNube);
        }
        // Corrige valor "maldito" 53.5% que aparecía esporádicamente desde la nube.
        if (ajustesFinales.x === '53.5%') ajustesFinales.x = '50%';

        setAjustes(ajustesFinales);
        ajustesRef.current = ajustesFinales;
        setDisenoCargado(true);
        isInitialLoad.current = false;

        if ((data as any)?.instrumento_id) setInstrumentoId((data as any).instrumento_id);
      } catch (_) { }
    })();
  }, [tonalidadSeleccionada, usuarioId]);

  // Persiste lista_tonalidades_activa con debounce
  useEffect(() => {
    if (!usuarioId || isInitialLoad.current || listaTonalidades.length === 0) return;
    const timer = setTimeout(async () => {
      await ((supabase.from('sim_ajustes_usuario') as any).update({
        lista_tonalidades_activa: listaTonalidades,
        updated_at: new Date().toISOString()
      } as any).eq('usuario_id', usuarioId) as any);
    }, 1500);
    return () => clearTimeout(timer);
  }, [listaTonalidades, usuarioId]);

  // Persiste nombres + lista cuando cambian los nombres
  useEffect(() => {
    if (!usuarioId || listaTonalidades.length === 0) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('sim_ajustes_usuario')
          .select('tonalidades_configuradas')
          .eq('usuario_id', usuarioId)
          .maybeSingle() as any;

        const configActuales = (data as any)?.tonalidades_configuradas || {};
        const siguientes: Record<string, any> = { ...configActuales };
        listaTonalidades.forEach(tonalidadId => {
          const key = `ajustes_acordeon_vPRO_${tonalidadId}`;
          siguientes[key] = {
            ...(configActuales[key] || {}),
            nombrePersonalizado: nombresTonalidades[tonalidadId] || null
          };
        });
        await supabase.from('sim_ajustes_usuario').upsert({
          usuario_id: usuarioId,
          tonalidades_configuradas: siguientes,
          lista_tonalidades_activa: listaTonalidades,
          updated_at: new Date().toISOString()
        } as any, { onConflict: 'usuario_id' }) as any;
      } catch (_) { }
    })();
  }, [nombresTonalidades, listaTonalidades, usuarioId]);

  const guardarAjustes = useCallback(async () => {
    if (!usuarioId) return;
    const key = `ajustes_acordeon_vPRO_${tonalidadSeleccionada}`;
    const cur = ajustesRef.current;

    const disenoGlobal = {
      x: cur.x, y: cur.y, tamano: cur.tamano,
      pitosBotonTamano: cur.pitosBotonTamano, pitosFuenteTamano: cur.pitosFuenteTamano,
      bajosBotonTamano: cur.bajosBotonTamano, bajosFuenteTamano: cur.bajosFuenteTamano,
      teclasLeft: cur.teclasLeft, teclasTop: cur.teclasTop,
      bajosLeft: cur.bajosLeft, bajosTop: cur.bajosTop
    };
    const configMusical = {
      mapeoPersonalizado: cur.mapeoPersonalizado,
      pitchPersonalizado: cur.pitchPersonalizado,
      pitchGlobal: cur.pitchGlobal,
      bancoId: cur.bancoId,
      timbre: cur.timbre || 'Brillante',
    };

    try {
      const { data } = await supabase
        .from('sim_ajustes_usuario')
        .select('tonalidades_configuradas')
        .eq('usuario_id', usuarioId)
        .maybeSingle() as any;

      const nuevasTonalidades = { ...((data as any)?.tonalidades_configuradas || {}), [key]: configMusical };
      const { error } = await (supabase.from('sim_ajustes_usuario').upsert({
        usuario_id: usuarioId,
        tonalidad_activa: tonalidadSeleccionada,
        instrumento_id: instrumentoId,
        ajustes_visuales: disenoGlobal,
        tonalidades_configuradas: nuevasTonalidades,
        updated_at: new Date().toISOString()
      } as any) as any);
      if (error) throw error;

      // Espejo en localStorage del diseño visual (carga inmediata sin esperar Supabase).
      localStorage.setItem('SIM_VISUAL_MASTER_V11', JSON.stringify(disenoGlobal));
    } catch (_) { }
  }, [usuarioId, tonalidadSeleccionada, instrumentoId, ajustesRef]);

  const resetearAjustes = useCallback(() => {
    localStorage.removeItem('SIM_VISUAL_MASTER_V11');
    setAjustes(DEFAULTS_AJUSTES);
  }, [setAjustes]);

  const guardarNuevoSonidoVirtual = useCallback(async (
    nombre: string, rutaBase: string, pitch: number, tipo: 'Bajos' | 'Brillante' | 'Armonizado'
  ) => {
    const nuevo: SonidoVirtual = { id: `custom_${Date.now()}`, nombre, rutaBase, pitch, tipo };
    const nuevaLista = [nuevo, ...sonidosVirtuales];
    setSonidosVirtuales(nuevaLista);
    if (usuarioId) {
      await (supabase.from('sim_ajustes_usuario').upsert({
        usuario_id: usuarioId,
        sonidos_personalizados: nuevaLista,
        updated_at: new Date().toISOString()
      } as any) as any);
    }
    return nuevo;
  }, [usuarioId, sonidosVirtuales, setSonidosVirtuales]);

  const actualizarNombreTonalidad = useCallback(async (tonalidadId: string, nuevoNombre: string) => {
    setNombresTonalidades(prev => ({ ...prev, [tonalidadId]: nuevoNombre }));
    if (!usuarioId) return;
    try {
      const key = `ajustes_acordeon_vPRO_${tonalidadId}`;
      const { data } = await supabase
        .from('sim_ajustes_usuario')
        .select('tonalidades_configuradas')
        .eq('usuario_id', usuarioId)
        .maybeSingle() as any;
      const nuevasConfigs = {
        ...(data?.tonalidades_configuradas || {}),
        [key]: { ...(data?.tonalidades_configuradas?.[key] || {}), nombrePersonalizado: nuevoNombre }
      };
      await ((supabase.from('sim_ajustes_usuario') as any).update({
        tonalidades_configuradas: nuevasConfigs,
        updated_at: new Date().toISOString()
      } as any).eq('usuario_id', usuarioId) as any);
    } catch (_) { }
  }, [usuarioId]);

  const eliminarTonalidad = useCallback(async (tonalidad: string) => {
    if (listaTonalidades.length <= 1) return;
    const nueva = listaTonalidades.filter(t => t !== tonalidad);
    setListaTonalidades(nueva);
    if (tonalidad === tonalidadSeleccionada) setTonalidadSeleccionada(nueva[0]);

    if (!usuarioId) return;
    try {
      const key = `ajustes_acordeon_vPRO_${tonalidad}`;
      const { data } = await (supabase
        .from('sim_ajustes_usuario')
        .select('tonalidades_configuradas')
        .eq('usuario_id', usuarioId)
        .maybeSingle() as any);
      const nuevasConfigs = { ...((data as any)?.tonalidades_configuradas || {}) };
      delete nuevasConfigs[key];
      await ((supabase.from('sim_ajustes_usuario') as any).update({
        tonalidades_configuradas: nuevasConfigs,
        lista_tonalidades_activa: nueva,
        updated_at: new Date().toISOString()
      } as any).eq('usuario_id', usuarioId) as any);
    } catch (_) { }
  }, [listaTonalidades, tonalidadSeleccionada, usuarioId, setTonalidadSeleccionada]);

  return {
    usuarioId, listaTonalidades, setListaTonalidades,
    nombresTonalidades, disenoCargado, isInitialLoad,
    guardarAjustes, resetearAjustes, guardarNuevoSonidoVirtual,
    actualizarNombreTonalidad, eliminarTonalidad,
  };
}
