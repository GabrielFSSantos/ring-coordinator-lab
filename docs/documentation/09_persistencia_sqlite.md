# 09 Persistência SQLite

## Schema

Arquivo canônico: [`schema.sql`](../../schema.sql)

```sql
CREATE TABLE IF NOT EXISTS log_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hostname TEXT NOT NULL,
  timestamp_ms INTEGER NOT NULL,
  request_id TEXT UNIQUE
);
```

## Conexão no código

- Classe: `SqliteLogRepository` em `src/server/infrastructure/persistence/`.
- Apenas o **coordenador** abre o banco após eleição (`setupCoordinator`).
- Variáveis de ambiente:

| Variável | Padrão (compose) |
| --- | --- |
| `DATABASE_PATH` | `/data/log.db` |
| `SCHEMA_PATH` | `/app/schema.sql` |

Bind mount `./data:/data` em todos os nós; somente o líder grava.

## Operação de escrita

`INSERT … RETURNING` via `better-sqlite3`, chamado a partir da fila do coordenador (`processRequest`).

## Inspeção no host

```bash
sqlite3 data/log.db "SELECT * FROM log_entries ORDER BY id DESC LIMIT 20;"
```

## Histórico

PostgreSQL e pgAdmin foram removidos na refatoração **DR-006**. Doc legada: [09_persistencia_postgres.md](09_persistencia_postgres.md).
