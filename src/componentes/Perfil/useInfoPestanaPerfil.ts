import { useState, useEffect } from 'react';
import { supabase } from '../../servicios/clienteSupabase';

export interface Perfil {
  id: string;
  nombre?: string;
  apellido?: string;
  nombre_completo?: string;
  nombre_usuario?: string;
  biografia?: string;
  fecha_nacimiento?: string;
  profesion?: string;
  pais?: string;
  ciudad?: string;
  direccion_completa?: string;
  whatsapp?: string;
  instrumento?: string;
  nivel_habilidad?: string;
  ano_experiencia?: number;
  estilo_favorito?: string;
  estudios_musicales?: string;
  objetivo_aprendizaje?: string;
  documento_tipo?: string;
  documento_numero?: string;
  como_nos_conocio?: string;
  [key: string]: any;
}

export interface MensajeAccion {
  texto: string;
  tipo: 'exito' | 'error';
}

export const paisesComunes = [
  { codigo: '+57', nombre: 'Colombia', bandera: '🇨🇴' },
  { codigo: '+58', nombre: 'Venezuela', bandera: '🇻🇪' },
  { codigo: '+507', nombre: 'Panamá', bandera: '🇵🇦' },
  { codigo: '+1', nombre: 'Estados Unidos', bandera: '🇺🇸' },
  { codigo: '+52', nombre: 'México', bandera: '🇲🇽' },
  { codigo: '+54', nombre: 'Argentina', bandera: '🇦🇷' },
  { codigo: '+34', nombre: 'España', bandera: '🇪🇸' },
];

interface UseInfoPestanaPerfilProps {
  perfil: Perfil;
  onActualizar: (parcial: Partial<Perfil>) => void;
}

export function useInfoPestanaPerfil({ perfil, onActualizar }: UseInfoPestanaPerfilProps) {
  const [form, setForm] = useState<Perfil>(perfil);
  const [guardando, setGuardando] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState('personal');
  const [indicativoSeleccionado, setIndicativoSeleccionado] = useState('+57');
  const [numeroWhatsapp, setNumeroWhatsapp] = useState('');
  const [mensajeAccion, setMensajeAccion] = useState<MensajeAccion | null>(null);

  useEffect(() => {
    setForm(perfil);
    if (perfil.whatsapp) {
      const whatsapp = perfil.whatsapp.toString();
      let encontrado = false;
      for (const pais of paisesComunes) {
        if (whatsapp.startsWith(pais.codigo)) {
          setIndicativoSeleccionado(pais.codigo);
          setNumeroWhatsapp(whatsapp.substring(pais.codigo.length));
          encontrado = true;
          break;
        }
      }
      if (!encontrado) setNumeroWhatsapp(whatsapp);
    }
  }, [perfil]);

  function toggleSeccion(nombre: string) {
    setSeccionActiva(prev => prev === nombre ? '' : nombre);
  }

  function cambiar(campo: string, valor: any) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  async function guardar() {
    setGuardando(true);
    setMensajeAccion(null);
    try {
      const datosActualizados = { ...form };
      if (numeroWhatsapp) {
        datosActualizados.whatsapp = indicativoSeleccionado + numeroWhatsapp;
      }
      if (datosActualizados.nombre || datosActualizados.apellido) {
        datosActualizados.nombre_completo = `${datosActualizados.nombre || ''} ${datosActualizados.apellido || ''}`.trim();
      }
      const { error } = await supabase
        .from('perfiles')
        // @ts-ignore
        .update(datosActualizados)
        .eq('id', perfil.id);
      if (error) throw error;
      onActualizar(datosActualizados);
      setMensajeAccion({ texto: '¡Perfil actualizado correctamente!', tipo: 'exito' });
    } catch (error: any) {
      setMensajeAccion({ texto: 'Error al guardar: ' + error.message, tipo: 'error' });
    } finally {
      setGuardando(false);
    }
  }

  return {
    form, guardando, seccionActiva,
    indicativoSeleccionado, setIndicativoSeleccionado,
    numeroWhatsapp, setNumeroWhatsapp,
    mensajeAccion,
    toggleSeccion, cambiar, guardar,
  };
}
