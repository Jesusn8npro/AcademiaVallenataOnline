Commit: Security: Reactivación de ofuscación de código con configuración de alta seguridad 
##########################################
### Download Github Archive Started...
### Sun, 12 Apr 2026 21:35:44 GMT
##########################################


╔═════════════════════ Nixpacks v1.34.1 ═════════════════════╗
║ setup      │ nodejs-22_x, python3, pkg-config              ║
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
#5 transferring context: 100.06MB 0.7s done
#5 DONE 0.8s

#6 [stage-0  4/15] RUN nix-env -if .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix && nix-collect-garbage -d
#6 CACHED

#7 [stage-0  2/15] WORKDIR /app/
#7 CACHED

#8 [stage-0  3/15] COPY .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix
#8 CACHED

#9 [stage-0  5/15] COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix
#9 CACHED

#10 [stage-0  6/15] RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d
#10 0.125 unpacking 'https://github.com/NixOS/nixpkgs/archive/ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.tar.gz' into the Git cache...
#10 39.10 unpacking 'https://github.com/railwayapp/nix-npm-overlay/archive/main.tar.gz' into the Git cache...
#10 39.52 installing 'ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env'
#10 40.10 error:
#10 40.10        … while calling the 'derivationStrict' builtin
#10 40.10          at <nix/derivation-internal.nix>:37:12:
#10 40.10            36|
#10 40.10            37|   strict = derivationStrict drvAttrs;
#10 40.10              |            ^
#10 40.10            38|
#10 40.10 
#10 40.10        … while evaluating derivation 'ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env'
#10 40.10          whose name attribute is located at /nix/store/lwi59jcfwk2lnrakmm1y5vw85hj3n1bi-source/pkgs/stdenv/generic/make-derivation.nix:375:7
#10 40.10 
#10 40.10        … while evaluating attribute 'passAsFile' of derivation 'ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env'
#10 40.10          at /nix/store/lwi59jcfwk2lnrakmm1y5vw85hj3n1bi-source/pkgs/build-support/trivial-builders/default.nix:60:9:
#10 40.10            59|         inherit buildCommand name;
#10 40.10            60|         passAsFile = [ "buildCommand" ]
#10 40.10              |         ^
#10 40.10            61|           ++ (derivationArgs.passAsFile or [ ]);
#10 40.10 
#10 40.10        (stack trace truncated; use '--show-trace' to show the full, detailed trace)
#10 40.10 
#10 40.10        error: undefined variable 'nodejs-22_x'
#10 40.10        at /app/.nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix:19:9:
#10 40.10            18|         '')
#10 40.10            19|         nodejs-22_x pkg-config python3
#10 40.10              |         ^
#10 40.10            20|       ];
#10 ERROR: process "/bin/bash -ol pipefail -c nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d" did not complete successfully: exit code: 1
------
 > [stage-0  6/15] RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d:
40.10            61|           ++ (derivationArgs.passAsFile or [ ]);
40.10 
40.10        (stack trace truncated; use '--show-trace' to show the full, detailed trace)
40.10 
40.10        error: undefined variable 'nodejs-22_x'
40.10        at /app/.nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix:19:9:
40.10            18|         '')
40.10            19|         nodejs-22_x pkg-config python3
40.10              |         ^
40.10            20|       ];
------

 7 warnings found (use docker --debug to expand):
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_SUPABASE_ANON_KEY") (line 14)
 - UndefinedVar: Usage of undefined variable '$NIXPACKS_PATH' (line 24)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_EPAYCO_PRIVATE_KEY") (line 13)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_GIPHY_API_KEY") (line 13)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "VITE_SUPABASE_ANON_KEY") (line 13)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_EPAYCO_PRIVATE_KEY") (line 14)
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "VITE_GIPHY_API_KEY") (line 14)
Dockerfile:10
--------------------
   8 |     RUN nix-env -if .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix && nix-collect-garbage -d
   9 |     COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix
  10 | >>> RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d
  11 |     
  12 |     COPY .nixpacks/assets /assets/
--------------------
ERROR: failed to build: failed to solve: process "/bin/bash -ol pipefail -c nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d" did not complete successfully: exit code: 1
##########################################
### Error
### Sun, 12 Apr 2026 21:36:34 GMT
##########################################

Command failed with exit code 1: docker buildx build --network host -f /etc/easypanel/projects/academiavallenataonline_app/academiavallenataonline_app_2026/code/.nixpacks/Dockerfile -t easypanel/academiavallenataonline_app/academiavallenataonline_app_2026 --label 'keep=true' --build-arg 'VITE_SUPABASE_URL=https://tbijzvtyyewhtwgakgka.supabase.co' --build-arg 'VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiaWp6dnR5eWV3aHR3Z2FrZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NTQyNjIsImV4cCI6MjA1ODUzMDI2Mn0.P09L8OpLpcrm5XzTLAN0oQllhl_bePk5bxbUUpoG-cQ' --build-arg 'VITE_EPAYCO_PUBLIC_KEY=a04d60e2e678d5bd89a58d26f3413fdb' --build-arg 'VITE_EPAYCO_PRIVATE_KEY=83ec651809bb7d11fcd114b16777bfa1' --build-arg 'VITE_EPAYCO_CUSTOMER_ID=37257' --build-arg 'VITE_EPAYCO_TEST_MODE=true' --build-arg 'VITE_GIPHY_API_KEY=Kj3vAtPH8E0gWaVO2amamR5xazoGL36q' --build-arg 'VITE_APP_URL=http://localhost:5173' --build-arg 'VITE_BASE_URL=http://localhost:5173' --build-arg 'NODE_ENV=development' --build-arg 'GIT_SHA=9e3f008db9af3cdc5cbe5fedbf04062414cad277' /etc/easypanel/projects/academiavallenataonline_app/academiavallenataonline_app_2026/code/