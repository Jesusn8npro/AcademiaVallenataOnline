// 🎯 ÍNDICE CENTRALIZADO DE SUPABASE
// Punto único de acceso para Supabase + Servicios + Utilidades

// ✅ CLIENTE Y CONFIGURACIÓN BÁSICA
export { supabase } from './clienteSupabase';
export { estadoUsuarioActual } from './estadoUsuarioActual';
export * from './utilidadesSupabase';
export * from './autenticacionSupabase';
export * from './supabase-comunidad';

// 🔄 PROVIDER PARA EVITAR DUPLICACIONES
export { default as SupabaseProvider } from './providers/SupabaseProvider.svelte';

// 🧭 UTILIDADES DE NAVEGACIÓN (Evita 70+ imports de goto)
export * from './utils/navigationUtils';

// 🛠️ UTILIDADES COMUNES (Evita 20+ imports duplicados)
export * from './utils/commonUtils';

// 🎯 HUB DE SERVICIOS (Evita múltiples imports de servicios)
export * from './services/serviceHub';

// 📱 USUARIO ACTIVO (centralizado)
export { usuario, setUsuario, limpiarUsuario } from '../UsuarioActivo/usuario';

// 🎮 TIPOS COMUNES DEL SIMULADOR (si se necesitan)
// export type { CancionCompleta, SecuenciaCancion, NotaCancion } from './services/serviceHub';
