Commit: Prueba teclado y ajustes de CSS 
##########################################
### Download Github Archive Started...
### Tue, 21 Apr 2026 01:36:05 GMT
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
#1 transferring dockerfile: 2.08kB done
#1 DONE 0.0s

#2 [internal] load metadata for ghcr.io/railwayapp/nixpacks:ubuntu-1741046653
#2 DONE 0.2s

#3 [internal] load .dockerignore
#3 transferring context: 110B done
#3 DONE 0.0s

#4 [stage-0  1/15] FROM ghcr.io/railwayapp/nixpacks:ubuntu-1741046653@sha256:ed406b77fb751927991b8655e76c33a4521c4957c2afeab293be7c63c2a373d2
#4 DONE 0.0s

#5 [internal] load build context
#5 transferring context: 100.38MB 0.7s done
#5 DONE 0.7s

#6 [stage-0  5/15] COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix
#6 CACHED

#7 [stage-0  7/15] COPY .nixpacks/assets /assets/
#7 CACHED

#8 [stage-0 11/15] RUN --mount=type=cache,id=V13bXEaLGp4-/root/npm,target=/root/.npm npm install
#8 CACHED

#9 [stage-0  4/15] RUN nix-env -if .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix && nix-collect-garbage -d
#9 CACHED

#10 [stage-0  9/15] RUN  caddy fmt --overwrite /assets/Caddyfile
#10 CACHED

#11 [stage-0  3/15] COPY .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix .nixpacks/nixpkgs-ba913eda2df8eb72147259189d55932012df6301.nix
#11 CACHED

#12 [stage-0  8/15] COPY . /app/.
#12 CACHED

#13 [stage-0 10/15] COPY . /app/.
#13 CACHED

#14 [stage-0  6/15] RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d
#14 CACHED

#15 [stage-0  2/15] WORKDIR /app/
#15 CACHED

#16 [stage-0 12/15] COPY . /app/.
#16 CACHED

#17 [stage-0 13/15] RUN --mount=type=cache,id=V13bXEaLGp4-node_modules/cache,target=/app/node_modules/.cache npm run build
#17 0.775 
#17 0.775 > mi-app@0.0.0 build
#17 0.775 > node scripts/sync-samples.cjs && node --max-old-space-size=4096 ./node_modules/vite/bin/vite.js build
#17 0.775 
#17 0.835 ✅ Sincronización completa. 34 pitos y 20 bajos detectados.
#17 0.836 📂 Lista guardada en: /app/public/muestrasLocales.json
#17 1.266 vite v6.4.1 building for production...
#17 1.644 transforming...
#17 30.24 ✓ 4733 modules transformed.
#17 32.31 rendering chunks...
#17 32.64 [esbuild css minify]
#17 32.64 ▲ [WARNING] "fontWeight" is not a known CSS property [unsupported-css-property]
#17 32.64 
#17 32.64     <stdin>:53955:2:
#17 32.64       53955 │   fontWeight: 800;
#17 32.64             │   ~~~~~~~~~~
#17 32.64             ╵   font-weight
#17 32.64 
#17 32.64   Did you mean "font-weight" instead?
#17 32.64 
#17 32.64 
#17 169.7 [plugin vite:reporter] 
#17 169.7 (!) /app/src/servicios/clienteSupabase.ts is dynamically imported by /app/src/Paginas/AcordeonProMax/Hooks/useLogicaProMax.ts but also statically imported by /app/src/App.tsx, /app/src/Paginas/AcordeonProMax/Admin/Componentes/PanelAdminLibreria.tsx, /app/src/Paginas/AcordeonProMax/Admin/Componentes/PanelAdminListaAcordes.tsx, /app/src/Paginas/AcordeonProMax/Pantallas/AcordeonProMaxSimulador.tsx, /app/src/Paginas/AcordeonProMax/Pantallas/ConfiguracionProMax.tsx, /app/src/Paginas/AcordeonProMax/Pantallas/ListaCancionesProMax.tsx, /app/src/Paginas/AcordeonProMax/PracticaLibre/Servicios/servicioPistasPracticaLibre.ts, /app/src/Paginas/AcordeonProMax/PracticaLibre/Servicios/servicioPreferenciasPracticaLibre.ts, /app/src/Paginas/Blog/ArticuloBlog.tsx, /app/src/Paginas/Blog/Blog.tsx, /app/src/Paginas/Cursos/ClaseCurso.tsx, /app/src/Paginas/Cursos/LandingCurso.tsx, /app/src/Paginas/Legales/RecuperarContrasena.tsx, /app/src/Paginas/Mensajes/ChatPage.tsx, /app/src/Paginas/Mensajes/ChatVista.tsx, /app/src/Paginas/Mensajes/ListaChats.tsx, /app/src/Paginas/Mensajes/MensajesLayout.tsx, /app/src/Paginas/Mensajes/MensajesPage.tsx, /app/src/Paginas/Pagos/PagoExitoso/PagoExitoso.tsx, /app/src/Paginas/PanelEstudiante/Componentes/ContinuarAprendiendo.tsx, /app/src/Paginas/PanelEstudiante/Componentes/LogrosDesafios.tsx, /app/src/Paginas/PanelEstudiante/Componentes/RecomendacionesCursos.tsx, /app/src/Paginas/PanelEstudiante/Componentes/SidebarDerecho.tsx, /app/src/Paginas/PanelEstudiante/Componentes/SimuladorEstadisticas.tsx, /app/src/Paginas/Perfil/ConfiguracionPerfil.tsx, /app/src/Paginas/Perfil/MisCursos.tsx, /app/src/Paginas/Perfil/MisPublicaciones.tsx, /app/src/Paginas/Perfil/MisValidaciones.tsx, /app/src/Paginas/Ranking/RankingPage.tsx, /app/src/Paginas/SimuladorDeAcordeon/Componentes/ModalCreadorAcordes.tsx, /app/src/Paginas/SimuladorDeAcordeon/Componentes/ModalListaAcordes.tsx, /app/src/Paginas/SimuladorDeAcordeon/Componentes/ModalListaHero.tsx, /app/src/Paginas/SimuladorDeAcordeon/Hooks/useGrabadorHero.ts, /app/src/Paginas/SimuladorDeAcordeon/Hooks/useLogicaAcordeon.ts, /app/src/Paginas/SimuladorDeAcordeon/videojuego_acordeon/GrabadorHero.tsx, /app/src/Paginas/Tutoriales/ClaseTutorial.tsx, /app/src/Paginas/Tutoriales/ContenidoTutorial.tsx, /app/src/Paginas/Usuarios/ActividadUsuarioPage.tsx, /app/src/Paginas/Usuarios/PerfilPublicoLayout.tsx, /app/src/Paginas/Usuarios/PublicacionesUsuarioPage.tsx, /app/src/Paginas/administrador/Dashboard/DashboardAdmin.tsx, /app/src/Paginas/administrador/Dashboard/pestanas/BlogAdminManager.tsx, /app/src/Paginas/administrador/Dashboard/pestanas/DetectorRetencion.tsx, /app/src/Paginas/administrador/Dashboard/pestanas/GeolocalizacionUsuarios.tsx, /app/src/Paginas/administrador/Dashboard/pestanas/GestionPaquetes.tsx, /app/src/Paginas/administrador/Dashboard/pestanas/PestanaComunicaciones.tsx, /app/src/Paginas/administrador/Dashboard/pestanas/PestanaConfiguracion.tsx, /app/src/Paginas/administrador/Dashboard/pestanas/PestanaGeolocalizacion.tsx, /app/src/Paginas/administrador/Dashboard/pestanas/PestanaPagos.tsx, /app/src/Paginas/administrador/Dashboard/pestanas/PestanaReportes.tsx, /app/src/Paginas/administrador/Dashboard/pestanas/PestanaRetencion.tsx, /app/src/Paginas/administrador/Dashboard/pestanas/PestanaUsuarios.tsx, /app/src/Paginas/administrador/Pagos/Pagos.tsx, /app/src/Paginas/administrador/PanelContenido.tsx, /app/src/Paginas/administrador/Usuarios/Componentes/pestanas/PestanaActividad.tsx, /app/src/Paginas/administrador/Usuarios/Componentes/pestanas/PestanaConfiguracion.tsx, /app/src/Paginas/administrador/Usuarios/Componentes/pestanas/PestanaCursos.tsx, /app/src/Paginas/administrador/Usuarios/Componentes/pestanas/PestanaGeolocalizacion.tsx, /app/src/Paginas/administrador/Validaciones/ValidacionesAdmin.tsx, /app/src/Paginas/administrador/blog/AdminBlog.tsx, /app/src/Paginas/administrador/blog/Componentes/CrearArticuloIA.tsx, /app/src/Paginas/administrador/blog/CreadorArticulos.tsx, /app/src/Paginas/administrador/blog/FormularioArticulo.tsx, /app/src/Paginas/administrador/chats/AdminChats.tsx, /app/src/Paginas/administrador/crear-contenido/CrearContenido.tsx, /app/src/Paginas/administrador/panel-contenido/componentes/ModalInscripciones.tsx, /app/src/Paginas/administrador/panel-contenido/componentes/MostradorCursosTutoriales.tsx, /app/src/Paginas/administrador/panel-contenido/componentes/SidebarResumenAdmin.tsx, /app/src/componentes/ComponentesComunidad/ComunidadPublicar.tsx, /app/src/componentes/ComponentesComunidad/FeedPublicaciones.tsx, /app/src/componentes/ComponentesComunidad/RankingComunidadNuevo.tsx, /app/src/componentes/ComponentesComunidad/SliderCursos.tsx, /app/src/componentes/Comunidad/ComunidadPage.tsx, /app/src/componentes/CrearContenido/PasoInformacionGeneral.tsx, /app/src/componentes/CrearContenido/PasoResumenGuardar.tsx, /app/src/componentes/Menu/MenuPublico.tsx, /app/src/componentes/Menu/ModalDeInicioDeSesion.tsx, /app/src/componentes/Menu/SidebarAdmin.tsx, /app/src/componentes/MisCursos/TarjetaCurso.tsx, /app/src/componentes/Pagos/EmailCompletarWrapper.tsx, /app/src/componentes/Pagos/ModalCompletarEmail.tsx, /app/src/componentes/Pagos/ModalPagoInteligente.tsx, /app/src/componentes/Perfil/EncabezadoPerfil.tsx, /app/src/componentes/Perfil/ExperienciaPerfil.tsx, /app/src/componentes/Perfil/InfoPestanaPerfil.tsx, /app/src/componentes/Perfil/ModalVisorImagenPerfil.tsx, /app/src/componentes/Perfil/MonedasPerfil.tsx, /app/src/componentes/Perfil/UltimosArticulosBlog.tsx, /app/src/componentes/VisualizadorDeLeccionesDeCursos/ComentariosLeccion.tsx, /app/src/componentes/VisualizadorDeLeccionesDeCursos/EncabezadoLeccion.tsx, /app/src/componentes/VisualizadorDeLeccionesDeCursos/NotasLeccion.tsx, /app/src/componentes/chat/ChatEnVivo.tsx, /app/src/componentes/paquetes/FormularioPaquete.tsx, /app/src/contextos/UsuarioContext.tsx, /app/src/hooks/useSesionTracker.ts, /app/src/servicios/actividadService.ts, /app/src/servicios/busquedaService.ts, /app/src/servicios/cancionesHeroService.ts, /app/src/servicios/comunidadService.ts, /app/src/servicios/cursosServicio.ts, /app/src/servicios/eventosService.ts, /app/src/servicios/gamificacionServicio.ts, /app/src/servicios/generadorNotificaciones.ts, /app/src/servicios/geolocalizacionService.ts, /app/src/servicios/grabacionesHeroService.ts, /app/src/servicios/mensajeriaService.ts, /app/src/servicios/notificacionesService.ts, /app/src/servicios/pagoService.ts, /app/src/servicios/paquetesService.ts, /app/src/servicios/passwordService.ts, /app/src/servicios/scoresHeroService.ts, /app/src/servicios/servicioGeolocalizacion.ts, /app/src/servicios/servicioObjetivos.ts, /app/src/servicios/servicioSeguridad.ts, /app/src/servicios/tiempoService.ts, /app/src/servicios/usuariosAdminService.ts, /app/src/stores/perfilStore.tsx, dynamic import will not move module into another chunk.
#17 169.7 