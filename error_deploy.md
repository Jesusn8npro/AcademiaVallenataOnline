Commit: fix(simulador): botones dentro de pantalla + traba en halar rápido

- pito-boton: reemplaza min-width/height:60px por width/height:10vh*escala
  10vh en landscape iPhone (≈39px) × 12 botones + 11 gaps(3.1vh) = 576px
  que cabe en el 90% del ancho disponible sin overflow horizontal.
- simulador-canvas: actualiza fórmula de altura 33vh→30vh (3×10vh),
  fallback dist-v 2.9→2.2vh y toolbar 42px→52px (incluye margin-top:6+mb:4).
- usePointerAcordeon: importa motorAudioPro y llama activarContexto() en
  cada nota para evitar que el AudioContext se suspenda en ejecuciones
  rápidas sin fuelle. Añade desactivarAudioRef para corregir closure
  obsoleto que impedía desactivar audio al abrir modales.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com> 
##########################################
### Download Github Archive Started...
### Tue, 21 Apr 2026 03:21:03 GMT
##########################################


╔═════════════════════ Nixpacks v1.34.1 ═════════════════════╗
║ setup      │ nodejs, python3, pkg-config                   ║
║────────────────────────────────────────────────────────────║
║ caddy      │ pkgs: caddy                                   ║
║            │ cmds: caddy fmt --overwrite /assets/Caddyfile ║
║────────────────────────────────────────────────────────────║
║ install    │ npm install                                   ║
║────────────────────────────────────────────────────────────║
║ build      │ npm run build                                 ║
║────────────────────────────────────────────────────────────║
║ start      │ npm run preview                               ║
╚════════════════════════════════════════════════════════════╝


Saved output to:
  /etc/easypanel/projects/academiavallenataonline_app/academiavallenataonline_app_2026/code/
#0 building with "default" instance using docker driver

#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 2.08kB done
#1 DONE 0.0s

#2 [internal] load metadata for ghcr.io/railwayapp/nixpacks:ubuntu-1741046653
#2 DONE 0.2s

#3 [internal] load .dockerignore
#3 transferring context: 110B done
#3 DONE 0.0s

#4 [stage-0  1/15] FROM ghcr.io/railwayapp/nixpacks:ubuntu-1741046653@sha256:ed406b77fb751927991b8655e76c33a4521c4957c2afeab293be7c63c2a373d2
#4 DONE 0.0s

#5 [internal] load build context
#5 transferring context: 100.35MB 0.7s done
#5 DONE 0.7s

#6 [stage-0  6/15] RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d
#6 CACHED

#7 [stage-0  8/15] COPY . /app/.
#7 CACHED

#8 [stage-0  2/15] WORKDIR /app/
#8 CACHED

#9 [stage-0  3/15] COPY .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix
#9 CACHED

#10 [stage-0  7/15] COPY .nixpacks/assets /assets/
#10 CACHED

#11 [stage-0 10/15] COPY . /app/.
#11 CACHED

#12 [stage-0  5/15] COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix
#12 CACHED

#13 [stage-0  9/15] RUN  caddy fmt --overwrite /assets/Caddyfile
#13 CACHED

#14 [stage-0 11/15] RUN --mount=type=cache,id=V13bXEaLGp4-/root/npm,target=/root/.npm npm install
#14 CACHED

#15 [stage-0  4/15] RUN nix-env -if .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix && nix-collect-garbage -d
#15 CACHED

#16 [stage-0 12/15] COPY . /app/.
#16 CACHED

#17 [stage-0 13/15] RUN --mount=type=cache,id=V13bXEaLGp4-node_modules/cache,target=/app/node_modules/.cache npm run build
#17 0.927 
#17 0.927 > mi-app@0.0.0 build
#17 0.927 > node scripts/sync-samples.cjs && node --max-old-space-size=4096 ./node_modules/vite/bin/vite.js build
#17 0.927 
#17 0.979 ✅ Sincronización completa. 34 pitos y 20 bajos detectados.
#17 0.979 📂 Lista guardada en: /app/public/muestrasLocales.json
#17 1.454 vite v6.4.1 building for production...
#17 1.820 transforming...