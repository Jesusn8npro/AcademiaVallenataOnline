import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { crearUsuario as crearUsuarioService } from '../../../../servicios/usuariosAdminService';

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  correo_electronico: string;
  rol: string;
  suscripcion: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  ultima_actividad?: string;
  url_foto_perfil?: string;
  eliminado: boolean;
  whatsapp?: string;
  ciudad?: string;
  pais?: string;
  nivel_habilidad?: string;
  documento_numero?: string;
  profesion?: string;
  documento_tipo?: string;
  instrumento?: string;
  latitud?: string;
  longitud?: string;
  zona_horaria?: string;
  ip_registro?: string;
}

const DATOS_INICIALES = {
  nombre: '',
  apellido: '',
  nombre_usuario: '',
  correo_electronico: '',
  password: '',
  rol: 'estudiante',
  suscripcion: 'free',
  ciudad: '',
  pais: '',
  whatsapp: '',
  nivel_habilidad: '',
  documento_tipo: 'CC',
  documento_numero: '',
  profesion: '',
  instrumento: 'acordeon'
};

const CAMPOS_TEXTO = ['nombre', 'apellido', 'nombre_usuario', 'ciudad', 'pais', 'profesion'];
const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;

function limpiarTexto(texto: string): string {
  return texto.replace(EMOJI_REGEX, '');
}

function limpiarTextoFinal(texto: string): string {
  return texto.replace(EMOJI_REGEX, '').trim();
}

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function useCrearUsuario(onUsuarioCreado: (usuario: Usuario) => void) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [datos, setDatos] = useState({ ...DATOS_INICIALES });

  const limpiarFormulario = () => {
    setDatos({ ...DATOS_INICIALES });
    setError('');
    setExito(false);
  };

  const crearUsuarioLocal = async () => {
    const datosLimpios = {
      ...datos,
      nombre: limpiarTextoFinal(datos.nombre),
      apellido: limpiarTextoFinal(datos.apellido),
      nombre_usuario: limpiarTextoFinal(datos.nombre_usuario),
      correo_electronico: datos.correo_electronico.trim().toLowerCase(),
      ciudad: limpiarTextoFinal(datos.ciudad),
      pais: limpiarTextoFinal(datos.pais),
      profesion: limpiarTextoFinal(datos.profesion)
    };

    if (!datosLimpios.nombre || !datosLimpios.apellido || !datosLimpios.correo_electronico || !datosLimpios.password) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }
    if (!validarEmail(datosLimpios.correo_electronico)) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }
    if (datosLimpios.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (datosLimpios.nombre_usuario && datosLimpios.nombre_usuario.trim() !== '') {
      if (!/^[a-zA-Z0-9_]+$/.test(datosLimpios.nombre_usuario)) {
        setError('El nombre de usuario solo puede contener letras, números y guiones bajos (_)');
        return;
      }
      if (datosLimpios.nombre_usuario.length < 3) {
        setError('El nombre de usuario debe tener al menos 3 caracteres');
        return;
      }
    }

    try {
      setCargando(true);
      setError('');
      const resultado = await crearUsuarioService(datosLimpios);
      if (resultado.success) {
        setExito(true);
        limpiarFormulario();
        setTimeout(() => { onUsuarioCreado(resultado.data as any); }, 2000);
      } else {
        setError(resultado.error || 'Error al crear el usuario');
      }
    } catch (err: any) {
      setError(`Error inesperado: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const manejarEntradaTexto = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.target;
    if (target.name && CAMPOS_TEXTO.includes(target.name)) {
      target.value = limpiarTexto(target.value);
    }
  };

  const manejarCambioDatos = (campo: string, valor: string) => {
    setDatos(prev => ({ ...prev, [campo]: valor }));
  };

  return { cargando, error, exito, datos, limpiarFormulario, crearUsuarioLocal, manejarEntradaTexto, manejarCambioDatos };
}
