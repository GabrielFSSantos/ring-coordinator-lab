# Decision register

Registro de decisões de implementação (formato ADR leve). Novas entradas no topo.

---

## DR-012 — Reset ledger e narrativa completa no tail

- **Data:** 2026-10-08
- **Decisão:** `LEDGER_RESET_ON_START` (default true) limpa timeline/ledger no boot do storage; mensagens TX do líder sempre na timeline (`narrativeForEvent`); `ELECTION_HEARD` / `ELECTION_PASS`; `TimelineEventRecorder.drain()` antes do ACK do líder e após SEND/ACK do follower; nome `ubuntu-node-N` via `port - 3000`.
- **Motivo:** `lab-tail` sem histórico antigo e ordem causal legível na demo.

---

## DR-011 — Título multi-PC e ops no compose

- **Data:** 2026-10-08
- **Decisão:** Títulos de caixa prefixam `LAB_HOST_NAME` (`boxTitle` / timeline). `lab-tail` com `attach: false` no compose local. Canal `[lab-ops]` em stderr (`LOG_DOCKER_OPS` default quando stdout≠direct) para subida/erro sem repetir narrativa do tail.
- **Motivo:** Vários PCs com `ubuntu-node-N` homônimos; terminal do `compose up` operacional vs `logs -f lab-tail` narrativo.

---

## DR-010 — Stdout via timeline (`lab-tail`)

- **Data:** 2026-10-08
- **Decisão:** `LOG_STDOUT_MODE` (`direct` | `off` | `timeline_self` | `timeline_all`). Docker local: nós/storage `off` + serviço `lab-tail` com `timeline_all` pollando `GET /v1/timeline-events`. Caixas reconstruídas a partir de `message` persistida; latência ~`LOG_TIMELINE_POLL_MS`.
- **Motivo:** Terminal único ordenado no `compose up`; multi-PC pode usar `timeline_self` por máquina ou um `npm run tail` central.
- **Trade-off:** Evento só aparece após persistência + poll; debug isolado ainda pode usar `direct`.

---

## DR-009 — Timeline global no storage

- **Data:** 2026-10-08
- **Decisão:** Tabela `timeline_events` no SQLite do storage; `POST /v1/timeline-events` com `x-storage-token` por qualquer nó; `GET` público (lab) paginado por `afterId`. Saldo continua só via `POST /v1/transactions` do líder. Integração assíncrona a partir do `LabLogger` (`LOG_TIMELINE_PERSIST`).
- **Motivo:** Frontend e operadores multi-PC com linha do tempo cronológica única, independente do stdout intercalado.
- **Trade-off:** Volume de linhas (cadeia TX completa); token compartilhado aceitável só no lab.

---

## DR-008 — Compose único e descoberta mDNS no lab LAN

- **Data:** 2026-10-08
- **Decisão:** Um único `docker-compose.yml` com profiles `local` / `storage` / `nodes`, um `lab.env.example`, e `network_mode: host` na LAN; descoberta mDNS (`DISCOVERY_MODE=mdns`) com tipos `_ring-coordinator-lab` e `_ring-storage-lab`; merge determinístico de peers; fallback `DISCOVERY_MODE=manual` + `CLUSTER_PEERS` para ambientes mistos (WSL2/Linux).
- **Motivo:** Operar 2+ PCs com 8 nós sem editar peers a cada boot; playbook casa documentado em `docs/documentation/18_lan_dois_pcs_casa.md`.
- **Trade-off:** mDNS não é consenso; WSL2 pode exigir IP Wi‑Fi explícito e peers manuais.

---

## DR-007 — Storage HTTP + ledger LAN

- **Data:** 2026-10-08
- **Decisão:** Serviço `storage` (HTTP + SQLite ledger) separado dos nós; coordenador aplica transações via `POST /v1/transactions`; leitura direta no storage; primário único com standby por discovery; `lab.env` para LAN e modos `SIM_MODE`.
- **Motivo:** Demo multi-PC, saldo didático (−500…500), distinção storage_down vs falha de líder.
- **Trade-off:** Sem consenso forte; possível split-brain de storage sob partição.

---

## DR-006 — SQLite no coordenador

- **Data:** 2026-10-08
- **Decisão:** Persistência em SQLite (`data/log.db` no host), apenas o coordenador grava; remover PostgreSQL e pgAdmin do compose.
- **Motivo:** Reduzir peso do lab didático; inspecionar o log por arquivo (`sqlite3`, DB Browser).
- **Trade-off:** Continua SPOF do recurso; não há replicação. DR-002 permanece como histórico.

---

## DR-005 — Bibliografia local (estilo FSL)

- **Data:** 2026-10-08
- **Decisão:** `docs/references/bibliografia.bib`, `pdfs/` versionados, notas por obra e `mapa_literatura_codigo.md`.
- **Motivo:** Embasar TP com fontes citáveis e gaps explícitos (B-CR1, B-ELEC1, B-MUTEX1) sem monografia no repo.

---

## DR-004 — Documentação canônica em `docs/`

- **Data:** 2026-10-08
- **Decisão:** Toda documentação técnica detalhada vive em `ring-coordinator-lab/docs/`; harness no meta-workspace apenas indexa e executa gate.
- **Motivo:** Alinhar ao Financial Sentiment Lab; evitar duplicação e referências a `Workspaces/` no repo de produto.

---

## DR-003 — Critério de líder = maior `NODE_PORT`

- **Data:** (implementação original)
- **Decisão:** Na conclusão da eleição, `coordinatorPort = Math.max(...electionList)`.
- **Motivo:** ID totalmente ordenado; em cluster de quatro nós estável, líder previsível (3005).
- **Alternativa rejeitada:** menor ID (também válida didaticamente, mas exige mudar convenção do compose).

---

## DR-002 — PostgreSQL em vez de arquivo

- **Data:** (implementação original)
- **Decisão:** Persistir em `log_entries` no Postgres (`172.25.0.6`) em vez de arquivo compartilhado.
- **Motivo:** Facilita inspeção (pgAdmin), volume Docker, SQL explícito no TP.
- **Trade-off:** SPOF do banco; coordenador único grava — não distribui storage.

---

## DR-001 — Socket.IO sobre HTTP

- **Data:** (implementação original)
- **Decisão:** Comunicação inter-nós via Socket.IO (servidor + cliente), não UDP/raw TCP do slide de curso.
- **Motivo:** Implementação rápida em Node, eventos nomeados (`election_round`, `coordinator_announce`).
- **Trade-off:** Sem garantias de entrega formal; modelo de falha simplificado.
