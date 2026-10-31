FROM node:22-alpine AS builder
RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm install --workspace=api

COPY apps/api ./apps/api

WORKDIR /app/apps/api

RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-eng tesseract-ocr-data-ben

COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/main"]
