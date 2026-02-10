Commit: feat: implementar panel de objetivos estilo trello para administrador y limpieza de componentes obsoletos 
##########################################
### Download Github Archive Started...
### Tue, 03 Feb 2026 04:46:41 GMT
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
#5 transferring context: 81.64kB 0.1s done
#5 DONE 0.1s

#6 [stage-0  2/15] WORKDIR /app/
#6 CACHED

#7 [stage-0  6/15] RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d
#7 CACHED

#8 [stage-0  5/15] COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix
#8 CACHED

#9 [stage-0 10/15] COPY . /app/.
#9 CACHED

#10 [stage-0 11/15] RUN --mount=type=cache,id=V13bXEaLGp4-/root/npm,target=/root/.npm npm install
#10 CACHED

#11 [stage-0  3/15] COPY .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix
#11 CACHED

#12 [stage-0  4/15] RUN nix-env -if .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix && nix-collect-garbage -d
#12 CACHED

#13 [stage-0  8/15] COPY . /app/.
#13 CACHED

#14 [stage-0  9/15] RUN  caddy fmt --overwrite /assets/Caddyfile
#14 CACHED

#15 [stage-0  7/15] COPY .nixpacks/assets /assets/
#15 CACHED

#16 [stage-0 12/15] COPY . /app/.
#16 CACHED

#17 [stage-0 13/15] RUN --mount=type=cache,id=V13bXEaLGp4-node_modules/cache,target=/app/node_modules/.cache npm run build
#17 0.535 (node:1) ExperimentalWarning: CommonJS module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/debug/src/node.js is loading ES Module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/supports-color/index.js using require().
#17 0.535 Support for loading ES Module in require() is an experimental feature and might change at any time
#17 0.535 (Use `node --trace-warnings ...` to show where the warning was created)
#17 0.552 
#17 0.552 > mi-app@0.0.0 build
#17 0.552 > vite build
#17 0.552 
#17 0.829 vite v6.4.1 building for production...
#17 1.084 transforming...
#17 1.481 ✓ 37 modules transformed.
#17 1.485 ✗ Build failed in 625ms
#17 1.485 error during build:
#17 1.485 Could not resolve "./app.css" from "src/App.tsx"
#17 1.485 file: /app/src/App.tsx
#17 1.485     at getRollupError (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
#17 1.485     at error (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
#17 1.485     at ModuleLoader.handleInvalidResolvedId (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21590:24)
#17 1.485     at file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21550:26
#17 1.539 npm notice
#17 1.539 npm notice New major version of npm available! 10.9.0 -> 11.8.0
#17 1.539 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.8.0
#17 1.539 npm notice To update run: npm install -g npm@11.8.0
#17 1.539 npm notice
#17 ERROR: process "/bin/bash -ol pipefail -c npm run build" did not complete successfully: exit code: 1
------
 > [stage-0 13/15] RUN --mount=type=cache,id=V13bXEaLGp4-node_modules/cache,target=/app/node_modules/.cache npm run build:
1.485 file: /app/src/App.tsx
1.485     at getRollupError (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
1.485     at error (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
1.485     at ModuleLoader.handleInvalidResolvedId (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21590:24)
1.485     at file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21550:26
1.539 npm notice
1.539 npm notice New major version of npm available! 10.9.0 -> 11.8.0
1.539 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.8.0
1.539 npm notice To update run: npm install -g npm@11.8.0
1.539 npm notice
------

 7 warnings found (use docker --debug to expand):
 - UndefinedVar: Usage of undefined variable '$NIXPACKS_PATH' (line 24)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_EPAYCO_PRIVATE_KEY") (line 13)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_GIPHY_API_KEY") (line 13)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_SUPABASE_ANON_KEY") (line 13)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_EPAYCO_PRIVATE_KEY") (line 14)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_GIPHY_API_KEY") (line 14)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_SUPABASE_ANON_KEY") (line 14)
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
### Tue, 03 Feb 2026 04:46:48 GMT
##########################################

Command failed with exit code 1: docker buildx build --network host -f /etc/easypanel/projects/academiavallenataonline_app/academiavallenataonline_app_2026/code/.nixpacks/Dockerfile -t easypanel/academiavallenataonline_app/academiavallenataonline_app_2026 --label 'keep=true' --build-arg 'VITE_SUPABASE_URL=https://tbijzvtyyewhtwgakgka.supabase.co' --build-arg 'VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiaWp6dnR5eWV3aHR3Z2FrZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NTQyNjIsImV4cCI6MjA1ODUzMDI2Mn0.P09L8OpLpcrm5XzTLAN0oQllhl_bePk5bxbUUpoG-cQ' --build-arg 'VITE_EPAYCO_PUBLIC_KEY=a04d60e2e678d5bd89a58d26f3413fdb' --build-arg 'VITE_EPAYCO_PRIVATE_KEY=83ec651809bb7d11fcd114b16777bfa1' --build-arg 'VITE_EPAYCO_CUSTOMER_ID=37257' --build-arg 'VITE_EPAYCO_TEST_MODE=false' --build-arg 'VITE_GIPHY_API_KEY=Kj3vAtPH8E0gWaVO2amamR5xazoGL36q' --build-arg 'VITE_APP_URL=http://localhost:5173' --build-arg 'VITE_BASE_URL=http://localhost:5173' --build-arg 'NODE_ENV=development' --build-arg 'GIT_SHA=9d01a91add736393d94d9b6d839b0ca5ebe75693' /etc/easypanel/projects/academiavallenataonline_app/academiavallenataonline_app_2026/code/