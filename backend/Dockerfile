FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN DATABASE_URL=postgresql://build:build@localhost/build DIRECT_URL=postgresql://build:build@localhost/build npx prisma generate --schema prisma/neon/schema.prisma && npm run build

ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma migrate deploy --schema prisma/neon/schema.prisma && npm start"]