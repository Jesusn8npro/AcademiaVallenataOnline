import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

const BotonInstalarPWA: React.FC = () => {
    const [promptEvent, setPromptEvent] = useState<any>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setPromptEvent(e);
            setVisible(true);
        };
        const handlerInstalada = () => setVisible(false);

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', handlerInstalada);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', handlerInstalada);
        };
    }, []);

    const handleInstalar = async () => {
        if (!promptEvent) return;
        promptEvent.prompt();
        try {
            const { outcome } = await promptEvent.userChoice;
            if (outcome === 'accepted') setVisible(false);
        } catch { /* usuario cerró el prompt */ }
        setPromptEvent(null);
    };

    if (!visible) return null;

    return (
        <button
            onClick={handleInstalar}
            style={{
                position: 'fixed',
                bottom: '70px',
                right: '12px',
                zIndex: 9999,
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '24px',
                padding: '10px 16px',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                cursor: 'pointer'
            }}
        >
            <Download size={16} />
            INSTALAR APP
        </button>
    );
};

export default BotonInstalarPWA;
