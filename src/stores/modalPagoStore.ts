import { writable, useTienda } from '$utilidades/tiendaReact';

// Store para controlar cuándo el modal de pago está abierto
export const modalPagoAbierto = writable<boolean>(false);

export const useModalPagoAbierto = () => useTienda(modalPagoAbierto);
