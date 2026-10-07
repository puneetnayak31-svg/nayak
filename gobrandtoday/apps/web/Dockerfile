# Build from the repo root:  docker build -f apps/web/Dockerfile -t gobrandtoday-web .
FROM node:22-alpine AS build
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_OUTPUT=standalone
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @gbt/web --workspace @gbt/shared --include-workspace-root
COPY packages/shared packages/shared
COPY apps/web apps/web
ARG NEXT_PUBLIC_SITE_URL=https://gobrandtoday.com
# Next.js bakes rewrites at build time — point /api/* at the API service here.
ARG API_ORIGIN=http://api:4000
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL API_ORIGIN=$API_ORIGIN
RUN npm run build --workspace @gbt/web

FROM node:22-alpine
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
