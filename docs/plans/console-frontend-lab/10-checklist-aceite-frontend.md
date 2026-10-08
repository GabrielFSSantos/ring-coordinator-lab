# 10 Checklist aceite (frontend)

## Com backend Docker local

- [ ] UI mostra saldo atualizado em ≤ 2 s após tx
- [ ] Tabela ledger cresce automaticamente com novas entradas
- [ ] Log exibe linhas coerentes com novas entradas ledger
- [ ] Grid marca líder correto após kill ~25s
- [ ] Pausar nó reduz txs desse host
- [ ] PATCH altera burst/intervalo sem restart
- [ ] Transação manual aparece no ledger
- [ ] Preset demo restaura 2/5s e kill 25s
- [ ] `npm run build` sem erro TypeScript

## LAN multi-host (1 storage host + 2 participants mínimo)

- [ ] Observador: `VITE_STORAGE_URL` = IP do storage host; ledger atualiza na Fase 2
- [ ] Grid distingue ≥3 `LAB_HOST_NAME`
- [ ] Fase C: UI indica storage down sem travar

## Opcional LAN 2 PCs

- [ ] UI configurada com IP storage remoto
- [ ] Cards mostram `LAB_HOST_NAME` de ambos PCs

## Documentação

- [ ] `docs/documentation/18_console_lab.md` criado na fase implementação
- [ ] Entrada em `docs/README.md`

## Fora de escopo

- Testes E2E Playwright (opcional futuro).
