Commit: Fix: Remover imagen faltante que bloqueaba el build (Jesus-Gonzalez--Fondo.jpg) 
##########################################
### Download Github Archive Started...
### Mon, 13 Apr 2026 05:33:58 GMT
##########################################


╔═════════════════════ Nixpacks v1.34.1 ═════════════════════╗
║ setup      │ nodejs, python3, pkg-config                   ║
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
#2 DONE 0.4s

#3 [internal] load .dockerignore
#3 transferring context: 110B done
#3 DONE 0.0s

#4 [stage-0  1/15] FROM ghcr.io/railwayapp/nixpacks:ubuntu-1741046653@sha256:ed406b77fb751927991b8655e76c33a4521c4957c2afeab293be7c63c2a373d2
#4 resolve ghcr.io/railwayapp/nixpacks:ubuntu-1741046653@sha256:ed406b77fb751927991b8655e76c33a4521c4957c2afeab293be7c63c2a373d2 done
#4 sha256:82afdcbbf1dd44bb728577e4e48f1c9ca00dde78318a60985b01018dc2803a46 4.37kB / 4.37kB done
#4 sha256:ed406b77fb751927991b8655e76c33a4521c4957c2afeab293be7c63c2a373d2 1.61kB / 1.61kB done
#4 sha256:53a1550a769bb935ad1d80f12dfd0ae96a8ec35865d8e6b956cdb79f3ae49e5e 868B / 868B done
#4 DONE 0.1s

#5 [internal] load build context
#5 ...

#6 [stage-0  2/15] WORKDIR /app/
#6 DONE 0.0s

#5 [internal] load build context
#5 transferring context: 100.08MB 0.7s done
#5 DONE 0.8s

#7 [stage-0  3/15] COPY .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix
#7 DONE 0.1s

#8 [stage-0  4/15] RUN nix-env -if .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix && nix-collect-garbage -d
#8 0.292 unpacking 'https://github.com/NixOS/nixpkgs/archive/ba913eda2df8eb72147259189d55932012df6301.tar.gz' into the Git cache...
#8 37.85 installing 'ba913eda2df8eb72147259189d55932012df6301-env'
#8 38.86 these 4 derivations will be built:
#8 38.86   /nix/store/x9qrr2jb0d9d7gjg77imaric1nr9wl3s-libraries.drv
#8 38.86   /nix/store/4vjgp6bh2gja20gkg167x66kgk10c24j-ba913eda2df8eb72147259189d55932012df6301-env.drv
#8 38.86   /nix/store/hpybn12g5ny53hbyvrlvzdl3hpk392ql-builder.pl.drv
#8 38.86   /nix/store/llvngay9gncvs8l6dw01c6wlbh35zzf0-ba913eda2df8eb72147259189d55932012df6301-env.drv
#8 38.86 these 38 paths will be fetched (32.50 MiB download, 164.56 MiB unpacked):
#8 38.86   /nix/store/mjgi65m3hgzqqvqcix848gskkw5zzwi9-acl-2.3.2
#8 38.86   /nix/store/5nk2ga7i2f030am4qpcdsd8qlk6i3z83-attr-2.5.2
#8 38.86   /nix/store/306znyj77fv49kwnkpxmb0j2znqpa8bj-bash-5.2p26
#8 38.86   /nix/store/xwcf1rw3ackqp2vxms9myf9jq2ny6ynv-bzip2-1.0.8
#8 38.86   /nix/store/mxcq77rlan82dzpv3cgj0fh6qvv8ncil-bzip2-1.0.8-bin
#8 38.86   /nix/store/1iz89fy5fi998g43z1m4j7s5f095di68-caddy-2.8.4
#8 38.86   /nix/store/php4qidg2bxzmm79vpri025bqi0fa889-coreutils-9.5
#8 38.86   /nix/store/i34mknsjgrfyy71k2h79gda0bvagzc2j-diffutils-3.10
#8 38.86   /nix/store/1sffjkg6c6ff16fz5yr0pnz3j7vja42h-ed-1.20.2
#8 38.86   /nix/store/xx7x1dwybpssfhq8yikvzz38bh3yrq97-file-5.45
#8 38.86   /nix/store/jjcsr5gs4qanf7ln5c6wgcq4sn75a978-findutils-4.9.0
#8 38.86   /nix/store/8vvkbgmnin1x2jkp7wcb2zg1p0vc4ks9-gawk-5.2.2
#8 38.86   /nix/store/xvzz97yk73hw03v5dhhz3j47ggwf1yq1-gcc-13.2.0-lib
#8 38.86   /nix/store/0rxb3ixzk4zaqivc9s795m0a3679wbw2-gcc-13.2.0-libgcc
#8 38.86   /nix/store/k7zgvzp2r31zkg9xqgjim7mbknryv6bs-glibc-2.39-52
#8 38.86   /nix/store/7ivacs3m2fm19hyxdmrs05xisj82v6y5-gmp-with-cxx-6.3.0
#8 38.86   /nix/store/4i0j14zymvlngyyhq2254f4g9m9my98y-gnu-config-2024-01-01
#8 38.86   /nix/store/28gpmx3z6ss3znd7fhmrzmvk3x5lnfbk-gnugrep-3.11
#8 38.86   /nix/store/cdzpn0rdq810aknww3w9fy3wmw9ixr66-gnumake-4.4.1
#8 38.86   /nix/store/5zjms21vpxlkbc0qyl5pmj2sidfmzmd7-gnused-4.9
#8 38.86   /nix/store/rik7p68cq7yzlj5pmfpf4yv6jnrpvlgf-gnutar-1.35
#8 38.86   /nix/store/j5chw7v1x3vlmf3wmdpdb5gwh9hl0b80-gzip-1.13
#8 38.86   /nix/store/dzsby2vk02jcn0s43fkna2qqqix6ccy1-iana-etc-20240318
#8 38.86   /nix/store/ic63ay0py10fyryaw7345k4ps32da33w-libidn2-2.3.7
#8 38.86   /nix/store/yfp7dr8m7zi7kxk49wd714gwvhb105hf-libunistring-1.1
#8 38.86   /nix/store/5xynf9c9ml7d97q70kpq9rpqqmx13xl8-libxcrypt-4.4.36
#8 38.86   /nix/store/zk9ybjjixdwyv3jmpg2i7s8p7iqi5vhh-mailcap-2.1.53
#8 38.86   /nix/store/0lfxbmchigx9vs9qmrlbahcy6nxwfnj1-patch-2.7.6
#8 38.86   /nix/store/nbad47q0m0m9c5xid7zh05hiknwircbp-patchelf-0.15.0
#8 38.86   /nix/store/g3vi60zgyjsvij7xkk6dxky1hkwh0ynd-pcre2-10.43
#8 38.86   /nix/store/1iscdpbd3x9x3s3s25jd5ppl7yra0b77-perl-5.38.2
#8 38.86   /nix/store/rg6agzlb4gcl4w2126m16qm4mgr8jgi6-stdenv-linux
#8 38.86   /nix/store/y6hmqbmbwq0rmx1fzix5c5jszla2pzmp-tzdata-2024a
#8 38.86   /nix/store/bq6xbl9cq6hkcn65mz2fzc2k38xiv87h-update-autotools-gnu-config-scripts-hook
#8 38.86   /nix/store/1q9vc0lq7qjlfjz47mfmlzdf86c543jy-xgcc-13.2.0-libgcc
#8 38.86   /nix/store/lphbn1va4i43fj7f3m9xskf9y86khzf3-xz-5.4.6
#8 38.86   /nix/store/6i4xxaa812vsbli9jkq4mksdddrk27lw-xz-5.4.6-bin
#8 38.86   /nix/store/lv6nackqis28gg7l2ic43f6nk52hb39g-zlib-1.3.1
#8 38.87 copying path '/nix/store/dzsby2vk02jcn0s43fkna2qqqix6ccy1-iana-etc-20240318' from 'https://cache.nixos.org'...
#8 38.87 copying path '/nix/store/zk9ybjjixdwyv3jmpg2i7s8p7iqi5vhh-mailcap-2.1.53' from 'https://cache.nixos.org'...
#8 38.87 copying path '/nix/store/y6hmqbmbwq0rmx1fzix5c5jszla2pzmp-tzdata-2024a' from 'https://cache.nixos.org'...
#8 38.87 copying path '/nix/store/4i0j14zymvlngyyhq2254f4g9m9my98y-gnu-config-2024-01-01' from 'https://cache.nixos.org'...
#8 38.87 copying path '/nix/store/1q9vc0lq7qjlfjz47mfmlzdf86c543jy-xgcc-13.2.0-libgcc' from 'https://cache.nixos.org'...
#8 38.88 copying path '/nix/store/0rxb3ixzk4zaqivc9s795m0a3679wbw2-gcc-13.2.0-libgcc' from 'https://cache.nixos.org'...
#8 38.88 copying path '/nix/store/yfp7dr8m7zi7kxk49wd714gwvhb105hf-libunistring-1.1' from 'https://cache.nixos.org'...
#8 38.93 copying path '/nix/store/bq6xbl9cq6hkcn65mz2fzc2k38xiv87h-update-autotools-gnu-config-scripts-hook' from 'https://cache.nixos.org'...
#8 38.99 copying path '/nix/store/ic63ay0py10fyryaw7345k4ps32da33w-libidn2-2.3.7' from 'https://cache.nixos.org'...
#8 39.04 copying path '/nix/store/k7zgvzp2r31zkg9xqgjim7mbknryv6bs-glibc-2.39-52' from 'https://cache.nixos.org'...
#8 39.53 copying path '/nix/store/306znyj77fv49kwnkpxmb0j2znqpa8bj-bash-5.2p26' from 'https://cache.nixos.org'...
#8 39.53 copying path '/nix/store/5nk2ga7i2f030am4qpcdsd8qlk6i3z83-attr-2.5.2' from 'https://cache.nixos.org'...
#8 39.53 copying path '/nix/store/1iz89fy5fi998g43z1m4j7s5f095di68-caddy-2.8.4' from 'https://cache.nixos.org'...
#8 39.53 copying path '/nix/store/1sffjkg6c6ff16fz5yr0pnz3j7vja42h-ed-1.20.2' from 'https://cache.nixos.org'...
#8 39.53 copying path '/nix/store/xwcf1rw3ackqp2vxms9myf9jq2ny6ynv-bzip2-1.0.8' from 'https://cache.nixos.org'...
#8 39.53 copying path '/nix/store/xvzz97yk73hw03v5dhhz3j47ggwf1yq1-gcc-13.2.0-lib' from 'https://cache.nixos.org'...
#8 39.53 copying path '/nix/store/cdzpn0rdq810aknww3w9fy3wmw9ixr66-gnumake-4.4.1' from 'https://cache.nixos.org'...
#8 39.53 copying path '/nix/store/5zjms21vpxlkbc0qyl5pmj2sidfmzmd7-gnused-4.9' from 'https://cache.nixos.org'...
#8 39.53 copying path '/nix/store/5xynf9c9ml7d97q70kpq9rpqqmx13xl8-libxcrypt-4.4.36' from 'https://cache.nixos.org'...
#8 39.53 copying path '/nix/store/g3vi60zgyjsvij7xkk6dxky1hkwh0ynd-pcre2-10.43' from 'https://cache.nixos.org'...
#8 39.53 copying path '/nix/store/lphbn1va4i43fj7f3m9xskf9y86khzf3-xz-5.4.6' from 'https://cache.nixos.org'...
#8 39.53 copying path '/nix/store/lv6nackqis28gg7l2ic43f6nk52hb39g-zlib-1.3.1' from 'https://cache.nixos.org'...
#8 39.53 copying path '/nix/store/8vvkbgmnin1x2jkp7wcb2zg1p0vc4ks9-gawk-5.2.2' from 'https://cache.nixos.org'...
#8 39.63 copying path '/nix/store/mjgi65m3hgzqqvqcix848gskkw5zzwi9-acl-2.3.2' from 'https://cache.nixos.org'...
#8 39.63 copying path '/nix/store/0lfxbmchigx9vs9qmrlbahcy6nxwfnj1-patch-2.7.6' from 'https://cache.nixos.org'...
#8 39.63 copying path '/nix/store/mxcq77rlan82dzpv3cgj0fh6qvv8ncil-bzip2-1.0.8-bin' from 'https://cache.nixos.org'...
#8 39.65 copying path '/nix/store/xx7x1dwybpssfhq8yikvzz38bh3yrq97-file-5.45' from 'https://cache.nixos.org'...
#8 39.71 copying path '/nix/store/28gpmx3z6ss3znd7fhmrzmvk3x5lnfbk-gnugrep-3.11' from 'https://cache.nixos.org'...
#8 39.76 copying path '/nix/store/j5chw7v1x3vlmf3wmdpdb5gwh9hl0b80-gzip-1.13' from 'https://cache.nixos.org'...
#8 39.78 copying path '/nix/store/6i4xxaa812vsbli9jkq4mksdddrk27lw-xz-5.4.6-bin' from 'https://cache.nixos.org'...
#8 39.85 copying path '/nix/store/7ivacs3m2fm19hyxdmrs05xisj82v6y5-gmp-with-cxx-6.3.0' from 'https://cache.nixos.org'...
#8 39.85 copying path '/nix/store/nbad47q0m0m9c5xid7zh05hiknwircbp-patchelf-0.15.0' from 'https://cache.nixos.org'...
#8 39.87 copying path '/nix/store/rik7p68cq7yzlj5pmfpf4yv6jnrpvlgf-gnutar-1.35' from 'https://cache.nixos.org'...
#8 39.93 copying path '/nix/store/php4qidg2bxzmm79vpri025bqi0fa889-coreutils-9.5' from 'https://cache.nixos.org'...
#8 40.01 copying path '/nix/store/i34mknsjgrfyy71k2h79gda0bvagzc2j-diffutils-3.10' from 'https://cache.nixos.org'...
#8 40.01 copying path '/nix/store/1iscdpbd3x9x3s3s25jd5ppl7yra0b77-perl-5.38.2' from 'https://cache.nixos.org'...
#8 40.01 copying path '/nix/store/jjcsr5gs4qanf7ln5c6wgcq4sn75a978-findutils-4.9.0' from 'https://cache.nixos.org'...
#8 40.13 copying path '/nix/store/rg6agzlb4gcl4w2126m16qm4mgr8jgi6-stdenv-linux' from 'https://cache.nixos.org'...
#8 40.23 building '/nix/store/hpybn12g5ny53hbyvrlvzdl3hpk392ql-builder.pl.drv'...
#8 40.44 building '/nix/store/x9qrr2jb0d9d7gjg77imaric1nr9wl3s-libraries.drv'...
#8 40.71 building '/nix/store/4vjgp6bh2gja20gkg167x66kgk10c24j-ba913eda2df8eb72147259189d55932012df6301-env.drv'...
#8 41.31 building '/nix/store/llvngay9gncvs8l6dw01c6wlbh35zzf0-ba913eda2df8eb72147259189d55932012df6301-env.drv'...
#8 41.38 created 4 symlinks in user environment
#8 41.44 building '/nix/store/6zxkblvgw1ay1kb3a7ghxcqdgbyc7pk9-user-environment.drv'...
#8 41.64 removing old generations of profile /nix/var/nix/profiles/per-user/root/channels
#8 41.64 removing old generations of profile /nix/var/nix/profiles/per-user/root/profile
#8 41.64 removing profile version 1
#8 41.64 removing old generations of profile /nix/var/nix/profiles/per-user/root/channels
#8 41.64 removing old generations of profile /nix/var/nix/profiles/per-user/root/profile
#8 41.65 finding garbage collector roots...
#8 41.65 removing stale link from '/nix/var/nix/gcroots/auto/lzjbmb2ry0z7lma2fvpqprb12921pnb5' to '/nix/var/nix/profiles/per-user/root/profile-1-link'
#8 41.66 deleting garbage...
#8 41.66 deleting '/nix/store/ir9fki7838bmk4hlj0zmwbw45q101j66-user-environment.drv'
#8 41.66 deleting '/nix/store/b9rj4wk1cxh7g2ib89aqbcapzzar8p2s-user-environment'
#8 41.67 deleting '/nix/store/xxyn8jfxcpr5ac9dvismfzx39ijh9kiv-env-manifest.nix'
#8 41.70 deleting '/nix/store/rg6agzlb4gcl4w2126m16qm4mgr8jgi6-stdenv-linux'
#8 41.71 deleting '/nix/store/nbad47q0m0m9c5xid7zh05hiknwircbp-patchelf-0.15.0'
#8 41.71 deleting '/nix/store/jjcsr5gs4qanf7ln5c6wgcq4sn75a978-findutils-4.9.0'
#8 41.72 deleting '/nix/store/i34mknsjgrfyy71k2h79gda0bvagzc2j-diffutils-3.10'
#8 41.73 deleting '/nix/store/1iscdpbd3x9x3s3s25jd5ppl7yra0b77-perl-5.38.2'
#8 41.91 deleting '/nix/store/php4qidg2bxzmm79vpri025bqi0fa889-coreutils-9.5'
#8 41.91 deleting '/nix/store/7ivacs3m2fm19hyxdmrs05xisj82v6y5-gmp-with-cxx-6.3.0'
#8 41.91 deleting '/nix/store/xvzz97yk73hw03v5dhhz3j47ggwf1yq1-gcc-13.2.0-lib'
#8 41.92 deleting '/nix/store/0rxb3ixzk4zaqivc9s795m0a3679wbw2-gcc-13.2.0-libgcc'
#8 41.92 deleting '/nix/store/4vkw8ifh2naxmxl323vzq0scm0l36c1v-builder.pl'
#8 41.92 deleting '/nix/store/5zjms21vpxlkbc0qyl5pmj2sidfmzmd7-gnused-4.9'
#8 41.93 deleting '/nix/store/0lfxbmchigx9vs9qmrlbahcy6nxwfnj1-patch-2.7.6'
#8 41.93 deleting '/nix/store/1sffjkg6c6ff16fz5yr0pnz3j7vja42h-ed-1.20.2'
#8 41.93 deleting '/nix/store/mxcq77rlan82dzpv3cgj0fh6qvv8ncil-bzip2-1.0.8-bin'
#8 41.93 deleting '/nix/store/xwcf1rw3ackqp2vxms9myf9jq2ny6ynv-bzip2-1.0.8'
#8 41.93 deleting '/nix/store/xx7x1dwybpssfhq8yikvzz38bh3yrq97-file-5.45'
#8 41.94 deleting '/nix/store/rik7p68cq7yzlj5pmfpf4yv6jnrpvlgf-gnutar-1.35'
#8 41.94 deleting '/nix/store/mjgi65m3hgzqqvqcix848gskkw5zzwi9-acl-2.3.2'
#8 41.95 deleting '/nix/store/bq6xbl9cq6hkcn65mz2fzc2k38xiv87h-update-autotools-gnu-config-scripts-hook'
#8 41.95 deleting '/nix/store/4i0j14zymvlngyyhq2254f4g9m9my98y-gnu-config-2024-01-01'
#8 41.95 deleting '/nix/store/6i4xxaa812vsbli9jkq4mksdddrk27lw-xz-5.4.6-bin'
#8 41.95 deleting '/nix/store/lphbn1va4i43fj7f3m9xskf9y86khzf3-xz-5.4.6'
#8 41.96 deleting '/nix/store/5nk2ga7i2f030am4qpcdsd8qlk6i3z83-attr-2.5.2'
#8 41.96 deleting '/nix/store/j5chw7v1x3vlmf3wmdpdb5gwh9hl0b80-gzip-1.13'
#8 41.96 deleting '/nix/store/5xynf9c9ml7d97q70kpq9rpqqmx13xl8-libxcrypt-4.4.36'
#8 41.96 deleting '/nix/store/cdzpn0rdq810aknww3w9fy3wmw9ixr66-gnumake-4.4.1'
#8 41.97 deleting '/nix/store/8vvkbgmnin1x2jkp7wcb2zg1p0vc4ks9-gawk-5.2.2'
#8 41.98 deleting '/nix/store/306znyj77fv49kwnkpxmb0j2znqpa8bj-bash-5.2p26'
#8 41.98 deleting '/nix/store/28gpmx3z6ss3znd7fhmrzmvk3x5lnfbk-gnugrep-3.11'
#8 41.99 deleting '/nix/store/lv6nackqis28gg7l2ic43f6nk52hb39g-zlib-1.3.1'
#8 41.99 deleting '/nix/store/jdxlsyfxs63rxxhrzgc3mnhx0mz6s595-libraries'
#8 41.99 deleting '/nix/store/g3vi60zgyjsvij7xkk6dxky1hkwh0ynd-pcre2-10.43'
#8 41.99 deleting '/nix/store/p5l041qdj83dg93parxblr0q0al3hhsc-source'
#8 45.73 deleting unused links...
#8 45.73 note: currently hard linking saves -0.00 MiB
#8 45.73 36 store paths deleted, 245.12 MiB freed
#8 DONE 45.8s

#9 [stage-0  5/15] COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix
#9 DONE 0.0s

#10 [stage-0  6/15] RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d
#10 0.116 unpacking 'https://github.com/NixOS/nixpkgs/archive/ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.tar.gz' into the Git cache...
#10 38.70 unpacking 'https://github.com/railwayapp/nix-npm-overlay/archive/main.tar.gz' into the Git cache...
#10 39.31 installing 'ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env'
#10 40.02 these 4 derivations will be built:
#10 40.02   /nix/store/kmkgqwwal88b9lch9dl53iqa3wsm6vdb-libraries.drv
#10 40.02   /nix/store/91aaayacr12psqb9fmp8arg1xafgg9v2-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env.drv
#10 40.02   /nix/store/9smjjb5pkmcbykz8p4786s3a4nq6m030-builder.pl.drv
#10 40.02   /nix/store/h9515wp0z14am7h46nx4lj85cmwc290f-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env.drv
#10 40.02 these 66 paths will be fetched (96.94 MiB download, 394.45 MiB unpacked):
#10 40.02   /nix/store/cf7gkacyxmm66lwl5nj6j6yykbrg4q5c-acl-2.3.2
#10 40.02   /nix/store/a9jgnlhkjkxav6qrc3rzg2q84pkl2wvr-attr-2.5.2
#10 40.02   /nix/store/5mh7kaj2fyv8mk4sfq1brwxgc02884wi-bash-5.2p37
#10 40.02   /nix/store/ivl2v8rgg7qh1jkj5pwpqycax3rc2hnl-bzip2-1.0.8
#10 40.02   /nix/store/mglixp03lsp0w986svwdvm7vcy17rdax-bzip2-1.0.8-bin
#10 40.02   /nix/store/4s9rah4cwaxflicsk5cndnknqlk9n4p3-coreutils-9.5
#10 40.02   /nix/store/00g69vw7c9lycy63h45ximy0wmzqx5y6-diffutils-3.10
#10 40.02   /nix/store/74h4z8k82pmp24xryflv4lxkz8jlpqqd-ed-1.20.2
#10 40.02   /nix/store/5ayb629gzbkc3amm6zd5jp1aciprb2zs-expat-2.6.4
#10 40.02   /nix/store/c4rj90r2m89rxs64hmm857mipwjhig5d-file-5.46
#10 40.02   /nix/store/jqrz1vq5nz4lnv9pqzydj0ir58wbjfy1-findutils-4.10.0
#10 40.02   /nix/store/a3c47r5z1q2c4rz0kvq8hlilkhx2s718-gawk-5.3.1
#10 40.02   /nix/store/bpq1s72cw9qb2fs8mnmlw6hn2c7iy0ss-gcc-14-20241116-lib
#10 40.02   /nix/store/17v0ywnr3akp85pvdi56gwl99ljv95kx-gcc-14-20241116-libgcc
#10 40.02   /nix/store/2h8rk9xwa6xqy2pqk2lr2s57qbrx5p30-gdbm-1.24-lib
#10 40.02   /nix/store/65h17wjrrlsj2rj540igylrx7fqcd6vq-glibc-2.40-36
#10 40.02   /nix/store/a2byxfv4lc8f2g5xfzw8cz5q8k05wi29-gmp-with-cxx-6.3.0
#10 40.02   /nix/store/1m67ipsk39xvhyqrxnzv2m2p48pil8kl-gnu-config-2024-01-01
#10 40.02   /nix/store/aap6cq56amx4mzbyxp2wpgsf1kqjcr1f-gnugrep-3.11
#10 40.02   /nix/store/fp6cjl1zcmm6mawsnrb5yak1wkz2ma8l-gnumake-4.4.1
#10 40.02   /nix/store/abm77lnrkrkb58z6xp1qwjcr1xgkcfwm-gnused-4.9
#10 40.02   /nix/store/9cwwj1c9csmc85l2cqzs3h9hbf1vwl6c-gnutar-1.35
#10 40.02   /nix/store/nvvj6sk0k6px48436drlblf4gafgbvzr-gzip-1.13
#10 40.02   /nix/store/wwipgdqb4p2fr46kmw9c5wlk799kbl68-icu4c-74.2
#10 40.02   /nix/store/m8w3mf0i4862q22bxad0wspkgdy4jnkk-icu4c-74.2-dev
#10 40.02   /nix/store/nlqind4szw3amcmhgy4pd2n0894558gg-libX11-1.8.10
#10 40.02   /nix/store/hjbxiwsc587b8dc6v6pisa34aj10hq23-libXau-1.0.11
#10 40.02   /nix/store/c9gk656q2x8av467r06hcjag31drjfzh-libXdmcp-1.1.5
#10 40.02   /nix/store/r87iqz07igmwfvb12mgr6rmpb6353ys4-libXext-1.3.6
#10 40.02   /nix/store/r04wysx6yl7ys1rdv1b1lih6in1810r0-libffi-3.4.6
#10 40.02   /nix/store/5mb70vg3kdzkyn0zqdgm4f87mdi0yi4i-libglvnd-1.7.0
#10 40.02   /nix/store/34z2792zyd4ayl5186vx0s98ckdaccz9-libidn2-2.3.7
#10 40.02   /nix/store/xcqcgqazykf6s7fsn08k0blnh0wisdcl-libunistring-1.3
#10 40.02   /nix/store/r9ac2hwnmb0nxwsrvr6gi9wsqf2whfqj-libuv-1.49.2
#10 40.02   /nix/store/ll14czvpxglf6nnwmmrmygplm830fvlv-libuv-1.49.2-dev
#10 40.02   /nix/store/2j3c18398phz5c1376x2qvva8gx9g551-libxcb-1.17.0
#10 40.02   /nix/store/6cr0spsvymmrp1hj5n0kbaxw55w1lqyp-libxcrypt-4.4.36
#10 40.02   /nix/store/ky5k49f2byfjg49ci75ci89szy29hk4k-mailcap-2.1.54
#10 40.02   /nix/store/1aybnfshx1vxh7vi04bhfh1n69k15335-mpdecimal-4.0.0
#10 40.02   /nix/store/wm1qn5jqrxpcjkc640gq8a90ns5gw3cn-ncurses-6.4.20221231
#10 40.02   /nix/store/fkyp1bm5gll9adnfcj92snyym524mdrj-nodejs-22.11.0
#10 40.02   /nix/store/h1ydpxkw9qhjdxjpic1pdc2nirggyy6f-openssl-3.3.2
#10 40.02   /nix/store/lygl27c44xv73kx1spskcgvzwq7z337c-openssl-3.3.2-bin
#10 40.02   /nix/store/pp2zf8bdgyz60ds8vcshk2603gcjgp72-openssl-3.3.2-dev
#10 40.02   /nix/store/5yja5dpk2qw1v5mbfbl2d7klcdfrh90w-patch-2.7.6
#10 40.02   /nix/store/srfxqk119fijwnprgsqvn68ys9kiw0bn-patchelf-0.15.0
#10 40.02   /nix/store/3j1p598fivxs69wx3a657ysv3rw8k06l-pcre2-10.44
#10 40.02   /nix/store/1i003ijlh9i0mzp6alqby5hg3090pjdx-perl-5.40.0
#10 40.02   /nix/store/qymsiixx4v0q4qjmrhjbnrc4b4ghm7b8-pkg-config-0.29.2
#10 40.02   /nix/store/kvng1xl2g7g77mim1y51y5mqr4hnrsx5-pkg-config-0.29.2-man
#10 40.02   /nix/store/0d4m43yp69lrm8imxbqgl9zxjwwz52jw-pkg-config-wrapper-0.29.2
#10 40.02   /nix/store/xjpdc7ryah1y4l9m8qd5n1hcywfapwdi-pkg-config-wrapper-0.29.2-man
#10 40.02   /nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8
#10 40.02   /nix/store/9jzrcxf9wi9yp679il6j6zh6cq81p4s9-readline-8.2p13
#10 40.02   /nix/store/dj96qp9vps02l3n8xgc2vallqa9rhafb-sqlite-3.47.0
#10 40.02   /nix/store/yc39wvfz87i0bl8r6vnhq48n6clbx2pb-sqlite-3.47.0-bin
#10 40.02   /nix/store/i47d0rzbbnihcxkcaj48jgii5pj58djc-sqlite-3.47.0-dev
#10 40.02   /nix/store/4ig84cyqi6qy4n0sanrbzsw1ixa497jx-stdenv-linux
#10 40.02   /nix/store/gfkyf4hw4riqwgf5scfk8r8g69crbn4x-tzdata-2024b
#10 40.02   /nix/store/d29r1bdmlvwmj52apgcdxfl1mm9c5782-update-autotools-gnu-config-scripts-hook
#10 40.02   /nix/store/2phvd8h14vwls0da1kmsxc73vzmhkm3b-util-linux-minimal-2.39.4-lib
#10 40.02   /nix/store/acfkqzj5qrqs88a4a6ixnybbjxja663d-xgcc-14-20241116-libgcc
#10 40.02   /nix/store/c2njy6bv84kw1i4bjf5k5gn7gz8hn57n-xz-5.6.3
#10 40.02   /nix/store/h18s640fnhhj2qdh5vivcfbxvz377srg-xz-5.6.3-bin
#10 40.02   /nix/store/cqlaa2xf6lslnizyj9xqa8j0ii1yqw0x-zlib-1.3.1
#10 40.02   /nix/store/1lggwqzapn5mn49l9zy4h566ysv9kzdb-zlib-1.3.1-dev
#10 40.03 copying path '/nix/store/ky5k49f2byfjg49ci75ci89szy29hk4k-mailcap-2.1.54' from 'https://cache.nixos.org'...
#10 40.03 copying path '/nix/store/kvng1xl2g7g77mim1y51y5mqr4hnrsx5-pkg-config-0.29.2-man' from 'https://cache.nixos.org'...
#10 40.03 copying path '/nix/store/gfkyf4hw4riqwgf5scfk8r8g69crbn4x-tzdata-2024b' from 'https://cache.nixos.org'...
#10 40.03 copying path '/nix/store/17v0ywnr3akp85pvdi56gwl99ljv95kx-gcc-14-20241116-libgcc' from 'https://cache.nixos.org'...
#10 40.04 copying path '/nix/store/1m67ipsk39xvhyqrxnzv2m2p48pil8kl-gnu-config-2024-01-01' from 'https://cache.nixos.org'...
#10 40.04 copying path '/nix/store/acfkqzj5qrqs88a4a6ixnybbjxja663d-xgcc-14-20241116-libgcc' from 'https://cache.nixos.org'...
#10 40.04 copying path '/nix/store/xcqcgqazykf6s7fsn08k0blnh0wisdcl-libunistring-1.3' from 'https://cache.nixos.org'...
#10 40.04 copying path '/nix/store/xjpdc7ryah1y4l9m8qd5n1hcywfapwdi-pkg-config-wrapper-0.29.2-man' from 'https://cache.nixos.org'...
#10 40.07 copying path '/nix/store/d29r1bdmlvwmj52apgcdxfl1mm9c5782-update-autotools-gnu-config-scripts-hook' from 'https://cache.nixos.org'...
#10 40.11 copying path '/nix/store/34z2792zyd4ayl5186vx0s98ckdaccz9-libidn2-2.3.7' from 'https://cache.nixos.org'...
#10 40.13 copying path '/nix/store/65h17wjrrlsj2rj540igylrx7fqcd6vq-glibc-2.40-36' from 'https://cache.nixos.org'...
#10 40.58 copying path '/nix/store/a9jgnlhkjkxav6qrc3rzg2q84pkl2wvr-attr-2.5.2' from 'https://cache.nixos.org'...
#10 40.58 copying path '/nix/store/ivl2v8rgg7qh1jkj5pwpqycax3rc2hnl-bzip2-1.0.8' from 'https://cache.nixos.org'...
#10 40.58 copying path '/nix/store/74h4z8k82pmp24xryflv4lxkz8jlpqqd-ed-1.20.2' from 'https://cache.nixos.org'...
#10 40.58 copying path '/nix/store/5ayb629gzbkc3amm6zd5jp1aciprb2zs-expat-2.6.4' from 'https://cache.nixos.org'...
#10 40.58 copying path '/nix/store/abm77lnrkrkb58z6xp1qwjcr1xgkcfwm-gnused-4.9' from 'https://cache.nixos.org'...
#10 40.58 copying path '/nix/store/hjbxiwsc587b8dc6v6pisa34aj10hq23-libXau-1.0.11' from 'https://cache.nixos.org'...
#10 40.58 copying path '/nix/store/c9gk656q2x8av467r06hcjag31drjfzh-libXdmcp-1.1.5' from 'https://cache.nixos.org'...
#10 40.58 copying path '/nix/store/a3c47r5z1q2c4rz0kvq8hlilkhx2s718-gawk-5.3.1' from 'https://cache.nixos.org'...
#10 40.58 copying path '/nix/store/r04wysx6yl7ys1rdv1b1lih6in1810r0-libffi-3.4.6' from 'https://cache.nixos.org'...
#10 40.58 copying path '/nix/store/bpq1s72cw9qb2fs8mnmlw6hn2c7iy0ss-gcc-14-20241116-lib' from 'https://cache.nixos.org'...
#10 40.58 copying path '/nix/store/2h8rk9xwa6xqy2pqk2lr2s57qbrx5p30-gdbm-1.24-lib' from 'https://cache.nixos.org'...
#10 40.58 copying path '/nix/store/r9ac2hwnmb0nxwsrvr6gi9wsqf2whfqj-libuv-1.49.2' from 'https://cache.nixos.org'...
#10 40.58 copying path '/nix/store/6cr0spsvymmrp1hj5n0kbaxw55w1lqyp-libxcrypt-4.4.36' from 'https://cache.nixos.org'...
#10 40.58 copying path '/nix/store/fp6cjl1zcmm6mawsnrb5yak1wkz2ma8l-gnumake-4.4.1' from 'https://cache.nixos.org'...
#10 40.58 copying path '/nix/store/1aybnfshx1vxh7vi04bhfh1n69k15335-mpdecimal-4.0.0' from 'https://cache.nixos.org'...
#10 40.58 copying path '/nix/store/5mh7kaj2fyv8mk4sfq1brwxgc02884wi-bash-5.2p37' from 'https://cache.nixos.org'...
#10 40.59 copying path '/nix/store/wm1qn5jqrxpcjkc640gq8a90ns5gw3cn-ncurses-6.4.20221231' from 'https://cache.nixos.org'...
#10 40.60 copying path '/nix/store/mglixp03lsp0w986svwdvm7vcy17rdax-bzip2-1.0.8-bin' from 'https://cache.nixos.org'...
#10 40.61 copying path '/nix/store/cf7gkacyxmm66lwl5nj6j6yykbrg4q5c-acl-2.3.2' from 'https://cache.nixos.org'...
#10 40.61 copying path '/nix/store/h1ydpxkw9qhjdxjpic1pdc2nirggyy6f-openssl-3.3.2' from 'https://cache.nixos.org'...
#10 40.62 copying path '/nix/store/3j1p598fivxs69wx3a657ysv3rw8k06l-pcre2-10.44' from 'https://cache.nixos.org'...
#10 40.63 copying path '/nix/store/5yja5dpk2qw1v5mbfbl2d7klcdfrh90w-patch-2.7.6' from 'https://cache.nixos.org'...
#10 40.64 copying path '/nix/store/2j3c18398phz5c1376x2qvva8gx9g551-libxcb-1.17.0' from 'https://cache.nixos.org'...
#10 40.66 copying path '/nix/store/qymsiixx4v0q4qjmrhjbnrc4b4ghm7b8-pkg-config-0.29.2' from 'https://cache.nixos.org'...
#10 40.66 copying path '/nix/store/2phvd8h14vwls0da1kmsxc73vzmhkm3b-util-linux-minimal-2.39.4-lib' from 'https://cache.nixos.org'...
#10 40.66 copying path '/nix/store/c2njy6bv84kw1i4bjf5k5gn7gz8hn57n-xz-5.6.3' from 'https://cache.nixos.org'...
#10 40.67 copying path '/nix/store/ll14czvpxglf6nnwmmrmygplm830fvlv-libuv-1.49.2-dev' from 'https://cache.nixos.org'...
#10 40.70 copying path '/nix/store/cqlaa2xf6lslnizyj9xqa8j0ii1yqw0x-zlib-1.3.1' from 'https://cache.nixos.org'...
#10 40.71 copying path '/nix/store/9cwwj1c9csmc85l2cqzs3h9hbf1vwl6c-gnutar-1.35' from 'https://cache.nixos.org'...
#10 40.76 copying path '/nix/store/c4rj90r2m89rxs64hmm857mipwjhig5d-file-5.46' from 'https://cache.nixos.org'...
#10 40.76 copying path '/nix/store/dj96qp9vps02l3n8xgc2vallqa9rhafb-sqlite-3.47.0' from 'https://cache.nixos.org'...
#10 40.76 copying path '/nix/store/yc39wvfz87i0bl8r6vnhq48n6clbx2pb-sqlite-3.47.0-bin' from 'https://cache.nixos.org'...
#10 40.77 copying path '/nix/store/1lggwqzapn5mn49l9zy4h566ysv9kzdb-zlib-1.3.1-dev' from 'https://cache.nixos.org'...
#10 40.84 copying path '/nix/store/nvvj6sk0k6px48436drlblf4gafgbvzr-gzip-1.13' from 'https://cache.nixos.org'...
#10 40.84 copying path '/nix/store/0d4m43yp69lrm8imxbqgl9zxjwwz52jw-pkg-config-wrapper-0.29.2' from 'https://cache.nixos.org'...
#10 40.85 copying path '/nix/store/nlqind4szw3amcmhgy4pd2n0894558gg-libX11-1.8.10' from 'https://cache.nixos.org'...
#10 40.86 copying path '/nix/store/h18s640fnhhj2qdh5vivcfbxvz377srg-xz-5.6.3-bin' from 'https://cache.nixos.org'...
#10 40.91 copying path '/nix/store/aap6cq56amx4mzbyxp2wpgsf1kqjcr1f-gnugrep-3.11' from 'https://cache.nixos.org'...
#10 41.13 copying path '/nix/store/i47d0rzbbnihcxkcaj48jgii5pj58djc-sqlite-3.47.0-dev' from 'https://cache.nixos.org'...
#10 41.14 copying path '/nix/store/r87iqz07igmwfvb12mgr6rmpb6353ys4-libXext-1.3.6' from 'https://cache.nixos.org'...
#10 41.16 copying path '/nix/store/5mb70vg3kdzkyn0zqdgm4f87mdi0yi4i-libglvnd-1.7.0' from 'https://cache.nixos.org'...
#10 41.25 copying path '/nix/store/wwipgdqb4p2fr46kmw9c5wlk799kbl68-icu4c-74.2' from 'https://cache.nixos.org'...
#10 41.25 copying path '/nix/store/a2byxfv4lc8f2g5xfzw8cz5q8k05wi29-gmp-with-cxx-6.3.0' from 'https://cache.nixos.org'...
#10 41.25 copying path '/nix/store/srfxqk119fijwnprgsqvn68ys9kiw0bn-patchelf-0.15.0' from 'https://cache.nixos.org'...
#10 41.30 copying path '/nix/store/4s9rah4cwaxflicsk5cndnknqlk9n4p3-coreutils-9.5' from 'https://cache.nixos.org'...
#10 41.32 copying path '/nix/store/lygl27c44xv73kx1spskcgvzwq7z337c-openssl-3.3.2-bin' from 'https://cache.nixos.org'...
#10 41.40 copying path '/nix/store/pp2zf8bdgyz60ds8vcshk2603gcjgp72-openssl-3.3.2-dev' from 'https://cache.nixos.org'...
#10 41.44 copying path '/nix/store/00g69vw7c9lycy63h45ximy0wmzqx5y6-diffutils-3.10' from 'https://cache.nixos.org'...
#10 41.44 copying path '/nix/store/jqrz1vq5nz4lnv9pqzydj0ir58wbjfy1-findutils-4.10.0' from 'https://cache.nixos.org'...
#10 41.44 copying path '/nix/store/1i003ijlh9i0mzp6alqby5hg3090pjdx-perl-5.40.0' from 'https://cache.nixos.org'...
#10 41.56 copying path '/nix/store/9jzrcxf9wi9yp679il6j6zh6cq81p4s9-readline-8.2p13' from 'https://cache.nixos.org'...
#10 41.59 copying path '/nix/store/4ig84cyqi6qy4n0sanrbzsw1ixa497jx-stdenv-linux' from 'https://cache.nixos.org'...
#10 41.61 copying path '/nix/store/c9m6yd8fg1flz2j5r4bif1ib5j20a0cy-python3-3.12.8' from 'https://cache.nixos.org'...
#10 41.72 building '/nix/store/9smjjb5pkmcbykz8p4786s3a4nq6m030-builder.pl.drv'...
#10 42.14 building '/nix/store/kmkgqwwal88b9lch9dl53iqa3wsm6vdb-libraries.drv'...
#10 42.81 building '/nix/store/91aaayacr12psqb9fmp8arg1xafgg9v2-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env.drv'...
#10 42.98 copying path '/nix/store/m8w3mf0i4862q22bxad0wspkgdy4jnkk-icu4c-74.2-dev' from 'https://cache.nixos.org'...
#10 43.19 copying path '/nix/store/fkyp1bm5gll9adnfcj92snyym524mdrj-nodejs-22.11.0' from 'https://cache.nixos.org'...
#10 45.12 building '/nix/store/h9515wp0z14am7h46nx4lj85cmwc290f-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env.drv'...
#10 45.22 created 105 symlinks in user environment
#10 45.29 building '/nix/store/vs36jda6wqhri4n01xy7p8c3grmgpnn4-user-environment.drv'...
#10 45.50 removing old generations of profile /nix/var/nix/profiles/per-user/root/channels
#10 45.50 removing old generations of profile /nix/var/nix/profiles/per-user/root/profile
#10 45.50 removing profile version 2
#10 45.50 removing old generations of profile /nix/var/nix/profiles/per-user/root/channels
#10 45.50 removing old generations of profile /nix/var/nix/profiles/per-user/root/profile
#10 45.50 finding garbage collector roots...
#10 45.50 removing stale link from '/nix/var/nix/gcroots/auto/v73nmmh5d8van4ja5c8jn0gjlwhxbz3a' to '/nix/var/nix/profiles/per-user/root/profile-2-link'
#10 45.51 deleting garbage...
#10 45.58 deleting '/nix/store/4ig84cyqi6qy4n0sanrbzsw1ixa497jx-stdenv-linux'
#10 45.58 deleting '/nix/store/aap6cq56amx4mzbyxp2wpgsf1kqjcr1f-gnugrep-3.11'
#10 45.59 deleting '/nix/store/3j1p598fivxs69wx3a657ysv3rw8k06l-pcre2-10.44'
#10 45.59 deleting '/nix/store/a3c47r5z1q2c4rz0kvq8hlilkhx2s718-gawk-5.3.1'
#10 45.60 deleting '/nix/store/00g69vw7c9lycy63h45ximy0wmzqx5y6-diffutils-3.10'
#10 45.61 deleting '/nix/store/h18s640fnhhj2qdh5vivcfbxvz377srg-xz-5.6.3-bin'
#10 45.61 deleting '/nix/store/d29r1bdmlvwmj52apgcdxfl1mm9c5782-update-autotools-gnu-config-scripts-hook'
#10 45.61 deleting '/nix/store/1i003ijlh9i0mzp6alqby5hg3090pjdx-perl-5.40.0'
#10 45.71 deleting '/nix/store/srfxqk119fijwnprgsqvn68ys9kiw0bn-patchelf-0.15.0'
#10 45.71 deleting '/nix/store/mglixp03lsp0w986svwdvm7vcy17rdax-bzip2-1.0.8-bin'
#10 45.72 deleting '/nix/store/1m67ipsk39xvhyqrxnzv2m2p48pil8kl-gnu-config-2024-01-01'
#10 45.72 deleting '/nix/store/5yja5dpk2qw1v5mbfbl2d7klcdfrh90w-patch-2.7.6'
#10 45.72 deleting '/nix/store/c4rj90r2m89rxs64hmm857mipwjhig5d-file-5.46'
#10 45.72 deleting '/nix/store/9cwwj1c9csmc85l2cqzs3h9hbf1vwl6c-gnutar-1.35'
#10 45.73 deleting '/nix/store/1m82cbxhdbb85h3lykjpry4mnvyq5x0m-libraries'
#10 45.73 deleting '/nix/store/lwi59jcfwk2lnrakmm1y5vw85hj3n1bi-source'
#10 55.66 deleting '/nix/store/nvvj6sk0k6px48436drlblf4gafgbvzr-gzip-1.13'
#10 55.66 deleting '/nix/store/fp6cjl1zcmm6mawsnrb5yak1wkz2ma8l-gnumake-4.4.1'
#10 55.67 deleting '/nix/store/wf5zj2gbib3gjqllkabxaw4dh0gzcla3-builder.pl'
#10 55.67 deleting '/nix/store/abm77lnrkrkb58z6xp1qwjcr1xgkcfwm-gnused-4.9'
#10 55.67 deleting '/nix/store/2003hyg40f9kpv337jz3283smr3j9rnc-source'
#10 55.68 deleting '/nix/store/jqrz1vq5nz4lnv9pqzydj0ir58wbjfy1-findutils-4.10.0'
#10 55.68 deleting '/nix/store/74h4z8k82pmp24xryflv4lxkz8jlpqqd-ed-1.20.2'
#10 55.69 deleting '/nix/store/ilf53zg10ajl832fgdc5lhdv8srbdq36-user-environment'
#10 55.71 deleting '/nix/store/6zxkblvgw1ay1kb3a7ghxcqdgbyc7pk9-user-environment.drv'
#10 55.71 deleting '/nix/store/mbgkmd06wd8dy5mz076h4pk7m1c9apgn-env-manifest.nix'
#10 55.71 deleting unused links...
#10 55.71 note: currently hard linking saves -0.00 MiB
#10 55.72 26 store paths deleted, 248.12 MiB freed
#10 DONE 55.8s

#11 [stage-0  7/15] COPY .nixpacks/assets /assets/
#11 DONE 0.0s

#12 [stage-0  8/15] COPY . /app/.
#12 DONE 0.6s

#13 [stage-0  9/15] RUN  caddy fmt --overwrite /assets/Caddyfile
#13 DONE 0.3s

#14 [stage-0 10/15] COPY . /app/.
#14 DONE 1.1s

#15 [stage-0 11/15] RUN --mount=type=cache,id=V13bXEaLGp4-/root/npm,target=/root/.npm npm install
#15 689.9 
#15 689.9 added 571 packages, and audited 572 packages in 11m
#15 689.9 
#15 689.9 130 packages are looking for funding
#15 689.9   run `npm fund` for details
#15 689.9 
#15 689.9 1 high severity vulnerability
#15 689.9 
#15 689.9 To address all issues, run:
#15 689.9   npm audit fix
#15 689.9 
#15 689.9 Run `npm audit` for details.
#15 689.9 npm notice
#15 689.9 npm notice New major version of npm available! 10.9.0 -> 11.12.1
#15 689.9 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1
#15 689.9 npm notice To update run: npm install -g npm@11.12.1
#15 689.9 npm notice
#15 DONE 690.3s

#16 [stage-0 12/15] COPY . /app/.
#16 DONE 0.5s

#17 [stage-0 13/15] RUN --mount=type=cache,id=V13bXEaLGp4-node_modules/cache,target=/app/node_modules/.cache npm run build
#17 0.625 
#17 0.625 > mi-app@0.0.0 build
#17 0.625 > node scripts/sync-samples.cjs && node --max-old-space-size=4096 ./node_modules/vite/bin/vite.js build
#17 0.625 
#17 0.670 ✅ Sincronización completa. 34 pitos y 20 bajos detectados.
#17 0.670 📂 Lista guardada en: /app/public/muestrasLocales.json
#17 1.436 vite v6.4.1 building for production...
#17 2.139 transforming...