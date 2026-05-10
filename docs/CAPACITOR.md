# Capacitor 6 — Build Android

Este proyecto usa **Capacitor 6** para empaquetar la web (React + Vite) como APK Android.
La carpeta `android/` aún NO está generada — la creas tú una vez tengas el entorno listo.

---

## 1. Requisitos del entorno (una vez)

### JDK 17 (o superior)
Capacitor 6 requiere JDK 17+.
- Descarga **Eclipse Temurin 17 LTS** desde https://adoptium.net/temurin/releases/
- Instalador `.msi` para Windows. Marca la opción "Set JAVA_HOME" durante la instalación.
- Verifica:
  ```powershell
  java -version
  echo $env:JAVA_HOME
  ```

### Android Studio + SDK
- Descarga Android Studio: https://developer.android.com/studio
- Durante el primer arranque, deja que descargue el **Android SDK** (API 34 o 35).
- Abre `Settings → Languages & Frameworks → Android SDK` y confirma:
  - SDK Platforms: Android 14 (API 34) o Android 15 (API 35)
  - SDK Tools: Android SDK Build-Tools, Platform-Tools, Emulator (opcional)

### Variable `ANDROID_HOME`
La SDK suele instalarse en `C:\Users\<TU_USUARIO>\AppData\Local\Android\Sdk`.
Configura las variables de entorno (PowerShell, sesión actual + permanente):
```powershell
# Permanente (ejecutar una vez):
[Environment]::SetEnvironmentVariable('ANDROID_HOME','C:\Users\acord\AppData\Local\Android\Sdk','User')
[Environment]::SetEnvironmentVariable('Path',$env:Path + ';C:\Users\acord\AppData\Local\Android\Sdk\platform-tools','User')
```
Cierra y reabre la terminal. Verifica:
```powershell
echo $env:ANDROID_HOME
adb --version
```

---

## 2. Inicializar Android (una sola vez)

Con JDK 17 y `ANDROID_HOME` configurados:
```bash
npm run build:capacitor
npx cap add android
npx cap sync android
```
Esto crea la carpeta `android/`. Algunos archivos van al repo (manifest, gradle, recursos) y otros están en `.gitignore` (build, .gradle, local.properties).

---

## 3. Flujo de desarrollo diario

### Build web + sync hacia Android
```bash
npm run build:capacitor   # build con base: './'
npx cap sync android      # copia dist/ a android/app/src/main/assets/public
```

### Abrir en Android Studio
```bash
npx cap open android
```
Desde Android Studio puedes:
- **Run on device**: conecta el celular por USB con depuración USB activa.
- **Build APK**: `Build → Build Bundle(s) / APK(s) → Build APK(s)`
- El APK debug aparece en `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 4. Probar en device físico (USB)

1. En el celular: `Ajustes → Acerca del teléfono → toca "Número de compilación" 7 veces` para activar Opciones de desarrollador.
2. En Opciones de desarrollador: activa **Depuración USB**.
3. Conecta el USB y autoriza la huella en el celular.
4. Verifica:
   ```bash
   adb devices
   ```
   Debe listar tu dispositivo.
5. Desde Android Studio, presiona **Run** y elige tu device.

---

## 5. APK Release firmado

Para subir a Play Store o distribuir:
1. Genera un **keystore** (una sola vez):
   ```bash
   keytool -genkey -v -keystore academia-release.keystore -alias academia -keyalg RSA -keysize 2048 -validity 10000
   ```
   Guarda la contraseña en lugar seguro. **NO subir** al repo.
2. En Android Studio: `Build → Generate Signed Bundle / APK → APK → Release`.
3. Selecciona el keystore. Output: `android/app/build/outputs/apk/release/app-release.apk`.

---

## 6. Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm run build:capacitor` | Build web con `base: './'` |
| `npx cap sync android` | Copia `dist/` a Android + actualiza plugins |
| `npx cap copy android` | Solo copia web assets (más rápido) |
| `npx cap open android` | Abre Android Studio en el proyecto |
| `npx cap run android` | Build + run en device conectado |
| `npx cap doctor` | Diagnostica el entorno Capacitor |

---

## 7. Plugins instalados

- `@capacitor/app` — gestión del ciclo de vida de la app
- `@capacitor/haptics` — vibraciones / haptic feedback
- `@capacitor/keyboard` — control del teclado virtual
- `@capacitor/status-bar` — color y estilo de la status bar
- `@capacitor/splash-screen` — splash al arranque

Configurados en `capacitor.config.ts` (raíz del repo).
