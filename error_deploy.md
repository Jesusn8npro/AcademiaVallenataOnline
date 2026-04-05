Commit: Fix: fija typescript-eslint compatible con Node 22.11 
##########################################
### Download Github Archive Started...
### Mon, 30 Mar 2026 22:34:15 GMT
##########################################


╔═════════════════════ Nixpacks v1.34.1 ═════════════════════╗
║ setup      │ nodejs_22                                     ║
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
#1 transferring dockerfile: 2.04kB done
#1 DONE 0.0s

#2 [internal] load metadata for ghcr.io/railwayapp/nixpacks:ubuntu-1741046653
#2 DONE 0.1s

#3 [internal] load .dockerignore
#3 transferring context: 110B done
#3 DONE 0.0s

#4 [stage-0  1/15] FROM ghcr.io/railwayapp/nixpacks:ubuntu-1741046653@sha256:ed406b77fb751927991b8655e76c33a4521c4957c2afeab293be7c63c2a373d2
#4 DONE 0.0s

#5 [internal] load build context
#5 transferring context: 68.37MB 0.6s done
#5 DONE 0.6s

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
#14 DONE 0.4s

#15 [stage-0 11/15] RUN --mount=type=cache,id=V13bXEaLGp4-/root/npm,target=/root/.npm npm install
#15 16.10 
#15 16.10 added 532 packages, and audited 533 packages in 16s
#15 16.10 
#15 16.10 128 packages are looking for funding
#15 16.10   run `npm fund` for details
#15 16.10 
#15 16.10 found 0 vulnerabilities
#15 DONE 16.4s

#16 [stage-0 12/15] COPY . /app/.
#16 DONE 1.4s

#17 [stage-0 13/15] RUN --mount=type=cache,id=V13bXEaLGp4-node_modules/cache,target=/app/node_modules/.cache npm run build
#17 0.625 
#17 0.625 > mi-app@0.0.0 build
#17 0.625 > node scripts/sync-samples.cjs && node --max-old-space-size=4096 ./node_modules/vite/bin/vite.js build
#17 0.625 
#17 0.668 ✅ Sincronización completa. 34 pitos y 20 bajos detectados.
#17 0.668 📂 Lista guardada en: /app/public/muestrasLocales.json
#17 1.029 vite v6.4.1 building for production...
#17 1.329 transforming...
#17 2.920 
#17 2.920 /images/Jesus-Gonzalez--Fondo.jpg referenced in /images/Jesus-Gonzalez--Fondo.jpg didn't resolve at build time, it will remain unchanged to be resolved at runtime
#17 27.29 ✓ 4036 modules transformed.
#17 31.12 rendering chunks...