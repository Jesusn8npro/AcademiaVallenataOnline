import * as React from 'react';
import VistaGrabacionesHero from '../../../../Perfil/MisGrabaciones/VistaGrabacionesHero';

interface Props { usuario: any; }

const PestanaGrabaciones: React.FC<Props> = ({ usuario }) => (
  <VistaGrabacionesHero
    usuarioId={usuario.id}
    tipoVista="admin"
    nombreUsuario={usuario.nombre_completo || usuario.nombre || 'este usuario'}
  />
);

export default PestanaGrabaciones;
