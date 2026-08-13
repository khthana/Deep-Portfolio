# syntax=docker/dockerfile:1
#
# Web image. Build context is the REPO ROOT, not this folder:
#
#     docker build -f apps/web/Dockerfile .
#
# See apps/api/Dockerfile for why — the shared package-lock.json lives at the root.

FROM node:22-alpine AS base
WORKDIR /repo
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

# --- deps -------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/api-types/package.json packages/api-types/
RUN npm ci --workspace @deep-portfolio/web --include-workspace-root

# --- build ------------------------------------------------------------------
FROM deps AS build

# Vite inlines VITE_* variables into the bundle at build time — they cannot be
# supplied at run time. Whatever value is baked in here is also public: it ends
# up verbatim in JavaScript the browser downloads. Never pass a secret this way.
ARG VITE_BACKEND_URL=http://localhost:4001
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# No default: a build without a client id produces a login page whose Google
# button never appears, which is far more confusing to debug than a build that
# refuses to start. This one is public by design (it is an OAuth client id, not
# a client secret) so baking it into the bundle is exactly what it is for.
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

COPY apps/web apps/web
# @deep-portfolio/api-types has no build step and ships its .ts, so tsc and
# Vite read those files directly — the manifest copied into deps is not enough.
COPY packages/api-types packages/api-types
RUN npm run build --workspace @deep-portfolio/web

# --- runtime ----------------------------------------------------------------
# Static files only. Nothing from node_modules ships.
FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
