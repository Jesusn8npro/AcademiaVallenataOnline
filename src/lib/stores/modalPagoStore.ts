import { writable } from 'svelte/store';
 
// Store para controlar cuándo el modal de pago está abierto
export const modalPagoAbierto = writable<boolean>(false); 