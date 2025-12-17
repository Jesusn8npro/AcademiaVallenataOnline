Commit: fix: correct case sensitivity import for eventos.css 
##########################################
### Download Github Archive Started...
### Wed, 17 Dec 2025 20:55:44 GMT
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
#1 transferring dockerfile: 1.43kB done
#1 DONE 0.0s

#2 [internal] load metadata for ghcr.io/railwayapp/nixpacks:ubuntu-1741046653
#2 DONE 0.1s

#3 [internal] load .dockerignore
#3 transferring context: 2B done
#3 DONE 0.0s

#4 [stage-0  1/15] FROM ghcr.io/railwayapp/nixpacks:ubuntu-1741046653@sha256:ed406b77fb751927991b8655e76c33a4521c4957c2afeab293be7c63c2a373d2
#4 DONE 0.0s

#5 [internal] load build context
#5 transferring context: 43.17MB 0.5s done
#5 DONE 0.5s

#6 [stage-0  3/15] COPY .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix
#6 CACHED

#7 [stage-0  4/15] RUN nix-env -if .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix && nix-collect-garbage -d
#7 CACHED

#8 [stage-0  5/15] COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix
#8 CACHED

#9 [stage-0  6/15] RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d
#9 CACHED

#10 [stage-0  2/15] WORKDIR /app/
#10 CACHED

#11 [stage-0  7/15] COPY .nixpacks/assets /assets/
#11 CACHED

#12 [stage-0  8/15] COPY . /app/.
#12 DONE 0.3s

#13 [stage-0  9/15] RUN  caddy fmt --overwrite /assets/Caddyfile
#13 DONE 0.2s

#14 [stage-0 10/15] COPY . /app/.
#14 DONE 0.5s

#15 [stage-0 11/15] RUN --mount=type=cache,id=V13bXEaLGp4-/root/npm,target=/root/.npm npm install
#15 0.543 (node:1) ExperimentalWarning: CommonJS module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/debug/src/node.js is loading ES Module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/supports-color/index.js using require().
#15 0.543 Support for loading ES Module in require() is an experimental feature and might change at any time
#15 0.543 (Use `node --trace-warnings ...` to show where the warning was created)
#15 364.9 
#15 364.9 added 230 packages, and audited 231 packages in 6m
#15 364.9 
#15 364.9 55 packages are looking for funding
#15 364.9   run `npm fund` for details
#15 364.9 
#15 364.9 found 0 vulnerabilities
#15 DONE 365.2s

#16 [stage-0 12/15] COPY . /app/.
#16 DONE 0.8s

#17 [stage-0 13/15] RUN --mount=type=cache,id=V13bXEaLGp4-node_modules/cache,target=/app/node_modules/.cache npm run build
#17 1.168 (node:1) ExperimentalWarning: CommonJS module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/debug/src/node.js is loading ES Module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/supports-color/index.js using require().
#17 1.168 Support for loading ES Module in require() is an experimental feature and might change at any time
#17 1.168 (Use `node --trace-warnings ...` to show where the warning was created)
#17 1.191 
#17 1.191 > mi-app@0.0.0 build
#17 1.191 > vite build
#17 1.191 
#17 1.527 vite v6.4.1 building for production...
#17 1.779 transforming...
#17 3.112 
#17 3.112 /imagenes/Jesus-Gonzalez--Fondo.jpg referenced in /imagenes/Jesus-Gonzalez--Fondo.jpg didn't resolve at build time, it will remain unchanged to be resolved at runtime
#17 3.778 ✓ 182 modules transformed.
#17 3.781 ✗ Build failed in 2.23s
#17 3.782 error during build:
#17 3.782 Could not resolve "./Contacto.css" from "src/Paginas/Contacto/Contacto.tsx"
#17 3.782 file: /app/src/Paginas/Contacto/Contacto.tsx
#17 3.782     at getRollupError (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
#17 3.782     at error (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
#17 3.782     at ModuleLoader.handleInvalidResolvedId (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21590:24)
#17 3.782     at file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21550:26
#17 3.861 npm notice
#17 3.861 npm notice New major version of npm available! 10.9.0 -> 11.7.0
#17 3.861 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.7.0
#17 3.861 npm notice To update run: npm install -g npm@11.7.0
#17 3.861 npm notice
#17 ERROR: process "/bin/bash -ol pipefail -c npm run build" did not complete successfully: exit code: 1
------
 > [stage-0 13/15] RUN --mount=type=cache,id=V13bXEaLGp4-node_modules/cache,target=/app/node_modules/.cache npm run build:
3.782 file: /app/src/Paginas/Contacto/Contacto.tsx
3.782     at getRollupError (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
3.782     at error (file:///app/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
3.782     at ModuleLoader.handleInvalidResolvedId (file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21590:24)
3.782     at file:///app/node_modules/rollup/dist/es/shared/node-entry.js:21550:26
3.861 npm notice
3.861 npm notice New major version of npm available! 10.9.0 -> 11.7.0
3.861 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.7.0
3.861 npm notice To update run: npm install -g npm@11.7.0
3.861 npm notice
------

 1 warning found (use docker --debug to expand):
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
### Wed, 17 Dec 2025 21:02:01 GMT
##########################################

Command failed with exit code 1: docker buildx build --network host -f /etc/easypanel/projects/academiavallenataonline_app/academiavallenataonline_app_2026/code/.nixpacks/Dockerfile -t easypanel/academiavallenataonline_app/academiavallenataonline_app_2026 --label 'keep=true' --build-arg 'GIT_SHA=8a3062fb3bfeb20cb920a3b176478d04bb622c3d' /etc/easypanel/projects/academiavallenataonline_app/academiavallenataonline_app_2026/code/