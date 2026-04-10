# 🎓 Academia Vallenata Online — Configuración Google OAuth + SMTP
**Fecha:** 10 de abril de 2026  
**Proyecto Supabase:** `tbijzvtyyewhtwgakgka`  
**Dominio:** `academiavallenataonline.com`

---

## ✅ PARTE 1 — Login con Google (OAuth)

### 1. Google Cloud Console
- Proyecto: **2026 Jesus** (`jesus-492904`)
- Configuramos la **pantalla de consentimiento OAuth**:
  - Nombre de la app: `Academia Vallenata Online`
  - Correo de asistencia: `acordeon91@gmail.com`
  - Tipo de usuario: **Externo**
- Creamos el **Client ID de OAuth**:
  - Tipo: Aplicación web
  - Orígenes JS autorizados:
    - `https://academiavallenataonline.com`
    - `http://localhost:5173`
  - URI de redireccionamiento:
    - `https://tbijzvtyyewhtwgakgka.supabase.co/auth/v1/callback`
- **Client ID:** `806361108375-9eo08sl94t646am7mtp7b7puvuq9rd31.apps.googleusercontent.com`
- **Client Secret:** (guardado en Supabase — no exponer)

### 2. Supabase Dashboard
- Ruta: `Authentication → Providers → Google`
- Activamos el provider con Client ID y Client Secret
- Callback URL confirmada: `https://tbijzvtyyewhtwgakgka.supabase.co/auth/v1/callback`

### 3. Código en el Modal (React)
```tsx
const handleGoogleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://academiavallenataonline.com'
    }
  })
  if (error) console.error('Error Google login:', error.message)
}
```
- Botón agregado en vista de **Login** y **Registro**
- Archivo modificado: `ModalDeInicioDeSesion.tsx`

---

## ✅ PARTE 2 — Verificación de Dominio en Google

### Google Search Console
- Verificamos `https://academiavallenataonline.com`
- Método usado: **Proveedor de nombres de dominio (DNS TXT)**
- Registro TXT agregado en Cloudflare:
  - Nombre: `academiavallenataonline.com`
  - Contenido: `google-site-verification=s...` (registro TXT visible en Cloudflare)

### Google Auth Platform — Información de la marca
- Página principal: `https://academiavallenataonline.com`
- Política de privacidad: `https://academiavallenataonline.com/privacidad`
- Términos de servicio: `https://academiavallenataonline.com/terminos`
- Dominios autorizados:
  - `academiavallenataonline.com`
  - `tbijzvtyyewhtwgakgka.supabase.co`
- Logo: subido ✅
- Contacto desarrollador: `Contacto@academiavallenataonline.com`

### Estado de publicación
- Cambiado de **Prueba → Producción**
- Marca verificada y publicada ✅
- Resultado: aparece **"Ir a Academia Vallenata Online"** en la pantalla de Google

---

## ✅ PARTE 3 — SMTP Personalizado con Resend

### Problema
Supabase enviaba correos desde `noreply@mail.app.supabase.io`.  
Cloudflare Email solo hace reenvío, no tiene servidor SMTP propio.

### Solución: Resend.com
- Cuenta creada en [resend.com](https://resend.com)
- Dominio agregado: `academiavallenataonline.com`
- Región: `São Paulo (sa-east-1)`

### Registros DNS agregados en Cloudflare
| Tipo | Nombre | Contenido | TTL |
|------|--------|-----------|-----|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSlb3D...DAQAB` | Auto |
| MX | `send` | `feedback-smtp.sa-east-1.amazonses.com` | Auto (Prioridad: 10) |
| TXT | `send` | `v=spf1 include:[...]nses.com ~all` | Auto |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | Auto |

- Dominio verificado en Resend ✅

### Configuración SMTP en Supabase
- Ruta: `Project Settings → Authentication → SMTP Settings`
- **Host:** `smtp.resend.com`
- **Port:** `465`
- **Username:** `resend`
- **Password:** API Key de Resend (guardada de forma segura)
- **Sender email:** `contacto@academiavallenataonline.com`
- **Sender name:** `Academia Vallenata Online`

### Resultado
Los correos ahora salen desde:  
**Academia Vallenata Online** `<contacto@academiavallenataonline.com>` ✅  
Firmado por: `academiavallenataonline.com` ✅

---

## ✅ PARTE 4 — Footer con Links Legales

- Footer agregado en páginas públicas (Inicio, Blog, Cursos, Paquetes, Eventos, Nuestra Academia, Contacto, Privacidad, Términos)
- **NO aparece** en páginas de la app autenticada (Mi Panel, Mis Cursos, Juego, etc.)
- Incluye:
  - Logo de la academia
  - Links: Política de Privacidad | Términos de Servicio
  - Redes: Instagram, WhatsApp, YouTube
  - Copyright: `© 2026 Academia Vallenata Online`
  - Frase: *"Aprende desde cualquier lugar, conecta con la música de tus raíces 🇨🇴"*

---

## 📋 Pendientes relacionados

- [ ] Login con Facebook (siguiente paso)
- [ ] Ruta `/restablecer-contrasena` para cambio de contraseña post-email
- [ ] Webhook ePayco (URGENTE — pagos no se activan)
- [ ] Paywall — contenido premium aún accesible gratis

---

## 🔑 Referencias rápidas

| Servicio | URL |
|----------|-----|
| Google Console | https://console.cloud.google.com/?project=jesus-492904 |
| Supabase Dashboard | https://supabase.com/dashboard/project/tbijzvtyyewhtwgakgka |
| Resend Dashboard | https://resend.com/domains |
| Cloudflare DNS | https://dash.cloudflare.com → academiavallenataonline.com → DNS |
| Search Console | https://search.google.com/search-console |