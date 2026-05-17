FROM node:20-slim

WORKDIR /app

# Build args (Vite bakes these into the bundle at build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_EPAYCO_PUBLIC_KEY
ARG VITE_EPAYCO_CUSTOMER_ID
ARG VITE_EPAYCO_TEST_MODE
ARG VITE_GIPHY_API_KEY
ARG VITE_APP_URL
ARG VITE_BASE_URL
ARG EPAYCO_PRIVATE_KEY
ARG NODE_ENV=production
ARG NODE_OPTIONS=--max-old-space-size=3072

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_EPAYCO_PUBLIC_KEY=$VITE_EPAYCO_PUBLIC_KEY \
    VITE_EPAYCO_CUSTOMER_ID=$VITE_EPAYCO_CUSTOMER_ID \
    VITE_EPAYCO_TEST_MODE=$VITE_EPAYCO_TEST_MODE \
    VITE_GIPHY_API_KEY=$VITE_GIPHY_API_KEY \
    VITE_APP_URL=$VITE_APP_URL \
    VITE_BASE_URL=$VITE_BASE_URL \
    EPAYCO_PRIVATE_KEY=$EPAYCO_PRIVATE_KEY \
    NODE_ENV=$NODE_ENV \
    NODE_OPTIONS=$NODE_OPTIONS

# Native build deps (sharp usa libvips; @tailwindcss/oxide usa binarios prebuilt)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# Solo package.json y .npmrc — SIN package-lock.json
# Así npm resuelve las optional deps nativas para Linux x64 desde cero
COPY package.json .npmrc ./

RUN npm install --legacy-peer-deps

# Ahora copiamos el resto del código
COPY . .

RUN npm run build

EXPOSE 80
CMD ["npm", "run", "preview"]
