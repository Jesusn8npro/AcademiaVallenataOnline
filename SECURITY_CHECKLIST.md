# Checklist de Seguridad y Actualizaciones

Usa esta lista para verificar la seguridad de la aplicación antes de cada despliegue importante o cuando se reporten nuevas vulnerabilidades.

## 1. Gestión de Dependencias
- [ ] **Auditoría**: Ejecuta `npm audit` para buscar vulnerabilidades conocidas.
- [ ] **Actualizaciones**: Revisa actualizaciones mayores para `react`, `react-dom` y `vite`.
  - Comando: `npm outdated`
- [ ] **Lockfile**: Asegúrate de que `package-lock.json` esté commiteado y actualizado.

## 2. Secretos y Entorno
- [ ] **Revisión del Repositorio**: Confirma que `.env` NO esté en el repositorio.
  - Comando: `git ls-files .env` (No debería devolver nada)
- [ ] **Escaneo de Código**: Busca claves obvias en `src/` usando grep.
  - Comando: `grep -r "sk-" src/` o similar.
- [ ] **EasyPanel**: Verifica que los secretos estén estrictamente en las Variables de Entorno, no hardcodeados.

## 3. Configuración de Despliegue (SPA/Vite)
- [ ] **Sin SSR**: Confirma que `package.json` NO incluya frameworks de servidor (Next.js/Remix) a menos que esté configurado explícitamente.
- [ ] **Build de Producción**: 
  - Comando de Build: `npm run build`
  - Comando de Inicio: `serve -s dist -l tcp://0.0.0.0:${PORT:-80}`
  - Asegúrate de que `vite preview` NO se use en puertos expuestos en producción.

## 4. Protección del Código Fuente
- [ ] **Sourcemaps**: Asegúrate de que `sourcemap: false` esté configurado en `vite.config.ts` para builds de producción para evitar exponer el código fuente original.

## 5. React Server Components (RSC)
- [ ] **Confirmación SPA**: Dado que este proyecto es una SPA (Single Page Application) del lado del cliente, las vulnerabilidades de RSC (como filtración de código fuente vía componentes de servidor) generalmente **NO APLICAN** a menos que migremos a un framework como Next.js.