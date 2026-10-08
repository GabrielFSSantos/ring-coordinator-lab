# Appendix — mapeamento log UI

## Resumo

Como transformar dados HTTP em linhas do painel estilo CMD.

## Regras de geração (v1)

| Gatilho | Linha gerada |
| --- | --- |
| Nova entry `txn` id N | `FOLLOWER \| TX_APPLY \| req={request_id} balance={balance_after}` |
| Nova entry `admin` | `SIM \| LEADER_DOWN \| {message}` |
| `coordinatorPort` mudou | `ELECTION \| coordinator_announce \| port={port}` |
| `storageUp` false→true | `STORAGE \| UP \| {url}` |
| `storageUp` true→false | `STORAGE \| DOWN \| {url}` |
| `storageUp` false→true | `STORAGE \| STORAGE_RECOVERED \| {url}` |
| `coordinatorPort` mudou (líder em outro host) | `ELECTION \| coordinator_announce \| port=... host=...` |
| PATCH pause true | `SIM \| NODE_PAUSED \| port={port}` |

## Colunas do painel

| Coluna log | Fonte |
| --- | --- |
| time | `created_at_ms` ou `Date.now()` evento |
| host | `host_name` ou `state.host` |
| node | `node_name` |
| ROLE | fixo por regra |
| EVENT | tabela acima |
| detail | resto |

## Timeline HTTP (implementado)

| Campo API | Coluna UI |
| --- | --- |
| `created_at_ms` | hora |
| `lab_host_name` / `node_name` | host (PC) / nó — título sugerido: `{lab_host_name} · {node_name} · {role}` |
| `role` | papel |
| `event_code` | EVENT |
| `message` | texto legível |
| `request_id` | correlação TX |

## Critérios de aceite

- [ ] Desenvolvedor front implementa log sem ler docker stdout.
