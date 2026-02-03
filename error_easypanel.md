Commit: fix: correcciones UI perfil y home, pagina ventas publica y depencias de build 
##########################################
### Download Github Archive Started...
### Thu, 18 Dec 2025 06:26:51 GMT
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
#3 transferring context: 2B done
#3 DONE 0.0s

#4 [stage-0  1/15] FROM ghcr.io/railwayapp/nixpacks:ubuntu-1741046653@sha256:ed406b77fb751927991b8655e76c33a4521c4957c2afeab293be7c63c2a373d2
#4 DONE 0.0s

#5 [internal] load build context
#5 transferring context: 41.74MB 0.5s done
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
#12 DONE 0.3s

#13 [stage-0  9/15] RUN  caddy fmt --overwrite /assets/Caddyfile
#13 DONE 0.2s

#14 [stage-0 10/15] COPY . /app/.
#14 DONE 0.6s

#15 [stage-0 11/15] RUN --mount=type=cache,id=V13bXEaLGp4-/root/npm,target=/root/.npm npm install
#15 0.758 (node:1) ExperimentalWarning: CommonJS module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/debug/src/node.js is loading ES Module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/supports-color/index.js using require().
#15 0.758 Support for loading ES Module in require() is an experimental feature and might change at any time
#15 0.758 (Use `node --trace-warnings ...` to show where the warning was created)
#15 1.119 npm error code ERESOLVE
#15 1.120 npm error ERESOLVE could not resolve
#15 1.120 npm error
#15 1.120 npm error While resolving: react-helmet-async@2.0.5
#15 1.120 npm error Found: react@19.2.1
#15 1.120 npm error node_modules/react
#15 1.120 npm error   react@"^19.2.0" from the root project
#15 1.120 npm error   peer react@"^16.5.1 || ^17.0.0 || ^18.0.0 || ^19.0.0" from lucide-react@0.561.0
#15 1.120 npm error   node_modules/lucide-react
#15 1.120 npm error     lucide-react@"^0.561.0" from the root project
#15 1.120 npm error   6 more (react-dom, react-dropzone, react-i18next, react-router, ...)
#15 1.120 npm error
#15 1.120 npm error Could not resolve dependency:
#15 1.120 npm error peer react@"^16.6.0 || ^17.0.0 || ^18.0.0" from react-helmet-async@2.0.5
#15 1.120 npm error node_modules/react-helmet-async
#15 1.120 npm error   react-helmet-async@"^2.0.5" from the root project
#15 1.120 npm error
#15 1.120 npm error Conflicting peer dependency: react@18.3.1
#15 1.120 npm error node_modules/react
#15 1.120 npm error   peer react@"^16.6.0 || ^17.0.0 || ^18.0.0" from react-helmet-async@2.0.5
#15 1.120 npm error   node_modules/react-helmet-async
#15 1.120 npm error     react-helmet-async@"^2.0.5" from the root project
#15 1.120 npm error
#15 1.120 npm error Fix the upstream dependency conflict, or retry
#15 1.120 npm error this command with --force or --legacy-peer-deps
#15 1.120 npm error to accept an incorrect (and potentially broken) dependency resolution.
#15 1.120 npm error
#15 1.120 npm error
#15 1.120 npm error For a full report see:
#15 1.120 npm error /root/.npm/_logs/2025-12-18T06_26_58_479Z-eresolve-report.txt
#15 1.122 npm error A complete log of this run can be found in: /root/.npm/_logs/2025-12-18T06_26_58_479Z-debug-0.log
#15 ERROR: process "/bin/bash -ol pipefail -c npm install" did not complete successfully: exit code: 1
------
 > [stage-0 11/15] RUN --mount=type=cache,id=V13bXEaLGp4-/root/npm,target=/root/.npm npm install:
1.120 npm error     react-helmet-async@"^2.0.5" from the root project
1.120 npm error
1.120 npm error Fix the upstream dependency conflict, or retry
1.120 npm error this command with --force or --legacy-peer-deps
1.120 npm error to accept an incorrect (and potentially broken) dependency resolution.
1.120 npm error
1.120 npm error
1.120 npm error For a full report see:
1.120 npm error /root/.npm/_logs/2025-12-18T06_26_58_479Z-eresolve-report.txt
1.122 npm error A complete log of this run can be found in: /root/.npm/_logs/2025-12-18T06_26_58_479Z-debug-0.log
------

 7 warnings found (use docker --debug to expand):
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_GIPHY_API_KEY") (line 14)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_SUPABASE_ANON_KEY") (line 14)
 - UndefinedVar: Usage of undefined variable '$NIXPACKS_PATH' (line 24)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_EPAYCO_PRIVATE_KEY") (line 13)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_GIPHY_API_KEY") (line 13)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_SUPABASE_ANON_KEY") (line 13)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_EPAYCO_PRIVATE_KEY") (line 14)
Dockerfile:26
--------------------
  24 |     ENV NIXPACKS_PATH=/app/node_modules/.bin:$NIXPACKS_PATH
  25 |     COPY . /app/.
  26 | >>> RUN --mount=type=cache,id=V13bXEaLGp4-/root/npm,target=/root/.npm npm install
  27 |     
  28 |     # build phase
--------------------
ERROR: failed to build: failed to solve: process "/bin/bash -ol pipefail -c npm install" did not complete successfully: exit code: 1
##########################################
### Error
### Thu, 18 Dec 2025 06:26:59 GMT
##########################################

Command failed with exit code 1: docker buildx build --network host -f /etc/easypanel/projects/academiavallenataonline_app/academiavallenataonline_app_2026/code/.nixpacks/Dockerfile -t easypanel/academiavallenataonline_app/academiavallenataonline_app_2026 --label 'keep=true' --build-arg 'VITE_SUPABASE_URL=https://tbijzvtyyewhtwgakgka.supabase.co' --build-arg 'VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiaWp6dnR5eWV3aHR3Z2FrZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NTQyNjIsImV4cCI6MjA1ODUzMDI2Mn0.P09L8OpLpcrm5XzTLAN0oQllhl_bePk5bxbUUpoG-cQ' --build-arg 'VITE_EPAYCO_PUBLIC_KEY=a04d60e2e678d5bd89a58d26f3413fdb' --build-arg 'VITE_EPAYCO_PRIVATE_KEY=83ec651809bb7d11fcd114b16777bfa1' --build-arg 'VITE_EPAYCO_CUSTOMER_ID=37257' --build-arg 'VITE_EPAYCO_TEST_MODE=false' --build-arg 'VITE_GIPHY_API_KEY=Kj3vAtPH8E0gWaVO2amamR5xazoGL36q' --build-arg 'VITE_APP_URL=http://localhost:5173' --build-arg 'VITE_BASE_URL=http://localhost:5173' --build-arg 'NODE_ENV=development' --build-arg 'GIT_SHA=350f53c22a30d3f1fddd54b57b007c9bf68faa26' /etc/easypanel/projects/academiavallenataonline_app/academiavallenataonline_app_2026/code/