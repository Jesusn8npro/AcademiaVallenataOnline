# Documentación — Academia Vallenata Online

> **Fecha de consolidación:** 2026-05-10
> **Estructura:** 7 documentos maestros que reemplazan 40+ archivos `.md` dispersos.

Este es el índice de la documentación oficial del proyecto. Cualquier `.md` fuera de
esta carpeta (excepto `CLAUDE.md` raíz y `.github/instructions/`) es ruido y se borra.

---

## Índice

| Archivo | Contenido |
|---|---|
| [`ARQUITECTURA.md`](./ARQUITECTURA.md) | Stack técnico, estructura de carpetas, rutas, BD, ecosistema V-PRO (hardware ESP32). |
| [`SIMULADOR.md`](./SIMULADOR.md) | SimuladorApp y SimuladorDeAcordeon: lógica, audio, grabación, replay, modos de juego. |
| [`ACORDEON_PROMAX.md`](./ACORDEON_PROMAX.md) | Suite Pro Max: AcordeonHero, GrabadorV2, PracticaLibre, EstudioAdmin, modelos 3D. |
| [`PAGOS.md`](./PAGOS.md) | Flujo ePayco end-to-end, Edge Functions, IVA, plan migración a estrategia híbrida. |
| [`SEGURIDAD.md`](./SEGURIDAD.md) | Auditoría completa, RLS, Edge Functions, signed URLs Bunny, CSP, SMTP, login. |
| [`CHANGELOG.md`](./CHANGELOG.md) | Hitos por mes, errores de deploy, decisiones técnicas, gamificación, comunidad. |

---

## Datos rápidos del proyecto

| Item | Valor |
|---|---|
| **Stack frontend** | React 19 + Vite 6 + TypeScript |
| **Estilos** | CSS puro + Tailwind CSS |
| **Backend** | Supabase (PostgreSQL 15 + Auth + Storage + Edge Functions) |
| **Audio** | Web Audio API (motor propio `AudioEnginePro.ts`) |
| **3D** | Three.js + React Three Fiber + Drei |
| **Pagos** | ePayco (Colombia) — plan migrar a RevenueCat (Android) + ePayco (web) |
| **Video hosting** | Bunny Stream (signed URLs vía Edge Function) |
| **Deploy** | EasyPanel (Nixpacks → Docker), Cloudflare al frente |
| **Idioma del código y docs** | Español (variables, comentarios, .md) |
| **Idioma de la app** | Español (i18n con `react-i18next`, soporte multi-idioma preparado) |
| **Proyecto Supabase ID** | `tbijzvtyyewhtwgakgka` |
| **Producción aprox.** | ~443 usuarios, 879 inscripciones, 64 pagos, 70 tutoriales |
| **Branch principal** | `main` (a veces `feature/migracion-nativa`) |

---

## Convenciones para escribir docs

- **Idioma:** español. Solo emoji si el contenido lo requiere semánticamente (no decorativo).
- **Estructura:** títulos `##` y `###`, tablas cuando aplique.
- **Código:** bloques con lenguaje (`tsx`, `ts`, `sql`, `bash`).
- **Foco:** info accionable o de referencia. Nada de relato cronológico, "Sesión X", "felicidades".
- **Caducidad:** si una decisión cambia, edita el doc maestro. No agregues "actualización abajo".

Si vas a documentar algo nuevo y dudas dónde, primero busca si encaja en uno de los
6 docs maestros. Solo crear archivos nuevos para temas radicalmente diferentes
(ej: futuro `MOBILE_APP.md` para Capacitor/Expo).
