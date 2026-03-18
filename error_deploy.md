Commit: Fix: Sonido Armonizado funcional, mapeo de octavas para Reb6 y optimización de latencia cero 
##########################################
### Download Github Archive Started...
### Wed, 18 Mar 2026 19:45:19 GMT
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
#2 DONE 0.3s

#3 [internal] load .dockerignore
#3 transferring context: 110B done
#3 DONE 0.0s

#4 [stage-0  1/15] FROM ghcr.io/railwayapp/nixpacks:ubuntu-1741046653@sha256:ed406b77fb751927991b8655e76c33a4521c4957c2afeab293be7c63c2a373d2
#4 resolve ghcr.io/railwayapp/nixpacks:ubuntu-1741046653@sha256:ed406b77fb751927991b8655e76c33a4521c4957c2afeab293be7c63c2a373d2 0.0s done
#4 sha256:ed406b77fb751927991b8655e76c33a4521c4957c2afeab293be7c63c2a373d2 1.61kB / 1.61kB done
#4 sha256:53a1550a769bb935ad1d80f12dfd0ae96a8ec35865d8e6b956cdb79f3ae49e5e 868B / 868B done
#4 sha256:82afdcbbf1dd44bb728577e4e48f1c9ca00dde78318a60985b01018dc2803a46 4.37kB / 4.37kB done
#4 DONE 0.1s

#5 [internal] load build context
#5 ...

#6 [stage-0  2/15] WORKDIR /app/
#6 DONE 0.1s

#5 [internal] load build context
#5 transferring context: 113.81MB 1.0s done
#5 DONE 1.0s

#7 [stage-0  3/15] COPY .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix
#7 DONE 0.0s

#8 [stage-0  4/15] RUN nix-env -if .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix && nix-collect-garbage -d
#8 0.287 unpacking 'https://github.com/NixOS/nixpkgs/archive/ba913eda2df8eb72147259189d55932012df6301.tar.gz' into the Git cache...
#8 38.06 installing 'ba913eda2df8eb72147259189d55932012df6301-env'
#8 38.89 these 4 derivations will be built:
#8 38.89   /nix/store/x9qrr2jb0d9d7gjg77imaric1nr9wl3s-libraries.drv
#8 38.89   /nix/store/4vjgp6bh2gja20gkg167x66kgk10c24j-ba913eda2df8eb72147259189d55932012df6301-env.drv
#8 38.89   /nix/store/hpybn12g5ny53hbyvrlvzdl3hpk392ql-builder.pl.drv
#8 38.89   /nix/store/llvngay9gncvs8l6dw01c6wlbh35zzf0-ba913eda2df8eb72147259189d55932012df6301-env.drv
#8 38.89 these 38 paths will be fetched (32.50 MiB download, 164.56 MiB unpacked):
#8 38.89   /nix/store/mjgi65m3hgzqqvqcix848gskkw5zzwi9-acl-2.3.2
#8 38.89   /nix/store/5nk2ga7i2f030am4qpcdsd8qlk6i3z83-attr-2.5.2
#8 38.89   /nix/store/306znyj77fv49kwnkpxmb0j2znqpa8bj-bash-5.2p26
#8 38.89   /nix/store/xwcf1rw3ackqp2vxms9myf9jq2ny6ynv-bzip2-1.0.8
#8 38.89   /nix/store/mxcq77rlan82dzpv3cgj0fh6qvv8ncil-bzip2-1.0.8-bin
#8 38.89   /nix/store/1iz89fy5fi998g43z1m4j7s5f095di68-caddy-2.8.4
#8 38.89   /nix/store/php4qidg2bxzmm79vpri025bqi0fa889-coreutils-9.5
#8 38.89   /nix/store/i34mknsjgrfyy71k2h79gda0bvagzc2j-diffutils-3.10
#8 38.89   /nix/store/1sffjkg6c6ff16fz5yr0pnz3j7vja42h-ed-1.20.2
#8 38.89   /nix/store/xx7x1dwybpssfhq8yikvzz38bh3yrq97-file-5.45
#8 38.89   /nix/store/jjcsr5gs4qanf7ln5c6wgcq4sn75a978-findutils-4.9.0
#8 38.89   /nix/store/8vvkbgmnin1x2jkp7wcb2zg1p0vc4ks9-gawk-5.2.2
#8 38.89   /nix/store/xvzz97yk73hw03v5dhhz3j47ggwf1yq1-gcc-13.2.0-lib
#8 38.89   /nix/store/0rxb3ixzk4zaqivc9s795m0a3679wbw2-gcc-13.2.0-libgcc
#8 38.89   /nix/store/k7zgvzp2r31zkg9xqgjim7mbknryv6bs-glibc-2.39-52
#8 38.89   /nix/store/7ivacs3m2fm19hyxdmrs05xisj82v6y5-gmp-with-cxx-6.3.0
#8 38.89   /nix/store/4i0j14zymvlngyyhq2254f4g9m9my98y-gnu-config-2024-01-01
#8 38.89   /nix/store/28gpmx3z6ss3znd7fhmrzmvk3x5lnfbk-gnugrep-3.11
#8 38.89   /nix/store/cdzpn0rdq810aknww3w9fy3wmw9ixr66-gnumake-4.4.1
#8 38.89   /nix/store/5zjms21vpxlkbc0qyl5pmj2sidfmzmd7-gnused-4.9
#8 38.89   /nix/store/rik7p68cq7yzlj5pmfpf4yv6jnrpvlgf-gnutar-1.35
#8 38.89   /nix/store/j5chw7v1x3vlmf3wmdpdb5gwh9hl0b80-gzip-1.13
#8 38.89   /nix/store/dzsby2vk02jcn0s43fkna2qqqix6ccy1-iana-etc-20240318
#8 38.89   /nix/store/ic63ay0py10fyryaw7345k4ps32da33w-libidn2-2.3.7
#8 38.89   /nix/store/yfp7dr8m7zi7kxk49wd714gwvhb105hf-libunistring-1.1
#8 38.89   /nix/store/5xynf9c9ml7d97q70kpq9rpqqmx13xl8-libxcrypt-4.4.36
#8 38.89   /nix/store/zk9ybjjixdwyv3jmpg2i7s8p7iqi5vhh-mailcap-2.1.53
#8 38.89   /nix/store/0lfxbmchigx9vs9qmrlbahcy6nxwfnj1-patch-2.7.6
#8 38.89   /nix/store/nbad47q0m0m9c5xid7zh05hiknwircbp-patchelf-0.15.0
#8 38.89   /nix/store/g3vi60zgyjsvij7xkk6dxky1hkwh0ynd-pcre2-10.43
#8 38.89   /nix/store/1iscdpbd3x9x3s3s25jd5ppl7yra0b77-perl-5.38.2
#8 38.89   /nix/store/rg6agzlb4gcl4w2126m16qm4mgr8jgi6-stdenv-linux
#8 38.89   /nix/store/y6hmqbmbwq0rmx1fzix5c5jszla2pzmp-tzdata-2024a
#8 38.89   /nix/store/bq6xbl9cq6hkcn65mz2fzc2k38xiv87h-update-autotools-gnu-config-scripts-hook
#8 38.89   /nix/store/1q9vc0lq7qjlfjz47mfmlzdf86c543jy-xgcc-13.2.0-libgcc
#8 38.89   /nix/store/lphbn1va4i43fj7f3m9xskf9y86khzf3-xz-5.4.6
#8 38.89   /nix/store/6i4xxaa812vsbli9jkq4mksdddrk27lw-xz-5.4.6-bin
#8 38.89   /nix/store/lv6nackqis28gg7l2ic43f6nk52hb39g-zlib-1.3.1
#8 38.90 copying path '/nix/store/dzsby2vk02jcn0s43fkna2qqqix6ccy1-iana-etc-20240318' from 'https://cache.nixos.org'...
#8 38.90 copying path '/nix/store/zk9ybjjixdwyv3jmpg2i7s8p7iqi5vhh-mailcap-2.1.53' from 'https://cache.nixos.org'...
#8 38.91 copying path '/nix/store/0rxb3ixzk4zaqivc9s795m0a3679wbw2-gcc-13.2.0-libgcc' from 'https://cache.nixos.org'...
#8 38.91 copying path '/nix/store/yfp7dr8m7zi7kxk49wd714gwvhb105hf-libunistring-1.1' from 'https://cache.nixos.org'...
#8 38.91 copying path '/nix/store/4i0j14zymvlngyyhq2254f4g9m9my98y-gnu-config-2024-01-01' from 'https://cache.nixos.org'...
#8 38.91 copying path '/nix/store/y6hmqbmbwq0rmx1fzix5c5jszla2pzmp-tzdata-2024a' from 'https://cache.nixos.org'...
#8 38.91 copying path '/nix/store/1q9vc0lq7qjlfjz47mfmlzdf86c543jy-xgcc-13.2.0-libgcc' from 'https://cache.nixos.org'...
#8 38.93 copying path '/nix/store/bq6xbl9cq6hkcn65mz2fzc2k38xiv87h-update-autotools-gnu-config-scripts-hook' from 'https://cache.nixos.org'...
#8 38.96 copying path '/nix/store/ic63ay0py10fyryaw7345k4ps32da33w-libidn2-2.3.7' from 'https://cache.nixos.org'...
#8 39.01 copying path '/nix/store/k7zgvzp2r31zkg9xqgjim7mbknryv6bs-glibc-2.39-52' from 'https://cache.nixos.org'...
#8 39.48 copying path '/nix/store/5nk2ga7i2f030am4qpcdsd8qlk6i3z83-attr-2.5.2' from 'https://cache.nixos.org'...
#8 39.48 copying path '/nix/store/306znyj77fv49kwnkpxmb0j2znqpa8bj-bash-5.2p26' from 'https://cache.nixos.org'...
#8 39.48 copying path '/nix/store/xwcf1rw3ackqp2vxms9myf9jq2ny6ynv-bzip2-1.0.8' from 'https://cache.nixos.org'...
#8 39.48 copying path '/nix/store/1iz89fy5fi998g43z1m4j7s5f095di68-caddy-2.8.4' from 'https://cache.nixos.org'...
#8 39.48 copying path '/nix/store/1sffjkg6c6ff16fz5yr0pnz3j7vja42h-ed-1.20.2' from 'https://cache.nixos.org'...
#8 39.48 copying path '/nix/store/5xynf9c9ml7d97q70kpq9rpqqmx13xl8-libxcrypt-4.4.36' from 'https://cache.nixos.org'...
#8 39.48 copying path '/nix/store/g3vi60zgyjsvij7xkk6dxky1hkwh0ynd-pcre2-10.43' from 'https://cache.nixos.org'...
#8 39.48 copying path '/nix/store/lv6nackqis28gg7l2ic43f6nk52hb39g-zlib-1.3.1' from 'https://cache.nixos.org'...
#8 39.49 copying path '/nix/store/8vvkbgmnin1x2jkp7wcb2zg1p0vc4ks9-gawk-5.2.2' from 'https://cache.nixos.org'...
#8 39.49 copying path '/nix/store/xvzz97yk73hw03v5dhhz3j47ggwf1yq1-gcc-13.2.0-lib' from 'https://cache.nixos.org'...
#8 39.49 copying path '/nix/store/cdzpn0rdq810aknww3w9fy3wmw9ixr66-gnumake-4.4.1' from 'https://cache.nixos.org'...
#8 39.49 copying path '/nix/store/lphbn1va4i43fj7f3m9xskf9y86khzf3-xz-5.4.6' from 'https://cache.nixos.org'...
#8 39.49 copying path '/nix/store/5zjms21vpxlkbc0qyl5pmj2sidfmzmd7-gnused-4.9' from 'https://cache.nixos.org'...
#8 39.52 copying path '/nix/store/mjgi65m3hgzqqvqcix848gskkw5zzwi9-acl-2.3.2' from 'https://cache.nixos.org'...
#8 39.53 copying path '/nix/store/mxcq77rlan82dzpv3cgj0fh6qvv8ncil-bzip2-1.0.8-bin' from 'https://cache.nixos.org'...
#8 39.54 copying path '/nix/store/0lfxbmchigx9vs9qmrlbahcy6nxwfnj1-patch-2.7.6' from 'https://cache.nixos.org'...
#8 39.54 copying path '/nix/store/xx7x1dwybpssfhq8yikvzz38bh3yrq97-file-5.45' from 'https://cache.nixos.org'...
#8 39.64 copying path '/nix/store/6i4xxaa812vsbli9jkq4mksdddrk27lw-xz-5.4.6-bin' from 'https://cache.nixos.org'...
#8 39.64 copying path '/nix/store/j5chw7v1x3vlmf3wmdpdb5gwh9hl0b80-gzip-1.13' from 'https://cache.nixos.org'...
#8 39.65 copying path '/nix/store/rik7p68cq7yzlj5pmfpf4yv6jnrpvlgf-gnutar-1.35' from 'https://cache.nixos.org'...
#8 39.66 copying path '/nix/store/28gpmx3z6ss3znd7fhmrzmvk3x5lnfbk-gnugrep-3.11' from 'https://cache.nixos.org'...
#8 39.88 copying path '/nix/store/7ivacs3m2fm19hyxdmrs05xisj82v6y5-gmp-with-cxx-6.3.0' from 'https://cache.nixos.org'...
#8 39.88 copying path '/nix/store/nbad47q0m0m9c5xid7zh05hiknwircbp-patchelf-0.15.0' from 'https://cache.nixos.org'...
#8 39.91 copying path '/nix/store/php4qidg2bxzmm79vpri025bqi0fa889-coreutils-9.5' from 'https://cache.nixos.org'...
#8 39.97 copying path '/nix/store/i34mknsjgrfyy71k2h79gda0bvagzc2j-diffutils-3.10' from 'https://cache.nixos.org'...
#8 39.97 copying path '/nix/store/jjcsr5gs4qanf7ln5c6wgcq4sn75a978-findutils-4.9.0' from 'https://cache.nixos.org'...
#8 39.97 copying path '/nix/store/1iscdpbd3x9x3s3s25jd5ppl7yra0b77-perl-5.38.2' from 'https://cache.nixos.org'...
#8 40.07 copying path '/nix/store/rg6agzlb4gcl4w2126m16qm4mgr8jgi6-stdenv-linux' from 'https://cache.nixos.org'...
#8 40.17 building '/nix/store/hpybn12g5ny53hbyvrlvzdl3hpk392ql-builder.pl.drv'...
#8 40.45 building '/nix/store/x9qrr2jb0d9d7gjg77imaric1nr9wl3s-libraries.drv'...
#8 40.86 building '/nix/store/4vjgp6bh2gja20gkg167x66kgk10c24j-ba913eda2df8eb72147259189d55932012df6301-env.drv'...
#8 41.18 building '/nix/store/llvngay9gncvs8l6dw01c6wlbh35zzf0-ba913eda2df8eb72147259189d55932012df6301-env.drv'...
#8 41.27 created 4 symlinks in user environment
#8 41.33 building '/nix/store/6zxkblvgw1ay1kb3a7ghxcqdgbyc7pk9-user-environment.drv'...
#8 41.51 removing old generations of profile /nix/var/nix/profiles/per-user/root/channels
#8 41.51 removing old generations of profile /nix/var/nix/profiles/per-user/root/profile
#8 41.51 removing profile version 1
#8 41.51 removing old generations of profile /nix/var/nix/profiles/per-user/root/channels
#8 41.51 removing old generations of profile /nix/var/nix/profiles/per-user/root/profile
#8 41.52 finding garbage collector roots...
#8 41.52 removing stale link from '/nix/var/nix/gcroots/auto/lzjbmb2ry0z7lma2fvpqprb12921pnb5' to '/nix/var/nix/profiles/per-user/root/profile-1-link'
#8 41.52 deleting garbage...
#8 41.53 deleting '/nix/store/ir9fki7838bmk4hlj0zmwbw45q101j66-user-environment.drv'
#8 41.53 deleting '/nix/store/b9rj4wk1cxh7g2ib89aqbcapzzar8p2s-user-environment'
#8 41.53 deleting '/nix/store/xxyn8jfxcpr5ac9dvismfzx39ijh9kiv-env-manifest.nix'
#8 41.55 deleting '/nix/store/rg6agzlb4gcl4w2126m16qm4mgr8jgi6-stdenv-linux'
#8 41.55 deleting '/nix/store/nbad47q0m0m9c5xid7zh05hiknwircbp-patchelf-0.15.0'
#8 41.55 deleting '/nix/store/jjcsr5gs4qanf7ln5c6wgcq4sn75a978-findutils-4.9.0'
#8 41.56 deleting '/nix/store/i34mknsjgrfyy71k2h79gda0bvagzc2j-diffutils-3.10'
#8 41.57 deleting '/nix/store/1iscdpbd3x9x3s3s25jd5ppl7yra0b77-perl-5.38.2'
#8 41.66 deleting '/nix/store/php4qidg2bxzmm79vpri025bqi0fa889-coreutils-9.5'
#8 41.66 deleting '/nix/store/7ivacs3m2fm19hyxdmrs05xisj82v6y5-gmp-with-cxx-6.3.0'
#8 41.66 deleting '/nix/store/xvzz97yk73hw03v5dhhz3j47ggwf1yq1-gcc-13.2.0-lib'
#8 41.67 deleting '/nix/store/0rxb3ixzk4zaqivc9s795m0a3679wbw2-gcc-13.2.0-libgcc'
#8 41.67 deleting '/nix/store/4vkw8ifh2naxmxl323vzq0scm0l36c1v-builder.pl'
#8 41.67 deleting '/nix/store/5zjms21vpxlkbc0qyl5pmj2sidfmzmd7-gnused-4.9'
#8 41.68 deleting '/nix/store/0lfxbmchigx9vs9qmrlbahcy6nxwfnj1-patch-2.7.6'
#8 41.68 deleting '/nix/store/1sffjkg6c6ff16fz5yr0pnz3j7vja42h-ed-1.20.2'
#8 41.68 deleting '/nix/store/mxcq77rlan82dzpv3cgj0fh6qvv8ncil-bzip2-1.0.8-bin'
#8 41.68 deleting '/nix/store/xwcf1rw3ackqp2vxms9myf9jq2ny6ynv-bzip2-1.0.8'
#8 41.68 deleting '/nix/store/xx7x1dwybpssfhq8yikvzz38bh3yrq97-file-5.45'
#8 41.68 deleting '/nix/store/rik7p68cq7yzlj5pmfpf4yv6jnrpvlgf-gnutar-1.35'
#8 41.69 deleting '/nix/store/mjgi65m3hgzqqvqcix848gskkw5zzwi9-acl-2.3.2'
#8 41.69 deleting '/nix/store/bq6xbl9cq6hkcn65mz2fzc2k38xiv87h-update-autotools-gnu-config-scripts-hook'
#8 41.69 deleting '/nix/store/4i0j14zymvlngyyhq2254f4g9m9my98y-gnu-config-2024-01-01'
#8 41.69 deleting '/nix/store/6i4xxaa812vsbli9jkq4mksdddrk27lw-xz-5.4.6-bin'
#8 41.70 deleting '/nix/store/lphbn1va4i43fj7f3m9xskf9y86khzf3-xz-5.4.6'
#8 41.70 deleting '/nix/store/5nk2ga7i2f030am4qpcdsd8qlk6i3z83-attr-2.5.2'
#8 41.70 deleting '/nix/store/j5chw7v1x3vlmf3wmdpdb5gwh9hl0b80-gzip-1.13'
#8 41.70 deleting '/nix/store/5xynf9c9ml7d97q70kpq9rpqqmx13xl8-libxcrypt-4.4.36'
#8 41.70 deleting '/nix/store/cdzpn0rdq810aknww3w9fy3wmw9ixr66-gnumake-4.4.1'
#8 41.71 deleting '/nix/store/8vvkbgmnin1x2jkp7wcb2zg1p0vc4ks9-gawk-5.2.2'
#8 41.72 deleting '/nix/store/306znyj77fv49kwnkpxmb0j2znqpa8bj-bash-5.2p26'
#8 41.72 deleting '/nix/store/28gpmx3z6ss3znd7fhmrzmvk3x5lnfbk-gnugrep-3.11'
#8 41.73 deleting '/nix/store/lv6nackqis28gg7l2ic43f6nk52hb39g-zlib-1.3.1'
#8 41.73 deleting '/nix/store/jdxlsyfxs63rxxhrzgc3mnhx0mz6s595-libraries'
#8 41.73 deleting '/nix/store/g3vi60zgyjsvij7xkk6dxky1hkwh0ynd-pcre2-10.43'
#8 41.73 deleting '/nix/store/p5l041qdj83dg93parxblr0q0al3hhsc-source'
#8 45.29 deleting unused links...
#8 45.29 note: currently hard linking saves -0.00 MiB
#8 45.29 36 store paths deleted, 245.12 MiB freed
#8 DONE 45.4s

#9 [stage-0  5/15] COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix
#9 DONE 0.0s

#10 [stage-0  6/15] RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d
#10 0.117 unpacking 'https://github.com/NixOS/nixpkgs/archive/ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.tar.gz' into the Git cache...
#10 38.57 unpacking 'https://github.com/railwayapp/nix-npm-overlay/archive/main.tar.gz' into the Git cache...
#10 39.19 installing 'ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env'
#10 40.10 these 4 derivations will be built:
#10 40.10   /nix/store/kmkgqwwal88b9lch9dl53iqa3wsm6vdb-libraries.drv
#10 40.10   /nix/store/91aaayacr12psqb9fmp8arg1xafgg9v2-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env.drv
#10 40.10   /nix/store/9smjjb5pkmcbykz8p4786s3a4nq6m030-builder.pl.drv
#10 40.10   /nix/store/2s0nwykqmy6w90k0g5lagpic137q50dj-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env.drv
#10 40.10 these 53 paths will be fetched (56.46 MiB download, 282.21 MiB unpacked):
#10 40.10   /nix/store/cf7gkacyxmm66lwl5nj6j6yykbrg4q5c-acl-2.3.2
#10 40.10   /nix/store/a9jgnlhkjkxav6qrc3rzg2q84pkl2wvr-attr-2.5.2
#10 40.10   /nix/store/5mh7kaj2fyv8mk4sfq1brwxgc02884wi-bash-5.2p37
#10 40.10   /nix/store/ivl2v8rgg7qh1jkj5pwpqycax3rc2hnl-bzip2-1.0.8
#10 40.10   /nix/store/mglixp03lsp0w986svwdvm7vcy17rdax-bzip2-1.0.8-bin
#10 40.10   /nix/store/4s9rah4cwaxflicsk5cndnknqlk9n4p3-coreutils-9.5
#10 40.10   /nix/store/00g69vw7c9lycy63h45ximy0wmzqx5y6-diffutils-3.10
#10 40.10   /nix/store/74h4z8k82pmp24xryflv4lxkz8jlpqqd-ed-1.20.2
#10 40.10   /nix/store/c4rj90r2m89rxs64hmm857mipwjhig5d-file-5.46
#10 40.10   /nix/store/jqrz1vq5nz4lnv9pqzydj0ir58wbjfy1-findutils-4.10.0
#10 40.10   /nix/store/a3c47r5z1q2c4rz0kvq8hlilkhx2s718-gawk-5.3.1
#10 40.10   /nix/store/bpq1s72cw9qb2fs8mnmlw6hn2c7iy0ss-gcc-14-20241116-lib
#10 40.10   /nix/store/17v0ywnr3akp85pvdi56gwl99ljv95kx-gcc-14-20241116-libgcc
#10 40.10   /nix/store/65h17wjrrlsj2rj540igylrx7fqcd6vq-glibc-2.40-36
#10 40.10   /nix/store/a2byxfv4lc8f2g5xfzw8cz5q8k05wi29-gmp-with-cxx-6.3.0
#10 40.10   /nix/store/1m67ipsk39xvhyqrxnzv2m2p48pil8kl-gnu-config-2024-01-01
#10 40.10   /nix/store/aap6cq56amx4mzbyxp2wpgsf1kqjcr1f-gnugrep-3.11
#10 40.10   /nix/store/fp6cjl1zcmm6mawsnrb5yak1wkz2ma8l-gnumake-4.4.1
#10 40.10   /nix/store/abm77lnrkrkb58z6xp1qwjcr1xgkcfwm-gnused-4.9
#10 40.10   /nix/store/9cwwj1c9csmc85l2cqzs3h9hbf1vwl6c-gnutar-1.35
#10 40.10   /nix/store/nvvj6sk0k6px48436drlblf4gafgbvzr-gzip-1.13
#10 40.10   /nix/store/wwipgdqb4p2fr46kmw9c5wlk799kbl68-icu4c-74.2
#10 40.10   /nix/store/m8w3mf0i4862q22bxad0wspkgdy4jnkk-icu4c-74.2-dev
#10 40.10   /nix/store/nlqind4szw3amcmhgy4pd2n0894558gg-libX11-1.8.10
#10 40.10   /nix/store/hjbxiwsc587b8dc6v6pisa34aj10hq23-libXau-1.0.11
#10 40.10   /nix/store/c9gk656q2x8av467r06hcjag31drjfzh-libXdmcp-1.1.5
#10 40.10   /nix/store/r87iqz07igmwfvb12mgr6rmpb6353ys4-libXext-1.3.6
#10 40.10   /nix/store/5mb70vg3kdzkyn0zqdgm4f87mdi0yi4i-libglvnd-1.7.0
#10 40.10   /nix/store/34z2792zyd4ayl5186vx0s98ckdaccz9-libidn2-2.3.7
#10 40.10   /nix/store/xcqcgqazykf6s7fsn08k0blnh0wisdcl-libunistring-1.3
#10 40.10   /nix/store/r9ac2hwnmb0nxwsrvr6gi9wsqf2whfqj-libuv-1.49.2
#10 40.10   /nix/store/ll14czvpxglf6nnwmmrmygplm830fvlv-libuv-1.49.2-dev
#10 40.10   /nix/store/2j3c18398phz5c1376x2qvva8gx9g551-libxcb-1.17.0
#10 40.10   /nix/store/6cr0spsvymmrp1hj5n0kbaxw55w1lqyp-libxcrypt-4.4.36
#10 40.10   /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0
#10 40.10   /nix/store/h1ydpxkw9qhjdxjpic1pdc2nirggyy6f-openssl-3.3.2
#10 40.10   /nix/store/lygl27c44xv73kx1spskcgvzwq7z337c-openssl-3.3.2-bin
#10 40.10   /nix/store/pp2zf8bdgyz60ds8vcshk2603gcjgp72-openssl-3.3.2-dev
#10 40.10   /nix/store/5yja5dpk2qw1v5mbfbl2d7klcdfrh90w-patch-2.7.6
#10 40.10   /nix/store/srfxqk119fijwnprgsqvn68ys9kiw0bn-patchelf-0.15.0
#10 40.10   /nix/store/3j1p598fivxs69wx3a657ysv3rw8k06l-pcre2-10.44
#10 40.10   /nix/store/1i003ijlh9i0mzp6alqby5hg3090pjdx-perl-5.40.0
#10 40.10   /nix/store/dj96qp9vps02l3n8xgc2vallqa9rhafb-sqlite-3.47.0
#10 40.10   /nix/store/yc39wvfz87i0bl8r6vnhq48n6clbx2pb-sqlite-3.47.0-bin
#10 40.10   /nix/store/i47d0rzbbnihcxkcaj48jgii5pj58djc-sqlite-3.47.0-dev
#10 40.10   /nix/store/4ig84cyqi6qy4n0sanrbzsw1ixa497jx-stdenv-linux
#10 40.10   /nix/store/d29r1bdmlvwmj52apgcdxfl1mm9c5782-update-autotools-gnu-config-scripts-hook
#10 40.10   /nix/store/2phvd8h14vwls0da1kmsxc73vzmhkm3b-util-linux-minimal-2.39.4-lib
#10 40.10   /nix/store/acfkqzj5qrqs88a4a6ixnybbjxja663d-xgcc-14-20241116-libgcc
#10 40.10   /nix/store/c2njy6bv84kw1i4bjf5k5gn7gz8hn57n-xz-5.6.3
#10 40.10   /nix/store/h18s640fnhhj2qdh5vivcfbxvz377srg-xz-5.6.3-bin
#10 40.10   /nix/store/cqlaa2xf6lslnizyj9xqa8j0ii1yqw0x-zlib-1.3.1
#10 40.10   /nix/store/1lggwqzapn5mn49l9zy4h566ysv9kzdb-zlib-1.3.1-dev
#10 40.11 copying path '/nix/store/17v0ywnr3akp85pvdi56gwl99ljv95kx-gcc-14-20241116-libgcc' from 'https://cache.nixos.org'...
#10 40.11 copying path '/nix/store/1m67ipsk39xvhyqrxnzv2m2p48pil8kl-gnu-config-2024-01-01' from 'https://cache.nixos.org'...
#10 40.11 copying path '/nix/store/acfkqzj5qrqs88a4a6ixnybbjxja663d-xgcc-14-20241116-libgcc' from 'https://cache.nixos.org'...
#10 40.12 copying path '/nix/store/xcqcgqazykf6s7fsn08k0blnh0wisdcl-libunistring-1.3' from 'https://cache.nixos.org'...
#10 40.14 copying path '/nix/store/d29r1bdmlvwmj52apgcdxfl1mm9c5782-update-autotools-gnu-config-scripts-hook' from 'https://cache.nixos.org'...
#10 40.21 copying path '/nix/store/34z2792zyd4ayl5186vx0s98ckdaccz9-libidn2-2.3.7' from 'https://cache.nixos.org'...
#10 40.26 copying path '/nix/store/65h17wjrrlsj2rj540igylrx7fqcd6vq-glibc-2.40-36' from 'https://cache.nixos.org'...
#10 40.71 copying path '/nix/store/a9jgnlhkjkxav6qrc3rzg2q84pkl2wvr-attr-2.5.2' from 'https://cache.nixos.org'...
#10 40.71 copying path '/nix/store/bpq1s72cw9qb2fs8mnmlw6hn2c7iy0ss-gcc-14-20241116-lib' from 'https://cache.nixos.org'...
#10 40.71 copying path '/nix/store/a3c47r5z1q2c4rz0kvq8hlilkhx2s718-gawk-5.3.1' from 'https://cache.nixos.org'...
#10 40.71 copying path '/nix/store/fp6cjl1zcmm6mawsnrb5yak1wkz2ma8l-gnumake-4.4.1' from 'https://cache.nixos.org'...
#10 40.71 copying path '/nix/store/5mh7kaj2fyv8mk4sfq1brwxgc02884wi-bash-5.2p37' from 'https://cache.nixos.org'...
#10 40.71 copying path '/nix/store/ivl2v8rgg7qh1jkj5pwpqycax3rc2hnl-bzip2-1.0.8' from 'https://cache.nixos.org'...
#10 40.71 copying path '/nix/store/74h4z8k82pmp24xryflv4lxkz8jlpqqd-ed-1.20.2' from 'https://cache.nixos.org'...
#10 40.71 copying path '/nix/store/abm77lnrkrkb58z6xp1qwjcr1xgkcfwm-gnused-4.9' from 'https://cache.nixos.org'...
#10 40.71 copying path '/nix/store/hjbxiwsc587b8dc6v6pisa34aj10hq23-libXau-1.0.11' from 'https://cache.nixos.org'...
#10 40.71 copying path '/nix/store/c9gk656q2x8av467r06hcjag31drjfzh-libXdmcp-1.1.5' from 'https://cache.nixos.org'...
#10 40.71 copying path '/nix/store/r9ac2hwnmb0nxwsrvr6gi9wsqf2whfqj-libuv-1.49.2' from 'https://cache.nixos.org'...
#10 40.71 copying path '/nix/store/6cr0spsvymmrp1hj5n0kbaxw55w1lqyp-libxcrypt-4.4.36' from 'https://cache.nixos.org'...
#10 40.71 copying path '/nix/store/h1ydpxkw9qhjdxjpic1pdc2nirggyy6f-openssl-3.3.2' from 'https://cache.nixos.org'...
#10 40.71 copying path '/nix/store/3j1p598fivxs69wx3a657ysv3rw8k06l-pcre2-10.44' from 'https://cache.nixos.org'...
#10 40.71 copying path '/nix/store/2phvd8h14vwls0da1kmsxc73vzmhkm3b-util-linux-minimal-2.39.4-lib' from 'https://cache.nixos.org'...
#10 40.71 copying path '/nix/store/c2njy6bv84kw1i4bjf5k5gn7gz8hn57n-xz-5.6.3' from 'https://cache.nixos.org'...
#10 40.73 copying path '/nix/store/cqlaa2xf6lslnizyj9xqa8j0ii1yqw0x-zlib-1.3.1' from 'https://cache.nixos.org'...
#10 40.74 copying path '/nix/store/cf7gkacyxmm66lwl5nj6j6yykbrg4q5c-acl-2.3.2' from 'https://cache.nixos.org'...
#10 40.76 copying path '/nix/store/2j3c18398phz5c1376x2qvva8gx9g551-libxcb-1.17.0' from 'https://cache.nixos.org'...
#10 40.76 copying path '/nix/store/mglixp03lsp0w986svwdvm7vcy17rdax-bzip2-1.0.8-bin' from 'https://cache.nixos.org'...
#10 40.76 copying path '/nix/store/5yja5dpk2qw1v5mbfbl2d7klcdfrh90w-patch-2.7.6' from 'https://cache.nixos.org'...
#10 40.79 copying path '/nix/store/c4rj90r2m89rxs64hmm857mipwjhig5d-file-5.46' from 'https://cache.nixos.org'...
#10 40.79 copying path '/nix/store/dj96qp9vps02l3n8xgc2vallqa9rhafb-sqlite-3.47.0' from 'https://cache.nixos.org'...
#10 40.81 copying path '/nix/store/yc39wvfz87i0bl8r6vnhq48n6clbx2pb-sqlite-3.47.0-bin' from 'https://cache.nixos.org'...
#10 40.85 copying path '/nix/store/ll14czvpxglf6nnwmmrmygplm830fvlv-libuv-1.49.2-dev' from 'https://cache.nixos.org'...
#10 40.86 copying path '/nix/store/9cwwj1c9csmc85l2cqzs3h9hbf1vwl6c-gnutar-1.35' from 'https://cache.nixos.org'...
#10 40.89 copying path '/nix/store/1lggwqzapn5mn49l9zy4h566ysv9kzdb-zlib-1.3.1-dev' from 'https://cache.nixos.org'...
#10 40.97 copying path '/nix/store/aap6cq56amx4mzbyxp2wpgsf1kqjcr1f-gnugrep-3.11' from 'https://cache.nixos.org'...
#10 40.98 copying path '/nix/store/h18s640fnhhj2qdh5vivcfbxvz377srg-xz-5.6.3-bin' from 'https://cache.nixos.org'...
#10 41.04 copying path '/nix/store/nvvj6sk0k6px48436drlblf4gafgbvzr-gzip-1.13' from 'https://cache.nixos.org'...
#10 41.06 copying path '/nix/store/nlqind4szw3amcmhgy4pd2n0894558gg-libX11-1.8.10' from 'https://cache.nixos.org'...
#10 41.13 copying path '/nix/store/i47d0rzbbnihcxkcaj48jgii5pj58djc-sqlite-3.47.0-dev' from 'https://cache.nixos.org'...
#10 41.22 copying path '/nix/store/lygl27c44xv73kx1spskcgvzwq7z337c-openssl-3.3.2-bin' from 'https://cache.nixos.org'...
#10 41.25 copying path '/nix/store/a2byxfv4lc8f2g5xfzw8cz5q8k05wi29-gmp-with-cxx-6.3.0' from 'https://cache.nixos.org'...
#10 41.25 copying path '/nix/store/wwipgdqb4p2fr46kmw9c5wlk799kbl68-icu4c-74.2' from 'https://cache.nixos.org'...
#10 41.25 copying path '/nix/store/srfxqk119fijwnprgsqvn68ys9kiw0bn-patchelf-0.15.0' from 'https://cache.nixos.org'...
#10 41.26 copying path '/nix/store/r87iqz07igmwfvb12mgr6rmpb6353ys4-libXext-1.3.6' from 'https://cache.nixos.org'...
#10 41.28 copying path '/nix/store/pp2zf8bdgyz60ds8vcshk2603gcjgp72-openssl-3.3.2-dev' from 'https://cache.nixos.org'...
#10 41.29 copying path '/nix/store/5mb70vg3kdzkyn0zqdgm4f87mdi0yi4i-libglvnd-1.7.0' from 'https://cache.nixos.org'...
#10 41.31 copying path '/nix/store/4s9rah4cwaxflicsk5cndnknqlk9n4p3-coreutils-9.5' from 'https://cache.nixos.org'...
#10 41.41 copying path '/nix/store/00g69vw7c9lycy63h45ximy0wmzqx5y6-diffutils-3.10' from 'https://cache.nixos.org'...
#10 41.41 copying path '/nix/store/jqrz1vq5nz4lnv9pqzydj0ir58wbjfy1-findutils-4.10.0' from 'https://cache.nixos.org'...
#10 41.41 copying path '/nix/store/1i003ijlh9i0mzp6alqby5hg3090pjdx-perl-5.40.0' from 'https://cache.nixos.org'...
#10 41.54 copying path '/nix/store/4ig84cyqi6qy4n0sanrbzsw1ixa497jx-stdenv-linux' from 'https://cache.nixos.org'...
#10 41.68 building '/nix/store/9smjjb5pkmcbykz8p4786s3a4nq6m030-builder.pl.drv'...
#10 41.95 building '/nix/store/kmkgqwwal88b9lch9dl53iqa3wsm6vdb-libraries.drv'...
#10 42.46 building '/nix/store/91aaayacr12psqb9fmp8arg1xafgg9v2-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env.drv'...
#10 42.46 copying path '/nix/store/m8w3mf0i4862q22bxad0wspkgdy4jnkk-icu4c-74.2-dev' from 'https://cache.nixos.org'...
#10 42.65 copying path '/nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0' from 'https://cache.nixos.org'...
#10 44.06 building '/nix/store/2s0nwykqmy6w90k0g5lagpic137q50dj-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env.drv'...
#10 44.14 created 5 symlinks in user environment
#10 44.21 building '/nix/store/rwzgx8bxhcn82yxrvcpg0wgk3bv9m6kz-user-environment.drv'...
#10 44.41 removing old generations of profile /nix/var/nix/profiles/per-user/root/channels
#10 44.41 removing old generations of profile /nix/var/nix/profiles/per-user/root/profile
#10 44.41 removing profile version 2
#10 44.41 removing old generations of profile /nix/var/nix/profiles/per-user/root/channels
#10 44.41 removing old generations of profile /nix/var/nix/profiles/per-user/root/profile
#10 44.41 finding garbage collector roots...
#10 44.41 removing stale link from '/nix/var/nix/gcroots/auto/v73nmmh5d8van4ja5c8jn0gjlwhxbz3a' to '/nix/var/nix/profiles/per-user/root/profile-2-link'
#10 44.42 deleting garbage...
#10 44.62 deleting '/nix/store/4ig84cyqi6qy4n0sanrbzsw1ixa497jx-stdenv-linux'
#10 44.62 deleting '/nix/store/aap6cq56amx4mzbyxp2wpgsf1kqjcr1f-gnugrep-3.11'
#10 44.64 deleting '/nix/store/3j1p598fivxs69wx3a657ysv3rw8k06l-pcre2-10.44'
#10 44.65 deleting '/nix/store/a3c47r5z1q2c4rz0kvq8hlilkhx2s718-gawk-5.3.1'
#10 44.67 deleting '/nix/store/00g69vw7c9lycy63h45ximy0wmzqx5y6-diffutils-3.10'
#10 44.70 deleting '/nix/store/h18s640fnhhj2qdh5vivcfbxvz377srg-xz-5.6.3-bin'
#10 44.70 deleting '/nix/store/d29r1bdmlvwmj52apgcdxfl1mm9c5782-update-autotools-gnu-config-scripts-hook'
#10 44.70 deleting '/nix/store/mglixp03lsp0w986svwdvm7vcy17rdax-bzip2-1.0.8-bin'
#10 44.70 deleting '/nix/store/ivl2v8rgg7qh1jkj5pwpqycax3rc2hnl-bzip2-1.0.8'
#10 44.70 deleting '/nix/store/1i003ijlh9i0mzp6alqby5hg3090pjdx-perl-5.40.0'
#10 44.90 deleting '/nix/store/srfxqk119fijwnprgsqvn68ys9kiw0bn-patchelf-0.15.0'
#10 44.90 deleting '/nix/store/lc72l660alcb0mayx06bav5aknx511ws-source'
#10 44.90 deleting '/nix/store/1m67ipsk39xvhyqrxnzv2m2p48pil8kl-gnu-config-2024-01-01'
#10 44.90 deleting '/nix/store/5yja5dpk2qw1v5mbfbl2d7klcdfrh90w-patch-2.7.6'
#10 44.90 deleting '/nix/store/c4rj90r2m89rxs64hmm857mipwjhig5d-file-5.46'
#10 44.91 deleting '/nix/store/9cwwj1c9csmc85l2cqzs3h9hbf1vwl6c-gnutar-1.35'
#10 44.91 deleting '/nix/store/6cr0spsvymmrp1hj5n0kbaxw55w1lqyp-libxcrypt-4.4.36'
#10 44.91 deleting '/nix/store/1m82cbxhdbb85h3lykjpry4mnvyq5x0m-libraries'
#10 44.92 deleting '/nix/store/lwi59jcfwk2lnrakmm1y5vw85hj3n1bi-source'
#10 54.00 deleting '/nix/store/nvvj6sk0k6px48436drlblf4gafgbvzr-gzip-1.13'
#10 54.00 deleting '/nix/store/fp6cjl1zcmm6mawsnrb5yak1wkz2ma8l-gnumake-4.4.1'
#10 54.01 deleting '/nix/store/wf5zj2gbib3gjqllkabxaw4dh0gzcla3-builder.pl'
#10 54.01 deleting '/nix/store/c2njy6bv84kw1i4bjf5k5gn7gz8hn57n-xz-5.6.3'
#10 54.02 deleting '/nix/store/abm77lnrkrkb58z6xp1qwjcr1xgkcfwm-gnused-4.9'
#10 54.02 deleting '/nix/store/jqrz1vq5nz4lnv9pqzydj0ir58wbjfy1-findutils-4.10.0'
#10 54.03 deleting '/nix/store/74h4z8k82pmp24xryflv4lxkz8jlpqqd-ed-1.20.2'
#10 54.03 deleting '/nix/store/ilf53zg10ajl832fgdc5lhdv8srbdq36-user-environment'
#10 54.06 deleting '/nix/store/6zxkblvgw1ay1kb3a7ghxcqdgbyc7pk9-user-environment.drv'
#10 54.06 deleting '/nix/store/mbgkmd06wd8dy5mz076h4pk7m1c9apgn-env-manifest.nix'
#10 54.06 deleting unused links...
#10 54.06 note: currently hard linking saves -0.00 MiB
#10 54.07 29 store paths deleted, 249.12 MiB freed
#10 DONE 54.1s

#11 [stage-0  7/15] COPY .nixpacks/assets /assets/
#11 DONE 0.0s

#12 [stage-0  8/15] COPY . /app/.
#12 DONE 0.8s

#13 [stage-0  9/15] RUN  caddy fmt --overwrite /assets/Caddyfile
#13 DONE 0.3s

#14 [stage-0 10/15] COPY . /app/.
#14 DONE 0.5s

#15 [stage-0 11/15] RUN --mount=type=cache,id=V13bXEaLGp4-/root/npm,target=/root/.npm npm install
#15 0.535 (node:1) ExperimentalWarning: CommonJS module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/debug/src/node.js is loading ES Module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/supports-color/index.js using require().
#15 0.535 Support for loading ES Module in require() is an experimental feature and might change at any time
#15 0.535 (Use `node --trace-warnings ...` to show where the warning was created)
#15 312.5 
#15 312.5 added 483 packages, and audited 484 packages in 5m
#15 312.5 
#15 312.5 125 packages are looking for funding
#15 312.5   run `npm fund` for details
#15 312.6 
#15 312.6 9 vulnerabilities (2 moderate, 7 high)
#15 312.6 
#15 312.6 To address all issues, run:
#15 312.6   npm audit fix
#15 312.6 
#15 312.6 Run `npm audit` for details.
#15 312.6 npm notice
#15 312.6 npm notice New major version of npm available! 10.9.0 -> 11.11.1
#15 312.6 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.11.1
#15 312.6 npm notice To update run: npm install -g npm@11.11.1
#15 312.6 npm notice
#15 DONE 313.0s

#16 [stage-0 12/15] COPY . /app/.
#16 DONE 0.5s

#17 [stage-0 13/15] RUN --mount=type=cache,id=V13bXEaLGp4-node_modules/cache,target=/app/node_modules/.cache npm run build
#17 0.645 (node:1) ExperimentalWarning: CommonJS module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/debug/src/node.js is loading ES Module /nix/store/cgkpjpl1hspg30dlmv4hhvlhbvik1bn1-nodejs-23.2.0/lib/node_modules/npm/node_modules/supports-color/index.js using require().
#17 0.645 Support for loading ES Module in require() is an experimental feature and might change at any time
#17 0.645 (Use `node --trace-warnings ...` to show where the warning was created)
#17 0.651 
#17 0.651 > mi-app@0.0.0 build
#17 0.651 > node scripts/sync-samples.cjs && vite build
#17 0.651 
#17 0.699 ✅ Sincronización completa. 34 pitos y 20 bajos detectados.
#17 0.700 📂 Lista guardada en: /app/public/muestrasLocales.json
#17 1.403 vite v6.4.1 building for production...
#17 1.764 transforming...
#17 39.11 ✓ 4040 modules transformed.
#17 43.24 rendering chunks...