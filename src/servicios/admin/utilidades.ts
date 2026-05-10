import { formatearMonedaCOP } from '../../utilidades/formatadores';

export function formatearNumero(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

export const formatearMoneda = formatearMonedaCOP;

export function calcularCrecimiento(actual: number, anterior: number): number {
    return anterior > 0 ? Math.round(((actual - anterior) / anterior) * 100) : 0;
}
