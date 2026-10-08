# 16 Referência `lab.env` — variáveis e comportamento

## Resumo

Documentação **exaustiva** de cada variável de ambiente do lab: o que altera no runtime, interações entre flags e cenários de uso (casa, LAN Wi‑Fi, integrações futuras — câmeras, jogos, apps que serializam eventos no ledger).

Arquivo modelo: [lab.env.example](../../../lab.env.example) (único; local, LAN e `npm run`).

O que sobe no Docker: profiles `local` | `storage` | `nodes` — ver [03-compose-unico-e-flags.md](03-compose-unico-e-flags.md).

## Pré-requisitos

- [04-lab-env-perfis.md](04-lab-env-perfis.md)
- [08-caminho-escrita-leitura-invariantes.md](08-caminho-escrita-leitura-invariantes.md)

## Identidade e rede

| Variável | Função | Se você mudar… |
| --- | --- | --- |
| `LAB_HOST_NAME` | Nome lógico do host nos logs, ledger (`host_name`) e UI | Aparece em toda linha de log e em entradas `txn`; use IDs estáveis por máquina física. |
| `LAB_PROFILE` | Legado (opcional) | Preferir profiles do compose (`local`, `storage`, `nodes`). |
| `ADVERTISE_HOST` | IP ou hostname **anunciado** na LAN para Socket/mDNS | **Deve** ser alcançável por outros hosts. Em WSL2+Docker, use IP Wi‑Fi/Ethernet do host, não só IP interno do container. |
| `ADVERTISE_PORT_BASE` | Primeira porta Socket quando `NODE_COUNT>1` | Com `NODE_COUNT=4` e base `3002` → processos em 3002–3005 no **mesmo** host. |
| `NODE_COUNT` | Processos nó no supervisor (`main.js`), 1–4 | Aumenta participantes no anel **deste** host; aumenta carga de eleição e mensagens. |
| `RING_NODE_COUNT` | (Compose) containers nó no perfil multi-container | Só Docker local; ver cap. 03. |
| `NODE_PORT` | Porta Socket deste processo (override Compose) | Identidade no anel; critério de líder = `max(port)` entre peers. |
| `NODE_HTTP_PORT` / `NODE_HTTP_PORT_OFFSET` | HTTP estado/controle (default port+1000) | UI e `curl` usam esta porta. |
| `HOSTNAME` | Nome do container/processo (`ubuntu-node-N`) | Campo `node_name` no ledger; distinto de `LAB_HOST_NAME`. |

## Storage (ledger HTTP)

| Variável | Função | Se você mudar… |
| --- | --- | --- |
| `STORAGE_MODE` | `primary` \| `standby` \| `none` | `primary`: sobe DB e aceita writes do líder. `none`: este host **não** roda storage; nós usam `STORAGE_URL` remoto. |
| `STORAGE_URL` | Base HTTP do ledger (`http://host:4000`) | **Obrigatório** em hosts `STORAGE_MODE=none`. Se inalcançável → `storageUp=false` → líder descarta txs (`storage_down`). |
| `STORAGE_HTTP_PORT` | Porta publicada do storage | Alinhar com firewall e URL. |
| `STORAGE_WRITE_TOKEN` | Token `POST /v1/transactions` | Deve coincidir entre líder e storage; não expor na internet pública. |
| `DATABASE_PATH` | Caminho SQLite no volume | Só no host storage; backup = copiar este arquivo. |
| `LEDGER_INITIAL_BALANCE` | Saldo inicial (2 decimais) | Aplica na criação da conta; não reseta em restart. |
| `USE_STORAGE_HTTP` | Nós escrevem via HTTP (recomendado `true`) | `false` = modo legado SQLite local no líder (não usar em LAN). |

**Cenário típico multi-host:** todos com o mesmo `STORAGE_URL=http://<IP-do-banco>:4000`; quem sobe o ledger usa `docker compose --profile storage` (ou `npm run storage`).

## Anel e descoberta

| Variável | Função | Se você mudar… |
| --- | --- | --- |
| `CLUSTER_PEERS` | Lista manual `host:port,...` | Com `DISCOVERY_MODE=off/manual`, define o anel fixo. Com mDNS, pode ficar vazio e ser preenchido por merge. |
| `DISCOVERY_MODE` | `off` \| `manual` \| `mdns` | `mdns`: anuncia e descobre peers na LAN. `off`: Docker 172.25.0.x fixo. |
| `DISCOVERY_POLL_MS` | Intervalo de re-scan mDNS | Afeta velocidade de join de novos hosts e detecção de saída. |
| `DISCOVERY_*_TYPE` | Tipos mDNS | Alterar só se houver colisão com outro serviço na rede. |
| `BOOTSTRAP_PEER` | Primeiro `host:port` para `reconnect` Socket | Join tardio sem mDNS; complementar a HTTP `cluster/state` (futuro). |

**Importante:** mDNS encontra **peers**, não o líder. O líder é sempre resultado da **eleição** após o anel estar conectado.

## Simulação (carga de teste)

| Variável | Função | Se você mudar… |
| --- | --- | --- |
| `SIM_MODE` | `manual` \| `auto` | `auto` agenda kill do líder (demo); use `manual` em produção didática ou apps reais. |
| `SIM_TX_BURST` | Transações por ciclo por follower | Demo orgânica: **1** (máx. na API). |
| `SIM_TX_INTERVAL_MS` | Ms entre ciclos (1 tx) | Por nó no `docker-compose` ou fallback 10/5/8/7 s por porta. |
| `SIM_TX_INITIAL_STAGGER_MS` | Atraso do 1º ciclo | Vazio = `(porta - ADVERTISE_PORT_BASE) × 1 s`. |
| `SIM_TX_JITTER_MS` | Atraso aleatório extra | Espalha picos no tempo. |
| `SIM_DELTA_MIN` / `MAX` | Faixa de delta monetário simulado | Fora do range → rejeição na validação. |
| `SIM_LEADER_KILL_*` | Kill automático em `auto` | Desligar com `manual` ou intervalo 0. |

Para **apps reais** (ex.: eventos de câmera), desligue simulação (`SIM_MODE=manual`, `txEnabled=false` via API futura) e envie transações via API/`transaction_request` com payload de delta ou mensagem em `admin`.

## Logs

| Variável | Efeito se `false` |
| --- | --- |
| `LOG_ENABLED` | Silencia quase tudo (master). |
| `LOG_WRITES` | Sem `TX_*` de escrita. |
| `LOG_QUEUE` | Sem posição na fila. |
| `LOG_ELECTION` | Sem `ELECTION_ROUND`, `COORDINATOR_*`, `RING_VIEW`. |
| `LOG_STORAGE` | Sem health storage. |
| `LOG_READS` | Sem consultas periódicas ao storage. |
| `LOG_SIM` | Sem eventos de kill/simulação. |

## Cliente e falhas

| Variável | Função | Se você mudar… |
| --- | --- | --- |
| `CLIENT_BUFFER_ON_LEADER_LOSS` | Buffer em eleição / líder ausente | `true`: reenvia após novo líder; não aplica a `storage_down` se `DISCARD_ON_STORAGE_DOWN=true`. |
| `DISCARD_ON_STORAGE_DOWN` | Não reenviar txs quando storage off | `true` (recomendado LAN): evita fila infinita. |
| `CLIENT_BUFFER_LIMIT` | Tamanho do buffer cliente | Excesso → rejeição ou drop (documentar na implementação). |

## Validação (implementação futura)

| Variável | Função |
| --- | --- |
| `STORAGE_URL_REQUIRED` | Se `true` e perfil participant, falhar no boot sem `STORAGE_URL`. |

## Exemplos de uso além do lab TP

| Caso | Configuração sugerida |
| --- | --- |
| Casa, 1 PC, 4 nós | `docker-4nodes`, `DISCOVERY_MODE=off`, storage local |
| LAN Wi‑Fi, N hosts | Mesmo `lab.env` + profiles `storage`/`nodes`, mDNS, `STORAGE_URL` fixo |
| “Câmeras” gerando eventos | `SIM_MODE=manual`; cada sensor = nó ou tx manual com delta 0 + `admin` message (evolução schema) |
| Jogo / app | Front PATCH simulation; txs com delta = pontuação |

## Critérios de aceite

- [x] Tabela cobre variáveis dos `.example` atuais.
- [ ] Cada nova env adicionada no código entra neste capítulo na mesma PR.

## Fora de escopo

- Variáveis de sistema Node (`NODE_ENV`) não listadas aqui.
