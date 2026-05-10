# Pagos — Documentación técnica

> **Fecha de consolidación:** 2026-05-10
> **Fuentes consolidadas:**
> - `Avances_Registradoss/PAYMENT_FLOW_DEBUG_como_funciona.md`
> - Sección de pagos de `auditoria_seguridad.md`

---

## 1. Arquitectura del flujo de pagos

### Stack
- **Pasarela:** ePayco (Colombia).
- **Webhook:** Edge Function de Supabase (Deno).
- **Frontend:** React (`ModalPagoInteligente.tsx`).
- **BD:** tabla `pagos_epayco` (PK = `ref_payco`).

### Flujo esperado
```
Usuario realiza pago
    ↓
Modal envía datos a ePayco
    ↓
ePayco procesa y aprueba
    ↓
ePayco llama webhook (confirmation URL)
    ↓
Webhook actualiza estado en pagos_epayco
    ↓
ePayco redirige a /pago-exitoso
    ↓
Usuario ve "¡Transacción exitosa!"
```

---

## 2. Tabla `pagos_epayco`

```sql
ref_payco        TEXT PRIMARY KEY        -- TUT-AC3BA5439-1775864726059-A9YL
usuario_id       UUID FK perfiles
estado           TEXT                    -- 'pendiente' | 'aceptada' | 'rechazada' | 'fallida'
cod_respuesta    TEXT
respuesta        TEXT
fecha_transaccion TIMESTAMPTZ
valor            INTEGER
iva              INTEGER
nombre_producto  TEXT
```

### RLS (importante, ver [`SEGURIDAD.md`](./SEGURIDAD.md))
- INSERT por usuario autenticado (su propio pago, estado inicial `pendiente`).
- UPDATE **solo admin/service_role** (vía webhook). El usuario no puede cambiar estado.

---

## 3. Variables de entorno

```bash
VITE_EPAYCO_PUBLIC_KEY=a04d60e2e678d5bd89a58d26f3413fdb
VITE_EPAYCO_CUSTOMER_ID=37257
VITE_EPAYCO_TEST_MODE=true
EPAYCO_PRIVATE_KEY=83ec651809bb7d11fcd114b16777bfa1   # solo servidor
```

> **Pendiente P7 del audit:** mover hardcoded keys a env (`src/componentes/Pagos/Hooks/useModalPago.ts:199` y `src/servicios/pagos/crearPago.ts:168-170`). Son llaves PÚBLICAS por diseño (Checkout) pero hardcoded dificulta rotación.

### URLs
```
Webhook:       https://tbijzvtyyewhtwgakgka.supabase.co/functions/v1/epayco-webhook
Confirmation:  https://tbijzvtyyewhtwgakgka.supabase.co/functions/v1/epayco-webhook
Response:      https://academiavallenataonline.com/pago-exitoso?invoice={refPayco}
```

---

## 4. Edge Function `epayco-webhook`

### Características
- `verify_jwt: false` (ePayco no envía JWT).
- Valida firma SHA256 con `EPAYCO_PRIVATE_KEY` (intencional: el endpoint es público pero solo procesa requests con firma válida).
- Actualiza `pagos_epayco.estado` según `x_cod_response`.
- Logs detallados en Dashboard → Edge Functions → Logs.

### Pendiente P5 del audit
Hacer el webhook **idempotente**:
1. Verificar antes de UPDATE si ya está en estado final.
2. Activar inscripción/suscripción **dentro del webhook** (no en frontend).
3. Si reenvían el webhook, no duplicar monedas/membresías.

Hoy `epayco-webhook` solo actualiza estado del pago. Cuando se conecte la activación de membresía/inscripción, debe ser idempotente.

---

## 5. RPCs verificadores de pago

Tras el audit, las RPCs de inscripción/suscripción **verifican pago aprobado**:

- `inscripcion_directa(p_curso_id)` → si curso es pago, requiere `pagos_epayco.estado='aceptada'`. Si gratis, permite.
- `inscribir_a_curso(p_usuario_id, p_curso_id)` → admin/service_role para otros; uno mismo delega en `inscripcion_directa`.
- `inscribir_usuario_paquete` → solo admin/service_role.
- `crear_suscripcion` → solo admin/service_role.

**Antes del audit:** cualquier usuario podía crear inscripciones/suscripciones premium sin pagar (vulnerabilidad crítica resuelta).

---

## 6. Bug histórico — `ref_payco` incorrecto en redirect

### Problema
ePayco redirigía a `/pago-exitoso?ref_payco=69d98...` con SU ID interno, no nuestro `invoice`. PagoExitoso buscaba el pago con ese ID y no encontraba nada → mostraba "Pago en verificación" eternamente.

### Solución
ModalPagoInteligente.tsx (línea ~473):
```ts
response: `${EPAYCO_RESPONSE_URL}?invoice=${refPayco}`,
url_response: `${EPAYCO_RESPONSE_URL}?invoice=${refPayco}`,
```

PagoExitoso.tsx (línea ~86):
```ts
const refPayco = searchParams.get('invoice')         // 1º nuestro
              || searchParams.get('x_id_invoice')    // 2º fallback
              || searchParams.get('ref_payco')       // 3º fallback ePayco
              || searchParams.get('x_ref_payco')     // 4º fallback
              || '';
```

---

## 7. Pre-llenado de datos del usuario

`ModalPagoInteligente.tsx` (línea ~103). `verificarUsuario()` async consulta tabla `perfiles`:
```ts
const { data: perfil } = await supabase
  .from('perfiles')
  .select('nombre, apellido, correo_electronico, whatsapp, documento_tipo, documento_numero, direccion_completa, ciudad, pais, codigo_postal')
  .eq('id', usuario.id)
  .single();
```

Campos pre-llenados: nombre, apellido, email, whatsapp, tipo y número documento, dirección completa, ciudad, país, código postal. Fallback a datos del contexto si hay error.

---

## 8. Diseño visual `PagoExitoso.css`

Limpio, sin partículas ni gradientes excesivos. Tarjeta blanca centrada (max-width 560px). Fondo `#f8f8f6`.

Colores por estado:
| Estado | Círculo | Ícono / Texto |
|---|---|---|
| ✓ Aceptada | `#EAF3DE` | `#3B6D11` (verde) |
| 🕐 Pendiente | `#FAEEDA` | `#854F0B` (naranja) |
| ✗ Rechazada | `#FCEBEB` | `#A32D2D` (rojo) |

Tipografía: Títulos 20-22px peso 700, subtítulos 14-16px peso 500, detalles 14px peso 600.

Botones: "Ir a mis cursos" verde `#3B6D11`, "Volver al inicio" gris `#808080`.

---

## 9. Páginas de pago

| Ruta | Función |
|---|---|
| `/pago-exitoso?invoice=<refPayco>` | Confirmación. Lee BD, muestra estado real. |
| `/pago-error` | Manejo de errores. |
| `/pago-confirmacion` | Confirmación adicional según ePayco. |

---

## 10. Componentes adicionales

- `BannerCompletarPerfil.tsx` — incita al usuario a completar datos antes de comprar.
- `ModalCompletarEmail.tsx` — captura email faltante (login OAuth no siempre lo da).
- `EmailCompletarWrapper.tsx` — wrapper que envuelve la app y dispara el modal cuando hace falta.

---

## 11. Plan de migración a estrategia híbrida

### Estado actual
- **Web (Cloudflare + ePayco):** funciona, sin comisión Apple/Google.
- **App nativa Android/iOS:** no existe aún.

### Plan futuro
- **Web:** seguir con ePayco (sin comisión, control total).
- **Android:** integrar **RevenueCat** + Google Play Billing (cuando salga app nativa).
- **iOS:** RevenueCat + Apple In-App Purchase (cuando salga, con su 15-30% de comisión inevitable).
- **Sincronización:** RevenueCat sincroniza membresías cross-platform → `suscripciones_usuario` en Supabase.

### Decisión técnica
- App nativa no es prioridad inmediata (PWA cubre 80% de casos).
- Cuando se priorice, usar **Capacitor** (no Expo, para reusar todo el código React+Vite actual).

---

## 12. Pendientes específicos

### P5 — Webhook idempotente
Activar membresía/inscripción dentro del webhook, no en frontend. Verificar estado final antes de UPDATE.

### P7 — Mover keys a env
- `src/componentes/Pagos/Hooks/useModalPago.ts:199`
- `src/servicios/pagos/crearPago.ts:168-170`

### Re-habilitar validación de firma del webhook
Durante debugging se comentó la validación de firma SHA256. **Importante re-habilitarla** una vez confirmado que ePayco envía las confirmaciones correctamente.

```ts
// supabase/functions/epayco-webhook/index.ts línea 138-140
// ⚠️ TEMPORALMENTE COMENTADA PARA DEBUGGING
// if (expectedSignature.toLowerCase() !== xSignature) {
//   return jsonResponse({ success: false, error: "Firma invalida" }, 401);
// }
```

### Test pago de prueba en producción
1. Confirmar deploy en EasyPanel.
2. Realizar pago de prueba con tarjeta sandbox de ePayco.
3. Abrir DevTools → Console: ver logs de PagoExitoso.
4. Supabase Dashboard → Edge Functions → epayco-webhook → Logs: ver `🎯 WEBHOOK RECIBIDO`.
5. Verificar que `pagos_epayco.estado = 'aceptada'`.

### Escenarios a verificar
- ✅ Webhook recibe y actualiza → re-habilitar firma.
- ❌ Webhook NO recibe logs → verificar URL en panel ePayco.
- ⚠️ Webhook recibe pero falla UPDATE → debuggear ref_payco/RLS.

### URL de confirmación en panel ePayco
Debe ser **exactamente:**
```
https://tbijzvtyyewhtwgakgka.supabase.co/functions/v1/epayco-webhook
```
