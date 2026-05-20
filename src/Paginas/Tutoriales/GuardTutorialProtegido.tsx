'use client';

// Reutiliza el guard existente src/SeguridadApp/ProteccionRuta SIN
// reimplementar la lógica de auth. ProteccionRuta acepta `children` y, si
// hay sesión, los renderiza tal cual. Este wrapper solo existe para exponer
// el guard como Client Component a un layout.tsx de Next App Router.
import * as React from 'react'
import ProteccionRuta from '../../SeguridadApp/ProteccionRuta';

export default function GuardTutorialProtegido({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProteccionRuta>{children}</ProteccionRuta>;
}
