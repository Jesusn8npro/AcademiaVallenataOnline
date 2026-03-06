Commit: fix(ModalBusqueda.css): corregir error de sintaxis en CSS keyframes que causaba falla de build en Easypanel 
##########################################
### Download Github Archive Started...
### Tue, 03 Mar 2026 20:28:35 GMT
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
#2 DONE 0.2s

#3 [internal] load .dockerignore
#3 transferring context: 110B done
#3 DONE 0.0s

#4 [stage-0  1/15] FROM ghcr.io/railwayapp/nixpacks:ubuntu-1741046653@sha256:ed406b77fb751927991b8655e76c33a4521c4957c2afeab293be7c63c2a373d2
#4 DONE 0.0s

#5 [internal] load build context
#5 transferring context: 46.16MB 0.3s done
#5 DONE 0.4s

#6 [stage-0 11/15] RUN --mount=type=cache,id=V13bXEaLGp4-/root/npm,target=/root/.npm npm install
#6 CACHED

#7 [stage-0  6/15] RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d
#7 CACHED

#8 [stage-0  2/15] WORKDIR /app/
#8 CACHED

#9 [stage-0  3/15] COPY .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix
#9 CACHED

#10 [stage-0  5/15] COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix
#10 CACHED

#11 [stage-0  8/15] COPY . /app/.
#11 CACHED

#12 [stage-0  4/15] RUN nix-env -if .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix && nix-collect-garbage -d
#12 CACHED

#13 [stage-0  7/15] COPY .nixpacks/assets /assets/
#13 CACHED

#14 [stage-0  9/15] RUN  caddy fmt --overwrite /assets/Caddyfile
#14 CACHED

#15 [stage-0 10/15] COPY . /app/.
#15 CACHED

#16 [stage-0 12/15] COPY . /app/.
#16 CACHED

#17 [stage-0 13/15] RUN --mount=type=cache,id=V13bXEaLGp4-node_modules/cache,target=/app/node_modules/.cache npm run build
#17 0.886 (node:1) ExperimentalWarning: CommonJS module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/debug/src/node.js is loading ES Module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/supports-color/index.js using require().
#17 0.886 Support for loading ES Module in require() is an experimental feature and might change at any time
#17 0.886 (Use `node --trace-warnings ...` to show where the warning was created)
#17 0.896 
#17 0.896 > mi-app@0.0.0 build
#17 0.896 > node scripts/sync-samples.cjs && vite build
#17 0.896 
#17 0.941 ✅ Sincronización completa. 34 pitos y 20 bajos detectados.
#17 0.942 📂 Lista guardada en: /app/public/muestrasLocales.json
#17 1.819 vite v6.4.1 building for production...
#17 2.425 transforming...
#17 71.70 ✓ 3460 modules transformed.