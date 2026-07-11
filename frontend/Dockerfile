# Production Docker image for Cognee native UI on StartOS
# Serves the Next.js frontend on port 3000 and proxies API calls to the Cognee backend.

FROM node:22-alpine AS builder

WORKDIR /app

# Install git to fetch the upstream frontend source
RUN apk add --no-cache git

# Clone only the latest cognee frontend source
RUN git clone --depth 1 https://github.com/topoteretes/cognee.git /tmp/cognee && \
    cp -r /tmp/cognee/cognee-frontend/. /app/ && \
    rm -rf /tmp/cognee

# Install dependencies and rebuild native CSS tooling
RUN npm ci
RUN npm rebuild lightningcss

# Patch upstream TypeScript errors that block production build. Upstream types
# drift against strict TypeScript settings in Node 22 / Next 16, so we correct
# the few lines that fail the build.
RUN sed -i 's|// @ts-expect-error d3-force-3d has no types|// @ts-ignore d3-force-3d has no types|' "src/app/(graph)/GraphVisualization.tsx" && \
    sed -i 's|searchParams.get("source") === "serve"|searchParams?.get("source") === "serve"|' "src/app/(app)/onboarding/page.tsx" && \
    sed -i 's|searchParams.get("step") ?? "0"|searchParams?.get("step") ?? "0"|' "src/app/(app)/onboarding/page.tsx" && \
    sed -i 's|const pathname = usePathname();|const pathname = usePathname() ?? "";|' "src/ui/layout/CustomAppShell.tsx"

# Copy local patches over the upstream source.
# We copy the whole tree first because Docker COPY treats brackets as glob chars,
# so they are applied via an explicit RUN cp step.
COPY patches/ /tmp/patches/

RUN cp /tmp/patches/src/modules/tenant/LocalProvider.tsx src/modules/tenant/LocalProvider.tsx && \
    cp /tmp/patches/src/modules/instances/localFetch.ts src/modules/instances/localFetch.ts && \
    cp /tmp/patches/src/middleware.ts src/middleware.ts && \
    cp '/tmp/patches/src/app/(auth)/local-login/partials/LocalSignInForm.tsx' 'src/app/(auth)/local-login/partials/LocalSignInForm.tsx' && \
    cp /tmp/patches/next.config.mjs next.config.mjs && \
    mkdir -p "src/pages/api/v1" && \
    cp '/tmp/patches/src/pages/api/v1/[...path].ts' 'src/pages/api/v1/[...path].ts' && \
    cp /tmp/patches/src/pages/api/health.ts src/pages/api/health.ts && \
    rm -rf /tmp/patches

# Server-side routes/tree-shaking still need to know the real backend address.
ENV NEXT_PUBLIC_LOCAL_API_URL=http://cognee.embassy:8000
ENV NEXT_PUBLIC_IS_CLOUD_ENVIRONMENT=false

# Build the production frontend
RUN npm run build

# ------------------------------------------------------------------------------
# Production runtime image
# ------------------------------------------------------------------------------
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/postcss.config.mjs ./
COPY --from=builder /app/tsconfig.json ./

ENV NEXT_PUBLIC_LOCAL_API_URL=http://cognee.embassy:8000
ENV NEXT_PUBLIC_IS_CLOUD_ENVIRONMENT=false
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "start"]
