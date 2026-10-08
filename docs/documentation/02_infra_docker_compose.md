# 02 Infraestrutura Docker Compose

Arquivo: [`docker-compose.yml`](../../docker-compose.yml) na raiz do repositório.

## Rede

- Nome: `app_network`, driver `bridge`.
- Sub-rede: `172.25.0.0/16`.
- IPs estáticos por serviço (facilita `IP_LIST` e conexão ao Postgres).

| IP | Serviço |
| --- | --- |
| 172.25.0.2 | ubuntu-node-2 |
| 172.25.0.3 | ubuntu-node-3 |
| 172.25.0.4 | ubuntu-node-4 |
| 172.25.0.5 | ubuntu-node-5 |
| 172.25.0.6 | postgres |
| 172.25.0.7 | dbadmin (pgAdmin) |

## Serviços de aplicação (nós)

Quatro serviços idênticos em imagem (`build: ./src`), diferindo por:

- `container_name`
- `environment`: `HOSTNAME`, `IP_LOCAL`, `NODE_PORT`, `IP_LIST`
- `ports`: `"300x:300x"`
- `ipv4_address`

Regra de porta: **último octeto do IP + 3000** (ex.: `.5` → `3005`). Implementação: `IpsToObjectSorted`, `getClientPort` — ver [08_utilitarios.md](08_utilitarios.md).

`IP_LIST` é CSV com os quatro IPs dos nós (sem Postgres).

### depends_on

Cada nó depende de:

- `postgres` com `condition: service_healthy`
- `dbadmin` com `condition: service_started`

O coordenador conecta ao Postgres após eleição; o `depends_on` evita subir nós antes do banco estar pronto.

## PostgreSQL

- Imagem: `postgres:16`
- Banco: `distributed_systems_db`, usuário `user`, senha `password`
- Init: [`tabela.sql`](../../tabela.sql) montado em `/docker-entrypoint-initdb.d/`
- Volume: `db_data` para persistência
- Healthcheck: `pg_isready -U user -d distributed_systems_db`

## pgAdmin (`dbadmin`)

- Imagem: `dpage/pgadmin4`
- Host: porta `5050` → `80` no container
- Credenciais padrão no compose (ver [00_quickstart.md](00_quickstart.md))

**Nota:** o `healthcheck` do serviço `dbadmin` no compose usa um comando `pg_isready` malformado; não reflete saúde do pgAdmin. Detalhe em [engineering_backlog.md](engineering_backlog.md).

## Build da imagem do nó

Contexto: `src/`, Dockerfile instala Node 20 em Ubuntu, `npm install`, `CMD node server/main.js`. Ver [03_entrypoints_e_build.md](03_entrypoints_e_build.md).

## Variáveis por nó

Tabela completa: [appendix_variaveis_ambiente.md](appendix_variaveis_ambiente.md).

## Comandos úteis

```bash
docker compose config          # validar YAML
docker compose up --build -d   # detached
docker compose logs -f ubuntu-node-3
docker compose ps
```

Validação no gate externo: script `run-gate.sh` no meta-workspace do projeto (executa `docker compose config` quando Docker está disponível).
