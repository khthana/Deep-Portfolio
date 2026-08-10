# syntax=docker/dockerfile:1
#
# API image. Build context is the REPO ROOT, not this folder:
#
#     docker build -f apps/api/Dockerfile .
#
# The context has to be the root because this is an npm workspaces monorepo —
# package-lock.json lives there and is the only file that pins versions. A
# context of apps/api would see a package.json with no lockfile beside it, and
# `npm ci` would refuse to run.

FROM node:22-alpine AS base
# Prisma's query engine links against OpenSSL; the alpine image does not ship it.
RUN apk add --no-cache openssl
WORKDIR /repo
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

# --- deps -------------------------------------------------------------------
# Only the manifests, so this layer is rebuilt when dependencies change rather
# than on every source edit.
FROM base AS deps
COPY package.json package-lock.json ./
# npm resolves every workspace in the root package.json's globs, so both
# manifests must be present even though only the API's tree is installed.
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
# apps/api has a postinstall that runs `prisma generate`, so the schema must be
# in place before the install, not after it.
COPY apps/api/prisma apps/api/prisma
RUN npm ci --workspace @deep-portfolio/api --include-workspace-root

# --- build ------------------------------------------------------------------
FROM deps AS build
COPY apps/api apps/api
RUN npm run build --workspace @deep-portfolio/api

# --- runtime ----------------------------------------------------------------
FROM base AS runtime

# node_modules is carried over whole, dev dependencies included. Pruning them is
# not possible here: the Prisma CLI is a dev dependency, and it is what generates
# @prisma/client during install AND what runs `prisma migrate deploy` — the
# migrate service in docker-compose.yml is this same image with a different
# command. Dropping dev dependencies would break both.
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=build /repo/package.json ./
COPY --from=build /repo/apps/api/package.json apps/api/
COPY --from=build /repo/apps/api/prisma apps/api/prisma
COPY --from=build /repo/apps/api/dist apps/api/dist

WORKDIR /repo/apps/api

USER node
EXPOSE 4001

# The compiled output, not tsx watch. src/server.ts is the entry point that
# listens and starts the cron job; src/app.ts is the app it serves.
CMD ["node", "dist/server.js"]
