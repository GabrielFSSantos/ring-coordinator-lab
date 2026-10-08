# 10 Arquitetura DDD e SOLID

## Resumo

Guia de refatoração incremental para não inflar `NodeApplication`: novos serviços em camadas existentes (`domain`, `application`, `infrastructure`, `http`).

## Pré-requisitos

- [documentation/14_arquitetura_e_manutencao.md](../../documentation/14_arquitetura_e_manutencao.md)

## Mapa de módulos (alvo)

| Camada | Módulo | Responsabilidade | Princípio |
| --- | --- | --- | --- |
| domain | `RingTopology`, `RequestQueue`, `ElectionService` | Regras puras anel/fila | SRP |
| domain | `SimulationPolicy` (novo) | Valida burst, intervalos, delta mode | SRP |
| application | `NodeApplication` | Orquestra ciclo de vida, delega | Facade fina |
| application | `SimulationRunner` | Timers; lê `SimulationPolicy` | DIP |
| application | `DiscoveryCoordinator` (novo) | Merge peers, callbacks | SRP |
| application | `StorageReachabilityMonitor` (novo) | Health periódico, `STORAGE_RECOVERED` | SRP |
| infrastructure | `MdnsDiscoveryAdapter` | mDNS | Adapter |
| infrastructure | `StorageHttpClient`, `LabLogger` | I/O | ISP |
| infrastructure | `SqliteLogRepository` | Legado local | deprecar em LAN |
| http | `NodeHttpServer` + rotas controle | Parse HTTP, chama application | SRP |

## Onde editar (atualizado)

| Objetivo | Arquivo |
| --- | --- |
| Novo evento Socket | `NodeApplication.onPeerConnection` (mínimo) ou extrator handlers |
| Discovery | `infrastructure/discovery/*`, `DiscoveryCoordinator` |
| API UI | `http/controlRoutes.js` |
| Defaults demo | `config/env.js`, `SimulationPolicy.fromConfig` |
| Ledger | `src/storage/*` apenas |

## Decisões e invariantes

- **NÃO** mover lógica de saldo para `NodeApplication`; permanece em `LedgerDatabase`.
- Dependências apontam **para dentro** (infra implementa portas definidas em application se necessário).
- Testes unitários em `domain` e `SimulationPolicy` sem Socket.

## Critérios de aceite

- [ ] `NodeApplication.js` não cresce mais de ~15% linhas na fase; lógica nova em arquivos dedicados.
- [ ] Gate e testes passam.

## Fora de escopo

- Microserviços separados por container além do storage.
