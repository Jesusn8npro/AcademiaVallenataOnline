'use client';

// Reutiliza el guard de sesión src/SeguridadApp/ProteccionRuta y, ADEMÁS,
// verifica el acceso al CONTENIDO del tutorial según la membresía del usuario.
// Como lo usan tanto /tutoriales/[slug]/contenido como /clase/[claseSlug],
// proteger aquí cubre el hub Y las clases en un solo punto, sin tocar los
// componentes grandes (ContenidoTutorial / ClaseTutorial).
//
// Acceso permitido si: tutorial gratuito · usuario admin · inscripción
// individual (compra suelta / alumno antiguo) · el plan cubre tutoriales_video.
import * as React from 'react';
import { useParams } from '@/compat/router';
import ProteccionRuta from '../../SeguridadApp/ProteccionRuta';
import { supabase } from '../../servicios/clienteSupabase';
import { obtenerPermisos } from '../../config/accesoPlan';
import { generarSlug } from '../../utilidades/slug';
import CandadoContenido from '../../componentes/Acceso/CandadoContenido';

type Estado = 'verificando' | 'ok' | 'bloqueado';

// Caché en memoria (cliente) de la lista de tutoriales: evita leer la tabla
// completa cada vez que se abre un tutorial. Los títulos casi no cambian.
const TTL_TUTS = 300_000; // 5 min
let _tutsCache: { at: number; data: any[] } | null = null;

async function getTutoriales(): Promise<any[]> {
  const ahora = Date.now();
  if (_tutsCache && ahora - _tutsCache.at < TTL_TUTS) return _tutsCache.data;
  const { data } = await supabase.from('tutoriales').select('id, titulo, tipo_acceso');
  _tutsCache = { at: ahora, data: data || [] };
  return _tutsCache.data;
}

function GateAccesoTutorial({ children }: { children: React.ReactNode }) {
  const { slug = '' } = useParams() as { slug?: string };
  const [estado, setEstado] = React.useState<Estado>('verificando');
  const [tituloTut, setTituloTut] = React.useState<string>('');

  React.useEffect(() => {
    let activo = true;
    (async () => {
      setEstado('verificando');
      try {
        const safeSlug = (t: string) => { try { return generarSlug(t || ''); } catch { return ''; } };

        const tuts = await getTutoriales();
        let tut = tuts.find((t: any) => safeSlug(t.titulo) === slug);
        if (!tut) tut = tuts.find((t: any) => t.id === slug || safeSlug(t.titulo).includes(slug));

        // Si no existe el tutorial, dejamos pasar: el componente muestra su propio error.
        if (!tut) { if (activo) setEstado('ok'); return; }
        if (activo) setTituloTut(tut.titulo || '');

        // Contenido gratuito → abierto a todos.
        if (tut.tipo_acceso === 'gratuito') { if (activo) setEstado('ok'); return; }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (activo) setEstado('bloqueado'); return; }

        // Verificaciones del usuario EN PARALELO (admin · inscripción · permisos del plan).
        const [perfilRes, inscRes, permisos] = await Promise.all([
          supabase.from('perfiles').select('rol').eq('id', user.id).maybeSingle(),
          supabase.from('inscripciones').select('id').eq('usuario_id', user.id).eq('tutorial_id', tut.id).maybeSingle(),
          obtenerPermisos(user.id),
        ]);

        const esAdmin = (perfilRes as any)?.data?.rol === 'admin';
        const tieneInscripcion = !!(inscRes as any)?.data;
        const cubrePlan = permisos.contenido.tutoriales_video;

        if (activo) setEstado(esAdmin || tieneInscripcion || cubrePlan ? 'ok' : 'bloqueado');
      } catch {
        // Ante un error inesperado, NO bloqueamos (evita dejar fuera a quien sí pagó).
        if (activo) setEstado('ok');
      }
    })();
    return () => { activo = false; };
  }, [slug]);

  if (estado === 'verificando') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        Verificando acceso…
      </div>
    );
  }
  if (estado === 'bloqueado') {
    return <CandadoContenido tipo="tutorial" titulo={tituloTut} landingHref={`/tutoriales/${slug}`} />;
  }
  return <>{children}</>;
}

export default function GuardTutorialProtegido({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProteccionRuta>
      <GateAccesoTutorial>{children}</GateAccesoTutorial>
    </ProteccionRuta>
  );
}
