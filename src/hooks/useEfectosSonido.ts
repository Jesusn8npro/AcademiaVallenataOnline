import { useEffect, useRef } from 'react';

/**
 * Hook para reproducir efectos de sonido globales en la interfaz.
 * Por ahora implementa el sonido de 'click' al interactuar con elementos.
 */
export const useEfectosSonido = () => {
    // Usamos useRef para mantener la instancia del audio y no recargarla en cada render
    const audioClickRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Inicializar el audio
        // Asegurarse de que la ruta sea correcta según la estructura del proyecto
        audioClickRef.current = new Audio('/audio/effects/ui/click.mp3');
        audioClickRef.current.volume = 0.4; // Volumen suave (40%)

        const manejarClick = (e: MouseEvent) => {
            // Verificar si el elemento clickeado es interactivo
            const target = e.target as HTMLElement;

            // Buscamos si el elemento o sus padres son botones, enlaces o inputs
            const esInteractivo = target.closest('button, a, input, select, textarea, [role="button"], .clickable');

            if (esInteractivo) {
                try {
                    if (audioClickRef.current) {
                        // Reiniciar el audio si ya se estaba reproduciendo para permitir clicks rápidos
                        audioClickRef.current.currentTime = 0;
                        // Reproducir
                        const promesa = audioClickRef.current.play();

                        // Manejar promesa de play() que puede fallar si el usuario no ha interactuado aún
                        if (promesa !== undefined) {
                            promesa.then(() => {
                            }).catch(error => {
                            });
                        }
                    } else {
                    }
                } catch (err) {
                }
            }
        };

        // Agregar listener global
        document.addEventListener('click', manejarClick);

        // Limpieza
        return () => {
            document.removeEventListener('click', manejarClick);
        };
    }, []);
};
