# 04 Telas e componentes

## Resumo

Detalha componentes React, props principais e comportamento visual inicial (sem design final pixel-perfect).

## Pré-requisitos

- [02-stack-e-layout.md](02-stack-e-layout.md)
- [03-modelo-dados-e-fontes.md](03-modelo-dados-e-fontes.md)

## BalanceHeader

- Exibe saldo formatado BRL (2 decimais).
- Badge storage: verde `ok` / vermelho `down` (último fetch).
- Badge líder: `coordinatorPort` do cluster state.

## NodeGrid

Card por nó (`VITE_NODE_HTTP_PORTS` ou lista dinâmica de peers):

| Campo UI | Fonte |
| --- | --- |
| Host lab | `state.host` (`LAB_HOST_NAME`) |
| IP anunciado | `ADVERTISE_HOST` via `/v1/state` (campo planejado) ou config |
| Porta / nome | `state.node`, `state.port` |
| Papel | `LÍDER` se `isCoordinator` (destaque visual + texto) |
| Storage global | ícone `storageUp` (mesmo `STORAGE_URL` do ledger primário para todos) |
| Fila | `queueSize` se líder |
| Pendente cliente | `pendingClient` |
| Pausado | `paused` |

Ação rápida no card: botão **Pausar/Retomar** → `POST /v1/control/pause`.

## LedgerTable

Colunas:

| Coluna | Conteúdo |
| --- | --- |
| `#` | `id` |
| Hora | `created_at_ms` local |
| Tipo | `txn` / `admin` |
| Host / Nó | `host_name`, `node_name` |
| Delta | formatado se `txn` |
| Saldo após | `balance_after_cents` |
| Request | `request_id` truncado |

- Scroll container `max-height: 40vh`; **auto-scroll** se usuário não rolou para cima.
- Novas linhas highlight 1s (CSS).

## LogPanel

- Fonte monoespaçada, fundo escuro (tema lab).
- Formato espelhado backend: `time | host | node | ROLE | - | EVENT | detail`
- Buffer circular 200 linhas.
- Botão **Limpar** local; toggle **Pausar scroll**.

## ControlDrawer

Seções:

1. **Simulação global** (aplica PATCH em todos os nós selecionados — v1: checkbox “aplicar em todos”).
2. **Transação manual** (delta + enviar para nó escolhido).
3. **Kill** (botão “Derrubar líder agora”).
4. **Presets** (“Demo 2/5s + kill 25s”).

## Estados vazios

- Storage offline: banner + ledger congelado.
- Nenhum nó responde: instrução “subir docker compose”.

## Critérios de aceite

- [ ] Cada componente mapeado a dados e ações.
- [ ] Ledger e log coexistem sem duplicar toda informação (log = narrativa, tabela = dados).

## Fora de escopo

- Gráficos de série temporal (fase opcional).
