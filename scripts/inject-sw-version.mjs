// Inyecta el BUILD_ID de Next.js en el service worker para invalidar caché en cada deploy.
// Se ejecuta automáticamente tras `next build` (ver package.json → scripts.build).
// Usa regex para que funcione en builds sucesivos (no depende de un placeholder fijo).
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const cwd = process.cwd();
const buildIdPath = join(cwd, '.next', 'BUILD_ID');

if (!existsSync(buildIdPath)) {
  console.warn('[inject-sw] .next/BUILD_ID no encontrado — saltando inyección');
  process.exit(0);
}

const buildId = readFileSync(buildIdPath, 'utf8').trim();
const swPath = join(cwd, 'public', 'sw.js');

if (!existsSync(swPath)) {
  console.warn('[inject-sw] public/sw.js no encontrado');
  process.exit(0);
}

const contenido = readFileSync(swPath, 'utf8');
const actualizado = contenido.replace(/const CACHE = 'ava-[^']*'/, `const CACHE = 'ava-${buildId}'`);

if (actualizado === contenido) {
  console.warn('[inject-sw] No se encontró línea CACHE en sw.js — revisa el formato');
} else {
  writeFileSync(swPath, actualizado);
  console.log(`[inject-sw] cache actualizado → ava-${buildId}`);
}
