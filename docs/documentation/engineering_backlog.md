# Engineering backlog

Débitos técnicos conhecidos. Ao corrigir um item, atualizar [12_invariantes_e_limites.md](12_invariantes_e_limites.md) e [mapa_literatura_codigo.md](../references/mapa_literatura_codigo.md).

| ID | Item | Impacto | Referência alvo | Doc |
| --- | --- | --- | --- | --- |
| B-CR1 | Lista na `ELEICAO` vs mensagem com max UID (Chang–Roberts) | Gap teórico principal | `chang1979extrema` | [05](05_eleicao_em_anel.md) |
| B-ELEC1 | `COORDENADOR` + delay 15s vs mensagem `elected` | Notificação do líder | `dtu2017elections` | [05](05_eleicao_em_anel.md) |
| B-MUTEX1 | Fila ad hoc vs permission-based formal | Mutex centralizado | `velazquez1993survey` | [06](06_exclusao_mutua_centralizada.md) |
| B1 | Jest legado (`DistributedNode` vs `DistribuitedNode`, API antiga) | CI local enganoso | — | [15](15_testes_e_gate.md) |
| B2 | `log_request` só registrado na conexão se já coordenador | Pedidos perdidos | `velazquez1993survey` | [07](07_contrato_socket_io.md) |
| B3 | Schema `log_entries` sem PK; sem `RETURNING` | Observabilidade | — | [09](09_persistencia_postgres.md) |
| B4 | Healthcheck pgAdmin inválido no compose | Ruído em `docker compose ps` | — | [02](02_infra_docker_compose.md) |
| B5 | Sleeps 15s / 80s / 5s sem configuração | Recuperação lenta | `garcia1982elections` | [10](10_falhas_e_recuperacao.md) |
| B6 | `connecToNode` resolve em 3s sem checar `connected` | Eleição frágil | `chang1979extrema` | [08](08_utilitarios.md) |
| B7 | `electSuccessor` recursão sem limite | Stack em rede morta | — | [05](05_eleicao_em_anel.md) |
| B8 | DB host/credenciais hardcoded | Deploy inflexível | `tanenbaum2023ds` | [09](09_persistencia_postgres.md) |
| B9 | Renomear `DistribuitedNode.js` → `DistributedNode.js` | Confusão import/test | — | [14](14_arquitetura_e_manutencao.md) |
| B10 | `socket.off` incorreto em `Disconnect` | Handler órfão | — | [10](10_falhas_e_recuperacao.md) |
| B11 | Fila descarta ao atingir 6 itens | Perda de requisições | `velazquez1993survey` | [06](06_exclusao_mutua_centralizada.md) |
| B12 | `copyFileSync` importado e não usado | Lint / ruído | — | `DistribuitedNode.js` |

Priorização para convergência bibliográfica: **B-CR1** → **B-ELEC1** + **B5** → **B2** / **B-MUTEX1**.
