FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY src/package.json src/package-lock.json ./
RUN npm ci --omit=dev

COPY schema.sql /app/schema.sql
COPY schema-ledger.sql /app/schema-ledger.sql
COPY src/shared ./shared
COPY src/server ./server
COPY src/storage ./storage
COPY src/log-viewer ./log-viewer

EXPOSE 3000 4000

CMD ["node", "server/bootstrap/main.js"]
