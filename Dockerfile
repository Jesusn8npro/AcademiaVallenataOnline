# Dockerfile propio: Node 22 fijo. Elimina la ruleta de versiones de
# Nixpacks (su catalogo nix viejo no tiene nodejs_22 y confunde el proyecto
# con Deno por la carpeta supabase/functions).
FROM node:22-bookworm-slim

# Dependencias del sistema: sharp/vips (procesado de imagenes en build) y
# node-gyp (python3/make/g++) por si algun modulo nativo compila.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ pkg-config libvips-dev ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Variables NEXT_PUBLIC_*: Next las "incrusta" en el bundle del navegador
# DURANTE el build, por eso deben existir como ARG/ENV antes de `npm run build`.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_EPAYCO_PUBLIC_KEY
ARG NEXT_PUBLIC_EPAYCO_CUSTOMER_ID
ARG NEXT_PUBLIC_EPAYCO_TEST_MODE
ARG NEXT_PUBLIC_GIPHY_API_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NODE_OPTIONS="--max-old-space-size=4096"

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS=$NODE_OPTIONS \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_EPAYCO_PUBLIC_KEY=$NEXT_PUBLIC_EPAYCO_PUBLIC_KEY \
    NEXT_PUBLIC_EPAYCO_CUSTOMER_ID=$NEXT_PUBLIC_EPAYCO_CUSTOMER_ID \
    NEXT_PUBLIC_EPAYCO_TEST_MODE=$NEXT_PUBLIC_EPAYCO_TEST_MODE \
    NEXT_PUBLIC_GIPHY_API_KEY=$NEXT_PUBLIC_GIPHY_API_KEY \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

# package-lock.json esta en .dockerignore (historico: causaba problemas con
# binarios linux). Se instala con npm install, no npm ci.
COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build && \
    cp -r .next/static .next/standalone/.next/static && \
    cp -r public .next/standalone/public

ENV PORT=3000
EXPOSE 3000
CMD ["node", ".next/standalone/server.js"]
