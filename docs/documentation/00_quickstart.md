# 00 Quickstart

## Pré-requisitos

- Docker e Docker Compose
- Node.js 20+ (opcional, para `npm test` em `src/`)
- `sqlite3` CLI (opcional, para inspecionar `data/log.db`)

## Subir o ambiente

```bash
cd ~/GitHub/ring-coordinator-lab
docker compose up --build
```

Aguarde os quatro nós (`ubuntu-node-2` … `ubuntu-node-5`). O nó de menor porta inicia a eleição quando o anel responde.

## Serviços e portas no host

| Serviço | Porta host | Função |
| --- | --- | --- |
| `ubuntu-node-2` | 3002 | Nó distribuído |
| `ubuntu-node-3` | 3003 | Nó distribuído |
| `ubuntu-node-4` | 3004 | Nó distribuído |
| `ubuntu-node-5` | 3005 | Nó distribuído |

Persistência: arquivo **`data/log.db`** na raiz do repo (bind mount).

## Verificar que está funcionando

### Logs

```bash
docker compose logs -f ubuntu-node-5
```

Procure `Lista de Processos da Eleição`, `Coordenador ativo`, `Gravação` / `Resposta recebida`.

### SQLite no host

```bash
sqlite3 data/log.db "SELECT * FROM log_entries ORDER BY id DESC LIMIT 20;"
```

## Parar

```bash
docker compose down
```

## Testes locais

```bash
cd src
npm ci
npm test
```

Próximo: [11_fluxo_ponta_a_ponta.md](11_fluxo_ponta_a_ponta.md).
