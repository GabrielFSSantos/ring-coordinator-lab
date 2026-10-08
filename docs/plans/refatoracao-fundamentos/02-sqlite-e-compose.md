# 02 SQLite e Compose

## Arquivo

- Host: `./data/log.db`
- Container: `DATABASE_PATH=/data/log.db`
- Bind mount `./data:/data` em todos os nós (apenas o coordenador abre o DB).

## Schema

Ver [`schema.sql`](../../../schema.sql) na raiz do repo.

## Compose

- Apenas `ubuntu-node-2` … `ubuntu-node-5`.
- Sem `postgres`, `dbadmin`, volume `db_data`.
- Imagem base: `node:20-bookworm-slim`.

## Inspeção

```bash
sqlite3 data/log.db "SELECT * FROM log_entries ORDER BY id DESC LIMIT 20;"
```
