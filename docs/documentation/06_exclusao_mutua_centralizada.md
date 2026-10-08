# 06 Exclusão mútua centralizada

## Modelo

- **Recurso compartilhado:** linhas em `log_entries` (SQLite).
- **Único servidor do recurso:** o coordenador (`isCoordinator === true`).
- **Clientes:** nós regulares enviam `log_request` ao coordenador.

## Fila no coordenador

| Parâmetro | Valor |
| --- | --- |
| Classe | `RequestQueue` |
| Limite | `QUEUE_LIMIT` (default 6) |
| Política cheia | Resposta `Rejected` / `queue_full` |

Fluxo:

1. `addToQueue` — enfileira ou rejeita com resposta ao cliente.
2. `processRequest` — `SqliteLogRepository.append` (serialização real).
3. `finally` — próximo item sem delay artificial.

## SQL

`INSERT INTO log_entries … RETURNING` via `better-sqlite3`.

Resposta: `log_response-{requestId}` com `Success`, `Failure` ou `Rejected`.

## Garantias (escopo didático)

- Um coordenador estável processa **uma gravação ativa por vez** na fila.
- Clientes não escrevem diretamente no SQLite.

## O que não é garantido

- Arquivo SQLite é ponto único de falha.
- Sem mutex distribuído no anel.
