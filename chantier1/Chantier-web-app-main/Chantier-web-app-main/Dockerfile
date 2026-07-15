# Stage 1: build Expo web static export
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Phase 13 — Unified Backend URL (baked at build time for Expo web)
ARG EXPO_PUBLIC_API_URL=http://localhost:3001
ARG EXPO_PUBLIC_API_ANON_KEY=local-anon
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_ANON_KEY=$EXPO_PUBLIC_API_ANON_KEY

# Legacy names unused; keep empty so cloud Supabase is not baked in
ENV EXPO_PUBLIC_SUPABASE_URL=
ENV EXPO_PUBLIC_SUPABASE_ANON_KEY=

RUN npm run build:web

# Stage 2: serve with nginx
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
