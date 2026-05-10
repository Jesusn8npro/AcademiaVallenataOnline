import { useEffect, useState } from 'react';

const SEGUNDOS_FOCO_FREE = 60;
const TOAST_UPGRADE_MS = 8000;

/**
 * Modo Foco del simulador: oculta la barra de herramientas para dejar todo
 * el espacio visible al acordeon.
 *
 * - Premium: queda siempre activo.
 * - Free: 60s gratis y luego se sale automaticamente con un toast invitando
 *   a Plus. El toast se auto-cierra a los 8s. Gatillo de venta.
 */
export const useModoFoco = (esPremium: boolean) => {
    const [modoFoco, setModoFoco] = useState(false);
    const [toastUpgradeVisible, setToastUpgradeVisible] = useState(false);

    // Timer del modo foco para usuarios FREE.
    useEffect(() => {
        if (!modoFoco || esPremium) return;
        const id = window.setTimeout(() => {
            setModoFoco(false);
            setToastUpgradeVisible(true);
        }, SEGUNDOS_FOCO_FREE * 1000);
        return () => window.clearTimeout(id);
    }, [modoFoco, esPremium]);

    // Toast upgrade auto-cierra despues de 8s.
    useEffect(() => {
        if (!toastUpgradeVisible) return;
        const id = window.setTimeout(() => setToastUpgradeVisible(false), TOAST_UPGRADE_MS);
        return () => window.clearTimeout(id);
    }, [toastUpgradeVisible]);

    return {
        modoFoco,
        setModoFoco,
        toastUpgradeVisible,
        setToastUpgradeVisible,
    };
};
