# 06 Exclusão mútua centralizada

## Modelo

- **Recurso compartilhado:** linhas em `log_entries` (representam “acesso exclusivo” ao log).
- **Único servidor do recurso:** o coordenador (`isCoordinator === true`).
- **Clientes:** nós regulares enviam `log_request` via Socket.IO cliente conectado ao IP/porta do coordenador.

Não há token circulando no anel para mutex; o anel serve principalmente à **eleição**. O mutex é **centralizado** (padrão de curso: um árbitro serializa).

## Fila no coordenador

| Parâmetro | Valor |
| --- | --- |
| `requestQueue` | FIFO de `{ requestData, socket }` |
| `queueLimit` | 6 (requisições extras são descartadas com log) |
| `isProcessing` | Impede processamento paralelo de dois itens |

Fluxo:

1. `addToQueue` — enfileira se há espaço; se não está processando, chama `processNextInQueue`.
2. `processNextInQueue` — desenfileira um item, chama `processRequest`.
3. `processRequest` — executa `INSERT` via `dbPool.query`.
4. Após callback (sucesso ou erro), espera **5 segundos**, limpa `isProcessing`, chama `processNextInQueue`.

O delay de 5s **simula** custo de seção crítica e reforça serialização visível nos logs; não é requisito formal de prova de mutex.

## SQL

```sql
INSERT INTO log_entries(hostname, timestamp) VALUES($1, $2)
```

Valores: `hostname` do pedido; `timestamp` convertido de `request.timestamp` (ms).

Resposta ao cliente: evento `log_response-{requestId}` com `status: Success` ou `Failure`.

## O que é garantido (escopo do TP)

- Em um único coordenador estável, **uma gravação ativa por vez** no fluxo da fila JavaScript.
- Clientes não escrevem diretamente no Postgres.

## O que não é garantido

- **Postgres** é ponto único de falha; não há replicação ou quorum.
- Handler `log_request` registrado só na conexão se `isCoordinator` já for true — ver [12_invariantes_e_limites.md](12_invariantes_e_limites.md).
- Fila cheia: requisições são **ignoradas** (sem backpressure formal).
- Partição de rede pode permitir visões inconsistentes de quem é líder (sem consenso).

Persistência: [09_persistencia_postgres.md](09_persistencia_postgres.md). Contrato de eventos: [07_contrato_socket_io.md](07_contrato_socket_io.md).

## Fundamentação bibliográfica

Velazquez (`velazquez1993survey`) classifica mutex **permission-based**: o cliente solicita; um conjunto ou servidor concede. Este lab usa **um coordenador** com fila FIFO — subclasse didática do permission-based centralizado (Tanenbaum, `tanenbaum2023ds`, modelo cliente/servidor).

| Literatura | Lab | Gap |
| --- | --- | --- |
| Pedido explícito de entrada na SC | `log_request` | Handler condicional na conexão (**B2**) |
| Servidor serializa | `requestQueue`, um `INSERT` ativo | OK no happy path |
| Token ring / Ricart–Agrawala | Não usado | **B-MUTEX1** se evoluir algoritmo |

Nota: [velazquez1993_mutex_survey.md](../references/notas/velazquez1993_mutex_survey.md).
