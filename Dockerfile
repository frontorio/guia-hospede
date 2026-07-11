# ---------- Estágio 1: build ----------
FROM node:20-slim AS builder

# openssl é necessário para os engines do Prisma.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instala dependências (o postinstall roda `prisma generate`, por isso o
# schema precisa estar presente antes do npm ci).
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Copia o restante do código e compila.
COPY . .
RUN npm run build

# ---------- Estágio 2: runtime ----------
FROM node:20-slim AS runner

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

# Instala apenas dependências de produção (postinstall gera o Prisma Client).
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

# Artefatos compilados.
COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./docker-entrypoint.sh
# Remove CR (caso o arquivo venha com CRLF do Windows) e torna executável.
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main"]
