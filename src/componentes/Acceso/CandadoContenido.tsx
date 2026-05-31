'use client';

import * as React from 'react';
import { Link } from '@/compat/router';
import { Lock, Sparkles } from 'lucide-react';
import './CandadoContenido.css';

interface Props {
  /** Nombre del contenido bloqueado (para el mensaje). */
  titulo?: string;
  /** 'tutorial' | 'curso' | 'paquete' — para el texto. */
  tipo?: 'tutorial' | 'curso' | 'paquete';
  /** Link a la landing para comprarlo individual (opcional). */
  landingHref?: string;
}

const ETIQUETA: Record<string, string> = {
  tutorial: 'este tutorial',
  curso: 'este curso',
  paquete: 'este paquete',
};

const CandadoContenido: React.FC<Props> = ({ titulo, tipo = 'tutorial', landingHref }) => {
  const que = ETIQUETA[tipo] || 'este contenido';
  return (
    <div className="candado-wrap">
      <div className="candado-card">
        <span className="candado-icono" aria-hidden="true"><Lock size={30} /></span>
        <h2 className="candado-titulo">Contenido bloqueado</h2>
        <p className="candado-texto">
          {titulo ? <><strong>{titulo}</strong> está disponible </> : <>Para ver {que} </>}
          con una membresía activa. Si tu plan venció, <strong>vuelve a activarlo</strong> y recupera el
          acceso a todo al instante.
        </p>
        <div className="candado-acciones">
          <Link href="/membresias" className="candado-btn candado-btn-primary">
            <Sparkles size={17} aria-hidden="true" /> Ver planes y desbloquear
          </Link>
          {landingHref && (
            <Link href={landingHref} className="candado-btn candado-btn-ghost">
              Comprar solo {que}
            </Link>
          )}
        </div>
        <p className="candado-nota">¿Ya tienes plan? Inicia sesión con la cuenta correcta.</p>
      </div>
    </div>
  );
};

export default CandadoContenido;
