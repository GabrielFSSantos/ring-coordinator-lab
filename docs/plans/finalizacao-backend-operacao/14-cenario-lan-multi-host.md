# 14 Cenário LAN multi-host

## Resumo

Operação com **vários hosts** na mesma rede (Wi‑Fi, Ethernet, VLAN de lab): um host **storage** (ledger primário) e um ou mais hosts **participant** (somente nós). Peers unem-se via mDNS (ou lista manual); **um** anel lógico e **um** líder global; persistência só quando o storage está saudável.

Aplica-se a demonstrações em grupo, testes em casa com dois PCs, ou bases para apps na LAN: fila de eventos serializada, jogos com estado compartilhado, sensores/câmeras que registram ocorrências no ledger (delta ou mensagem em `admin`), ou qualquer fluxo em que **um** escritor central (líder) persista ordem e saldo.

## Casos de uso (além do lab TP)

| Ideia | Como encaixa |
| --- | --- |
| Várias máquinas na mesma rede | mDNS + um storage host |
| Câmera / sensor detecta evento | Nó ou cliente envia `transaction_request`; líder grava se storage up |
| Jogo ou app cooperativo | `SIM_MODE=manual`; txs = pontuação ou eventos de domínio |
| Casa, um PC | `docker-4nodes` — ver [04-lab-env-perfis.md](04-lab-env-perfis.md) |

## Pré-requisitos

- [05-descoberta-lan-automatica.md](05-descoberta-lan-automatica.md)
- [15-matriz-cenarios-operacao.md](15-matriz-cenarios-operacao.md)
- [16-lab-env-referencia-comportamento.md](16-lab-env-referencia-comportamento.md)
- Template: [lab.env.example](../../../lab.env.example) (mesmo arquivo em todos os PCs)

## Papéis de host (compose profile)

| Papel | Profile compose | Ledger |
| --- | --- | --- |
| PC do banco | `storage` (e opcional `nodes`) | Este PC (`STORAGE_URL` = IP dele) |
| Outros PCs | `nodes` ou `npm run server` | Sempre `STORAGE_URL` do env |

## Decisões e invariantes

- `ADVERTISE_HOST` = IP **visível na LAN** para cada máquina.
- Participants **DEVEM** definir `STORAGE_URL=http://<IP-storage-host>:4000` (mDNS do storage é opcional).
- mDNS descobre **peers**; líder = eleição (`max(port)`), pode estar em **qualquer** host.
- Storage inalcançável → líder descarta (`storage_down`); anel pode continuar.
- Storage volta → health periódico; **tx perdidas não são reenviadas**.
- `SIM_MODE=manual` recomendado fora de demos automatizadas.

## Roteiro operacional (fases)

### Fase 1 — Participants sem storage alcançável

1. Copiar [lab.env.example](../../../lab.env.example) → `lab.env` (mesmo `STORAGE_URL` em todos).
2. Ajustar `ADVERTISE_HOST`, `LAB_HOST_NAME`, `STORAGE_URL` (pode apontar para storage ainda offline).
3. `docker compose --env-file lab.env up --build`.
4. mDNS forma anel entre participants; txs simuladas ou reais são **descartadas** se storage down.

### Fase 2 — Storage host online

1. No PC do banco: `docker compose --profile storage` (ver doc 18).
2. Subir storage + nós; abrir firewall `:4000`.
3. Participants detectam storage saudável; txs passam a gravar no ledger central.

### Fase 3 — Storage host offline

1. Parar storage ou desligar máquina.
2. Participants: descarte retorna; anel local entre participants pode continuar.

### Fase 4 — Recuperação

1. Religar storage no mesmo IP (ou atualizar `STORAGE_URL` se IP mudou).
2. Novas txs persistem; histórico não inclui gap.

## Escala e `NODE_COUNT`

| Objetivo | `NODE_COUNT` por host |
| --- | --- |
| Muitos hosts, anel grande | `1` (default participant) |
| Demo 2 PCs, anel 8 | `4` em cada host, `ADVERTISE_PORT_BASE` distintos se mesma faixa de portas |

Ver [16-lab-env-referencia-comportamento.md](16-lab-env-referencia-comportamento.md).

## Firewall e portas

TCP: `4000` (storage), `3002+` (Socket), `4002+` (HTTP nó). UDP: `5353` (mDNS).

## O que observar nos logs

Ver tabela em [15-matriz-cenarios-operacao.md](15-matriz-cenarios-operacao.md) e eventos em [appendix-eventos-e-env.md](appendix-eventos-e-env.md).

## Critérios de aceite (implementação)

- [ ] 1 storage-host + ≥2 participant-hosts na LAN sem `CLUSTER_PEERS` manual.
- [ ] Fases 1–4 reproduzíveis com checklist [11-testes-e-gate.md](11-testes-e-gate.md).

## Riscos

| Risco | Mitigação |
| --- | --- |
| AP isolation no Wi‑Fi | Desabilitar ou usar Ethernet |
| IP errado no Docker/WSL2 | [16-lab-env-referencia-comportamento.md](16-lab-env-referencia-comportamento.md) |

## Fora de escopo

- Multi-região / internet pública sem VPN.
