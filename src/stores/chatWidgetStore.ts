import { writable, useTienda } from '$utilidades/tiendaReact';

// 🚀 STORE PARA CONTROLAR VISIBILIDAD DEL CHAT WIDGET
export const chatWidgetVisible = writable(true);

// 🎯 FUNCIONES PARA CONTROLAR VISIBILIDAD
export function ocultarChatWidget() {
  chatWidgetVisible.set(false);
}

export function mostrarChatWidget() {
  chatWidgetVisible.set(true);
}

// 🔧 FUNCIÓN PARA VERIFICAR SI DEBE ESTAR OCULTO
export function debeOcultarChatWidget() {
  // Verificar si hay modales abiertos
  const modalesAbiertos = document.querySelectorAll('.modal-inicio-sesion, .modal-busqueda, .modal-permisos');
  return modalesAbiertos.length > 0;
}

// 📱 FUNCIÓN PARA ACTUALIZAR ESTADO AUTOMÁTICAMENTE
export function actualizarEstadoChatWidget() {
  if (debeOcultarChatWidget()) {
    ocultarChatWidget();
  } else {
    mostrarChatWidget();
  }
}
export const useChatWidgetVisible = () => useTienda(chatWidgetVisible);
