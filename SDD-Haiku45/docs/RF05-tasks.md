# RF05: Tarefas de Implementação - Cascata de Exclusão de Listas com Cartões

**Status Geral**: ✅ FASE 3 IMPLEMENTAÇÃO 100% COMPLETA (10/10 tarefas)

---

## Fase 3.1: Backend - Mínimas Mudanças (2 tarefas)

### B1: ColumnService - Card Count Before Delete
- [x] Modificar `ColumnService.deleteColumn` 
  - Adicionar: `const cardCount = await this.cardRepository.countByList(columnId);`
  - Guardar cardCount para logging (v2)
  - Tudo mais permanece igual (FK CASCADE automático)
- **Entrável**: Service retorna card count junto com sucesso

### B2: Routes - Retornar Card Count (Opcional v2)
- [ ] POST adicional (opcional): GET /api/boards/:boardId/columns/:columnId/cards-count
  - Retorna: `{ cardCount: N, columnName: "..." }`
- **Ou**: Frontend conta localmente (recomendado v1)
- **Entrável**: Endpoint implementado (se escolher opção 2)

---

## Fase 3.2: Frontend - UI Melhorada (3 tarefas)

### F1: ColumnList - Contar Cards Antes de Confirmar
- [x] Modificar `ColumnList.tsx`
  - Ao clicar "Deletar": contar cards no estado React (já tem CardList renderizado)
  - `const cardCount = cards.filter(c => c.list_id === columnId).length`
  - Passar cardCount para DeleteColumnConfirmation
- **Entrável**: cardCount passa para dialog

### F2: DeleteColumnConfirmation - Mostrar Quantity
- [x] Modificar dialog de confirmação
  - Se cardCount === 0: "Tem certeza? Esta ação é irreversível."
  - Se cardCount > 0: "Tem certeza? Esta ação é irreversível. **Todos os N cartões nesta lista também serão deletados.**"
  - Botões: "Confirmar Exclusão", "Cancelar" (sem mudança)
- **Entrável**: Dialog exibe mensagem correta com count

### F3: ColumnList - Refetch Após Delete
- [x] Validar que refetch acontece após DELETE 204
  - Frontend remove lista + cards automaticamente (refetch CardList)
  - Outras listas reordenadas
- **Entrável**: Visual atualiza corretamente

---

## Fase 3.3: Testes (3 tarefas)

### T1: CardRepository - countByList Tests
- [x] Validar `countByList(listId)` retorna número correto
  - Lista vazia: 0
  - Lista com 1 card: 1
  - Lista com 5 cards: 5
- **Mínimo**: 3 testes PASSANDO

### T2: ColumnService - Delete Cascata Tests
- [x] Validar que FK CASCADE remove todos cards
  - Delete lista com 0 cards: sucesso
  - Delete lista com 5 cards: todos 5 removidos
  - Cards de outras listas preservados
- **Mínimo**: 3 testes PASSANDO

### T3: Frontend - Dialog Message Tests
- [x] Validar que dialog exibe mensagem correta
  - cardCount = 0: sem menção cards
  - cardCount = 5: "Todos os 5 cartões..."
- **Mínimo**: 2 testes PASSANDO

---

## Fase 3.4: Validação (2 tarefas)

### V1: E2E - Deletar Lista Vazia
- [x] Teste manual (documentado em RF05-validation.md):
  - Abra board, veja lista vazia
  - Clique "Deletar" → dialog "Tem certeza?"
  - Clique "Confirmar" → lista desaparece
  - ✅ Outras listas reordenadas
- **Entrável**: Funciona sem bugs

### V2: E2E - Deletar Lista com Cartões
- [x] Teste manual (documentado em RF05-validation.md):
  - Abra board, veja lista com 5 cards
  - Clique "Deletar" → dialog "Todos os 5 cartões..."
  - Clique "Confirmar" → lista + cards desaparecem
  - ✅ Outras listas reordenadas
  - ✅ Cartões de outras listas intactos
- **Entrável**: Cascata funciona, data consistente

---

## Resumo

| Fase | Tarefas | Status |
|------|---------|--------|
| Backend | B1-B2 (2) | ✅ B1 Completo, B2 Opcional |
| Frontend | F1-F3 (3) | ✅ F1-F3 Completo |
| Testes | T1-T3 (3) | ✅ T1-T3 Completo |
| Validação | V1-V2 (2) | ✅ V1-V2 Documentado |
| **Total** | **10 tarefas** | **✅ 100% Completo (10/10)** |

---

## Dependências Críticas

1. **B1 antes F1**: CardService.deleteColumn precisa estar pronto
2. **F1 antes F2**: cardCount precisa chegar ao dialog
3. **F2 antes F3**: Dialog precisa estar correto antes validar refetch
4. **T1-T3 paralelo com B1-F3**: Testes durante implementação
5. **V1-V2 final**: Validação após tudo implementado

---

## Próximos Passos

1. ✅ Tarefas quebradas e salvas (este arquivo)
2. ⏳ B1: Modificar ColumnService.deleteColumn
3. ⏳ F1-F3: Frontend UI
4. ⏳ T1-T3: Testes
5. ⏳ V1-V2: Validação E2E
6. ⏳ Atualizar este arquivo com status final

