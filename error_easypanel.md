Commit: chore: remove svelte artifacts and merge static assets into public 
##########################################
### Download Github Archive Started...
### Wed, 17 Dec 2025 20:15:55 GMT
##########################################


╔═════════════════════ Nixpacks v1.34.1 ═════════════════════╗
║ setup      │ nodejs_22, npm-9_x                            ║
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
#12 DONE 0.4s

#13 [stage-0  9/15] RUN  caddy fmt --overwrite /assets/Caddyfile
#13 DONE 0.5s

#14 [stage-0 10/15] COPY . /app/.
#14 DONE 0.6s

#15 [stage-0 11/15] RUN --mount=type=cache,id=V13bXEaLGp4-/root/npm,target=/root/.npm npm install
#15 5.034 npm error code EBADENGINE
#15 5.034 npm error engine Unsupported engine
#15 5.034 npm error engine Not compatible with your version of node/npm: mi-app@0.0.0
#15 5.034 npm error notsup Not compatible with your version of node/npm: mi-app@0.0.0
#15 5.034 npm error notsup Required: {"node":">=22.12.0"}
#15 5.034 npm error notsup Actual:   {"npm":"10.9.0","node":"v22.11.0"}
#15 5.036 npm notice
#15 5.036 npm notice New major version of npm available! 10.9.0 -> 11.7.0
#15 5.036 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.7.0
#15 5.036 npm notice To update run: npm install -g npm@11.7.0
#15 5.036 npm notice
#15 5.037 npm error A complete log of this run can be found in: /root/.npm/_logs/2025-12-17T20_16_03_361Z-debug-0.log
#15 ERROR: process "/bin/bash -ol pipefail -c npm install" did not complete successfully: exit code: 1
------
 > [stage-0 11/15] RUN --mount=type=cache,id=V13bXEaLGp4-/root/npm,target=/root/.npm npm install:
5.034 npm error engine Not compatible with your version of node/npm: mi-app@0.0.0
5.034 npm error notsup Not compatible with your version of node/npm: mi-app@0.0.0
5.034 npm error notsup Required: {"node":">=22.12.0"}
5.034 npm error notsup Actual:   {"npm":"10.9.0","node":"v22.11.0"}
5.036 npm notice
5.036 npm notice New major version of npm available! 10.9.0 -> 11.7.0
5.036 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.7.0
5.036 npm notice To update run: npm install -g npm@11.7.0
5.036 npm notice
5.037 npm error A complete log of this run can be found in: /root/.npm/_logs/2025-12-17T20_16_03_361Z-debug-0.log
------

 1 warning found (use docker --debug to expand):
 - UndefinedVar: Usage of undefined variable '$NIXPACKS_PATH' (line 24)
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
### Wed, 17 Dec 2025 20:16:08 GMT
##########################################

Command failed with exit code 1: docker buildx build --network host -f /etc/easypanel/projects/academiavallenataonline_app/academiavallenataonline_app_2026/code/.nixpacks/Dockerfile -t easypanel/academiavallenataonline_app/academiavallenataonline_app_2026 --label 'keep=true' --build-arg 'GIT_SHA=3d8cce921dfe814be9749a99df480f24fe4ab693' /etc/easypanel/projects/academiavallenataonline_app/academiavallenataonline_app_2026/code/