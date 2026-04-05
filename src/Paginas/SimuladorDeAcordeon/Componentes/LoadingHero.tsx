import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export const LoadingHero = () => {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: '#000', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '20px'
        }}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
                <Loader2 size={60} color="#00e5ff" />
            </motion.div>
            <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>Sintonizando Acordeón...</h2>
        </div>
    );
};
