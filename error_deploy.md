Commit: fix: corrige error de sintaxis en useSesionTracker.ts y actualiza log de error 
##########################################
### Download Github Archive Started...
### Mon, 27 Apr 2026 01:51:23 GMT
##########################################


╔═════════════════════ Nixpacks v1.34.1 ═════════════════════╗
║ setup      │ nodejs, python3, pkg-config, vips             ║
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
#1 transferring dockerfile: 2.13kB done
#1 DONE 0.0s

#2 [internal] load metadata for ghcr.io/railwayapp/nixpacks:ubuntu-1741046653
#2 DONE 0.1s

#3 [internal] load .dockerignore
#3 transferring context: 107B done
#3 DONE 0.0s

#4 [stage-0  1/15] FROM ghcr.io/railwayapp/nixpacks:ubuntu-1741046653@sha256:ed406b77fb751927991b8655e76c33a4521c4957c2afeab293be7c63c2a373d2
#4 DONE 0.0s

#5 [internal] load build context
#5 transferring context: 91.98MB 0.7s done
#5 DONE 0.7s

#6 [stage-0  6/15] RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d
#6 CACHED

#7 [stage-0  2/15] WORKDIR /app/
#7 CACHED

#8 [stage-0  3/15] COPY .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix
#8 CACHED

#9 [stage-0  4/15] RUN nix-env -if .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix && nix-collect-garbage -d
#9 CACHED

#10 [stage-0  5/15] COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix
#10 CACHED

#11 [stage-0  7/15] COPY .nixpacks/assets /assets/
#11 CACHED

#12 [stage-0  8/15] COPY . /app/.
#12 DONE 0.4s

#13 [stage-0  9/15] RUN  caddy fmt --overwrite /assets/Caddyfile
#13 DONE 0.2s

#14 [stage-0 10/15] COPY . /app/.
#14 DONE 0.6s

#15 [stage-0 11/15] RUN --mount=type=cache,id=V13bXEaLGp4-/root/npm,target=/root/.npm npm install
#15 13.63 
#15 13.63 added 447 packages, and audited 448 packages in 13s
#15 13.63 
#15 13.63 85 packages are looking for funding
#15 13.63   run `npm fund` for details
#15 13.65 
#15 13.65 2 vulnerabilities (1 moderate, 1 high)
#15 13.65 
#15 13.65 To address all issues, run:
#15 13.65   npm audit fix
#15 13.65 
#15 13.65 Run `npm audit` for details.
#15 DONE 13.9s

#16 [stage-0 12/15] COPY . /app/.
#16 DONE 1.0s

#17 [stage-0 13/15] RUN --mount=type=cache,id=V13bXEaLGp4-node_modules/cache,target=/app/node_modules/.cache npm run build
#17 0.743 
#17 0.743 > mi-app@0.0.1 build
#17 0.743 > node scripts/sync-samples.cjs && npx vite build
#17 0.743 
#17 0.790 ✅ Sincronización completa. 34 pitos y 20 bajos detectados.
#17 0.790 📂 Lista guardada en: /app/public/muestrasLocales.json
#17 2.124 vite v6.4.1 building for production...
#17 2.435 transforming...
#17 4.904 ✓ 152 modules transformed.
#17 4.906 ✗ Build failed in 2.74s
#17 4.906 error during build:
#17 4.906 [vite:esbuild] Transform failed with 1 error:
#17 4.906 /app/src/servicios/paquetesService.ts:644:23: ERROR: Expected ";" but found ":"
#17 4.906 file: /app/src/servicios/paquetesService.ts:644:23
#17 4.906 
#17 4.906 Expected ";" but found ":"
#17 4.906 642|              const tieneTitulo = item.tutoriales?.titulo;
#17 4.906 643|                  item: item,
#17 4.906 644|                  tieneId: tieneId,
#17 4.906    |                         ^
#17 4.906 645|                  tieneTitulo: tieneTitulo,
#17 4.906 646|                  tutorial: item.tutoriales
#17 4.906 
#17 4.906     at failureErrorWithLog (/app/node_modules/esbuild/lib/main.js:1467:15)
#17 4.906     at /app/node_modules/esbuild/lib/main.js:736:50
#17 4.906     at responseCallbacks.<computed> (/app/node_modules/esbuild/lib/main.js:603:9)
#17 4.906     at handleIncomingPacket (/app/node_modules/esbuild/lib/main.js:658:12)
#17 4.906     at Socket.readFromStdout (/app/node_modules/esbuild/lib/main.js:581:7)
#17 4.906     at Socket.emit (node:events:518:28)
#17 4.906     at addChunk (node:internal/streams/readable:561:12)
#17 4.906     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
#17 4.906     at Readable.push (node:internal/streams/readable:392:5)
#17 4.906     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)
#17 5.033 npm notice
#17 5.033 npm notice New major version of npm available! 10.9.0 -> 11.13.0
#17 5.033 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.13.0
#17 5.033 npm notice To update run: npm install -g npm@11.13.0
#17 5.033 npm notice
#17 ERROR: process "/bin/bash -ol pipefail -c npm run build" did not complete successfully: exit code: 1
------
 > [stage-0 13/15] RUN --mount=type=cache,id=V13bXEaLGp4-node_modules/cache,target=/app/node_modules/.cache npm run build:
4.906     at Socket.emit (node:events:518:28)
4.906     at addChunk (node:internal/streams/readable:561:12)
4.906     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
4.906     at Readable.push (node:internal/streams/readable:392:5)
4.906     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)
5.033 npm notice
5.033 npm notice New major version of npm available! 10.9.0 -> 11.13.0
5.033 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.13.0
5.033 npm notice To update run: npm install -g npm@11.13.0
5.033 npm notice
------

 7 warnings found (use docker --debug to expand):
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_EPAYCO_PRIVATE_KEY") (line 14)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_GIPHY_API_KEY") (line 14)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_SUPABASE_ANON_KEY") (line 14)
 - UndefinedVar: Usage of undefined variable '$NIXPACKS_PATH' (line 24)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_EPAYCO_PRIVATE_KEY") (line 13)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_GIPHY_API_KEY") (line 13)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_SUPABASE_ANON_KEY") (line 13)
Dockerfile:30
--------------------
  28 |     # build phase
  29 |     COPY . /app/.
  30 | >>> RUN --mount=type=cache,id=V13bXEaLGp4-node_modules/cache,target=/app/node_modules/.cache npm run build
  31 |     
  32 |     
--------------------
ERROR: failed to build: failed to solve: process "/bin/bash -ol pipefail -c npm run build" did not complete successfully: exit code: 1
##########################################
### Error
### Mon, 27 Apr 2026 01:51:53 GMT
##########################################

Command failed with exit code 1: docker buildx build --network host -f /etc/easypanel/projects/academiavallenataonline_app/academiavallenataonline_app_2026/code/.nixpacks/Dockerfile -t easypanel/academiavallenataonline_app/academiavallenataonline_app_2026 --label 'keep=true' --build-arg 'VITE_SUPABASE_URL=https://tbijzvtyyewhtwgakgka.supabase.co' --build-arg 'VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiaWp6dnR5eWV3aHR3Z2FrZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NTQyNjIsImV4cCI6MjA1ODUzMDI2Mn0.P09L8OpLpcrm5XzTLAN0oQllhl_bePk5bxbUUpoG-cQ' --build-arg 'VITE_EPAYCO_PUBLIC_KEY=a04d60e2e678d5bd89a58d26f3413fdb' --build-arg 'VITE_EPAYCO_PRIVATE_KEY=83ec651809bb7d11fcd114b16777bfa1' --build-arg 'VITE_EPAYCO_CUSTOMER_ID=37257' --build-arg 'VITE_EPAYCO_TEST_MODE=false' --build-arg 'VITE_GIPHY_API_KEY=Kj3vAtPH8E0gWaVO2amamR5xazoGL36q' --build-arg 'VITE_APP_URL=https://academiavallenataonline.com' --build-arg 'VITE_BASE_URL=https://academiavallenataonline.com' --build-arg 'NODE_ENV=production' --build-arg 'NODE_OPTIONS=--max-old-space-size=6144' --build-arg 'NIXPACKS_NO_CACHE=0' --build-arg 'GIT_SHA=a8bed81ce34aec6baddad54824cf3a918483fe1d' /etc/easypanel/projects/academiavallenataonline_app/academiavallenataonline_app_2026/code/