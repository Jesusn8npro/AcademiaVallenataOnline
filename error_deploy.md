Commit: Optimización de build: manual chunks y limpieza de logs en producción 
##########################################
### Download Github Archive Started...
### Thu, 26 Mar 2026 22:44:44 GMT
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
#5 transferring context: 57.52MB 0.4s done
#5 DONE 0.4s

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
#13 DONE 0.4s

#14 [stage-0 10/15] COPY . /app/.
#14 DONE 0.4s

#15 [stage-0 11/15] RUN --mount=type=cache,id=V13bXEaLGp4-/root/npm,target=/root/.npm npm install
#15 0.993 (node:1) ExperimentalWarning: CommonJS module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/debug/src/node.js is loading ES Module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/supports-color/index.js using require().
#15 0.993 Support for loading ES Module in require() is an experimental feature and might change at any time
#15 0.993 (Use `node --trace-warnings ...` to show where the warning was created)
#15 12.37 
#15 12.37 added 483 packages, and audited 484 packages in 12s
#15 12.37 
#15 12.37 125 packages are looking for funding
#15 12.37   run `npm fund` for details
#15 12.42 
#15 12.42 11 vulnerabilities (3 moderate, 8 high)
#15 12.42 
#15 12.42 To address all issues, run:
#15 12.42   npm audit fix
#15 12.42 
#15 12.42 Run `npm audit` for details.
#15 DONE 12.9s

#16 [stage-0 12/15] COPY . /app/.
#16 DONE 0.4s

#17 [stage-0 13/15] RUN --mount=type=cache,id=V13bXEaLGp4-node_modules/cache,target=/app/node_modules/.cache npm run build
#17 0.615 (node:1) ExperimentalWarning: CommonJS module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/debug/src/node.js is loading ES Module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/supports-color/index.js using require().
#17 0.615 Support for loading ES Module in require() is an experimental feature and might change at any time
#17 0.615 (Use `node --trace-warnings ...` to show where the warning was created)
#17 0.633 
#17 0.633 > mi-app@0.0.0 build
#17 0.633 > node scripts/sync-samples.cjs && NODE_OPTIONS='--max-old-space-size=4096' vite build
#17 0.633 
#17 0.672 ✅ Sincronización completa. 34 pitos y 20 bajos detectados.
#17 0.672 📂 Lista guardada en: /app/public/muestrasLocales.json
#17 1.097 vite v6.4.1 building for production...
#17 1.376 transforming...
#17 24.98 ✓ 4049 modules transformed.
#17 30.08 rendering chunks...
#17 46.99 [plugin vite:reporter] 
#17 46.99 (!) /app/src/servicios/usuariosAdminService.ts is dynamically imported by /app/src/Paginas/administrador/Usuarios/GestionUsuarios.tsx, /app/src/Paginas/administrador/Usuarios/GestionUsuarios.tsx but also statically imported by /app/src/Paginas/administrador/Usuarios/Componentes/CrearUsuario.tsx, /app/src/Paginas/administrador/Usuarios/Componentes/DetalleUsuario.tsx, /app/src/Paginas/administrador/Usuarios/GestionUsuarios.tsx, dynamic import will not move module into another chunk.
#17 46.99 