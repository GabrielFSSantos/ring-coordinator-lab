# 03 lab.env — flags

Arquivo canônico: [`lab.env.example`](../../../lab.env.example).

| Variável | Função |
| --- | --- |
| `LAB_HOST_NAME` | Nome do PC nos prints |
| `ADVERTISE_HOST` | IP LAN anunciado |
| `CLUSTER_PEERS` | Lista `host:port` do anel |
| `STORAGE_URL` | Base HTTP do ledger |
| `STORAGE_MODE` | `primary` \| `standby` \| `none` |
| `SIM_MODE` | `manual` \| `auto` |
| `SIM_TX_INTERVAL_MS` | Intervalo entre transações simuladas |
| `SIM_LEADER_KILL_INTERVAL_MS` | Kill automático do líder |
| `LOG_WRITES` / `LOG_READS` | Silenciar tipos de print |

Carregamento: `source scripts/load-lab-env.sh`.
