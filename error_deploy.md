Commit: Seguridad: Blindaje total de activos gráficos y eliminación de rutas públicas expuestas 
##########################################
### Download Github Archive Started...
### Fri, 27 Mar 2026 00:05:52 GMT
##########################################


╔═════════════════════ Nixpacks v1.34.1 ═════════════════════╗
║ setup      │ nodejs_23                                     ║
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
#1 transferring dockerfile: 1.97kB done
#1 DONE 0.0s

#2 [internal] load metadata for ghcr.io/railwayapp/nixpacks:ubuntu-1741046653
#2 DONE 0.1s

#3 [internal] load .dockerignore
#3 transferring context: 110B done
#3 DONE 0.0s

#4 [stage-0  1/15] FROM ghcr.io/railwayapp/nixpacks:ubuntu-1741046653@sha256:ed406b77fb751927991b8655e76c33a4521c4957c2afeab293be7c63c2a373d2
#4 DONE 0.0s

#5 [internal] load build context
#5 transferring context: 57.49MB 0.5s done
#5 DONE 0.5s

#6 [stage-0  2/15] WORKDIR /app/
#6 CACHED

#7 [stage-0  3/15] COPY .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix
#7 CACHED

#8 [stage-0  4/15] RUN nix-env -if .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix && nix-collect-garbage -d
#8 CACHED

#9 [stage-0  5/15] COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix
#9 CACHED

#10 [stage-0  6/15] RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d
#10 CACHED

#11 [stage-0  7/15] COPY .nixpacks/assets /assets/
#11 CACHED

#12 [stage-0  8/15] COPY . /app/.
#12 DONE 0.5s

#13 [stage-0  9/15] RUN  caddy fmt --overwrite /assets/Caddyfile
#13 DONE 0.5s

#14 [stage-0 10/15] COPY . /app/.
#14 DONE 0.4s

#15 [stage-0 11/15] RUN --mount=type=cache,id=V13bXEaLGp4-/root/npm,target=/root/.npm npm install
#15 0.707 (node:1) ExperimentalWarning: CommonJS module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/debug/src/node.js is loading ES Module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/supports-color/index.js using require().
#15 0.707 Support for loading ES Module in require() is an experimental feature and might change at any time
#15 0.707 (Use `node --trace-warnings ...` to show where the warning was created)
#15 12.14 
#15 12.14 added 483 packages, and audited 484 packages in 12s
#15 12.14 
#15 12.14 125 packages are looking for funding
#15 12.14   run `npm fund` for details
#15 12.21 
#15 12.21 11 vulnerabilities (3 moderate, 8 high)
#15 12.21 
#15 12.21 To address all issues, run:
#15 12.21   npm audit fix
#15 12.21 
#15 12.21 Run `npm audit` for details.
#15 DONE 12.5s

#16 [stage-0 12/15] COPY . /app/.
#16 DONE 0.4s

#17 [stage-0 13/15] RUN --mount=type=cache,id=V13bXEaLGp4-node_modules/cache,target=/app/node_modules/.cache npm run build
#17 0.596 (node:1) ExperimentalWarning: CommonJS module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/debug/src/node.js is loading ES Module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/supports-color/index.js using require().
#17 0.596 Support for loading ES Module in require() is an experimental feature and might change at any time
#17 0.596 (Use `node --trace-warnings ...` to show where the warning was created)
#17 0.610 
#17 0.610 > mi-app@0.0.0 build
#17 0.610 > node scripts/sync-samples.cjs && NODE_OPTIONS='--max-old-space-size=4096' vite build
#17 0.610 
#17 0.649 ✅ Sincronización completa. 34 pitos y 20 bajos detectados.
#17 0.650 📂 Lista guardada en: /app/public/muestrasLocales.json
#17 1.039 vite v6.4.1 building for production...
#17 1.354 transforming...
#17 4.832 ✓ 1200 modules transformed.
#17 4.835 ✗ Build failed in 3.77s
#17 4.835 error during build:
#17 4.835 Could not resolve "../../assets/images/Home/Foto maestro oficial JESUS GONZALEZ.jpg" from "src/Paginas/NuestraAcademia/NuestraAcademia.tsx"
#17 4.835 file: /app/src/Paginas/NuestraAcademia/NuestraAcademia.tsx
#17 4.835     at getRollupError (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
#17 4.835     at error (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
#17 4.835     at ModuleLoader.handleInvalidResolvedId (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21590:24)
#17 4.835     at file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21550:26
#17 4.896 npm notice
#17 4.896 npm notice New major version of npm available! 10.9.0 -> 11.12.1
#17 4.896 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1
#17 4.896 npm notice To update run: npm install -g npm@11.12.1
#17 4.896 npm notice
#17 ERROR: process "/bin/bash -ol pipefail -c npm run build" did not complete successfully: exit code: 1
------
 > [stage-0 13/15] RUN --mount=type=cache,id=V13bXEaLGp4-node_modules/cache,target=/app/node_modules/.cache npm run build:
4.835 file: /app/src/Paginas/NuestraAcademia/NuestraAcademia.tsx
4.835     at getRollupError (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
4.835     at error (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
4.835     at ModuleLoader.handleInvalidResolvedId (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21590:24)
4.835     at file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21550:26
4.896 npm notice
4.896 npm notice New major version of npm available! 10.9.0 -> 11.12.1
4.896 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1
4.896 npm notice To update run: npm install -g npm@11.12.1
4.896 npm notice
------

 7 warnings found (use docker --debug to expand):
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_SUPABASE_ANON_KEY") (line 13)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_EPAYCO_PRIVATE_KEY") (line 14)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_GIPHY_API_KEY") (line 14)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_SUPABASE_ANON_KEY") (line 14)
 - UndefinedVar: Usage of undefined variable '$NIXPACKS_PATH' (line 24)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_EPAYCO_PRIVATE_KEY") (line 13)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_GIPHY_API_KEY") (line 13)
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
### Fri, 27 Mar 2026 00:06:18 GMT
##########################################

Command failed with exit code 1: docker buildx build --network host -f /etc/easypanel/projects/academiavallenataonline_app/academiavallenataonline_app_2026/code/.nixpacks/Dockerfile -t easypanel/academiavallenataonline_app/academiavallenataonline_app_2026 --label 'keep=true' --build-arg 'VITE_SUPABASE_URL=https://tbijzvtyyewhtwgakgka.supabase.co' --build-arg 'VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiaWp6dnR5eWV3aHR3Z2FrZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NTQyNjIsImV4cCI6MjA1ODUzMDI2Mn0.P09L8OpLpcrm5XzTLAN0oQllhl_bePk5bxbUUpoG-cQ' --build-arg 'VITE_EPAYCO_PUBLIC_KEY=a04d60e2e678d5bd89a58d26f3413fdb' --build-arg 'VITE_EPAYCO_PRIVATE_KEY=83ec651809bb7d11fcd114b16777bfa1' --build-arg 'VITE_EPAYCO_CUSTOMER_ID=37257' --build-arg 'VITE_EPAYCO_TEST_MODE=false' --build-arg 'VITE_GIPHY_API_KEY=Kj3vAtPH8E0gWaVO2amamR5xazoGL36q' --build-arg 'VITE_APP_URL=http://localhost:5173' --build-arg 'VITE_BASE_URL=http://localhost:5173' --build-arg 'NODE_ENV=development' --build-arg 'GIT_SHA=1af7274cc8484f08e74213a935b716614ddb0831' /etc/easypanel/projects/academiavallenataonline_app/academiavallenataonline_app_2026/code/