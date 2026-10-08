# Decision register

Registro de decisões de implementação (formato ADR leve). Novas entradas no topo.

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
- **Motivo:** Implementação rápida em Node, eventos nomeados (`ELEICAO`, `COORDENADOR`).
- **Trade-off:** Sem garantias de entrega formal; modelo de falha simplificado.
