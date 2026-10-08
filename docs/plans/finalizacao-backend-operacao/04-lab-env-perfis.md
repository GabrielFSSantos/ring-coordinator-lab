# 04 lab.env e perfis

## Resumo

Especifica `lab.env` (uso local completo) e `lab.env.example` (template), perfis operacionais e variáveis da finalização do backend.

**Referência detalhada (efeito de cada variável ao mudar valores):** [16-lab-env-referencia-comportamento.md](16-lab-env-referencia-comportamento.md).

## Pré-requisitos

- [03-compose-unico-e-flags.md](03-compose-unico-e-flags.md)
- [simulacao-lan-ledger/03-lab-env-flags.md](../simulacao-lan-ledger/03-lab-env-flags.md) (baseline)

## Um único template

Arquivo modelo: [lab.env.example](../../../lab.env.example).

O que sobe (Docker) é escolhido por **profile do compose**, não por outro arquivo `.env`:

| Profile compose | Uso |
| --- | --- |
| `local` | 4 nós + storage na bridge `172.25.0.x` |
| `storage` | Só ledger (`lan-storage`, host network) |
| `nodes` | Só nós (`lan-node`, supervisor `NODE_COUNT`) |

### Campos que mudam por pessoa (LAN)

| Campo | Quem define |
| --- | --- |
| `STORAGE_URL` | **Igual para todos** (IP do PC do banco) |
| `ADVERTISE_HOST`, `LAB_HOST_NAME`, `ADVERTISE_PORT_BASE`, `NODE_COUNT` | Cada PC |

### Bloco Docker local (profile `local`)

| Campo | Valor típico |
| --- | --- |
| `STORAGE_URL` | `http://172.25.0.10:4000` |
| `DISCOVERY_MODE` | `off` |
| `CLUSTER_PEERS` | 172.25.0.2:3002 … :3005 |
| `STORAGE_URL_REQUIRED` | `false` |

### Bloco LAN

| Campo | Valor típico |
| --- | --- |
| `DISCOVERY_MODE` | `mdns` ou `manual` + `CLUSTER_PEERS` |
| `STORAGE_URL` | `http://<IP-banco>:4000` |
| `NODE_COUNT` | `1` (muitos PCs) ou `4` (demo 8 nós) |

### Validação (implementação)

- Com `DISCOVERY_MODE=mdns|manual`, bootstrap **DEVE** falhar se `STORAGE_URL` vazio (`STORAGE_URL_REQUIRED` implícito ou explícito).

## Tabela de variáveis (índice)

Lista resumida; comportamento ao alterar valores → [16-lab-env-referencia-comportamento.md](16-lab-env-referencia-comportamento.md).

### Identidade e rede

| Variável | Descrição | Default demo |
| --- | --- | --- |
| `LAB_HOST_NAME` | Nome do host nos logs | `docker-lab` |
| `LAB_PROFILE` | Legado (opcional) | vazio |
| `ADVERTISE_HOST` | IP anunciado na LAN | Docker: 172.25.0.x |
| `ADVERTISE_PORT_BASE` | Base de portas multi-processo | `3002` |
| `NODE_PORT` | Porta do processo (compose override) | — |
| `RING_NODE_COUNT` | Containers nó no compose | `4` |
| `NODE_COUNT` | Processos por container (1–4) | `1` |

### Storage

| Variável | Descrição |
| --- | --- |
| `STORAGE_MODE` | `primary` \| `standby` \| `none` |
| `STORAGE_URL` | Base HTTP ledger |
| `STORAGE_HTTP_PORT` | Porta publicada |
| `STORAGE_WRITE_TOKEN` | Token POST transactions |
| `DATABASE_PATH` | Caminho SQLite no volume |
| `USE_STORAGE_HTTP` | Nós usam HTTP (deve ser `true` no lab atual) |

### Anel (manual)

| Variável | Descrição |
| --- | --- |
| `CLUSTER_PEERS` | CSV `host:port` |
| `BOOTSTRAP_PEER` | Fallback join Socket |
| `IP_LIST` | Legado Docker |

### Discovery

| Variável | Descrição | Default |
| --- | --- | --- |
| `DISCOVERY_MODE` | `mdns` \| `manual` \| `off` | `off` local, `mdns` LAN |
| `DISCOVERY_SERVICE_TYPE` | Tipo mDNS peers | `_ring-coordinator-lab._tcp.local` |
| `DISCOVERY_STORAGE_TYPE` | Anúncio storage | `_ring-storage-lab._tcp.local` |
| `DISCOVERY_POLL_MS` | Re-scan período | `5000` |
| `DISCOVERY_TTL_S` | Expiração peer sem heartbeat | `30` |

### Simulação

| Variável | Descrição | Demo |
| --- | --- | --- |
| `SIM_MODE` | `manual` \| `auto` | `auto` |
| `SIM_TX_BURST` | Transações por ciclo por follower | `2` |
| `SIM_TX_INTERVAL_MS` | Período entre ciclos | `5000` |
| `SIM_TX_JITTER_MS` | Atraso aleatório extra | `0` |
| `SIM_DELTA_MIN` / `MAX` | Faixa monetária | `-500` / `500` |
| `SIM_LEADER_KILL_INTERVAL_MS` | Kill automático | `25000` |
| `SIM_LEADER_KILL_INITIATOR` | Quem dispara kill (vazio = regra min port) | — |

### Logs

| Variável | Descrição |
| --- | --- |
| `LOG_ENABLED` | Master switch |
| `LOG_WRITES` | TX e apply |
| `LOG_READS` | Consultas storage |
| `LOG_ELECTION` | Eleição |
| `LOG_QUEUE` | Fila líder |
| `LOG_STORAGE` | Storage health |
| `LOG_SIM` | Kill, buffer sim |

### Controle HTTP (futuro / API)

| Variável | Descrição |
| --- | --- |
| `NODE_CONTROL_TOKEN` | Bearer opcional em PATCH/POST controle |
| `NODE_HTTP_PORT` / `NODE_HTTP_PORT_OFFSET` | HTTP estado/controle |

## Decisões e invariantes

- `lab.env` no repo **pode** versionar valores de lab (token demo); produção real não é alvo.
- Carregamento: `scripts/load-lab-env.sh`, dotenv em `server/bootstrap/main.js` e `storage/bootstrap/main.js` (candidatos existentes).

## Critérios de aceite

- [ ] `lab.env.example` contém todas as variáveis acima com comentários.
- [ ] Perfil demo documentado coincide com [06-simulacao-carga-e-kill-fixos.md](06-simulacao-carga-e-kill-fixos.md).

## Fora de escopo

- Gerenciador gráfico de `.env`.
