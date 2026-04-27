import { obtenerChatsUsuario, crearChat } from './_chats';
import { obtenerMensajes, enviarMensaje, marcarMensajesComoLeidos, toggleReaccion } from './_mensajes';
import {
    suscribirseAChat,
    desuscribirseDeChat,
    desuscribirseDeTodosLosChats,
    buscarUsuarios,
    obtenerEstadisticasMensajeria,
    eliminarChat
} from './_subscripcion';

export const mensajeriaService = {
    obtenerChatsUsuario,
    crearChat,
    obtenerMensajes,
    enviarMensaje,
    marcarMensajesComoLeidos,
    toggleReaccion,
    suscribirseAChat,
    desuscribirseDeChat,
    desuscribirseDeTodosLosChats,
    buscarUsuarios,
    obtenerEstadisticas: obtenerEstadisticasMensajeria,
    eliminarChat
};

export default mensajeriaService;
