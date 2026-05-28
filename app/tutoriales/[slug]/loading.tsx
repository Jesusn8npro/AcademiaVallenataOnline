import SkeletonLanding from '@/componentes/Skeletons/SkeletonLanding'

// loading.tsx de Next: mientras la ruta dinámica re-revalida o pre-renderiza
// (TTFB sobre miss de cache), el usuario ve este skeleton al instante. Es la
// forma más simple de tener navegación percibida como instantánea.
export default function Loading() {
  return <SkeletonLanding />
}
