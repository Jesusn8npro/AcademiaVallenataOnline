Commit: fix: eliminacion forzosa de cache de Nixpacks y salto de version 
##########################################
### Download Github Archive Started...
### Wed, 22 Apr 2026 00:17:41 GMT
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
#5 transferring context: 100.35MB 0.9s done
#5 DONE 0.9s

#6 [stage-0  4/15] RUN nix-env -if .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix && nix-collect-garbage -d
#6 CACHED

#7 [stage-0  5/15] COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix
#7 CACHED

#8 [stage-0  6/15] RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d
#8 CACHED

#9 [stage-0  2/15] WORKDIR /app/
#9 CACHED

#10 [stage-0  3/15] COPY .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix
#10 CACHED

#11 [stage-0  7/15] COPY .nixpacks/assets /assets/
#11 CACHED

#12 [stage-0  8/15] COPY . /app/.
#12 DONE 0.4s

#13 [stage-0  9/15] RUN  caddy fmt --overwrite /assets/Caddyfile
#13 DONE 0.1s

#14 [stage-0 10/15] COPY . /app/.
#14 DONE 0.5s

#15 [stage-0 11/15] RUN --mount=type=cache,id=V13bXEaLGp4-/root/npm,target=/root/.npm npm install
#15 13.65 
#15 13.65 added 446 packages, and audited 447 packages in 13s
#15 13.65 
#15 13.65 85 packages are looking for funding
#15 13.65   run `npm fund` for details
#15 13.66 
#15 13.66 1 high severity vulnerability
#15 13.66 
#15 13.66 To address all issues, run:
#15 13.66   npm audit fix
#15 13.66 
#15 13.66 Run `npm audit` for details.
#15 DONE 14.0s

#16 [stage-0 12/15] COPY . /app/.
#16 DONE 0.9s

#17 [stage-0 13/15] RUN --mount=type=cache,id=V13bXEaLGp4-node_modules/cache,target=/app/node_modules/.cache npm run build
#17 0.706 
#17 0.706 > mi-app@0.0.1 build
#17 0.706 > node scripts/sync-samples.cjs && npx vite build
#17 0.706 
#17 0.759 ✅ Sincronización completa. 34 pitos y 20 bajos detectados.
#17 0.759 📂 Lista guardada en: /app/public/muestrasLocales.json
#17 1.746 failed to load config from /app/vite.config.ts
#17 1.746 error during build:
#17 1.746 Error: Cannot find module 'acorn'
#17 1.746 Require stack:
#17 1.746 - /app/node_modules/acorn-import-attributes/lib/index.js
#17 1.746 - /app/node_modules/javascript-obfuscator/dist/index.js
#17 1.746 - /app/node_modules/rollup-plugin-obfuscator/dist/rollup-plugin-obfuscator.js
#17 1.746     at Function._resolveFilename (node:internal/modules/cjs/loader:1249:15)
#17 1.746     at Function._load (node:internal/modules/cjs/loader:1075:27)
#17 1.746     at TracingChannel.traceSync (node:diagnostics_channel:315:14)
#17 1.746     at wrapModuleLoad (node:internal/modules/cjs/loader:218:24)
#17 1.746     at Module.require (node:internal/modules/cjs/loader:1340:12)
#17 1.746     at require (node:internal/modules/helpers:141:16)
#17 1.746     at Object.<anonymous> (/app/node_modules/acorn-import-attributes/lib/index.js:7:38)
#17 1.746     at Module._compile (node:internal/modules/cjs/loader:1546:14)
#17 1.746     at Object..js (node:internal/modules/cjs/loader:1689:10)
#17 1.746     at Module.load (node:internal/modules/cjs/loader:1318:32)
#17 1.783 npm notice
#17 1.783 npm notice New major version of npm available! 10.9.0 -> 11.12.1
#17 1.783 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1
#17 1.783 npm notice To update run: npm install -g npm@11.12.1
#17 1.783 npm notice
#17 ERROR: process "/bin/bash -ol pipefail -c npm run build" did not complete successfully: exit code: 1
------
 > [stage-0 13/15] RUN --mount=type=cache,id=V13bXEaLGp4-node_modules/cache,target=/app/node_modules/.cache npm run build:
1.746     at require (node:internal/modules/helpers:141:16)
1.746     at Object.<anonymous> (/app/node_modules/acorn-import-attributes/lib/index.js:7:38)
1.746     at Module._compile (node:internal/modules/cjs/loader:1546:14)
1.746     at Object..js (node:internal/modules/cjs/loader:1689:10)
1.746     at Module.load (node:internal/modules/cjs/loader:1318:32)
1.783 npm notice
1.783 npm notice New major version of npm available! 10.9.0 -> 11.12.1
1.783 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1
1.783 npm notice To update run: npm install -g npm@11.12.1
1.783 npm notice
------

 7 warnings found (use docker --debug to expand):
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_EPAYCO_PRIVATE_KEY") (line 13)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_GIPHY_API_KEY") (line 13)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_SUPABASE_ANON_KEY") (line 13)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_EPAYCO_PRIVATE_KEY") (line 14)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_GIPHY_API_KEY") (line 14)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_SUPABASE_ANON_KEY") (line 14)
 - UndefinedVar: Usage of undefined variable '$NIXPACKS_PATH' (line 24)
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
### Wed, 22 Apr 2026 00:18:08 GMT
##########################################

Command failed with exit code 1: docker buildx build --network host -f /etc/easypanel/projects/academiavallenataonline_app/academiavallenataonline_app_2026/code/.nixpacks/Dockerfile -t easypanel/academiavallenataonline_app/academiavallenataonline_app_2026 --label 'keep=true' --build-arg 'VITE_SUPABASE_URL=https://tbijzvtyyewhtwgakgka.supabase.co' --build-arg 'VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiaWp6dnR5eWV3aHR3Z2FrZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NTQyNjIsImV4cCI6MjA1ODUzMDI2Mn0.P09L8OpLpcrm5XzTLAN0oQllhl_bePk5bxbUUpoG-cQ' --build-arg 'VITE_EPAYCO_PUBLIC_KEY=a04d60e2e678d5bd89a58d26f3413fdb' --build-arg 'VITE_EPAYCO_PRIVATE_KEY=83ec651809bb7d11fcd114b16777bfa1' --build-arg 'VITE_EPAYCO_CUSTOMER_ID=37257' --build-arg 'VITE_EPAYCO_TEST_MODE=true' --build-arg 'VITE_GIPHY_API_KEY=Kj3vAtPH8E0gWaVO2amamR5xazoGL36q' --build-arg 'VITE_APP_URL=https://academiavallenataonline.com' --build-arg 'VITE_BASE_URL=https://academiavallenataonline.com' --build-arg 'NODE_ENV=production' --build-arg 'NODE_OPTIONS=--max-old-space-size=6144' --build-arg 'NIXPACKS_NO_CACHE=0' --build-arg 'GIT_SHA=002bb9c841a0fb63ec95b68064c313bb86c85b91' /etc/easypanel/projects/academiavallenataonline_app/academiavallenataonline_app_2026/code/