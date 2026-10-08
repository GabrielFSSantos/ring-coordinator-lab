# 05 Comandos e controles (UI → API)

## Resumo

Lista fechada de comandos da interface, endpoint, efeito no sistema e default do demo. Implementação backend em [09-api-http-controle-v1.md](../finalizacao-backend-operacao/09-api-http-controle-v1.md).

## Pré-requisitos

- [04-telas-e-componentes.md](04-telas-e-componentes.md)

## Tabela de comandos

| # | Comando UI | Endpoint | Body / params | Efeito | Default demo |
| --- | --- | --- | --- | --- | --- |
| 1 | Ligar envio automático | `PATCH /v1/simulation` | `{ "txEnabled": true }` | Runner envia burst | `true` |
| 2 | Desligar envio automático | `PATCH /v1/simulation` | `{ "txEnabled": false }` | Para timers de tx | — |
| 3 | Mensagens por ciclo (burst) | `PATCH /v1/simulation` | `{ "txBurst": 1 }` | Fixo em **1** tx por ciclo (orgânico) | `1` |
| 4 | Intervalo entre ciclos (segundos) | `PATCH /v1/simulation` | `{ "txIntervalSec": 10 }` | Select UI: 3, 5, 7, 8, 10, 12, 15 | por nó no compose |
| 4b | Intervalo (ms, legado) | `PATCH /v1/simulation` | `{ "txIntervalMs": 10000 }` | Equivalente a `txIntervalSec` | — |
| 5 | Taxa derivada (info) | — | UI soma `1/intervalSec` por follower | Somente display | cadência espalhada |
| 6 | Delta aleatório | `PATCH /v1/simulation` | `{ "deltaMode": "random", "deltaMin": -500, "deltaMax": 500 }` | Random cents | ativo |
| 7 | Delta fixo | `PATCH /v1/simulation` | `{ "deltaMode": "fixed", "deltaFixed": "10.00" }` | Sempre mesmo delta | — |
| 8 | Pausar nó (sem desligar processo) | `POST /v1/control/pause` | `{ "paused": true }` | Não envia tx | — |
| 9 | Retomar nó | `POST /v1/control/resume` | `{ "paused": false }` | Volta sim | — |
| 10 | Enviar transação única | `POST /v1/transactions` | `{ "delta": "-25.00", "requestId": "ui-..." }` | Uma tx como cliente | — |
| 11 | Repetir valor fixo a cada X s | `PATCH` + scheduler UI | `deltaMode fixed` + `txIntervalMs` | UI pode usar mesmo PATCH; runner usa policy | — |
| 12 | Ativar queda automática do líder | `PATCH /v1/simulation` | `{ "mode": "auto", "killEnabled": true }` | Agenda kill | `true` |
| 13 | Desativar queda automática | `PATCH /v1/simulation` | `{ "killEnabled": false }` ou `mode: manual` | Para kill timer | — |
| 14 | Intervalo kill (ms) | `PATCH /v1/simulation` | `{ "killIntervalMs": 25000 }` | Período kill | `25000` |
| 15 | Derrubar líder agora | `POST /v1/control/leader-kill` | `{ "reason": "ui" }` | Kill lógico imediato | — |
| 16 | Modo manual (sem auto kill) | `PATCH /v1/simulation` | `{ "mode": "manual" }` | Só tx | — |
| 17 | Atualizar saldo (refresh) | `GET /v1/balance` | — | Leitura storage | poll 1s |
| 18 | Atualizar histórico | `GET /v1/ledger` | `afterId` | Append tabela | poll 1s |
| 19 | Ver estado do nó | `GET /v1/state` | — | Grid | poll 2s |
| 20 | Preset “Demo lab” | Vários PATCH | burst 2, interval 5s, auto, kill 25s | Restaura defaults | botão UI |

## Escopo por nó vs cluster

| Comando | Escopo v1 |
| --- | --- |
| 1–4, 6–8, 12–14, 16 | PATCH no nó selecionado; opção UI “replicar para todos os followers” |
| 10 | Nó selecionado (origem da tx) |
| 15 | Qualquer nó (pedido propaga no anel) |

### Controle remoto (outro PC na sala)

- UI chama HTTP no **`http://<ADVERTISE_HOST>:<NODE_HTTP_PORT>`** do nó remoto (descoberto via mDNS / lista de peers).
- Operador central pode pausar simulação em um participant remoto via HTTP (sem SSH no container remoto).
- CORS: proxy dev ou habilitar CORS nos nós (lab only).

## Validação UI

- `txBurst` 1–10; `txIntervalMs` ≥ 1000; `killIntervalMs` ≥ 5000.
- Delta fixo: regex money 2 decimais; ≠ 0.
- Desabilitar controles se `storageUp === false` (exceto leitura).

## Erros exibidos

| reason | Mensagem UI |
| --- | --- |
| `election_in_progress` | “Eleição em andamento — aguarde” |
| `storage_down` | “Storage indisponível” |
| `queue_full` | “Fila do líder cheia” |
| `node_paused` | “Nó pausado” |

## Critérios de aceite

- [ ] Tabela completa implementável sem ambiguidade.
- [ ] Defaults demo coincidem com [06-simulacao-carga-e-kill-fixos.md](../finalizacao-backend-operacao/06-simulacao-carga-e-kill-fixos.md).

## Fora de escopo

- Comando “docker stop” remoto.
- Editar `CLUSTER_PEERS` pela UI (usar discovery LAN).
