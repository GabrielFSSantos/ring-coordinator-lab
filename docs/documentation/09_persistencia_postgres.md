# 09 Persistência PostgreSQL

## Schema

Arquivo: [`tabela.sql`](../../tabela.sql)

```sql
CREATE TABLE log_entries (
    hostname VARCHAR(255),
    timestamp VARCHAR(255)
);
```

Sem chave primária, sem índices — adequado a demo; evolução em [engineering_backlog.md](engineering_backlog.md).

## Conexão no código

`connectToDatabase()` (coordenador):

| Parâmetro | Valor no compose |
| --- | --- |
| host | `172.25.0.6` (fixo no código) |
| port | 5432 |
| user | `user` |
| password | `password` |
| database | `distributed_systems_db` |

Usa `pg.Pool`. O coordenador chama `connectToDatabase` em `setupCoordinatorServer` após eleição.

**Nota:** host/credenciais hardcoded — alterações no compose exigem editar `DistribuitedNode.js` ou externalizar env (backlog).

## Operação de escrita

Única escrita: `INSERT` em `processRequest`. Não há `SELECT` no aplicativo; inspeção é via pgAdmin ou `psql`.

## Inicialização do volume

Primeira subida com volume vazio: script em `docker-entrypoint-initdb.d` cria a tabela. Se o volume já existir sem tabela, recrie o volume ou aplique DDL manualmente.

## Verificação

```sql
SELECT hostname, timestamp, COUNT(*) OVER () AS total FROM log_entries;
```

Ver também [00_quickstart.md](00_quickstart.md).
