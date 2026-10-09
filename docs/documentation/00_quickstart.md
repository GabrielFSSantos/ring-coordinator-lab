# 00 Quickstart

## Pré-requisitos

- Docker e Docker Compose (storage + start) ou Node 20+ (node + logs)
- `sqlite3` CLI (opcional)

## Subir

```bash
cd ~/GitHub/ring-coordinator-lab
./lab storage    # banco (qualquer ordem)
./lab start      # 4 nós Docker, primeiro plano
./lab logs       # outro terminal — narrativa
```

Nativo um nó: `./lab node`. Quatro processos no host: `./lab start --native`.

## Parar

Ctrl+C no `./lab start`, depois `./lab down` se precisar limpar containers.

## Testes

```bash
cd src && npm ci && npm test
```
