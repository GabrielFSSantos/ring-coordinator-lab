# 06 Fluxos de usuário

## Resumo

Cenários principais do operador ao usar o console.

## Fluxo 1 — Observar demo automática

1. Subir backend (`docker compose --env-file lab.env up`).
2. Abrir `npm run dev` no `frontend/`.
3. Ver saldo variar; ledger ganha linhas; log mostra narrativa.
4. A cada ~25s, log registra kill e mudança de líder no grid.

## Fluxo 2 — Pausar um nó

1. Selecionar card `ubuntu-node-3`.
2. Clicar **Pausar**.
3. Confirmar: menos `TX_SEND` daquele host; outros continuam.
4. **Retomar** restaura burst.

## Fluxo 3 — Alterar taxa ao vivo

1. Abrir drawer Simulação.
2. Alterar burst para 1 e intervalo para 10000 ms.
3. Aplicar em todos followers.
4. Observar redução de linhas no ledger.

## Fluxo 4 — Delta fixo repetido

1. `deltaMode: fixed`, `deltaFixed: 5.00`.
2. `txIntervalMs: 3000`, burst 1.
3. Ledger mostra deltas +5.00 sequenciais (serializados pelo líder).

## Fluxo 5 — Kill manual

1. Desativar kill auto (`killEnabled: false`).
2. Botão **Derrubar líder** → admin no ledger; novo líder no header.

## Fluxo 6 — LAN 2 PCs (operador)

1. UI aponta `VITE_STORAGE_URL` para IP do PC-A.
2. Lista de nós HTTP inclui portas expostas em A e B.
3. Grid mostra hosts distintos (`LAB_HOST_NAME`).

## Fluxos LAN multi-host (Fases 1–4)

Espelham [14-cenario-lan-multi-host.md](../finalizacao-backend-operacao/14-cenario-lan-multi-host.md):

| Fase | UI no host do storage (observador central) |
| --- | --- |
| 1 | Ledger vazio/estático; grid mostra participants; badge storage **down** |
| 2 | Tabela ledger crescendo; saldo muda |
| 3 | Ledger para de crescer; log `STORAGE DOWN` |
| 4 | Retomada de linhas novas no ledger |

## Critérios de aceite

- [ ] Fluxos cobrem pedidos do produto (observar, pausar, taxa, kill, LAN).

## Fora de escopo

- Tutorial gamificado.
