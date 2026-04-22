Commit: chore: ajuste de RAM a 3GB para estabilidad del servidor 
##########################################
### Download Github Archive Started...
### Tue, 21 Apr 2026 23:57:44 GMT
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
#1 transferring dockerfile: 2.26kB done
#1 DONE 0.0s

#2 [internal] load metadata for ghcr.io/railwayapp/nixpacks:ubuntu-1741046653
#2 DONE 0.1s

#3 [internal] load .dockerignore
#3 transferring context: 107B done
#3 DONE 0.0s

#4 [stage-0  1/15] FROM ghcr.io/railwayapp/nixpacks:ubuntu-1741046653@sha256:ed406b77fb751927991b8655e76c33a4521c4957c2afeab293be7c63c2a373d2
#4 DONE 0.0s

#5 [internal] load build context
#5 transferring context: 92.82kB 0.1s done
#5 DONE 0.1s

#6 [stage-0  8/15] COPY . /app/.
#6 CACHED

#7 [stage-0  9/15] RUN  caddy fmt --overwrite /assets/Caddyfile
#7 CACHED

#8 [stage-0 11/15] RUN --mount=type=cache,id=V13bXEaLGp4-node_modules,target=/app/node_modules --mount=type=cache,id=V13bXEaLGp4-root/npm,target=/app/root/.npm npm install
#8 CACHED

#9 [stage-0  4/15] RUN nix-env -if .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix && nix-collect-garbage -d
#9 CACHED

#10 [stage-0  7/15] COPY .nixpacks/assets /assets/
#10 CACHED

#11 [stage-0  5/15] COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix
#11 CACHED

#12 [stage-0 10/15] COPY . /app/.
#12 CACHED

#13 [stage-0  2/15] WORKDIR /app/
#13 CACHED

#14 [stage-0  3/15] COPY .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix
#14 CACHED

#15 [stage-0  6/15] RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d
#15 CACHED

#16 [stage-0 12/15] COPY . /app/.
#16 CACHED

#17 [stage-0 13/15] RUN --mount=type=cache,id=V13bXEaLGp4-dist,target=/app/dist --mount=type=cache,id=V13bXEaLGp4-node_modules/vite,target=/app/node_modules/.vite npm run build
#17 0.212 
#17 0.212 > mi-app@0.0.0 build
#17 0.212 > node scripts/sync-samples.cjs && npx vite build
#17 0.212 
#17 0.256 ✅ Sincronización completa. 34 pitos y 20 bajos detectados.
#17 0.256 📂 Lista guardada en: /app/public/muestrasLocales.json
#17 1.100 npm warn exec The following package was not found and will be installed: vite@6.4.2
#17 84.10 failed to load config from /app/vite.config.ts
#17 84.10 error during build:
#17 84.10 Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'vite' imported from /app/node_modules/.vite-temp/vite.config.ts.timestamp-1776815957102-e43a88b008a14.mjs
#17 84.10     at packageResolve (node:internal/modules/esm/resolve:838:9)
#17 84.10     at moduleResolve (node:internal/modules/esm/resolve:907:18)
#17 84.10     at defaultResolve (node:internal/modules/esm/resolve:1037:11)
#17 84.10     at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:650:12)
#17 84.10     at #cachedDefaultResolve (node:internal/modules/esm/loader:599:25)
#17 84.10     at ModuleLoader.resolve (node:internal/modules/esm/loader:582:38)
#17 84.10     at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:241:38)
#17 84.10     at ModuleJob._link (node:internal/modules/esm/module_job:132:49)
#17 ERROR: process "/bin/bash -ol pipefail -c npm run build" did not complete successfully: exit code: 1
------
 > [stage-0 13/15] RUN --mount=type=cache,id=V13bXEaLGp4-dist,target=/app/dist --mount=type=cache,id=V13bXEaLGp4-node_modules/vite,target=/app/node_modules/.vite npm run build:
84.10 error during build:
84.10 Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'vite' imported from /app/node_modules/.vite-temp/vite.config.ts.timestamp-1776815957102-e43a88b008a14.mjs
84.10     at packageResolve (node:internal/modules/esm/resolve:838:9)
84.10     at moduleResolve (node:internal/modules/esm/resolve:907:18)
84.10     at defaultResolve (node:internal/modules/esm/resolve:1037:11)
84.10     at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:650:12)
84.10     at #cachedDefaultResolve (node:internal/modules/esm/loader:599:25)
84.10     at ModuleLoader.resolve (node:internal/modules/esm/loader:582:38)
84.10     at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:241:38)
84.10     at ModuleJob._link (node:internal/modules/esm/module_job:132:49)
------

 7 warnings found (use docker --debug to expand):
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_GIPHY_API_KEY") (line 13)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_SUPABASE_ANON_KEY") (line 13)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_EPAYCO_PRIVATE_KEY") (line 14)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_GIPHY_API_KEY") (line 14)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_SUPABASE_ANON_KEY") (line 14)
 - UndefinedVar: Usage of undefined variable '$NIXPACKS_PATH' (line 24)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_EPAYCO_PRIVATE_KEY") (line 13)
Dockerfile:30
--------------------
  28 |     # build phase
  29 |     COPY . /app/.
  30 | >>> RUN --mount=type=cache,id=V13bXEaLGp4-dist,target=/app/dist --mount=type=cache,id=V13bXEaLGp4-node_modules/vite,target=/app/node_modules/.vite npm run build
  31 |     
  32 |     
--------------------
ERROR: failed to build: failed to solve: process "/bin/bash -ol pipefail -c npm run build" did not complete successfully: exit code: 1
##########################################
### Error
### Tue, 21 Apr 2026 23:59:17 GMT
##########################################

Command failed with exit code 1: docker buildx build --network host -f /etc/easypanel/projects/academiavallenataonline_app/academiavallenataonline_app_2026/code/.nixpacks/Dockerfile -t easypanel/academiavallenataonline_app/academiavallenataonline_app_2026 --label 'keep=true' --build-arg 'VITE_SUPABASE_URL=https://tbijzvtyyewhtwgakgka.supabase.co' --build-arg 'VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiaWp6dnR5eWV3aHR3Z2FrZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NTQyNjIsImV4cCI6MjA1ODUzMDI2Mn0.P09L8OpLpcrm5XzTLAN0oQllhl_bePk5bxbUUpoG-cQ' --build-arg 'VITE_EPAYCO_PUBLIC_KEY=a04d60e2e678d5bd89a58d26f3413fdb' --build-arg 'VITE_EPAYCO_PRIVATE_KEY=83ec651809bb7d11fcd114b16777bfa1' --build-arg 'VITE_EPAYCO_CUSTOMER_ID=37257' --build-arg 'VITE_EPAYCO_TEST_MODE=true' --build-arg 'VITE_GIPHY_API_KEY=Kj3vAtPH8E0gWaVO2amamR5xazoGL36q' --build-arg 'VITE_APP_URL=https://academiavallenataonline.com' --build-arg 'VITE_BASE_URL=https://academiavallenataonline.com' --build-arg 'NODE_ENV=production' --build-arg 'NODE_OPTIONS=--max-old-space-size=6144' --build-arg 'NIXPACKS_NO_CACHE=0' --build-arg 'GIT_SHA=bed662f7841b3be627917920f5632497cc175d62' /etc/easypanel/projects/academiavallenataonline_app/academiavallenataonline_app_2026/code/