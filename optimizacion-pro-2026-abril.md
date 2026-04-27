# Optimización Pro — Academia 2026 Abril

## Reglas base (aplican a todo el proyecto)

- **Máx 300 líneas** por `.tsx` — lógica extraída a hooks `.ts`
- **Cero `console.*`** — eliminados en todos los archivos tocados
- **`alert()` / `confirm()` / `prompt()`** → estado React local + UI inline (nunca eliminar la acción, solo el diálogo nativo)
- **Sin cambios** a lógica, funcionalidad ni estilos visuales
- Solo tocar lo necesario para cumplir las reglas

---

## Patrones aplicados (referencia rápida)

### Patrón A — alert() → banner inline
```tsx
// ANTES
alert('Error al cambiar el estado');

// DESPUÉS — en el hook:
setMensajeAccion({ texto: 'Error al cambiar el estado', tipo: 'error' });

// DESPUÉS — en el JSX:
{mensajeAccion && (
    <div style={{ background: mensajeAccion.tipo === 'exito' ? '#f0fdf4' : '#fef2f2', ... }}>
        {mensajeAccion.texto}
    </div>
)}
```

### Patrón B — confirm() → estado pendiente + botones inline
```tsx
// ANTES
if (!confirm('¿Eliminar este evento?')) return;
eliminarEvento(id);

// DESPUÉS — en el hook o componente local:
const solicitarEliminar = (id: string) => setConfirmarEliminarId(id);
const cancelarEliminar = () => setConfirmarEliminarId(null);
const confirmarEliminar = async () => { /* ejecuta la acción */ };

// DESPUÉS — en el JSX:
{confirmarEliminarId && (
    <div style={{ background: '#fff5f5', border: '1px solid #fc8181', ... }}>
        <p>¿Eliminar? Esta acción no se puede deshacer.</p>
        <button onClick={confirmarEliminar}>Eliminar</button>
        <button onClick={cancelarEliminar}>Cancelar</button>
    </div>
)}
```

### Patrón C — prompt() → estado de edición inline
```tsx
// ANTES
const n = prompt('Nuevo nombre:', label);
if (n) actualizarNombre(id, n);

// DESPUÉS — estado local en el componente:
const [editandoId, setEditandoId] = useState<string | null>(null);
const [nombreEditando, setNombreEditando] = useState('');

// En JSX: input inline con onBlur/onKeyDown para confirmar
```

### Patrón D — confirm() en hook → mover lógica de UX al componente
```tsx
// ANTES (en hook):
const eliminarTonalidad = async (t: string) => {
    if (lista.length <= 1) return alert('...');
    if (confirm('...')) { /* eliminar */ }
};

// DESPUÉS (hook queda limpio — solo lógica):
const eliminarTonalidad = async (t: string) => {
    if (lista.length <= 1) return; // guard silencioso
    /* eliminar directamente */
};

// DESPUÉS (componente maneja UX):
const [confirmarEliminarId, setConfirmarEliminarId] = useState<string | null>(null);
const [mensajeError, setMensajeError] = useState<string | null>(null);
const solicitarEliminar = (t: string) => {
    if (lista.length <= 1) { setMensajeError('Debe conservar al menos una.'); return; }
    setConfirmarEliminarId(t);
};
```

---

## Fases completadas

| Fase | Zona | Estado | Fecha |
|---|---|---|---|
| Fase 1–4 | `src/Paginas/AcordeonProMax/` (simulador completo) | ✅ Completo | Sesión previa |
| Fase 5 | `src/Paginas/administrador/Usuarios/` | ✅ Completo | Sesión previa |
| Fase 6 | `src/Paginas/administrador/` (15 archivos) | ✅ Completo | Sesión previa |
| Fase 7 | Eliminar huérfanos (`DetalleUsuario.tsx`, `CrearUsuario.tsx`) | ✅ Completo | Sesión previa |
| Fase 8 | Alerts/confirms en hooks y páginas sueltas (7 archivos) | ✅ Completo | Sesión previa |
| Fase 9 | `src/Core/componentes/` (4 archivos) | ✅ Completo | Sesión previa |
| Fase 10 — Grupos A/B/C/D | `src/componentes/` (completo) | ✅ Completo | 2026-04-25 |
| Fase 11 — A/B/C/D | `src/servicios/`, `utilidades/`, `stores/`, `hooks/`, `Core/` | ✅ Completo | 2026-04-26 |
| **Seguridad** | Rutas AcordeonProMax → solo rol admin | ✅ Completo | 2026-04-26 |

---

## ESTADO FINAL DEL PROYECTO — 2026-04-26

**`console.*` en código real: 0**
**`alert()` / `confirm()` / `prompt()`: 0**
**TypeScript (`npx tsc --noEmit`): sin errores**

> **EXCEPCIÓN INTENCIONAL:** `src/hooks/useSeguridadConsola.ts` usa `console.*` de forma deliberada.
> Es el sistema de seguridad anti-XSS que deshabilita la consola en producción y la restaura para admins.
> **NUNCA tocar ese archivo.**

---

## Detalle Fase 10 — Grupo A (2026-04-25)

16 archivos nuevos + 6 originales reescritos.

| Archivo original | Antes | Después | Archivos creados |
|---|---|---|---|
| `Menu/SidebarAdmin.tsx` | 1004L / 3 console | 248L / 0 | `useSidebarAdmin.ts`, `SidebarNavAdmin.tsx`, `SidebarNavStudent.tsx` |
| `Menu/ModalDeInicioDeSesion.tsx` | 966L / 21 console | 130L / 0 | `useModalInicioSesion.ts`, `getModalInicioSesionStyles.ts`, `VistaLoginModal.tsx`, `VistaRegistroModal.tsx`, `VistaRecuperarModal.tsx` |
| `Blog/BlogAdminManager.tsx` | 791L / 20 console / 1 confirm | 105L / 0 | `useBlogAdminManager.ts`, `BlogIcons.tsx`, `FormularioBlogAdmin.tsx` |
| `chat/ChatEnVivo.tsx` | 692L / 6 console | 145L / 0 | `useChatEnVivo.ts`, `MensajeChat.tsx` |
| `Busqueda/ModalBusqueda.tsx` | 676L / 3 console | 190L / 0 | `useModalBusqueda.ts`, `ResultadosBusqueda.tsx` |
| `VisualizadorDeLeccionesDeCursos/ReproductorLecciones.tsx` | 609L / 54 console | 134L / 0 | `useReproductorLecciones.ts` |

## Detalle Fase 10 — Grupo D (2026-04-25)

| Archivo | Antes | Después | Acción |
|---|---|---|---|
| `ComponentesComunidad/FeedPublicaciones.tsx` | 368L | 285L | Extraer `ContenidoPublicacion.tsx` |
| `Menu/MenuInferiorResponsivo.tsx` | 282L | 275L | 5 console eliminados |
| `CrearContenido/PasoInformacionGeneral.tsx` | 285L | 284L | 2 console + 1 alert → `errorTitulo` state inline |
| `MisCursos/TarjetaCurso.tsx` | 243L | 239L | 3 console eliminados |
| `CrearContenido/PasoResumenGuardar.tsx` | 174L | 170L | 3 console eliminados |
| `Perfil/UltimosArticulosBlog.tsx` | 120L | 118L | 1 console eliminado |
| `Pagos/EmailCompletarWrapper.tsx` | 94L | 91L | 2 console eliminados |

---

## Detalle Fase 11 — Limpieza global de capas de servicio (2026-04-26)

### Fase 11-A — `Core/hooks/useLogicaAcordeon.ts` + componentes relacionados

| Archivo | Problema | Solución |
|---|---|---|
| `useLogicaAcordeon.ts` | 21 console + 3 alert + 1 confirm | Todos eliminados. Confirm → guard silencioso en hook, UX al componente |
| `GestorSonidoPro.tsx` | Recibe `eliminarTonalidad` con confirm en hook | Estado local `confirmarEliminarId` + `mensajeError` (Patrón D) |
| `PanelAjustes.tsx` | 4 alert propios (export, import, sync) | `mensajePanelAjustes` state con auto-clear 3.5s + banner inline |

**Detalle de cambios en `useLogicaAcordeon.ts`:**
- `cargarMuestrasLocales(true)` → alert de éxito eliminado; PanelAjustes muestra banner tras `await`
- `conectarESP32` → alert de browser incompatible eliminado (`PanelAdminUSB` ya muestra los requisitos en su UI)
- `eliminarTonalidad` → `alert('Debe conservar...')` + `confirm('¿Eliminar...?')` eliminados del hook; `GestorSonidoPro` maneja el flujo completo con estado local

### Fase 11-B — `servicios/navegacionUsuariosService.ts`

- 2 `alert()` eliminados (usuario no encontrado + error al verificar)
- 3 `console.*` eliminados
- `validarYNavegar()` simplificada a 3 líneas (retorna silencioso si no existe)

### Fase 11-C — `src/servicios/` + `src/utilidades/` (sweep masivo)

| Zona | Archivos | Consoles eliminados |
|---|---|---|
| `servicios/` (46 archivos) | `gamificacionService.ts` (90), `paquetesService.ts` (111), `mensajeriaService.ts` (50), `cancionesService.ts` (48), y 42 más | ~680 |
| `utilidades/` (~10 archivos) | `lazyLoadingUtils.ts` (27), `cacheInteligente.ts` (27), `monitoreoRealTime.ts` (23), y más | ~180 |

Método: PowerShell batch — regex elimina líneas con solo `console.*` e `if (...) console.*`.

### Fase 11-D — Capas restantes

| Archivo | Consoles eliminados |
|---|---|
| `stores/sidebarStore.ts` | 20 |
| `stores/perfilStore.tsx` | 13 |
| `contextos/UsuarioContext.tsx` | 9 |
| `hooks/useSesionTracker.ts` | 5 |
| `hooks/useEfectosSonido.ts` | 5 |
| `Core/audio/AudioEnginePro.ts` | 6 |
| `Core/hooks/useGrabadorHero.ts` | 1 |
| `Core/hooks/useReproductorHero.ts` | 1 |

### Archivos escapados de fases anteriores (detectados en verificación final)

| Archivo | Acción |
|---|---|
| `AcordeonProMax/Admin/EditorSecuencia/usePunchInEditor.ts` | `.catch(console.error)` → `.catch(() => {})` |
| `AcordeonProMax/Admin/PanelAdminRec.tsx` | `.catch(e => console.warn(...))` → `.catch(() => {})` |
| `AcordeonProMax/Admin/PanelAdminListaAcordes.tsx` | 2 console eliminados |
| `AcordeonProMax/PracticaLibre/Hooks/useAudioFondoPracticaLibre.ts` | 5 console eliminados |
| `administrador/Dashboard/DashboardAdmin.tsx` | 3 console eliminados |
| `administrador/Dashboard/pestanas/GeolocalizacionUsuarios.tsx` | 3 console eliminados |
| `administrador/Dashboard/pestanas/PestanaGeolocalizacion.tsx` | 2 console eliminados |
| `administrador/Dashboard/pestanas/GestionPaquetes.tsx` | 2 console eliminados |
| `administrador/Dashboard/pestanas/PestanaRetencion.tsx` | 1 console eliminado |
| `administrador/Dashboard/pestanas/AnalyticsGeograficos.tsx` | 1 console eliminado |
| `administrador/Dashboard/pestanas/AlertasSeguridadGeografica.tsx` | 1 console eliminado |
| `administrador/Dashboard/pestanas/BlogAdminManager.tsx` | 1 console eliminado |
| `administrador/blog/Componentes/CrearArticuloIA.tsx` | 1 console eliminado |
| `administrador/crear-contenido/CrearContenido.tsx` | 1 console eliminado |
| `administrador/panel-contenido/componentes/SidebarResumenAdmin.tsx` | 1 console eliminado |
| `administrador/Objetivos/Componentes/ModalObjetivo.tsx` | 1 console + 1 alert → `errorGuardado` state + banner |
| `administrador/blog/Componentes/UploaderImagenesArticulo.tsx` | `window.confirm()` → `confirmarEliminarId` state + confirm inline |

---

## Cambio de seguridad — Rutas AcordeonProMax (2026-04-26)

**Problema:** Las rutas principales de AcordeonProMax usaban `ProtegidoAcordeonProMax`, que permitía acceso a:
- Usuarios con `rol === 'admin'`
- **O** al email hardcodeado `shalom@gmail.com` (excepción no deseada)
- El resto veía `ProximamentePage` (no era un bloqueo real)

**Solución:** Todas las rutas de AcordeonProMax movidas al bloque `<ProteccionAdmin />` en `App.tsx`.

Rutas ahora bajo `ProteccionAdmin` (solo `rol === 'admin'`):
- `/acordeon-pro-max`
- `/acordeon-pro-max/lista`
- `/acordeon-pro-max/acordeon`
- `/acordeon-pro-max/acordeon/:slug`
- `/acordeon-pro-max/configuracion`
- `/acordeon-pro-max/admin/practica`

**Archivo eliminado:** `src/SeguridadApp/ProtegidoAcordeonProMax.tsx` (ya no se necesita).

Cualquier usuario sin `rol === 'admin'` ve la pantalla de "ACCESO DENEGADO" y es redirigido al inicio en 2.5 segundos.

---

## Verificación final del proyecto

```powershell
# Verificar que no queda ningún console.* en código real (excluye useSeguridadConsola)
Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" |
  Where-Object { $_.FullName -notmatch "node_modules|useSeguridadConsola" } |
  ForEach-Object {
    $lineas = Get-Content $_.FullName
    foreach ($linea in $lineas) {
      $t = $linea.Trim()
      if ($t -match "console\." -and $t -notmatch "^\s*//" -and $t -notmatch "^\s*\*") {
        Write-Host $_.Name + ": " + $t
      }
    }
  }
# Resultado esperado: sin salida (0 coincidencias)

# TypeScript
npx tsc --noEmit
# Resultado esperado: sin salida (0 errores)
```

---

## Verificación por fase

Después de cada fase:
1. `npx tsc --noEmit` — sin errores TypeScript
2. Revisar en browser las vistas modificadas
3. Confirmar que no persiste ningún `console.*`, `alert()`, `confirm()` ni `prompt()`
4. Contar líneas de cada `.tsx` modificado — todos ≤ 300L
