# 05 Mutex, persistência e recuperação

## Mutex

- FIFO no coordenador; `isProcessing` + uma gravação SQLite por vez.
- Fila cheia: resposta `Rejected` / `queue_full` (não descarte silencioso).

## Persistência

- `SqliteLogRepository.append` com `INSERT … RETURNING`.

## Recuperação

- Timeout `TIMEOUT_LIMIT` (10 s) sem `log_response` → emissor chama `startElection`.
- Sem espera de 80 s após suspeita de falha do coordenador.
