'use client';

// Guard de sesión + acceso al CONTENIDO del curso según la membresía.
// Se usa en el layout de la ruta de lección (no en la landing, que es pública).
// Acceso permitido si: curso gratuito · usuario admin · inscripción individual ·
// el plan cubre cursos. La landing pública sigue mostrando "Comprar".
import * as React from 'react';
import { useParams } from '@/compat/router';
import ProteccionRuta from '../../SeguridadApp/ProteccionRuta';
import { supabase } from '../../servicios/clienteSupabase';
import { obtenerPermisos } from '../../config/accesoPlan';
import CandadoContenido from '../../componentes/Acceso/CandadoContenido';

type Estado = 'verificando' | 'ok' | 'bloqueado';

function GateAccesoCurso({ children }: { children: React.ReactNode }) {
  const { slug = '' } = useParams() as { slug?: string };
  const [estado, setEstado] = React.useState<Estado>('verificando');
  const [tituloCurso, setTituloCurso] = React.useState<string>('');

  React.useEffect(() => {
    let activo = true;
    (async () => {
      setEstado('verificando');
      try {
        const { data: curso } = await supabase
          .from('cursos')
          .select('id, titulo, tipo_acceso')
          .eq('slug', slug)
          .maybeSingle();

        if (!curso) { if (activo) setEstado('ok'); return; } // el componente muestra su error
        if (activo) setTituloCurso(curso.titulo || '');

        if (curso.tipo_acceso === 'gratuito') { if (activo) setEstado('ok'); return; }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (activo) setEstado('bloqueado'); return; }

        // Verificaciones del usuario EN PARALELO (admin · inscripción · permisos del plan).
        const [perfilRes, inscRes, permisos] = await Promise.all([
          supabase.from('perfiles').select('rol').eq('id', user.id).maybeSingle(),
          supabase.from('inscripciones').select('id, tipo_acceso').eq('usuario_id', user.id).eq('curso_id', curso.id).maybeSingle(),
          obtenerPermisos(user.id),
        ]);

        const esAdmin = (perfilRes as any)?.data?.rol === 'admin';
        const insc = (inscRes as any)?.data as { tipo_acceso?: string } | null;
        const cubrePlan = permisos.contenido.cursos; // obtenerPermisos ya es consciente del vencimiento
        // Acceso requiere inscripción (modelo de control). Las inscripciones por
        // membresía caducan con el plan; las pagadas/gratuitas son permanentes.
        const accesoInscripcion = !!insc && (insc.tipo_acceso !== 'membresia' || cubrePlan);
        if (activo) setEstado(esAdmin || accesoInscripcion ? 'ok' : 'bloqueado');
      } catch {
        if (activo) setEstado('ok');
      }
    })();
    return () => { activo = false; };
  }, [slug]);

  if (estado === 'bloqueado') {
    return <CandadoContenido tipo="curso" titulo={tituloCurso} landingHref={`/cursos/${slug}`} />;
  }
  // Optimista: mientras verificamos (estado 'verificando') mostramos el contenido
  // de una vez — carga su propio esqueleto, sin pantalla "Verificando acceso…"
  // adicional. Si el chequeo resulta bloqueado, se reemplaza por el candado.
  // El contenido sensible (video) está protegido server-side por URLs firmadas.
  return <>{children}</>;
}

export default function GuardCursoProtegido({ children }: { children: React.ReactNode }) {
  return (
    <ProteccionRuta>
      <GateAccesoCurso>{children}</GateAccesoCurso>
    </ProteccionRuta>
  );
}
