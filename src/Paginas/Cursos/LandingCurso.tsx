import React from 'react';
import SkeletonLanding from '../../componentes/Skeletons/SkeletonLanding';
import { useLandingCurso } from './Hooks/useLandingCurso';

// Re-exportamos los tipos para mantener compatibilidad con VistaPremium
export type { Modulo, Leccion, Contenido, DatosVista } from './tipos';

const LandingCurso = () => {
    const {
        cargando, error, errorAccion, contenido, estaInscrito, instructorInfo,
        manejarInscripcion, verContenido, irACursos, Vista,
    } = useLandingCurso();

    if (cargando) return <SkeletonLanding />;

    if (error || !contenido) {
        return (
            <div style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                minHeight: '100vh', background: '#000', color: '#fff',
                flexDirection: 'column', gap: '1rem'
            }}>
                <h2>Contenido no encontrado</h2>
                <p>El curso o tutorial que buscas no existe.</p>
                <button
                    onClick={irACursos}
                    style={{
                        padding: '0.75rem 1.5rem', background: '#8b5cf6',
                        color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer'
                    }}
                >
                    Volver a Cursos
                </button>
            </div>
        );
    }

    return (
        <>
            {errorAccion && (
                <div style={{ background: '#fed7d7', color: '#c53030', padding: '0.75rem 1.25rem', borderRadius: '0.5rem', margin: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    {errorAccion}
                </div>
            )}
            <Vista
                data={{
                    contenido,
                    estaInscrito,
                    instructor: instructorInfo
                        ? { full_name: instructorInfo.full_name || '', avatar_url: instructorInfo.avatar_url || '' }
                        : undefined
                }}
                handleInscripcion={manejarInscripcion}
                verContenido={verContenido}
                irAPrimeraClase={verContenido}
            />
        </>
    );
};

export default LandingCurso;
